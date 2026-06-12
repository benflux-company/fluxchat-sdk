<?php

declare(strict_types=1);

namespace FluxChat;

use FluxChat\Exceptions\FluxChatApiException;
use FluxChat\Exceptions\FluxChatNetworkException;

/**
 * Client fluent pour les opérations Knowledge Base.
 * Accédez-y via $client->knowledge().
 */
class KnowledgeClient
{
    public function __construct(
        private readonly FluxChat $client,
        private readonly ?string $jwtToken = null
    ) {}

    private function getHeaders(): array
    {
        if ($this->jwtToken) {
            return ['Authorization: Bearer ' . $this->jwtToken];
        }
        return [];
    }

    /** Retourne tous les éléments de la base de connaissance. */
    public function list(): array
    {
        return $this->client->request('GET', '/bot/knowledge', [], $this->getHeaders());
    }

    /** Retourne un élément par son ID. */
    public function get(string $id): array
    {
        return $this->client->request('GET', "/bot/knowledge/{$id}", [], $this->getHeaders());
    }

    /** Crée un nouvel élément. */
    public function create(string $title, string $content, ?string $category = null, ?array $keywords = null): array
    {
        $payload = array_filter([
            'title'    => $title,
            'content'  => $content,
            'category' => $category,
            'keywords' => $keywords,
        ], fn($v) => $v !== null);

        return $this->client->request('POST', '/bot/knowledge', $payload, $this->getHeaders());
    }

    /** Met à jour un élément existant (mise à jour partielle supportée). */
    public function update(string $id, array $patch): array
    {
        return $this->client->request('PATCH', "/bot/knowledge/{$id}", $patch, $this->getHeaders());
    }

    /** Supprime un élément par son ID. */
    public function delete(string $id): void
    {
        $this->client->request('DELETE', "/bot/knowledge/{$id}", [], $this->getHeaders());
    }
}
