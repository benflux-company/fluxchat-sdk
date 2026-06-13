package fluxchat_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	fluxchat "github.com/benflux-company/fluxchat-sdk/sdk/go"
)

// ─── Helper : crée un serveur HTTP de test ────────────────────────────────────

func newTestServer(statusCode int, body any) (*httptest.Server, *fluxchat.Client) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		if body != nil {
			_ = json.NewEncoder(w).Encode(body)
		}
	}))
	client, err := fluxchat.NewClient(
		"test-api-key",
		fluxchat.WithBaseURL(srv.URL),
		fluxchat.WithHTTPClient(srv.Client()),
	)
	if err != nil {
		panic(err)
	}
	return srv, client
}

// ─── Ask ─────────────────────────────────────────────────────────────────────

func TestAsk_Success(t *testing.T) {
	srv, client := newTestServer(http.StatusOK, map[string]any{
		"success": true,
		"data": map[string]string{
			"reply":          "Bonjour !",
			"conversationId": "conv-1",
		},
	})
	defer srv.Close()

	resp, err := client.Ask(context.Background(), "Bonjour")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Reply != "Bonjour !" {
		t.Errorf("expected reply 'Bonjour !', got %q", resp.Reply)
	}
	if resp.ConversationID != "conv-1" {
		t.Errorf("expected conversationId 'conv-1', got %q", resp.ConversationID)
	}
}

func TestAsk_WithOptions(t *testing.T) {
	srv, client := newTestServer(http.StatusOK, map[string]any{
		"success": true,
		"data": map[string]string{
			"reply":          "Réponse",
			"conversationId": "conv-abc",
		},
	})
	defer srv.Close()

	resp, err := client.Ask(
		context.Background(),
		"test",
		fluxchat.WithContext("support"),
		fluxchat.WithConversationID("conv-abc"),
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ConversationID != "conv-abc" {
		t.Errorf("expected conv-abc, got %q", resp.ConversationID)
	}
}

func TestAsk_APIError(t *testing.T) {
	srv, client := newTestServer(http.StatusUnauthorized, map[string]any{
		"success": false,
		"message": "Invalid API key",
	})
	defer srv.Close()

	_, err := client.Ask(context.Background(), "test")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	apiErr, ok := err.(*fluxchat.APIError)
	if !ok {
		t.Fatalf("expected *fluxchat.APIError, got %T", err)
	}
	if apiErr.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", apiErr.StatusCode)
	}
}

// ─── TestKey ─────────────────────────────────────────────────────────────────

func TestTestKey_Success(t *testing.T) {
	srv, client := newTestServer(http.StatusOK, map[string]any{
		"success": true,
		"data": map[string]any{
			"organizationId": "org-123",
			"scopes":         []string{"ask", "knowledge"},
		},
	})
	defer srv.Close()

	info, err := client.TestKey(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info.OrganizationID != "org-123" {
		t.Error("expected organizationId org-123")
	}
	if len(info.Scopes) != 2 {
		t.Errorf("expected 2 scopes, got %d", len(info.Scopes))
	}
}

func TestTestKey_Unauthorized(t *testing.T) {
	srv, client := newTestServer(http.StatusUnauthorized, map[string]any{"success": false, "message": "bad key"})
	defer srv.Close()

	_, err := client.TestKey(context.Background())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// ─── Knowledge CRUD ───────────────────────────────────────────────────────────

func TestGetKnowledge(t *testing.T) {
	items := []map[string]string{
		{"id": "1", "title": "FAQ", "content": "Contenu"},
	}
	srv, client := newTestServer(http.StatusOK, map[string]any{
		"success": true,
		"data":    items,
	})
	defer srv.Close()

	result, err := client.GetKnowledge(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("expected 1 item, got %d", len(result))
	}
	if result[0].Title != "FAQ" {
		t.Errorf("expected title 'FAQ', got %q", result[0].Title)
	}
}

func TestCreateKnowledge(t *testing.T) {
	srv, client := newTestServer(http.StatusOK, map[string]any{
		"success": true,
		"data": map[string]string{
			"id": "2", "title": "Nouveau", "content": "Contenu",
		},
	})
	defer srv.Close()

	item, err := client.CreateKnowledge(context.Background(), fluxchat.KnowledgeItem{
		Title:   "Nouveau",
		Content: "Contenu",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if item.ID != "2" {
		t.Errorf("expected id '2', got %q", item.ID)
	}
}

func TestDeleteKnowledge(t *testing.T) {
	srv, client := newTestServer(http.StatusOK, map[string]any{"success": true})
	defer srv.Close()

	err := client.DeleteKnowledge(context.Background(), "1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

// ─── Ask stateless ────────────────────────────────────────────────────────────

func TestAsk_Stateless(t *testing.T) {
	srv, client := newTestServer(http.StatusOK, map[string]any{
		"success": true,
		"data": map[string]string{
			"reply":          "Bonjour !",
			"conversationId": "",
		},
	})
	defer srv.Close()

	resp, err := client.Ask(context.Background(), "Bonjour")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ConversationID != "" {
		t.Errorf("expected empty conversationId for stateless call, got %q", resp.ConversationID)
	}
}

// ─── CapturePage 204 ─────────────────────────────────────────────────────────

func TestCapturePage_204(t *testing.T) {
	srv, client := newTestServer(http.StatusNoContent, nil)
	defer srv.Close()

	err := client.CapturePage(context.Background(), "https://example.com/about", "About", "Visible text content.")
	if err != nil {
		t.Fatalf("CapturePage returned unexpected error on 204: %v", err)
	}
}

// ─── 403 Forbidden ───────────────────────────────────────────────────────────

func TestAsk_Forbidden(t *testing.T) {
	srv, client := newTestServer(http.StatusForbidden, map[string]any{
		"success": false,
		"message": "API key lacks required scope",
	})
	defer srv.Close()

	_, err := client.Ask(context.Background(), "test")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	var apiErr *fluxchat.APIError
	if !errors.As(err, &apiErr) {
		t.Fatalf("expected *fluxchat.APIError, got %T", err)
	}
	if apiErr.StatusCode != http.StatusForbidden {
		t.Errorf("expected status 403, got %d", apiErr.StatusCode)
	}
}

// ─── Network error ───────────────────────────────────────────────────────────

func TestAsk_NetworkError(t *testing.T) {
	// Point the client at a port where nothing is listening.
	client, err := fluxchat.NewClient(
		"test-api-key",
		fluxchat.WithBaseURL("http://127.0.0.1:1"),
	)
	if err != nil {
		t.Fatalf("unexpected NewClient error: %v", err)
	}

	_, err = client.Ask(context.Background(), "test")
	if err == nil {
		t.Fatal("expected network error, got nil")
	}
	var netErr *fluxchat.NetworkError
	if !errors.As(err, &netErr) {
		t.Fatalf("expected *fluxchat.NetworkError, got %T: %v", err, err)
	}
}

// ─── ConfigError ─────────────────────────────────────────────────────────────

func TestNewClient_EmptyKey(t *testing.T) {
	_, err := fluxchat.NewClient("")
	if err == nil {
		t.Fatal("expected ConfigError for empty apiKey, got nil")
	}
	var cfgErr *fluxchat.ConfigError
	if !errors.As(err, &cfgErr) {
		t.Fatalf("expected *fluxchat.ConfigError, got %T", err)
	}
}

func TestNewClient_WhitespaceKey(t *testing.T) {
	_, err := fluxchat.NewClient("   ")
	if err == nil {
		t.Fatal("expected ConfigError for whitespace apiKey, got nil")
	}
}
