// Package fluxchat provides the official FluxChat SDK for Go.
//
// Basic usage:
//
//	client := fluxchat.NewClient("your-api-key")
//	resp, err := client.Ask(ctx, "Hello!", fluxchat.WithContext("support"))
package fluxchat

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// ─── Error types ──────────────────────────────────────────────────────────────

// APIError is returned when the FluxChat API responds with a non-2xx status.
type APIError struct {
	StatusCode int
	Message    string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("fluxchat: API error %d: %s", e.StatusCode, e.Message)
}

// NetworkError is returned when a network-level failure occurs.
type NetworkError struct {
	Cause error
}

func (e *NetworkError) Error() string {
	return fmt.Sprintf("fluxchat: network error: %v", e.Cause)
}

func (e *NetworkError) Unwrap() error { return e.Cause }

// ─── Models ───────────────────────────────────────────────────────────────────

// AskResponse holds the reply from the FluxChat API.
type AskResponse struct {
	Text           string `json:"text"`
	ConversationID string `json:"conversation_id"`
}

// KeyInfo holds the result of a key validation check.
type KeyInfo struct {
	Valid bool   `json:"valid"`
	Plan  string `json:"plan"`
}

// KnowledgeItem represents a single item in the knowledge base.
type KnowledgeItem struct {
	ID      string `json:"id,omitempty"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

// ─── Options ──────────────────────────────────────────────────────────────────

// Option configures the FluxChat client.
type Option func(*Client)

// WithBaseURL overrides the default API base URL.
func WithBaseURL(url string) Option {
	return func(c *Client) {
		c.baseURL = strings.TrimRight(url, "/")
	}
}

// WithHTTPClient replaces the default HTTP client (useful for testing).
func WithHTTPClient(hc *http.Client) Option {
	return func(c *Client) {
		c.httpClient = hc
	}
}

// AskOption configures a single Ask call.
type AskOption func(*askPayload)

type askPayload struct {
	Message        string `json:"message"`
	Context        string `json:"context,omitempty"`
	ConversationID string `json:"conversation_id,omitempty"`
}

// WithContext attaches an optional context string to an Ask call.
func WithContext(ctx string) AskOption {
	return func(p *askPayload) { p.Context = ctx }
}

// WithConversationID continues an existing conversation.
func WithConversationID(id string) AskOption {
	return func(p *askPayload) { p.ConversationID = id }
}

// ─── Client ───────────────────────────────────────────────────────────────────

// Client is the main FluxChat API client.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new FluxChat client.
//
//	client := fluxchat.NewClient("sk-...")
//	client := fluxchat.NewClient("sk-...", fluxchat.WithBaseURL("https://my-proxy/v1"))
func NewClient(apiKey string, opts ...Option) *Client {
	c := &Client{
		apiKey:  apiKey,
		baseURL: "https://api.fluxchat.io/v1",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
	for _, o := range opts {
		o(c)
	}
	return c
}

// ─── Core methods ─────────────────────────────────────────────────────────────

// Ask sends a message to FluxChat and returns the response.
func (c *Client) Ask(ctx context.Context, msg string, opts ...AskOption) (*AskResponse, error) {
	payload := &askPayload{Message: msg}
	for _, o := range opts {
		o(payload)
	}
	var result AskResponse
	if err := c.post(ctx, "/ask", payload, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// TestKey verifies the API key and returns associated info.
func (c *Client) TestKey(ctx context.Context) (*KeyInfo, error) {
	var result KeyInfo
	if err := c.get(ctx, "/test-key", &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ─── Knowledge CRUD ───────────────────────────────────────────────────────────

// GetKnowledge returns all knowledge base items.
func (c *Client) GetKnowledge(ctx context.Context) ([]KnowledgeItem, error) {
	var result []KnowledgeItem
	if err := c.get(ctx, "/knowledge", &result); err != nil {
		return nil, err
	}
	return result, nil
}

// CreateKnowledge creates a new knowledge base item.
func (c *Client) CreateKnowledge(ctx context.Context, title, content string) (*KnowledgeItem, error) {
	payload := KnowledgeItem{Title: title, Content: content}
	var result KnowledgeItem
	if err := c.post(ctx, "/knowledge", payload, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdateKnowledge updates an existing knowledge base item.
func (c *Client) UpdateKnowledge(ctx context.Context, id, title, content string) (*KnowledgeItem, error) {
	payload := KnowledgeItem{Title: title, Content: content}
	var result KnowledgeItem
	if err := c.put(ctx, "/knowledge/"+id, payload, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// DeleteKnowledge deletes a knowledge base item by ID.
func (c *Client) DeleteKnowledge(ctx context.Context, id string) error {
	return c.delete(ctx, "/knowledge/"+id)
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

func (c *Client) get(ctx context.Context, path string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return &NetworkError{Cause: err}
	}
	return c.do(req, out)
}

func (c *Client) post(ctx context.Context, path string, body, out any) error {
	return c.doWithBody(ctx, http.MethodPost, path, body, out)
}

func (c *Client) put(ctx context.Context, path string, body, out any) error {
	return c.doWithBody(ctx, http.MethodPut, path, body, out)
}

func (c *Client) delete(ctx context.Context, path string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, c.baseURL+path, nil)
	if err != nil {
		return &NetworkError{Cause: err}
	}
	return c.do(req, nil)
}

func (c *Client) doWithBody(ctx context.Context, method, path string, body, out any) error {
	b, err := json.Marshal(body)
	if err != nil {
		return &NetworkError{Cause: err}
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bytes.NewReader(b))
	if err != nil {
		return &NetworkError{Cause: err}
	}
	req.Header.Set("Content-Type", "application/json")
	return c.do(req, out)
}

func (c *Client) do(req *http.Request, out any) error {
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return &NetworkError{Cause: err}
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return &NetworkError{Cause: err}
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &APIError{StatusCode: resp.StatusCode, Message: string(raw)}
	}

	if out != nil {
		if err := json.Unmarshal(raw, out); err != nil {
			return &NetworkError{Cause: fmt.Errorf("decode response: %w", err)}
		}
	}
	return nil
}
