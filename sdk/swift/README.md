# FluxChat Swift SDK

SDK officiel pour intégrer FluxChat dans vos applications iOS et macOS.

## Installation (Swift Package Manager)

Dans Xcode : **File → Add Packages**, puis entrez l'URL :

```
https://github.com/benflux-company/fluxchat-sdk
```

Ou dans votre `Package.swift` :

```swift
dependencies: [
    .package(url: "https://github.com/benflux-company/fluxchat-sdk", from: "1.0.0")
],
targets: [
    .target(name: "MyApp", dependencies: [
        .product(name: "FluxChat", package: "fluxchat-sdk")
    ])
]
```

## Utilisation rapide

```swift
import FluxChat

let client = FluxChatClient(apiKey: "VOTRE_API_KEY")

let response = try await client.ask(message: "Bonjour !")
print(response.reply)
print(response.conversationId ?? "pas de conv")
```

## Options du client

```swift
// URL personnalisée (par défaut : https://dev-api.fluxchat-corp.com/api/v2)
let client = FluxChatClient(
    apiKey: "sk-...",
    baseURL: "https://mon-proxy.com/api/v2"
)
```

## Ask avec paramètres et Session

Pour maintenir le contexte entre plusieurs messages, utilisez `sessionId`.

```swift
let response = try await client.ask(
    message: "Quelle est votre politique de retour ?",
    context: "E-commerce support",
    conversationId: "conv-abc123",
    sessionId: "session-user-xyz"
)
print(response.reply)
```

## Capturer une page passivement

```swift
try await client.capturePage(
    url: "https://example.com/faq",
    title: "FAQ",
    content: "Contenu visible de la page..."
)
```

## Vérifier la clé API

```swift
let info = try await client.testKey()
print("Organisation: \(info.organizationId)")
print("Scopes: \(info.scopes.joined(separator: ", "))")
```

## Knowledge Base (CRUD - requiert un JWT)

```swift
// Créer le client Knowledge avec votre JWT
let kb = client.knowledge(jwtToken: "eyJhbGci...")

// Lister
let items = try await kb.list()

// Récupérer par ID
let item = try await kb.get(id: "abc123")

// Créer
let newItem = try await kb.create(
    title: "FAQ",
    content: "Contenu...",
    category: "support",
    keywords: ["retour", "remboursement"]
)

// Mettre à jour (patch partiel)
let updated = try await kb.update(
    id: newItem.id!,
    title: "FAQ v2"
)

// Supprimer
try await kb.delete(id: newItem.id!)
```

## Gestion des erreurs

```swift
do {
    let response = try await client.ask(message: "Bonjour")
} catch let e as FluxChatApiError {
    print("Erreur API \(e.statusCode): \(e.apiMessage)")
} catch let e as FluxChatNetworkError {
    print("Erreur réseau: \(e.message)")
}
```

## Structure du package

```
sdk/swift/
├── README.md
├── Package.swift
├── Sources/FluxChat/
│   ├── FluxChatClient.swift    ← Client principal
│   ├── KnowledgeClient.swift   ← CRUD Knowledge + HTTPHelper (actor)
│   ├── Models.swift            ← AskResponse, KeyInfo, KnowledgeItem (Codable)
│   └── Errors.swift            ← FluxChatApiError, FluxChatNetworkError
└── Tests/FluxChatTests/
    └── FluxChatClientTests.swift ← Tests XCTest avec MockURLProtocol
```

## Prérequis

- iOS 16+ / macOS 13+
- Swift 5.9+
- Xcode 15+
