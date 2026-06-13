package fluxchat

import (
	"context"
)

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
//	    {Method: "GET",  Path: "/api/products", Title: "List products",  Description: "Returns all active products with price and stock."},
//	    {Method: "POST", Path: "/api/orders",   Title: "Create order",   Description: "Creates a new order. Body: {productId, quantity, userId}."},
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
