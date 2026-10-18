"""Human handoff and the visitor's own support thread."""

from __future__ import annotations
from typing import TYPE_CHECKING
from urllib.parse import quote

from .models import EscalateResult, TicketThread

if TYPE_CHECKING:
    from ._http import HttpHelper


class SupportClient:
    """Client fluent pour le transfert vers un humain et le fil de support.

    Accessible via :attr:`FluxChat.support`.

    Le visiteur n'a ni compte ni session : l'e-mail avec lequel il a demandé
    un humain est ce qui prouve que le ticket est le sien, en lecture comme
    en écriture. À traiter comme un lien à usage unique qu'on lui aurait
    envoyé — assez pour atteindre sa propre conversation, jamais celle d'un
    autre, la recherche étant aussi limitée à l'organisation de la clé API.

    Le fil se lit en *polling*, il n'y a pas de socket sur la surface
    publique. 5 secondes est la cadence du widget officiel et celle pour
    laquelle les quotas de la route sont dimensionnés.
    """

    def __init__(self, http: "HttpHelper") -> None:
        self._http = http

    def escalate(
        self,
        name: str,
        email: str,
        message: str,
        session_id: str | None = None,
    ) -> EscalateResult:
        """Transfère un visiteur à un humain : crée un vrai ticket de support.

        Args:
            name: Nom du visiteur, tel qu'il l'a saisi.
            email: Son e-mail — c'est aussi la preuve que le ticket est le sien.
            message: Sa demande. Devient le premier message du ticket.
            session_id: Le même ``session_id`` que celui passé à
                :meth:`FluxChat.ask`. S'il est fourni, tout ce que le bot a
                déjà dit est recopié dans le ticket, pour que l'agent prenne
                la conversation en cours de route. Au mieux : la session vit
                2 h, passé ce délai le ticket commence au message du visiteur.

        Returns:
            :class:`EscalateResult` avec ``ticket_id`` et ``status``.
        """
        payload: dict = {"name": name, "email": email, "message": message}
        if session_id is not None:
            payload["sessionId"] = session_id
        return EscalateResult.from_dict(self._http.post("/public/bot/escalate", payload))

    def thread(self, ticket_id: str, email: str) -> TicketThread:
        """Lit le fil du ticket d'un visiteur, chaque ligne étiquetée par rôle.

        Raises:
            FluxChatApiError: 404 aussi bien quand le ticket n'existe pas que
                quand ``email`` n'est pas celui avec lequel il a été ouvert —
                les deux cas sont volontairement indiscernables, pour qu'un id
                deviné n'apprenne rien.
        """
        path = f"/public/bot/tickets/{quote(ticket_id, safe='')}?email={quote(email, safe='')}"
        return TicketThread.from_dict(self._http.get(path))

    def reply(self, ticket_id: str, email: str, content: str) -> None:
        """Poste la réponse du visiteur dans son propre ticket.

        Une réponse sur un ticket déjà marqué ``resolved`` le rouvre ; un
        ticket ``closed`` refuse l'écriture (403) plutôt que d'avaler un
        message que personne ne lira.
        """
        self._http.post(
            f"/public/bot/tickets/{quote(ticket_id, safe='')}/messages",
            {"email": email, "content": content},
        )
