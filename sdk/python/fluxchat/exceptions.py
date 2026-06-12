"""Typed exception classes for the FluxChat Python SDK."""

from __future__ import annotations


class FluxChatConfigError(ValueError):
    """Levée lors d'une configuration invalide (ex: clé API manquante)."""


class FluxChatApiError(Exception):
    """Levée lorsque l'API FluxChat retourne une réponse non-2xx."""

    def __init__(self, status_code: int, api_message: str = "") -> None:
        self.status_code = status_code
        self.api_message = api_message
        super().__init__(f"FluxChat API error {status_code}: {api_message}")


class FluxChatNetworkError(Exception):
    """Levée lors d'un problème réseau (timeout, connexion refusée, etc.)."""

    def __init__(self, message: str, cause: BaseException | None = None) -> None:
        self.cause = cause
        super().__init__(f"FluxChat network error: {message}")
