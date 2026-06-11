"""Main FluxChat client."""

from __future__ import annotations

from .exceptions import FluxChatConfigError
from .models import AskResponse, KeyInfo
from .knowledge import KnowledgeClient
from ._http import HttpHelper


class FluxChat:
    """Client officiel FluxChat pour Python.

    Example::

        from fluxchat import FluxChat

        client = FluxChat(api_key="sk-...")
        response = client.ask("Bonjour !")
        print(response.reply)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        jwt_token: str | None = None,
        timeout: float = 30.0,
        _http_client=None,  # pour les tests
    ) -> None:
        if not api_key or not api_key.strip():
            raise FluxChatConfigError("api_key must be a non-empty string.")

        self._http = HttpHelper(
            api_key=api_key,
            base_url=base_url or "https://api.fluxchat.io/v1",
            timeout=timeout,
            client=_http_client,
        )
        self.knowledge = KnowledgeClient(self._http, jwt_token=jwt_token)

    # ── Core ──────────────────────────────────────────────────────────────────

    def ask(
        self,
        message: str,
        context: str | None = None,
        conversation_id: str | None = None,
    ) -> AskResponse:
        """Envoie un message à FluxChat et retourne la réponse.

        Args:
            message: Le message à envoyer.
            context: Contexte optionnel pour personnaliser la réponse.
            conversation_id: ID de conversation pour continuer un échange.

        Returns:
            :class:`AskResponse` avec ``reply`` et ``conversation_id``.
        """
        payload: dict = {"message": message}
        if context is not None:
            payload["context"] = context
        if conversation_id is not None:
            payload["conversation_id"] = conversation_id

        data = self._http.post("/ask", payload)
        return AskResponse.from_dict(data)

    def test_key(self) -> KeyInfo:
        """Vérifie la clé API et retourne les informations associées.

        Returns:
            :class:`KeyInfo` avec ``organization_id`` et ``scopes``.
        """
        data = self._http.get("/test-key")
        return KeyInfo.from_dict(data)
