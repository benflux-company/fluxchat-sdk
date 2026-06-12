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
        $this->baseUrl = rtrim($baseUrl ?? 'https://dev-api.fluxchat-corp.com/api/v2', '/');
    }

    // ─── Core ─────────────────────────────────────────────────────────────────

    /**
     * Envoie un message à FluxChat et retourne la réponse.
     *
     * @return array
     */
    public function ask(
        string $message,
        ?string $context = null,
        ?string $conversationId = null,
        ?string $sessionId = null
    ): array {
        $payload = array_filter([
            'message'        => $message,
            'context'        => $context,
            'conversationId' => $conversationId,
            'sessionId'      => $sessionId,
        ], fn($v) => $v !== null);

        return $this->request('POST', '/public/bot/ask', $payload);
    }

    /**
     * Vérifie que la clé API est valide.
     *
     * @return array
     */
    public function testKey(): array
    {
        return $this->request('GET', '/public/bot/test');
    }

    /**
     * Capture passivement le contenu d'une page pour la base de connaissance.
     */
    public function capturePage(string $url, string $title, string $content): void
    {
        $this->request('POST', '/public/bot/pages', [
            'url'     => $url,
            'title'   => $title,
            'content' => $content,
        ]);
    }

    /**
     * Retourne le client pour les opérations Knowledge Base.
     */
    public function knowledge(?string $jwtToken = null): KnowledgeClient
    {
        if ($this->knowledgeClient === null) {
            $this->knowledgeClient = new KnowledgeClient($this, $jwtToken);
        }
        return $this->knowledgeClient;
    }

    // ─── HTTP helper (interne + accessible pour KnowledgeClient) ──────────────

    /**
     * @internal Utilisé par KnowledgeClient.
     */
    public function request(string $method, string $path, array $body = [], array $extraHeaders = []): array
    {
        $url = $this->baseUrl . $path;
        $ch  = curl_init();

        $headers = [
            'X-API-Key: ' . $this->apiKey,
            'Accept: application/json',
            'Content-Type: application/json',
        ];
        
        $headers = array_merge($headers, $extraHeaders);

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTPHEADER     => $headers,
        ]);

        match (strtoupper($method)) {
            'POST'   => $this->setPost($ch, $body),
            'PUT'    => $this->setPut($ch, $body),
            'PATCH'  => $this->setPatch($ch, $body),
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
            $msg = $raw;
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && isset($decoded['message'])) {
                $msg = $decoded['message'];
            }
            throw new FluxChatApiException($status, $msg ?: 'Unknown API Error');
        }

        // DELETE 204 : pas de body
        if ($raw === '' || $raw === 'null') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new FluxChatNetworkException('Failed to decode JSON response: ' . json_last_error_msg());
        }

        if (is_array($decoded) && isset($decoded['success'], $decoded['data'])) {
            return is_array($decoded['data']) ? $decoded['data'] : [];
        }

        return $decoded;
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private function setPost(\CurlHandle $ch, array $body): void
    {
        curl_setopt($ch, CURLOPT_POST, true);
        if (!empty($body)) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    private function setPut(\CurlHandle $ch, array $body): void
    {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if (!empty($body)) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    
    private function setPatch(\CurlHandle $ch, array $body): void
    {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        if (!empty($body)) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
}
