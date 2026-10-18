<?php

declare(strict_types=1);

namespace FluxChat\Exceptions;

use RuntimeException;

/**
 * Levée lorsque l'API FluxChat retourne une erreur HTTP.
 */
class FluxChatApiException extends RuntimeException
{
    public function __construct(
        private readonly int $statusCode,
        private readonly string $apiMessage = ''
    ) {
        parent::__construct("FluxChat API error {$statusCode}: {$apiMessage}");
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getApiMessage(): string
    {
        return $this->apiMessage;
    }
}
