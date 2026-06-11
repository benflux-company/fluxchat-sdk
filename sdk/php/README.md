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
// URL de base personnalisée
$client = new FluxChat('sk-...', 'https://mon-proxy.com/v1');
```

## Ask avec options

```php
$response = $client->ask(
    message: 'Quelle est votre politique de retour ?',
    context: 'E-commerce support',
    conversationId: 'conv-abc123'
);

echo $response['text'];
echo $response['conversation_id'];
```

## Vérifier la clé API

```php
$info = $client->testKey();

if ($info['valid']) {
    echo "Clé valide ! Plan : " . $info['plan'];
}
```

## Knowledge Base (CRUD)

```php
// Lister tous les éléments
$items = $client->knowledge()->list();

// Récupérer un élément par ID
$item = $client->knowledge()->get('abc123');

// Créer un nouvel élément
$newItem = $client->knowledge()->create('FAQ', 'Contenu de la FAQ...');

// Mettre à jour
$updated = $client->knowledge()->update($newItem['id'], 'FAQ v2', 'Nouveau contenu');

// Supprimer
$client->knowledge()->delete($newItem['id']);
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
