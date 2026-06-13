package fluxchat

import (
	"bytes"
	"context"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"
)

// ─── AutoCapture Middleware ────────────────────────────────────────────────────

// AutoCaptureConfig controls which responses the middleware captures.
type AutoCaptureConfig struct {
	// MaxBodyBytes is the max response body size to capture (default 8 KB).
	MaxBodyBytes int64

	// SkipPaths is a list of path prefixes to never capture
	// (e.g. ["/auth", "/login", "/token", "/health"]).
	SkipPaths []string

	// OnError is called when a background CapturePage call fails (optional).
	// Defaults to silent ignore.
	OnError func(err error)
}

func (c *AutoCaptureConfig) defaults() {
	if c.MaxBodyBytes == 0 {
		c.MaxBodyBytes = 8 * 1024
	}
	if c.SkipPaths == nil {
		c.SkipPaths = []string{"/auth", "/login", "/logout", "/token", "/refresh", "/health", "/metrics", "/favicon"}
	}
}

// AutoCapture returns an http.Handler middleware that passively captures every
// GET response (JSON or text) and sends it to FluxChat in a background
// goroutine — the same way the JS widget's autoCapture works on the frontend.
//
// Usage:
//
//	mux := http.NewServeMux()
//	mux.HandleFunc("/api/products", listProducts)
//	// ...
//
//	client, _ := fluxchat.NewClient(apiKey)
//	http.ListenAndServe(":8080", fluxchat.AutoCapture(client, nil)(mux))
func AutoCapture(c *Client, cfg *AutoCaptureConfig) func(http.Handler) http.Handler {
	if cfg == nil {
		cfg = &AutoCaptureConfig{}
	}
	cfg.defaults()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only intercept GET requests
			if r.Method != http.MethodGet {
				next.ServeHTTP(w, r)
				return
			}

			// Skip configured paths
			for _, skip := range cfg.SkipPaths {
				if strings.HasPrefix(r.URL.Path, skip) {
					next.ServeHTTP(w, r)
					return
				}
			}

			// Wrap the ResponseWriter to capture the response
			rec := &responseRecorder{
				ResponseWriter: w,
				body:           &bytes.Buffer{},
				maxBytes:       cfg.MaxBodyBytes,
			}
			next.ServeHTTP(rec, r)

			// Only capture 2xx responses with content
			if rec.status < 200 || rec.status >= 300 || rec.body.Len() == 0 {
				return
			}

			// Only capture text/JSON (skip binary, images, etc.)
			ct := rec.Header().Get("Content-Type")
			if !isTextContent(ct) {
				return
			}

			body := rec.body.String()
			if !utf8.ValidString(body) {
				return
			}

			url := r.URL.String()
			title := r.URL.Path

			// Background capture — never blocks the request
			go func() {
				ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
				defer cancel()
				if err := c.CapturePage(ctx, url, title, body); err != nil {
					if cfg.OnError != nil {
						cfg.OnError(err)
					}
				}
			}()
		})
	}
}

// ─── RouteInfo — manual route registration ────────────────────────────────────

// RouteInfo describes a single API route for bulk KB indexing.
type RouteInfo struct {
	// Method is the HTTP method (GET, POST, etc.).
	Method string
	// Path is the URL path pattern (e.g. "/api/products").
	Path string
	// Title is a human-readable name for this route.
	Title string
	// Description explains what this endpoint does, its parameters, and example responses.
	Description string
}

// IndexRoutes creates one Knowledge Base article per route, giving the bot
// a permanent understanding of your API surface — no requests needed.
//
// Typical usage at startup:
//
//	client.IndexRoutes(ctx, []fluxchat.RouteInfo{
//	    {Method: "GET",  Path: "/api/products",    Title: "List products",    Description: "Returns all active products with price and stock."},
//	    {Method: "POST", Path: "/api/orders",      Title: "Create order",     Description: "Creates a new order. Body: {productId, quantity, userId}."},
//	    {Method: "GET",  Path: "/api/users/:id",   Title: "Get user by ID",   Description: "Returns user profile: name, email, role, createdAt."},
//	})
func (c *Client) IndexRoutes(ctx context.Context, routes []RouteInfo) error {
	for _, r := range routes {
		title := r.Method + " " + r.Path
		if r.Title != "" {
			title = r.Title
		}
		content := r.Method + " " + r.Path
		if r.Description != "" {
			content += "\n\n" + r.Description
		}
		if _, err := c.CreateKnowledge(ctx, KnowledgeItem{
			Title:   title,
			Content: content,
		}); err != nil {
			return err
		}
	}
	return nil
}

// ─── responseRecorder ─────────────────────────────────────────────────────────

type responseRecorder struct {
	http.ResponseWriter
	status   int
	body     *bytes.Buffer
	maxBytes int64
	written  int64
}

func (r *responseRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	if r.status == 0 {
		r.status = http.StatusOK
	}
	n, err := r.ResponseWriter.Write(b)
	// Capture up to maxBytes
	remaining := r.maxBytes - r.written
	if remaining > 0 {
		take := int64(n)
		if take > remaining {
			take = remaining
		}
		r.body.Write(b[:take])
		r.written += take
	}
	return n, err
}

func isTextContent(ct string) bool {
	ct = strings.ToLower(ct)
	return strings.Contains(ct, "json") ||
		strings.Contains(ct, "text/") ||
		strings.Contains(ct, "xml") ||
		strings.Contains(ct, "form")
}
