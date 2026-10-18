<?php

declare(strict_types=1);

namespace FluxChat\Exceptions;

use RuntimeException;
use Throwable;

/**
 * Levée lors d'une erreur réseau (cURL, timeout, etc.).
 */
class FluxChatNetworkException extends RuntimeException
{
    public function __construct(string $message, ?Throwable $previous = null)
    {
        parent::__construct("FluxChat network error: {$message}", 0, $previous);
    }
}
