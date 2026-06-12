# FluxChat Kotlin SDK

SDK officiel pour intégrer FluxChat dans vos applications Kotlin (Android & JVM).

## Installation

Ajoutez dans votre `build.gradle.kts` :

```kotlin
dependencies {
    implementation("com.fluxchat:fluxchat-sdk:1.0.0")
}
```

## Utilisation rapide

```kotlin
import com.fluxchat.FluxChatClient

val client = FluxChatClient(apiKey = "VOTRE_API_KEY")

// Envoyer un message
val response = client.ask("Bonjour !")
println(response.reply)

// Avec contexte, conversationId et sessionId
val response2 = client.ask(
    message = "Quelle est votre politique de retour ?",
    context = "E-commerce support",
    conversationId = "conv-abc123",
    sessionId = "session-user-xyz"
)
```

## Capturer une page passivement

```kotlin
client.capturePage(
    url = "https://example.com/faq",
    title = "FAQ",
    content = "Contenu visible de la page..."
)
```

## Vérifier la clé API

```kotlin
val info = client.testKey()
println("Organisation: ${info.organizationId}")
println("Scopes: ${info.scopes.joinToString()}")
```

## Knowledge Base (CRUD - requiert un JWT)

```kotlin
// Obtenir un client Knowledge avec votre JWT
val kb = client.knowledge(jwtToken = "eyJhbGci...")

// Lister
val items = kb.list()

// Créer
val newItem = kb.create(
    title = "FAQ",
    content = "Contenu...",
    category = "support",
    keywords = listOf("retour", "remboursement")
)

// Mettre à jour (patch partiel)
val updated = kb.update(
    id = newItem.id!!,
    title = "FAQ v2"
)

// Supprimer
kb.delete(id = newItem.id!!)
```

## Gestion des erreurs

```kotlin
import com.fluxchat.FluxChatApiException
import com.fluxchat.FluxChatNetworkException

try {
    val response = client.ask("Bonjour")
} catch (e: FluxChatApiException) {
    println("Erreur API ${e.statusCode}: ${e.apiMessage}")
} catch (e: FluxChatNetworkException) {
    println("Erreur réseau: ${e.message}")
}
```

## Structure du package

```
sdk/kotlin/
├── README.md
├── build.gradle.kts
├── src/main/kotlin/com/fluxchat/
│   ├── FluxChatClient.kt     ← Client principal
│   ├── Models.kt             ← AskResponse, KeyInfo, KnowledgeItem...
│   └── Exceptions.kt         ← FluxChatApiException, FluxChatNetworkException
└── src/test/kotlin/com/fluxchat/
    └── FluxChatClientTest.kt ← Tests unitaires avec Ktor MockEngine
```

## Prérequis

- Kotlin 1.9+
- JDK 17+
- Coroutines (`kotlinx-coroutines-core`)
