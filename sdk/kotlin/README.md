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
println(response.text)

// Avec contexte et conversationId
val response2 = client.ask(
    message = "Quelle est votre politique de retour ?",
    context = "E-commerce support",
    conversationId = "conv-abc123"
)
```

## Vérifier la clé API

```kotlin
val info = client.testKey()
println(if (info.valid) "Clé valide ✅" else "Clé invalide ❌")
```

## Knowledge Base (CRUD)

```kotlin
// Lister
val items = client.getKnowledge()

// Créer
val newItem = client.createKnowledge(title = "FAQ", content = "Contenu...")

// Mettre à jour
val updated = client.updateKnowledge(id = newItem.id!!, title = "FAQ v2", content = "Nouveau contenu")

// Supprimer
client.deleteKnowledge(id = newItem.id!!)
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
