# FluxChat SDK — Go

> Community SDK — tracked in [issue #4](https://github.com/benflux-company/fluxchat-sdk/issues/4)

## Status

**Open for contribution.** This directory is a placeholder. See [CONTRIBUTING.md](../../CONTRIBUTING.md) and the [full guide](https://docs.fluxchat-corp.com/docs#for-devs) before starting.

## Sandbox — test credentials

| Field | Value |
|---|---|
| Base URL | `https://dev-api.fluxchat-corp.com/api/v2` |
| API Key | `fc_prod_f45868df738ddbec537c6c929570f1dad830fb0ca0cd5f82652e9eb7db4ede16` |
| Org ID | `ba134db3-993d-4076-8431-bb2c922d4db2` |
| Dashboard | https://fluxchat-corp.com (login: heyakaf832@ocuser.com / Test1234567890@) |

## Quickstart (target API)

```go
client := fluxchat.New("fc_prod_...")

resp, err := client.Ask(ctx, fluxchat.AskOptions{
    Message: "What are your opening hours?",
})
fmt.Println(resp.Reply)

// Capture a page
err = client.CapturePage(ctx, fluxchat.PageOptions{
    URL:     "https://myapp.com/about",
    Title:   "About",
    Content: "We are open Mon–Fri 9am–6pm.",
})
```

## What to implement

| Method | Endpoint | Required |
|---|---|---|
| `Ask(ctx, AskOptions)` | `POST /public/bot/ask` | Yes |
| `TestKey(ctx)` | `GET /public/bot/test` | Yes |
| `CapturePage(ctx, PageOptions)` | `POST /public/bot/pages` | Yes |
| `Knowledge.Create(ctx, ...)` | `POST /bot/knowledge` | Yes |
| `Knowledge.List(ctx)` | `GET /bot/knowledge` | Yes |
| `Knowledge.Delete(ctx, id)` | `DELETE /bot/knowledge/:id` | Yes |

## Package config

Use `go.mod` with no external dependencies (stdlib `net/http` only). Target Go 1.21+.

## Testing

After implementing `CapturePage`, follow the [5-step verification protocol](https://docs.fluxchat-corp.com/docs#sandbox-verify) using the sandbox above.
