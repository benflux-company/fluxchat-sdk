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
var response = await client.AskAsync("Bonjour !");
Console.WriteLine(response.Reply);
Console.WriteLine(response.ConversationId);

// URL personnalisée (par défaut : https://dev-api.fluxchat-corp.com/api/v2)
var client2 = new FluxChatClient("sk-...", "https://mon-proxy.com/api/v2");

// Avec contexte, ID de conversation et Session
var response2 = await client.AskAsync(
    message: "Quelle est votre politique de retour ?",
    context: "E-commerce support",
    conversationId: "conv-abc123",
    sessionId: "session-user-xyz"
);

// Capturer une page passivement
await client.CapturePageAsync(
    url: "https://example.com/faq",
    title: "FAQ",
    content: "Contenu visible de la page..."
);
```

## Vérifier la clé API

```csharp
var info = await client.TestKeyAsync();
Console.WriteLine($"Organisation: {info.OrganizationId}");
Console.WriteLine($"Scopes: {string.Join(", ", info.Scopes)}");
```

## Knowledge Base (CRUD - requiert un JWT)

```csharp
// Obtenir un client Knowledge avec votre JWT
var kb = client.Knowledge("eyJhbGci...");

// Lister
var items = await kb.ListAsync();

// Créer
var newItem = await kb.CreateAsync(
    title: "FAQ", 
    content: "Contenu...",
    category: "support",
    keywords: new[] { "retour", "remboursement" }
);

// Mettre à jour (patch partiel)
var updated = await kb.UpdateAsync(
    id: newItem.Id, 
    title: "FAQ v2"
);

// Supprimer
await kb.DeleteAsync(newItem.Id);
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
