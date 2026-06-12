"""Tests for the FluxChat Python SDK."""

from __future__ import annotations
import json
import pytest
import httpx

from fluxchat import FluxChat, FluxChatApiError, FluxChatNetworkError, FluxChatConfigError


# ─── Helper : crée un client avec un transport mocké ─────────────────────────

def make_client(status: int, body: object) -> FluxChat:
    """Crée un client FluxChat avec un transport httpx mocké."""

    class MockTransport(httpx.BaseTransport):
        def handle_request(self, request: httpx.Request) -> httpx.Response:
            response_body = {"success": 200 <= status < 300}
            if 200 <= status < 300:
                if body is not None:
                    response_body["data"] = body
            else:
                if isinstance(body, dict) and "error" in body:
                    response_body["message"] = body["error"]
                else:
                    response_body["message"] = "Error"
            
            return httpx.Response(
                status_code=status,
                headers={"Content-Type": "application/json"},
                content=json.dumps(response_body).encode() if status != 204 else b"",
            )

    http_client = httpx.Client(transport=MockTransport())
    return FluxChat(api_key="test-key", _http_client=http_client)


# ─── FluxChatConfigError ─────────────────────────────────────────────────────

class TestConfig:
    def test_raises_on_empty_api_key(self):
        with pytest.raises(FluxChatConfigError):
            FluxChat(api_key="")

    def test_raises_on_whitespace_api_key(self):
        with pytest.raises(FluxChatConfigError):
            FluxChat(api_key="   ")


# ─── ask() ───────────────────────────────────────────────────────────────────

class TestAsk:
    def test_returns_ask_response(self):
        client = make_client(200, {"text": "Bonjour !", "conversationId": "conv-1"})
        result = client.ask("Bonjour")
        assert result.reply == "Bonjour !"
        assert result.conversation_id == "conv-1"

    def test_with_context_and_conversation_id(self):
        client = make_client(200, {"text": "Réponse", "conversationId": "conv-abc"})
        result = client.ask("Question", context="support", conversation_id="conv-abc")
        assert result.conversation_id == "conv-abc"

    def test_raises_api_error_on_401(self):
        client = make_client(401, {"error": "Invalid key"})
        with pytest.raises(FluxChatApiError) as exc_info:
            client.ask("test")
        assert exc_info.value.status_code == 401

    def test_raises_api_error_on_500(self):
        client = make_client(500, {"error": "Internal Server Error"})
        with pytest.raises(FluxChatApiError) as exc_info:
            client.ask("test")
        assert exc_info.value.status_code == 500

class TestCapturePage:
    def test_capture_page(self):
        client = make_client(204, None)
        client.capture_page("https://test.com", "Test", "Content")
        # Should not raise


# ─── test_key() ──────────────────────────────────────────────────────────────

class TestTestKey:
    def test_returns_key_info(self):
        client = make_client(200, {
            "organizationId": "org-123",
            "scopes": ["read", "write"],
        })
        info = client.test_key()
        assert info.organization_id == "org-123"
        assert "read" in info.scopes

    def test_raises_on_403(self):
        client = make_client(403, {"error": "Forbidden"})
        with pytest.raises(FluxChatApiError) as exc_info:
            client.test_key()
        assert exc_info.value.status_code == 403


# ─── knowledge ───────────────────────────────────────────────────────────────

class TestKnowledge:
    def test_create_returns_item(self):
        client = make_client(200, {"id": "1", "title": "FAQ", "content": "Contenu"})
        item = client.knowledge.create("FAQ", "Contenu")
        assert item.id == "1"
        assert item.title == "FAQ"

    def test_create_with_category_and_keywords(self):
        client = make_client(200, {
            "id": "2", "title": "Docs", "content": "...",
            "category": "tech", "keywords": ["api", "sdk"],
        })
        item = client.knowledge.create("Docs", "...", category="tech", keywords=["api", "sdk"])
        assert item.category == "tech"
        assert "sdk" in item.keywords

    def test_update_returns_updated_item(self):
        client = make_client(200, {"id": "1", "title": "FAQ v2", "content": "Nouveau"})
        item = client.knowledge.update("1", title="FAQ v2", content="Nouveau")
        assert item.title == "FAQ v2"

    def test_delete_does_not_raise(self):
        client = make_client(204, None)
        client.knowledge.delete("1")  # Ne doit pas lever d'exception

    def test_list_returns_items(self):
        client = make_client(200, [
            {"id": "1", "title": "FAQ", "content": "Contenu"},
        ])
        items = client.knowledge.list()
        assert len(items) == 1
        assert items[0].title == "FAQ"

    def test_get_returns_item(self):
        client = make_client(200, {"id": "1", "title": "FAQ", "content": "Contenu"})
        item = client.knowledge.get("1")
        assert item.id == "1"


# ─── Exceptions ──────────────────────────────────────────────────────────────

class TestExceptions:
    def test_api_error_str(self):
        e = FluxChatApiError(404, "Not found")
        assert "404" in str(e)
        assert "Not found" in str(e)

    def test_network_error_str(self):
        e = FluxChatNetworkError("Connection refused")
        assert "Connection refused" in str(e)

    def test_config_error_is_value_error(self):
        with pytest.raises(ValueError):
            FluxChat(api_key="")
