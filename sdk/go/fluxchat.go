// Package fluxchat provides the official FluxChat SDK for Go.
//
// Basic usage:
//
//	client, err := fluxchat.NewClient("your-api-key")
//	if err != nil {
//	    log.Fatal(err)
//	}
//	resp, err := client.Ask(ctx, "Hello!", fluxchat.WithSessionID("user-123"))
package fluxchat

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
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

// ConfigError is returned when the client is misconfigured (e.g. empty API key).
type ConfigError struct {
	Message string
}

func (e *ConfigError) Error() string {
	return fmt.Sprintf("fluxchat: config error: %s", e.Message)
}

// ─── Auth types ───────────────────────────────────────────────────────────────

// LoginResponse holds the result of a successful login.
type LoginResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    string `json:"expiresIn"`
}

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
// EscalateResult is returned when a visitor is handed off to a human.
type EscalateResult struct {
	// TicketID — keep it, with the e-mail, to follow the thread.
	TicketID string `json:"ticketId"`
	// Status at creation ("open", or higher on a priority-support plan).
	Status string `json:"status"`
}

// TicketMessage is one line of a ticket thread, labelled by who said it:
// "bot", "visitor" or "agent".
type TicketMessage struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	Role      string `json:"role"`
	CreatedAt string `json:"createdAt"`
}

// TicketThread is a visitor's own support conversation, exactly as the widget
// shows it to them.
type TicketThread struct {
	TicketID string `json:"ticketId"`
	Subject  string `json:"subject"`
	// Status is one of "open", "in_progress", "resolved", "closed".
	Status string `json:"status"`
	// AgentConnected is true once a human has actually written — not merely
	// been assigned.
	AgentConnected bool   `json:"agentConnected"`
	AgentName      string `json:"agentName"`
	// Closed means "resolved" or "closed": readable, no longer writable.
	Closed   bool            `json:"closed"`
	Messages []TicketMessage `json:"messages"`
}

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

// WithOrgID sets the organization ID required for Knowledge Base operations.
// You can obtain it from the OrganizationID field returned by TestKey.
func WithOrgID(orgID string) Option {
	return func(c *Client) {
		c.orgID = orgID
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
	orgID      string
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new FluxChat client.
// Returns a ConfigError if apiKey is empty.
func NewClient(apiKey string, opts ...Option) (*Client, error) {
	if strings.TrimSpace(apiKey) == "" {
		return nil, &ConfigError{Message: "apiKey must not be empty"}
	}
	c := &Client{
		apiKey:  apiKey,
		baseURL: "https://api.fluxchat-corp.com/api/v2",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
	for _, o := range opts {
		o(c)
	}
	return c, nil
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
// As a side effect, it caches the OrganizationID on the client so that
// Knowledge Base methods work without explicitly calling WithOrgID.
func (c *Client) TestKey(ctx context.Context) (*KeyInfo, error) {
	var result KeyInfo
	if err := c.get(ctx, "/public/bot/test", &result, false); err != nil {
		return nil, err
	}
	if c.orgID == "" && result.OrganizationID != "" {
		c.orgID = result.OrganizationID
	}
	return &result, nil
}

// Login authenticates a user and stores the JWT for Knowledge Base read operations.
// After calling Login, knowledge list/get methods will work automatically.
func (c *Client) Login(ctx context.Context, email, password string) (*LoginResponse, error) {
	payload := map[string]string{"email": email, "password": password}
	var result LoginResponse
	if err := c.post(ctx, "/auth/login", payload, &result, false); err != nil {
		return nil, err
	}
	c.jwtToken = result.AccessToken
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

// ─── Support: human handoff and the visitor's own thread ──────────────────────
//
// The visitor has no FluxChat account and no session: the e-mail they escalated
// with is what proves the ticket is theirs, on every read and every reply.
// Treat it like a one-time link you e-mailed them — enough to reach their own
// conversation, never anyone else's, since the lookup is also scoped to the
// organization behind the API key.
//
// The thread is polled, not pushed: there is no socket on the public surface.
// Five seconds is the cadence the official widget uses and what the route's
// rate limit is sized for.

// Escalate hands a visitor off to a human, creating a real support ticket.
//
// Pass the same sessionID you use with Ask and everything the bot already said
// is copied into the ticket, so the agent picks up mid-conversation.
// Best-effort: the session lives for 2h, after which the ticket simply starts
// at the visitor's message.
func (c *Client) Escalate(ctx context.Context, name, email, message, sessionID string) (*EscalateResult, error) {
	payload := map[string]string{
		"name":    name,
		"email":   email,
		"message": message,
	}
	if sessionID != "" {
		payload["sessionId"] = sessionID
	}
	var result EscalateResult
	if err := c.post(ctx, "/public/bot/escalate", payload, &result, false); err != nil {
		return nil, err
	}
	return &result, nil
}

// TicketThread reads a visitor's own ticket thread, each line labelled by role.
//
// It returns an *APIError with status 404 both when the ticket does not exist
// and when email is not the one it was raised with: the two cases are
// deliberately indistinguishable, so a guessed ticket id reveals nothing.
func (c *Client) TicketThread(ctx context.Context, ticketID, email string) (*TicketThread, error) {
	path := "/public/bot/tickets/" + url.PathEscape(ticketID) +
		"?email=" + url.QueryEscape(email)
	var result TicketThread
	if err := c.get(ctx, path, &result, false); err != nil {
		return nil, err
	}
	return &result, nil
}

// ReplyToTicket posts the visitor's reply into their own ticket.
//
// A reply to a "resolved" ticket reopens it; a "closed" one refuses the write
// (403) rather than swallowing a message nobody will read.
func (c *Client) ReplyToTicket(ctx context.Context, ticketID, email, content string) error {
	payload := map[string]string{"email": email, "content": content}
	return c.post(ctx,
		"/public/bot/tickets/"+url.PathEscape(ticketID)+"/messages",
		payload, nil, false)
}

// ─── Knowledge CRUD ───────────────────────────────────────────────────────────

// knowledgeBase returns the base path for knowledge operations.
// Returns a ConfigError if orgID has not been set (via WithOrgID or TestKey).
func (c *Client) knowledgeBase() (string, error) {
	if c.orgID == "" {
		return "", &ConfigError{Message: "orgID is required for Knowledge operations — call TestKey() first or use WithOrgID()"}
	}
	return "/bot/organizations/" + c.orgID + "/knowledge", nil
}

// GetKnowledge returns all knowledge base items.
// Requires either a JWT (via Login or WithJWT) or an API key with bot:read scope.
func (c *Client) GetKnowledge(ctx context.Context) ([]KnowledgeItem, error) {
	base, err := c.knowledgeBase()
	if err != nil {
		return nil, err
	}
	useJWT := c.jwtToken != ""
	var result []KnowledgeItem
	if err := c.get(ctx, base, &result, useJWT); err != nil {
		return nil, err
	}
	return result, nil
}

// GetKnowledgeItem returns a single knowledge base item by ID.
// Requires either a JWT (via Login or WithJWT) or an API key with bot:read scope.
func (c *Client) GetKnowledgeItem(ctx context.Context, id string) (*KnowledgeItem, error) {
	base, err := c.knowledgeBase()
	if err != nil {
		return nil, err
	}
	useJWT := c.jwtToken != ""
	var result KnowledgeItem
	if err := c.get(ctx, base+"/"+id, &result, useJWT); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateKnowledge creates a new knowledge base item (requires bot:write scope).
func (c *Client) CreateKnowledge(ctx context.Context, item KnowledgeItem) (*KnowledgeItem, error) {
	base, err := c.knowledgeBase()
	if err != nil {
		return nil, err
	}
	useJWT := c.jwtToken != ""
	var result KnowledgeItem
	if err := c.post(ctx, base, item, &result, useJWT); err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdateKnowledge updates an existing knowledge base item (requires bot:write scope).
func (c *Client) UpdateKnowledge(ctx context.Context, id string, patch KnowledgeItem) (*KnowledgeItem, error) {
	base, err := c.knowledgeBase()
	if err != nil {
		return nil, err
	}
	useJWT := c.jwtToken != ""
	var result KnowledgeItem
	if err := c.patch(ctx, base+"/"+id, patch, &result, useJWT); err != nil {
		return nil, err
	}
	return &result, nil
}

// DeleteKnowledge deletes a knowledge base item by ID (requires bot:write scope).
func (c *Client) DeleteKnowledge(ctx context.Context, id string) error {
	base, err := c.knowledgeBase()
	if err != nil {
		return err
	}
	useJWT := c.jwtToken != ""
	return c.delete(ctx, base+"/"+id, useJWT)
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
