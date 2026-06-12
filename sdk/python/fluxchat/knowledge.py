"""Knowledge Base CRUD client."""

from __future__ import annotations
from typing import TYPE_CHECKING, Any

from .models import KnowledgeItem

if TYPE_CHECKING:
    from ._http import HttpHelper


class KnowledgeClient:
    """Client fluent pour les opérations Knowledge Base.

    Accessible via :attr:`FluxChat.knowledge`.
    """

    def __init__(self, http: "HttpHelper", jwt_token: str | None = None) -> None:
        self._http = http
        self._jwt_token = jwt_token

    # ── CRUD ──────────────────────────────────────────────────────────────────

    def create(
        self,
        title: str,
        content: str,
        category: str | None = None,
        keywords: list[str] | None = None,
    ) -> KnowledgeItem:
        """Crée un nouvel élément de connaissance."""
        payload: dict[str, Any] = {"title": title, "content": content}
        if category is not None:
            payload["category"] = category
        if keywords is not None:
            payload["keywords"] = keywords
        headers = self._jwt_headers()
        data = self._http.post("/bot/knowledge", payload, extra_headers=headers)
        return KnowledgeItem.from_dict(data)

    def update(self, id: str, **patch: Any) -> KnowledgeItem:
        """Met à jour un élément existant avec les champs fournis."""
        headers = self._jwt_headers()
        data = self._http.patch(f"/bot/knowledge/{id}", patch, extra_headers=headers)
        return KnowledgeItem.from_dict(data)

    def delete(self, id: str) -> None:
        """Supprime un élément par son identifiant."""
        headers = self._jwt_headers()
        self._http.delete(f"/bot/knowledge/{id}", extra_headers=headers)

    def list(self) -> list[KnowledgeItem]:
        """Retourne tous les éléments (requiert un JWT token)."""
        headers = self._jwt_headers()
        data = self._http.get("/bot/knowledge", extra_headers=headers)
        return [KnowledgeItem.from_dict(item) for item in data]

    def get(self, id: str) -> KnowledgeItem:
        """Retourne un élément par son identifiant (requiert un JWT token)."""
        headers = self._jwt_headers()
        data = self._http.get(f"/bot/knowledge/{id}", extra_headers=headers)
        return KnowledgeItem.from_dict(data)

    # ── Private ───────────────────────────────────────────────────────────────

    def _jwt_headers(self) -> dict[str, str]:
        if self._jwt_token:
            return {"Authorization": f"Bearer {self._jwt_token}"}
        return {}
