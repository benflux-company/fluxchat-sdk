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
// URL personnalisée (par défaut : https://api.fluxchat-corp.com/api/v2)
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

## Transfert vers un humain (fil de support)

```swift
let support = client.support()

// 1. Transfert — avec le même sessionId qu'ask, le fil du bot suit.
let ticket = try await support.escalate(
    name: "Jordan Mbeki",
    email: "jordan@example.com",
    message: "Mon virement est bloqué.",
    sessionId: mySessionId
)

// 2. Suivi : l'e-mail est la preuve que le ticket est le sien.
let thread = try await support.thread(ticketId: ticket.ticketId, email: "jordan@example.com")
for m in thread.messages {
    print(m.role, m.content)       // .bot | .visitor | .agent
}

// 3. Le visiteur répond dans le même fil.
try await support.reply(ticketId: ticket.ticketId,
                        email: "jordan@example.com",
                        content: "Référence 4821.")
```

- **Mauvais e-mail et ticket inexistant renvoient tous deux 404**, à dessein.
- **Polling** : 5 s (quotas 60 lectures/min, 30 réponses/min, 5 escalades/min).
- `open` → `in_progress` → `resolved` → `closed`. `resolved` se rouvre à la
  réponse ; `closed` refuse l'écriture (**403**).
- Nécessite le plan `supportTickets`.

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
