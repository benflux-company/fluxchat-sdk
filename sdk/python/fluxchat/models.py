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
            conversation_id=data.get("conversationId"),
        )


@dataclass(frozen=True)
class KeyInfo:
    """Réponse de la méthode :meth:`FluxChat.test_key`."""
    organization_id: str | None = None
    scopes: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "KeyInfo":
        return cls(
            organization_id=data.get("organizationId"),
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


@dataclass(frozen=True)
class TicketMessage:
    """Une ligne d'un fil de ticket, étiquetée par qui l'a écrite."""
    id: str
    content: str
    role: str  # "bot" | "visitor" | "agent"
    created_at: str | None = None

    @classmethod
    def from_dict(cls, data: dict) -> "TicketMessage":
        return cls(
            id=data.get("id", ""),
            content=data.get("content") or "",
            role=data.get("role", "visitor"),
            created_at=data.get("createdAt"),
        )


@dataclass(frozen=True)
class EscalateResult:
    """Réponse de :meth:`SupportClient.escalate`."""
    ticket_id: str
    status: str

    @classmethod
    def from_dict(cls, data: dict) -> "EscalateResult":
        return cls(ticket_id=data.get("ticketId", ""), status=data.get("status", "open"))


@dataclass(frozen=True)
class TicketThread:
    """Fil complet d'un ticket, tel que le visiteur le voit."""
    ticket_id: str
    subject: str
    status: str
    agent_connected: bool
    agent_name: str | None
    closed: bool
    messages: list[TicketMessage] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "TicketThread":
        return cls(
            ticket_id=data.get("ticketId", ""),
            subject=data.get("subject", ""),
            status=data.get("status", "open"),
            agent_connected=bool(data.get("agentConnected")),
            agent_name=data.get("agentName"),
            closed=bool(data.get("closed")),
            messages=[TicketMessage.from_dict(m) for m in data.get("messages", [])],
        )
