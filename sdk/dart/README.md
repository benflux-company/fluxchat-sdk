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

final result = await client.ask('Bonjour !');
print(result.reply);
print(result.conversationId);
```

## Ask avec options

```dart
final result = await client.ask(
  'Quelle est votre politique de retour ?',
  context: 'E-commerce support',
  conversationId: 'conv-abc123',
);
```

## Vérifier la clé API

```dart
final info = await client.testKey();
print('Organisation : ${info.organizationId}');
print('Scopes : ${info.scopes}');
```

## Knowledge Base (CRUD)

```dart
// Lister
final items = await client.knowledge.list();

// Récupérer par ID
final item = await client.knowledge.get('abc123');

// Créer
final newItem = await client.knowledge.create('FAQ', 'Contenu...');

// Mettre à jour
final updated = await client.knowledge.update(newItem.id!, 'FAQ v2', 'Nouveau contenu');

// Supprimer
await client.knowledge.delete(newItem.id!);
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
