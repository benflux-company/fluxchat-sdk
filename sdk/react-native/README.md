# FluxChat SDK — React Native

> Community SDK — tracked in [issue #8](https://github.com/benflux-company/fluxchat-sdk/issues/8)

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

```js
import FluxChat from '@fluxchat_sdk/react-native';

const client = new FluxChat({ apiKey: 'fc_prod_...' });

// Ask the bot
const { reply } = await client.ask('What are your opening hours?');

// Capture a screen (call on focus)
useEffect(() => {
  fluxchat.capturePage({
    url: `app://my-app/${route.name}`,
    title: route.params?.title ?? route.name,
    content: extractScreenText(),
  });
}, [route]);
```

## What to implement

| Method | Endpoint | Required |
|---|---|---|
| `ask(message, options?)` | `POST /public/bot/ask` | Yes |
| `testKey()` | `GET /public/bot/test` | Yes |
| `capturePage(options)` | `POST /public/bot/pages` | Yes |
| `knowledge.create(...)` | `POST /bot/knowledge` | Yes |
| `knowledge.list()` | `GET /bot/knowledge` | Yes |
| `knowledge.delete(id)` | `DELETE /bot/knowledge/:id` | Yes |

## Package config

Use `package.json`. No native modules — pure JS using `fetch`. Target React Native 0.72+.

## Testing

After implementing `capturePage`, follow the [5-step verification protocol](https://docs.fluxchat-corp.com/docs#sandbox-verify) using the sandbox above.
