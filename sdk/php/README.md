# FluxChat PHP SDK

SDK officiel pour intégrer FluxChat dans vos applications PHP.

## Installation

```bash
composer require fluxchat/sdk
```

## Utilisation rapide

```php
use FluxChat\FluxChat;

$client = new FluxChat('VOTRE_API_KEY');

$response = $client->ask('Bonjour !');
echo $response['text'];
```

## Options du constructeur

```php
// URL de base personnalisée (par défaut : https://dev-api.fluxchat-corp.com/api/v2)
$client = new FluxChat('sk-...', 'https://mon-proxy.com/api/v2');
```

## Ask avec options et Session

Pour maintenir le contexte d'une conversation entre plusieurs requêtes, utilisez `sessionId`.

```php
$response = $client->ask(
    message: 'Quelle est votre politique de retour ?',
    context: 'E-commerce support',
    conversationId: 'conv-abc123',
    sessionId: 'session-user-xyz'
);

echo $response['reply'];
echo $response['conversationId'];
```

## Capturer une page passivement

```php
$client->capturePage(
    url: 'https://example.com/faq',
    title: 'FAQ',
    content: 'Contenu visible de la page...'
);
```

## Vérifier la clé API

```php
$info = $client->testKey();
echo "Organisation : " . $info['organizationId'];
print_r($info['scopes']);
```

## Knowledge Base (CRUD - requiert un JWT)

```php
// Instancier le client Knowledge avec votre JWT
$knowledge = $client->knowledge('votre_jwt_token');

// Lister tous les éléments
$items = $knowledge->list();

// Récupérer un élément par ID
$item = $knowledge->get('abc123');

// Créer un nouvel élément
$newItem = $knowledge->create('FAQ', 'Contenu...', 'support', ['retour', 'remboursement']);

// Mettre à jour (champs partiels supportés)
$updated = $knowledge->update($newItem['id'], ['title' => 'FAQ v2']);

// Supprimer
$knowledge->delete($newItem['id']);
```

## Gestion des erreurs

```php
use FluxChat\Exceptions\FluxChatApiException;
use FluxChat\Exceptions\FluxChatNetworkException;

try {
    $response = $client->ask('Bonjour');
} catch (FluxChatApiException $e) {
    echo "Erreur API {$e->getStatusCode()}: {$e->getApiMessage()}";
} catch (FluxChatNetworkException $e) {
    echo "Erreur réseau: {$e->getMessage()}";
}
```

## Lancer les tests

```bash
composer install
composer test
```

## Structure du package

```
sdk/php/
├── README.md
├── composer.json
├── src/
│   ├── FluxChat.php                         ← Client principal
│   ├── KnowledgeClient.php                  ← CRUD Knowledge fluent
│   └── Exceptions/
│       ├── FluxChatApiException.php
│       └── FluxChatNetworkException.php
└── tests/
    └── FluxChatTest.php                     ← Tests PHPUnit
```

## Prérequis

- PHP 8.1+
- Extensions : `ext-curl`, `ext-json`
