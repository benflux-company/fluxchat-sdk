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
// URL de base personnalisée
client := fluxchat.NewClient("sk-...",
    fluxchat.WithBaseURL("https://mon-proxy.com/v1"),
)

// Client HTTP personnalisé
client := fluxchat.NewClient("sk-...",
    fluxchat.WithHTTPClient(monHTTPClient),
)
```

## Ask avec options

```go
resp, err := client.Ask(ctx, "Ma question",
    fluxchat.WithContext("support e-commerce"),
    fluxchat.WithConversationID("conv-abc123"),
)
```

## Vérifier la clé API

```go
info, err := client.TestKey(ctx)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Valide: %v, Plan: %s\n", info.Valid, info.Plan)
```

## Knowledge Base (CRUD)

```go
// Lister
items, err := client.GetKnowledge(ctx)

// Créer
item, err := client.CreateKnowledge(ctx, "FAQ", "Contenu de la FAQ...")

// Mettre à jour
updated, err := client.UpdateKnowledge(ctx, item.ID, "FAQ v2", "Nouveau contenu")

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
