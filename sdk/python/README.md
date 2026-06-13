# FluxChat SDK — Python

> Community SDK — tracked in [issue #1](https://github.com/benflux-company/fluxchat-sdk/issues/1)

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

```python
from fluxchat import FluxChat

client = FluxChat(api_key="fc_prod_...")

# Ask the bot
response = client.ask("What are your opening hours?")
print(response.reply)

# Capture a page into the knowledge base
client.capture_page(
    url="https://myapp.com/about",
    title="About us",
    content="We are open Mon–Fri 9am–6pm."
)
```

## What to implement

| Method | Endpoint | Required |
|---|---|---|
| `ask(message, context?, session_id?, conversation_id?)` | `POST /public/bot/ask` | Yes |
| `test_key()` | `GET /public/bot/test` | Yes |
| `capture_page(url, title, content)` | `POST /public/bot/pages` | Yes |
| `knowledge.create(title, content, category?)` | `POST /bot/knowledge` | Yes |
| `knowledge.list()` | `GET /bot/knowledge` | Yes |
| `knowledge.delete(id)` | `DELETE /bot/knowledge/:id` | Yes |

## Package config

Use `pyproject.toml` with `httpx` as the only dependency. Target Python 3.9+.

## Testing

After implementing `capture_page`, follow the [5-step verification protocol](https://docs.fluxchat-corp.com/docs#sandbox-verify) using the sandbox above.
