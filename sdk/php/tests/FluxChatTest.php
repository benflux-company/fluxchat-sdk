<?php

declare(strict_types=1);

namespace FluxChat\Tests;

use FluxChat\Exceptions\FluxChatApiException;
use FluxChat\FluxChat;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires pour FluxChat PHP SDK.
 *
 * On utilise un sous-classe de FluxChat qui remplace la méthode request()
 * par un faux retour, pour éviter toute dépendance réseau réelle.
 */
class FluxChatTest extends TestCase
{
    // ─── Helper : crée un client avec réponse mockée ──────────────────────────

    private function makeMock(array $response, int $status = 200): FluxChat
    {
        if ($status < 200 || $status >= 300) {
            return new class('test-key', $status, $response) extends FluxChat {
                public function __construct(
                    string $apiKey,
                    private int $mockStatus,
                    private array $mockBody
                ) {
                    parent::__construct($apiKey);
                }

                public function request(string $method, string $path, array $body = []): array
                {
                    throw new FluxChatApiException($this->mockStatus, json_encode($this->mockBody));
                }
            };
        }

        return new class('test-key', $response) extends FluxChat {
            public function __construct(string $apiKey, private array $mockResponse)
            {
                parent::__construct($apiKey);
            }

            public function request(string $method, string $path, array $body = []): array
            {
                return $this->mockResponse;
            }
        };
    }

    // ─── ask() ────────────────────────────────────────────────────────────────

    public function testAskReturnsResponse(): void
    {
        $client = $this->makeMock(['text' => 'Bonjour !', 'conversation_id' => 'conv-1']);

        $result = $client->ask('Bonjour');

        $this->assertEquals('Bonjour !', $result['text']);
        $this->assertEquals('conv-1', $result['conversation_id']);
    }

    public function testAskWithContextAndConversationId(): void
    {
        $client = $this->makeMock(['text' => 'Réponse', 'conversation_id' => 'conv-abc']);

        $result = $client->ask('Question', 'support', 'conv-abc');

        $this->assertEquals('conv-abc', $result['conversation_id']);
    }

    public function testAskThrowsApiException(): void
    {
        $this->expectException(FluxChatApiException::class);

        $client = $this->makeMock(['error' => 'Invalid key'], 401);
        $client->ask('test');
    }

    // ─── testKey() ────────────────────────────────────────────────────────────

    public function testTestKeyReturnsValid(): void
    {
        $client = $this->makeMock(['valid' => true, 'plan' => 'pro']);

        $info = $client->testKey();

        $this->assertTrue($info['valid']);
        $this->assertEquals('pro', $info['plan']);
    }

    // ─── knowledge() ─────────────────────────────────────────────────────────

    public function testKnowledgeListReturnsList(): void
    {
        $client = $this->makeMock([
            ['id' => '1', 'title' => 'FAQ', 'content' => 'Contenu'],
        ]);

        $items = $client->knowledge()->list();

        $this->assertCount(1, $items);
        $this->assertEquals('FAQ', $items[0]['title']);
    }

    public function testKnowledgeCreateReturnsItem(): void
    {
        $client = $this->makeMock(['id' => '2', 'title' => 'Nouveau', 'content' => 'Mon contenu']);

        $item = $client->knowledge()->create('Nouveau', 'Mon contenu');

        $this->assertEquals('2', $item['id']);
        $this->assertEquals('Nouveau', $item['title']);
    }

    public function testKnowledgeDeleteReturnsEmpty(): void
    {
        $client = $this->makeMock([]);

        // Ne doit pas lever d'exception
        $client->knowledge()->delete('1');
        $this->assertTrue(true); // Assertion explicite
    }

    public function testKnowledgeClientIsSingleton(): void
    {
        $client = $this->makeMock([]);

        $this->assertSame($client->knowledge(), $client->knowledge());
    }
}
