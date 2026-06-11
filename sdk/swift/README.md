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
print(response.text)
print(response.conversationId ?? "pas de conv")
```

## Options du client

```swift
// URL personnalisée
let client = FluxChatClient(
    apiKey: "sk-...",
    baseURL: "https://mon-proxy.com/v1"
)
```

## Ask avec paramètres

```swift
let response = try await client.ask(
    message: "Quelle est votre politique de retour ?",
    context: "E-commerce support",
    conversationId: "conv-abc123"
)
```

## Vérifier la clé API

```swift
let info = try await client.testKey()
print("Valide: \(info.valid)")
print("Organisation: \(info.organizationId ?? "N/A")")
print("Scopes: \(info.scopes.joined(separator: ", "))")
```

## Knowledge Base (CRUD)

```swift
// Lister
let items = try await client.knowledge.list()

// Récupérer par ID
let item = try await client.knowledge.get(id: "abc123")

// Créer
let newItem = try await client.knowledge.create(title: "FAQ", content: "Contenu...")

// Mettre à jour
let updated = try await client.knowledge.update(
    id: newItem.id!,
    title: "FAQ v2",
    content: "Nouveau contenu"
)

// Supprimer
try await client.knowledge.delete(id: newItem.id!)
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
