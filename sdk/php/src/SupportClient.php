<?php

declare(strict_types=1);

namespace FluxChat;

/**
 * Transfert vers un humain et fil de support du visiteur.
 *
 * Le visiteur n'a ni compte ni session : l'e-mail avec lequel il a demandé un
 * humain est ce qui prouve que le ticket est le sien, en lecture comme en
 * écriture. À traiter comme un lien à usage unique qu'on lui aurait envoyé —
 * assez pour atteindre sa propre conversation, jamais celle d'un autre, la
 * recherche étant aussi limitée à l'organisation de la clé API.
 *
 * Le fil se lit en polling : il n'y a pas de socket sur la surface publique.
 * 5 secondes est la cadence du widget officiel et celle pour laquelle les
 * quotas de la route sont dimensionnés.
 *
 * @example
 *   $support = $client->support();
 *   $ticket  = $support->escalate('Jordan', 'jordan@example.com', 'Virement bloqué', $sessionId);
 *   $thread  = $support->thread($ticket['ticketId'], 'jordan@example.com');
 *   $support->reply($ticket['ticketId'], 'jordan@example.com', 'La référence est 4821');
 */
class SupportClient
{
    public function __construct(private readonly FluxChat $client)
    {
    }

    /**
     * Transfère un visiteur à un humain : crée un vrai ticket de support.
     *
     * Passez le même $sessionId que celui utilisé avec ask() et tout ce que
     * le bot a déjà dit est recopié dans le ticket, pour que l'agent prenne
     * la conversation en cours de route. Au mieux : la session vit 2 h.
     *
     * @return array{ticketId: string, status: string}
     */
    public function escalate(
        string $name,
        string $email,
        string $message,
        ?string $sessionId = null
    ): array {
        $payload = array_filter([
            'name'      => $name,
            'email'     => $email,
            'message'   => $message,
            'sessionId' => $sessionId,
        ], fn($v) => $v !== null);

        return $this->client->request('POST', '/public/bot/escalate', $payload);
    }

    /**
     * Lit le fil du ticket, chaque ligne étiquetée par rôle (bot/visitor/agent).
     *
     * Lève une FluxChatApiException 404 aussi bien quand le ticket n'existe
     * pas que quand $email n'est pas celui avec lequel il a été ouvert : les
     * deux cas sont volontairement indiscernables, pour qu'un id deviné
     * n'apprenne rien.
     *
     * @return array{ticketId: string, subject: string, status: string, agentConnected: bool, agentName: ?string, closed: bool, messages: array}
     */
    public function thread(string $ticketId, string $email): array
    {
        $path = '/public/bot/tickets/' . rawurlencode($ticketId)
            . '?email=' . rawurlencode($email);

        return $this->client->request('GET', $path);
    }

    /**
     * Poste la réponse du visiteur dans son propre ticket.
     *
     * Une réponse sur un ticket « resolved » le rouvre ; un ticket « closed »
     * refuse l'écriture (403) plutôt que d'avaler un message que personne ne
     * lira.
     */
    public function reply(string $ticketId, string $email, string $content): void
    {
        $this->client->request(
            'POST',
            '/public/bot/tickets/' . rawurlencode($ticketId) . '/messages',
            ['email' => $email, 'content' => $content]
        );
    }
}
