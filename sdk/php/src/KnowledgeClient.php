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
    public function __construct(private readonly FluxChat $client) {}

    /** Retourne tous les éléments de la base de connaissance. */
    public function list(): array
    {
        return $this->client->request('GET', '/knowledge');
    }

    /** Retourne un élément par son ID. */
    public function get(string $id): array
    {
        return $this->client->request('GET', "/knowledge/{$id}");
    }

    /** Crée un nouvel élément. */
    public function create(string $title, string $content): array
    {
        return $this->client->request('POST', '/knowledge', [
            'title'   => $title,
            'content' => $content,
        ]);
    }

    /** Met à jour un élément existant. */
    public function update(string $id, string $title, string $content): array
    {
        return $this->client->request('PUT', "/knowledge/{$id}", [
            'title'   => $title,
            'content' => $content,
        ]);
    }

    /** Supprime un élément par son ID. */
    public function delete(string $id): void
    {
        $this->client->request('DELETE', "/knowledge/{$id}");
    }
}
