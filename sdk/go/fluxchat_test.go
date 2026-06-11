package fluxchat_test

import (
	"context"
	"encoding/json"
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
		_ = json.NewEncoder(w).Encode(body)
	}))
	client := fluxchat.NewClient(
		"test-api-key",
		fluxchat.WithBaseURL(srv.URL),
		fluxchat.WithHTTPClient(srv.Client()),
	)
	return srv, client
}

// ─── Ask ─────────────────────────────────────────────────────────────────────

func TestAsk_Success(t *testing.T) {
	srv, client := newTestServer(http.StatusOK, map[string]string{
		"text":            "Bonjour !",
		"conversation_id": "conv-1",
	})
	defer srv.Close()

	resp, err := client.Ask(context.Background(), "Bonjour")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Text != "Bonjour !" {
		t.Errorf("expected text 'Bonjour !', got %q", resp.Text)
	}
	if resp.ConversationID != "conv-1" {
		t.Errorf("expected conversation_id 'conv-1', got %q", resp.ConversationID)
	}
}

func TestAsk_WithOptions(t *testing.T) {
	srv, client := newTestServer(http.StatusOK, map[string]string{
		"text":            "Réponse",
		"conversation_id": "conv-abc",
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
	srv, client := newTestServer(http.StatusUnauthorized, map[string]string{
		"error": "Invalid API key",
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
		"valid": true,
		"plan":  "pro",
	})
	defer srv.Close()

	info, err := client.TestKey(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !info.Valid {
		t.Error("expected valid=true")
	}
	if info.Plan != "pro" {
		t.Errorf("expected plan 'pro', got %q", info.Plan)
	}
}

func TestTestKey_Unauthorized(t *testing.T) {
	srv, client := newTestServer(http.StatusUnauthorized, map[string]string{"error": "bad key"})
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
	srv, client := newTestServer(http.StatusOK, items)
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
	srv, client := newTestServer(http.StatusOK, map[string]string{
		"id": "2", "title": "Nouveau", "content": "Contenu",
	})
	defer srv.Close()

	item, err := client.CreateKnowledge(context.Background(), "Nouveau", "Contenu")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if item.ID != "2" {
		t.Errorf("expected id '2', got %q", item.ID)
	}
}

func TestDeleteKnowledge(t *testing.T) {
	srv, client := newTestServer(http.StatusNoContent, nil)
	defer srv.Close()

	err := client.DeleteKnowledge(context.Background(), "1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
