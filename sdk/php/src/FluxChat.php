<?php

declare(strict_types=1);

namespace FluxChat;

use FluxChat\Exceptions\FluxChatApiException;
use FluxChat\Exceptions\FluxChatNetworkException;

/**
 * Client principal FluxChat pour PHP.
 *
 * @example
 *   $client = new FluxChat('VOTRE_API_KEY');
 *   $response = $client->ask('Bonjour !');
 *   echo $response['text'];
 */
class FluxChat
{
    private readonly string $baseUrl;
    private ?KnowledgeClient $knowledgeClient = null;

    public function __construct(
        private readonly string $apiKey,
        ?string $baseUrl = null
    ) {
        $this->baseUrl = rtrim($baseUrl ?? 'https://api.fluxchat.io/v1', '/');
    }

    // ─── Core ─────────────────────────────────────────────────────────────────

    /**
     * Envoie un message à FluxChat et retourne la réponse.
     *
     * @return array{text: string, conversation_id: ?string}
     */
    public function ask(
        string $message,
        ?string $context = null,
        ?string $conversationId = null
    ): array {
        $payload = array_filter([
            'message'         => $message,
            'context'         => $context,
            'conversation_id' => $conversationId,
        ], fn($v) => $v !== null);

        return $this->request('POST', '/ask', $payload);
    }

    /**
     * Vérifie que la clé API est valide.
     *
     * @return array{valid: bool, plan: ?string}
     */
    public function testKey(): array
    {
        return $this->request('GET', '/test-key');
    }

    /**
     * Retourne le client pour les opérations Knowledge Base.
     */
    public function knowledge(): KnowledgeClient
    {
        if ($this->knowledgeClient === null) {
            $this->knowledgeClient = new KnowledgeClient($this);
        }
        return $this->knowledgeClient;
    }

    // ─── HTTP helper (interne + accessible pour KnowledgeClient) ──────────────

    /**
     * @internal Utilisé par KnowledgeClient.
     */
    public function request(string $method, string $path, array $body = []): array
    {
        $url = $this->baseUrl . $path;
        $ch  = curl_init();

        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Accept: application/json',
            'Content-Type: application/json',
        ];

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTPHEADER     => $headers,
        ]);

        match (strtoupper($method)) {
            'POST'   => $this->setPost($ch, $body),
            'PUT'    => $this->setPut($ch, $body),
            'DELETE' => curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE'),
            default  => null,  // GET
        };

        $raw    = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error  = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            throw new FluxChatNetworkException($error ?: 'cURL request failed');
        }

        if ($status < 200 || $status >= 300) {
            throw new FluxChatApiException($status, $raw ?: '');
        }

        // DELETE 204 : pas de body
        if ($raw === '' || $raw === 'null') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new FluxChatNetworkException('Failed to decode JSON response: ' . json_last_error_msg());
        }

        return $decoded;
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private function setPost(\CurlHandle $ch, array $body): void
    {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    private function setPut(\CurlHandle $ch, array $body): void
    {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
}
