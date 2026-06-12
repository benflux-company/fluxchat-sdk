// Package fluxchat provides the official FluxChat SDK for Go.
//
// Basic usage:
//
//	client := fluxchat.NewClient("your-api-key")
//	resp, err := client.Ask(ctx, "Hello!", fluxchat.WithSessionID("user-123"))
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

type apiEnvelope[T any] struct {
	Success bool   `json:"success"`
	Data    T      `json:"data,omitempty"`
	Message string `json:"message,omitempty"`
}

// AskResponse holds the reply from the FluxChat API.
type AskResponse struct {
	Reply          string `json:"reply"`
	ConversationID string `json:"conversationId"`
}

// KeyInfo holds the result of a key validation check.
type KeyInfo struct {
	OrganizationID string   `json:"organizationId"`
	Scopes         []string `json:"scopes"`
}

// KnowledgeItem represents a single item in the knowledge base.
type KnowledgeItem struct {
	ID        string   `json:"id,omitempty"`
	Title     string   `json:"title,omitempty"`
	Content   string   `json:"content,omitempty"`
	Category  string   `json:"category,omitempty"`
	Keywords  []string `json:"keywords,omitempty"`
	IsActive  *bool    `json:"isActive,omitempty"`
	CreatedAt string   `json:"createdAt,omitempty"`
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

// WithJWT configures the client with a JWT token for admin actions (Knowledge Base).
func WithJWT(token string) Option {
	return func(c *Client) {
		c.jwtToken = token
	}
}

// AskOption configures a single Ask call.
type AskOption func(*askPayload)

type askPayload struct {
	Message        string `json:"message"`
	Context        string `json:"context,omitempty"`
	ConversationID string `json:"conversationId,omitempty"`
	SessionID      string `json:"sessionId,omitempty"`
}

// WithContext attaches an optional context string to an Ask call.
func WithContext(ctx string) AskOption {
	return func(p *askPayload) { p.Context = ctx }
}

// WithConversationID continues an existing conversation.
func WithConversationID(id string) AskOption {
	return func(p *askPayload) { p.ConversationID = id }
}

// WithSessionID sets the session ID for context retention across stateless calls.
func WithSessionID(id string) AskOption {
	return func(p *askPayload) { p.SessionID = id }
}

// ─── Client ───────────────────────────────────────────────────────────────────

// Client is the main FluxChat API client.
type Client struct {
	apiKey     string
	jwtToken   string
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new FluxChat client.
func NewClient(apiKey string, opts ...Option) *Client {
	c := &Client{
		apiKey:  apiKey,
		baseURL: "https://dev-api.fluxchat-corp.com/api/v2",
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
	if err := c.post(ctx, "/public/bot/ask", payload, &result, false); err != nil {
		return nil, err
	}
	return &result, nil
}

// TestKey verifies the API key and returns associated info.
func (c *Client) TestKey(ctx context.Context) (*KeyInfo, error) {
	var result KeyInfo
	if err := c.get(ctx, "/public/bot/test", &result, false); err != nil {
		return nil, err
	}
	return &result, nil
}

// CapturePage passively captures page content for the bot's knowledge.
func (c *Client) CapturePage(ctx context.Context, url, title, content string) error {
	payload := map[string]string{
		"url":     url,
		"title":   title,
		"content": content,
	}
	return c.post(ctx, "/public/bot/pages", payload, nil, false)
}

// ─── Knowledge CRUD ───────────────────────────────────────────────────────────

// GetKnowledge returns all knowledge base items (requires JWT).
func (c *Client) GetKnowledge(ctx context.Context) ([]KnowledgeItem, error) {
	var result []KnowledgeItem
	if err := c.get(ctx, "/bot/knowledge", &result, true); err != nil {
		return nil, err
	}
	return result, nil
}

// GetKnowledgeItem returns a single knowledge base item by ID (requires JWT).
func (c *Client) GetKnowledgeItem(ctx context.Context, id string) (*KnowledgeItem, error) {
	var result KnowledgeItem
	if err := c.get(ctx, "/bot/knowledge/"+id, &result, true); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateKnowledge creates a new knowledge base item (requires JWT).
func (c *Client) CreateKnowledge(ctx context.Context, item KnowledgeItem) (*KnowledgeItem, error) {
	var result KnowledgeItem
	if err := c.post(ctx, "/bot/knowledge", item, &result, true); err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdateKnowledge updates an existing knowledge base item (requires JWT).
func (c *Client) UpdateKnowledge(ctx context.Context, id string, patch KnowledgeItem) (*KnowledgeItem, error) {
	var result KnowledgeItem
	if err := c.patch(ctx, "/bot/knowledge/"+id, patch, &result, true); err != nil {
		return nil, err
	}
	return &result, nil
}

// DeleteKnowledge deletes a knowledge base item by ID (requires JWT).
func (c *Client) DeleteKnowledge(ctx context.Context, id string) error {
	return c.delete(ctx, "/bot/knowledge/"+id, true)
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

func (c *Client) get(ctx context.Context, path string, out any, useJWT bool) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return &NetworkError{Cause: err}
	}
	return c.do(req, out, useJWT)
}

func (c *Client) post(ctx context.Context, path string, body, out any, useJWT bool) error {
	return c.doWithBody(ctx, http.MethodPost, path, body, out, useJWT)
}

func (c *Client) put(ctx context.Context, path string, body, out any, useJWT bool) error {
	return c.doWithBody(ctx, http.MethodPut, path, body, out, useJWT)
}

func (c *Client) patch(ctx context.Context, path string, body, out any, useJWT bool) error {
	return c.doWithBody(ctx, http.MethodPatch, path, body, out, useJWT)
}

func (c *Client) delete(ctx context.Context, path string, useJWT bool) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, c.baseURL+path, nil)
	if err != nil {
		return &NetworkError{Cause: err}
	}
	return c.do(req, nil, useJWT)
}

func (c *Client) doWithBody(ctx context.Context, method, path string, body, out any, useJWT bool) error {
	b, err := json.Marshal(body)
	if err != nil {
		return &NetworkError{Cause: err}
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bytes.NewReader(b))
	if err != nil {
		return &NetworkError{Cause: err}
	}
	req.Header.Set("Content-Type", "application/json")
	return c.do(req, out, useJWT)
}

func (c *Client) do(req *http.Request, out any, useJWT bool) error {
	if useJWT {
		req.Header.Set("Authorization", "Bearer "+c.jwtToken)
	} else {
		req.Header.Set("X-API-Key", c.apiKey)
	}
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
		msg := string(raw)
		var env apiEnvelope[any]
		if err := json.Unmarshal(raw, &env); err == nil && env.Message != "" {
			msg = env.Message
		}
		return &APIError{StatusCode: resp.StatusCode, Message: msg}
	}

	if out != nil && len(raw) > 0 {
		// Use apiEnvelope to extract data
		var env apiEnvelope[json.RawMessage]
		if err := json.Unmarshal(raw, &env); err != nil {
			return &NetworkError{Cause: fmt.Errorf("decode envelope: %w", err)}
		}
		if len(env.Data) > 0 && string(env.Data) != "null" {
			if err := json.Unmarshal(env.Data, out); err != nil {
				return &NetworkError{Cause: fmt.Errorf("decode data: %w", err)}
			}
		}
	}
	return nil
}
