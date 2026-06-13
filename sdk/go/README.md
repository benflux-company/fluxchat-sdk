# FluxChat Go SDK

SDK officiel pour intégrer FluxChat dans vos applications Go.

## Installation

```bash
go get github.com/benflux-company/fluxchat-sdk/sdk/go
```

## Utilisation rapide

```go
package main

import (
    "context"
    "fmt"
    "log"

    fluxchat "github.com/benflux-company/fluxchat-sdk/sdk/go"
)

func main() {
    client := fluxchat.NewClient("VOTRE_API_KEY")

    resp, err := client.Ask(context.Background(), "Bonjour !")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(resp.Text)
}
```

## Options du client

```go
```go
// URL de base personnalisée (par défaut: https://dev-api.fluxchat-corp.com/api/v2)
client := fluxchat.NewClient("sk-...",
    fluxchat.WithBaseURL("https://mon-proxy.com/api/v2"),
)

// Utiliser un JWT pour la Knowledge Base (requis pour l'administration)
clientAdmin := fluxchat.NewClient("sk-...",
    fluxchat.WithJWT("eyJhbGci..."),
)
```

## Ask avec options et Session

```go
resp, err := client.Ask(ctx, "Ma question",
    fluxchat.WithContext("support e-commerce"),
    fluxchat.WithConversationID("conv-abc123"),
    fluxchat.WithSessionID("session-user-xyz"), // Important pour le contexte
)

fmt.Println(resp.Reply)
```

## Capturer une page passivement

```go
err := client.CapturePage(ctx, "https://example.com/faq", "FAQ", "Contenu de la page...")
```

## Vérifier la clé API

```go
info, err := client.TestKey(ctx)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Organisation: %s, Scopes: %v\n", info.OrganizationID, info.Scopes)
```

## Knowledge Base (CRUD - requiert JWT)

```go
// Lister
items, err := client.GetKnowledge(ctx)

// Créer
newItem := fluxchat.KnowledgeItem{
    Title:   "FAQ",
    Content: "Contenu de la FAQ...",
    Category: "support",
}
item, err := client.CreateKnowledge(ctx, newItem)

// Mettre à jour (patch partiel)
patch := fluxchat.KnowledgeItem{Title: "FAQ v2"}
updated, err := client.UpdateKnowledge(ctx, item.ID, patch)

// Supprimer
err = client.DeleteKnowledge(ctx, item.ID)
```

## Gestion des erreurs

```go
resp, err := client.Ask(ctx, "Bonjour")
if err != nil {
    switch e := err.(type) {
    case *fluxchat.APIError:
        fmt.Printf("Erreur API %d: %s\n", e.StatusCode, e.Message)
    case *fluxchat.NetworkError:
        fmt.Printf("Erreur réseau: %v\n", e.Cause)
    default:
        fmt.Printf("Erreur inconnue: %v\n", err)
    }
}
```

## Structure du package

```
sdk/go/
├── README.md
├── go.mod
├── fluxchat.go        ← Client, types, options, helpers HTTP
└── fluxchat_test.go   ← Tests avec httptest.Server
```

## Prérequis

- Go 1.21+
