"""Data models for the FluxChat Python SDK."""

from __future__ import annotations
from dataclasses import dataclass, field


@dataclass(frozen=True)
class AskResponse:
    """Réponse de la méthode :meth:`FluxChat.ask`."""
    reply: str
    conversation_id: str | None = None

    @classmethod
    def from_dict(cls, data: dict) -> "AskResponse":
        return cls(
            reply=data.get("text") or data.get("reply") or "",
            conversation_id=data.get("conversation_id"),
        )


@dataclass(frozen=True)
class KeyInfo:
    """Réponse de la méthode :meth:`FluxChat.test_key`."""
    organization_id: str | None = None
    scopes: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "KeyInfo":
        return cls(
            organization_id=data.get("organization_id"),
            scopes=data.get("scopes", []),
        )


@dataclass(frozen=True)
class KnowledgeItem:
    """Élément de la base de connaissance."""
    id: str | None = None
    title: str = ""
    content: str = ""
    category: str | None = None
    keywords: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "KnowledgeItem":
        return cls(
            id=data.get("id"),
            title=data.get("title", ""),
            content=data.get("content", ""),
            category=data.get("category"),
            keywords=data.get("keywords", []),
        )
