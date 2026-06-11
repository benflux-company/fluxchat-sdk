# FluxChat .NET SDK

SDK officiel pour intégrer FluxChat dans vos applications C# et .NET.

## Installation

```bash
dotnet add package FluxChat
```

## Utilisation rapide

```csharp
using FluxChat;

// Créer le client
var client = new FluxChatClient("VOTRE_API_KEY");

// Envoyer un message
var response = await client.AskAsync("Bonjour, comment puis-je vous aider ?");
Console.WriteLine(response.Text);

// Avec contexte et ID de conversation
var response2 = await client.AskAsync(
    message: "Quelle est votre politique de retour ?",
    context: "E-commerce support",
    conversationId: "conv-abc123"
);
```

## Vérifier la clé API

```csharp
bool isValid = await client.TestKeyAsync();
Console.WriteLine(isValid ? "Clé valide ✅" : "Clé invalide ❌");
```

## Knowledge Base (CRUD)

```csharp
// Lister
var items = await client.GetKnowledgeAsync();

// Créer
var newItem = await client.CreateKnowledgeAsync("FAQ", "Contenu de la FAQ...");

// Mettre à jour
var updated = await client.UpdateKnowledgeAsync(newItem.Id!, "FAQ v2", "Nouveau contenu");

// Supprimer
await client.DeleteKnowledgeAsync(newItem.Id!);
```

## Gestion des erreurs

```csharp
using FluxChat.Exceptions;

try
{
    var response = await client.AskAsync("Bonjour");
}
catch (FluxChatApiException ex)
{
    Console.WriteLine($"Erreur API {ex.StatusCode}: {ex.ApiMessage}");
}
catch (FluxChatNetworkException ex)
{
    Console.WriteLine($"Erreur réseau: {ex.Message}");
}
```

## Structure du package

```
sdk/dotnet/
├── README.md
├── FluxChat.csproj
├── FluxChatClient.cs       ← Client principal
├── Exceptions.cs           ← FluxChatApiException, FluxChatNetworkException
└── Tests/
    ├── FluxChat.Tests.csproj
    └── FluxChatClientTests.cs
```

## Prérequis

- .NET 8.0 ou supérieur
