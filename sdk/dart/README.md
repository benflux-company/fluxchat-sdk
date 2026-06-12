# FluxChat Dart / Flutter SDK

SDK officiel pour intégrer FluxChat dans vos applications Dart et Flutter.

## Installation

Ajoutez dans votre `pubspec.yaml` :

```yaml
dependencies:
  fluxchat: ^1.0.0
```

Puis :

```bash
dart pub get
# ou
flutter pub get
```

## Utilisation rapide

```dart
import 'package:fluxchat/fluxchat.dart';

final client = FluxChat(apiKey: 'VOTRE_API_KEY');

final response = await client.ask('Bonjour !');
print(response.reply);
print(response.conversationId);
```

## Ask avec paramètres et Session

Pour maintenir le contexte entre plusieurs messages, utilisez `sessionId`.

```dart
final response = await client.ask(
  'Quelle est votre politique de retour ?',
  context: 'E-commerce support',
  conversationId: 'conv-abc123',
  sessionId: 'session-user-xyz',
);
print(response.reply);
```

## Capturer une page passivement

```dart
await client.capturePage(
  url: 'https://example.com/faq',
  title: 'FAQ',
  content: 'Contenu visible de la page...',
);
```

## Vérifier la clé API

```dart
final info = await client.testKey();
print('Organisation: ${info.organizationId}');
print('Scopes: ${info.scopes.join(', ')}');
```

## Knowledge Base (CRUD - requiert un JWT)

```dart
// Obtenir un client Knowledge avec votre JWT
final kb = client.knowledge(jwtToken: 'eyJhbGci...');

// Lister
final items = await kb.list();

// Récupérer par ID
final item = await kb.get('abc123');

// Créer
final newItem = await kb.create(
  'FAQ',
  'Contenu...',
  category: 'support',
  keywords: ['retour', 'remboursement'],
);

// Mettre à jour (patch partiel)
final updated = await kb.update(
  newItem.id!,
  title: 'FAQ v2',
);

// Supprimer
await kb.delete(newItem.id!);
```

## Gestion des erreurs

```dart
import 'package:fluxchat/fluxchat.dart';

try {
  final result = await client.ask('Bonjour');
} on FluxChatApiException catch (e) {
  print('Erreur API ${e.statusCode}: ${e.apiMessage}');
} on FluxChatNetworkException catch (e) {
  print('Erreur réseau: ${e.message}');
}
```

## Lancer les tests

```bash
dart test
```

## Structure du package

```
sdk/dart/
├── README.md
├── pubspec.yaml
├── lib/
│   ├── fluxchat.dart               ← Point d'entrée (barrel)
│   └── src/
│       ├── fluxchat_client.dart    ← FluxChat client principal
│       ├── knowledge_client.dart   ← CRUD Knowledge + helper HTTP
│       ├── models.dart             ← AskResponse, KeyInfo, KnowledgeItem
│       └── exceptions.dart        ← FluxChatApiException, FluxChatNetworkException
└── test/
    └── fluxchat_test.dart          ← Tests avec MockClient
```

## Prérequis

- Dart SDK ≥ 3.0 / Flutter ≥ 3.10
