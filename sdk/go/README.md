# FluxChat SDK — Go

> **Author:** [@benjaminmugangu](https://github.com/benjaminmugangu) · v1.0.4 · [MIT License](../../LICENSE)

Official Go SDK for [FluxChat](https://fluxchat-corp.com). Zero external dependencies — stdlib only.

---

## Install

```bash
go get github.com/benflux-company/fluxchat-sdk/sdk/go@v1.0.4
```

**go.mod**
```
require github.com/benflux-company/fluxchat-sdk/sdk/go v1.0.4
```

Requires Go 1.21+.

---

## Quickstart

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    fluxchat "github.com/benflux-company/fluxchat-sdk/sdk/go"
)

func main() {
    client, err := fluxchat.NewClient(os.Getenv("FLUXCHAT_API_KEY"))
    if err != nil {
        log.Fatal(err)
    }

    resp, err := client.Ask(context.Background(), "What are your opening hours?")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(resp.Reply)
}
```

---

## Authentication

```go
// Validate key + cache OrganizationID (required for KB operations)
info, err := client.TestKey(ctx)

// Obtain admin JWT for Knowledge list/get
loginResp, err := client.Login(ctx, "admin@example.com", "password")
```

---

## Ask

```go
// Stateless
resp, err := client.Ask(ctx, "Hello!")

// Continue a conversation
resp2, err := client.Ask(ctx, "Follow-up?",
    fluxchat.WithConversationID(resp.ConversationID),
)

// With session and context
resp3, err := client.Ask(ctx, "My balance?",
    fluxchat.WithSessionID("user-42"),
    fluxchat.WithContext("User: Alice, Plan: Pro"),
)
```

---

## CapturePage

```go
err := client.CapturePage(ctx,
    "https://yoursite.com/pricing",
    "Pricing",
    "Starter: $0/mo · Pro: $29/mo",
)
```

---

## IndexRoutes

Register your API surface as Knowledge Base articles at startup — the bot knows your endpoints before any request arrives.

```go
err := client.IndexRoutes(ctx, []fluxchat.RouteInfo{
    {Method: "GET",  Path: "/api/products", Title: "List products",  Description: "Returns all active products."},
    {Method: "POST", Path: "/api/orders",   Title: "Create order",   Description: "Body: {productId, quantity}."},
})
```

---

## Knowledge Base

```go
// List (requires JWT — call Login first)
items, err := client.GetKnowledge(ctx)

// Create
created, err := client.CreateKnowledge(ctx, fluxchat.KnowledgeItem{
    Title:   "Opening hours",
    Content: "Mon–Fri 9am–6pm",
})

// Update
updated, err := client.UpdateKnowledge(ctx, "article-id", fluxchat.KnowledgeItem{
    Content: "Mon–Fri 9am–7pm",
})

// Delete
err := client.DeleteKnowledge(ctx, "article-id")
```

---

## Error handling

```go
import "errors"

_, err := client.Ask(ctx, "Hello")
if err != nil {
    var apiErr *fluxchat.APIError
    var netErr *fluxchat.NetworkError
    var cfgErr *fluxchat.ConfigError

    switch {
    case errors.As(err, &apiErr):
        fmt.Printf("API %d: %s\n", apiErr.StatusCode, apiErr.Message)
    case errors.As(err, &netErr):
        fmt.Printf("Network: %v\n", netErr.Cause)
    case errors.As(err, &cfgErr):
        fmt.Printf("Config: %s\n", cfgErr.Message)
    }
}
```

---

## Options

| Option | Description |
|--------|-------------|
| `WithBaseURL(url)` | Override API base URL |
| `WithHTTPClient(hc)` | Inject custom HTTP client |
| `WithJWT(token)` | Pre-load a JWT |
| `WithOrgID(id)` | Pre-set organization ID |
| `WithConversationID(id)` | Continue a conversation thread |
| `WithSessionID(id)` | Tie calls to one session |
| `WithContext(text)` | Priority context injected into the bot |

---

## Author

This SDK was written by [@benjaminmugangu](https://github.com/benjaminmugangu) and contributed to the [FluxChat open-source ecosystem](https://github.com/benflux-company/fluxchat-sdk).
