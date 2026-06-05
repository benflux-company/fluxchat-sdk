<div align="center">

# FluxChat SDK

**The official SDK, CLI &amp; embeddable chat widget for [FluxChat](https://fluxchat-corp.com).**

Drop a beautiful AI assistant into any product in minutes — with per-request context, a customizable persona, and full knowledge-base control.

[![npm version](https://img.shields.io/npm/v/@fluxchat_sdk/sdk?color=4f46e5)](https://www.npmjs.com/package/@fluxchat_sdk/sdk)
[![license](https://img.shields.io/npm/l/@fluxchat_sdk/sdk?color=4f46e5)](./LICENSE)
[![types](https://img.shields.io/npm/types/@fluxchat_sdk/sdk?color=4f46e5)](./dist/index.d.ts)
[![node](https://img.shields.io/node/v/@fluxchat_sdk/sdk?color=4f46e5)](https://nodejs.org)

[Dashboard](https://fluxchat-corp.com) &nbsp;·&nbsp; [API](https://dev-api.fluxchat-corp.com) &nbsp;·&nbsp; [Benflux](https://benflux-corp.com)

</div>

---

## Features

- **Ask API** — send messages and get high-quality answers from your assistant.
- **Per-request context** — inject real-time data (cart, user, page) treated as a *priority source of truth*, above the knowledge base.
- **Persona** — set the assistant name, tone, and style rules per organization.
- **Knowledge base** — create, update and delete articles with a scoped API key.
- **Embeddable widget** — a polished, fully customizable chat bubble for any website.
- **CLI** — talk to your bot and manage knowledge from the terminal.
- **Universal** — ESM + CJS + TypeScript types, zero-config.

---

## Install

```bash
npm install @fluxchat_sdk/sdk
# or
pnpm add @fluxchat_sdk/sdk
# or
yarn add @fluxchat_sdk/sdk
```

> Requires Node.js **18+** (uses the global `fetch`). The widget runs in any modern browser.

---

## Quickstart

### 1. SDK

```ts
import { FluxChat } from '@fluxchat_sdk/sdk';

const fluxchat = new FluxChat({
  apiKey: process.env.FLUXCHAT_API_KEY!, // from your FluxChat dashboard
});

const { reply } = await fluxchat.ask({
  message: 'Quel est le statut de ma commande ?',
  context: 'Commande #1234 — expédiée le 3 juin, livraison prévue le 6 juin.',
});

console.log(reply);
```

### 2. CLI

```bash
export FLUXCHAT_API_KEY="bfx_xxx"

fluxchat test
fluxchat ask "Bonjour !" --context "Client VIP, panier de 3 articles."
```

### 3. Widget (one snippet)

```html
<script src="https://unpkg.com/@fluxchat_sdk/sdk/dist/widget.global.js"></script>
<script>
  FluxChatWidget.init({
    apiKey: 'bfx_xxx',
    clientName: 'Acme Bank',
    assistantName: 'Léa',
    primaryColor: '#4f46e5',
  });
</script>
```

---

## Widget

A floating chat bubble that looks great out of the box and is **fully themeable**.

```text
                                   +---------------------------+
                                   |  (L)  Léa               X |
                                   |       Acme Bank           |
                                   +---------------------------+
                                   |  Bonjour, comment puis-je |
                                   |  vous aider ?             |
                                   |                           |
                                   |       Quel est mon solde ?|
                                   |  Votre solde est de 4250 €|
                                   +---------------------------+
                                   |  Écrivez votre message… > |
                                   |     Propulsé par Benflux  |
                                   +---------------------------+
```

### Embed options

**A — Script tag (any site, no build step):**

```html
<script src="https://unpkg.com/@fluxchat_sdk/sdk/dist/widget.global.js"></script>
<script>
  const widget = FluxChatWidget.init({ apiKey: 'bfx_xxx' });
  // widget.open(); widget.close(); widget.send('Hi'); widget.destroy();
</script>
```

**B — Bundler / framework (React, Vue, Svelte…):**

```ts
import { init } from '@fluxchat_sdk/sdk/widget';

const widget = init({
  apiKey: import.meta.env.VITE_FLUXCHAT_API_KEY,
  clientName: 'Acme Bank',
  assistantName: 'Léa',
});
```

### Customization

| Option           | Type                    | Default                    | Description                                       |
| ---------------- | ----------------------- | -------------------------- | ------------------------------------------------- |
| `apiKey`         | `string` *(required)*   | —                          | Organization API key.                             |
| `baseUrl`        | `string`                | FluxChat API               | Override the API endpoint.                        |
| `clientName`     | `string`                | `''`                       | Your brand name, shown in the header.             |
| `assistantName`  | `string`                | `'Assistant'`              | The assistant's display name + avatar initial.    |
| `headerSubtitle` | `string`                | `'En ligne'`               | Subtitle under the name (when no `clientName`).   |
| `avatarUrl`      | `string`                | —                          | Avatar image (falls back to the initial).         |
| `logoUrl`        | `string`                | —                          | Logo image used in the header avatar.             |
| `primaryColor`   | `string`                | `'#4f46e5'`                | Brand color for header, bubbles and buttons.      |
| `theme`          | `'light' \| 'dark'`     | `'light'`                  | Color theme.                                      |
| `position`       | `'right' \| 'left'`     | `'right'`                  | Launcher corner.                                  |
| `radius`         | `number`                | `20`                       | Panel border radius (px).                         |
| `greeting`       | `string`                | `'Bonjour, comment…'`      | First assistant message.                          |
| `placeholder`    | `string`                | `'Écrivez votre message…'` | Input placeholder.                                |
| `launcherLabel`  | `string`                | `'Discuter'`               | Launcher tooltip / aria-label.                    |
| `context`        | `string`                | —                          | Static context sent with **every** message.       |
| `openOnLoad`     | `boolean`               | `false`                    | Open the panel automatically.                     |
| `showBranding`   | `boolean`               | `true`                     | Show the "Powered by Benflux" footer.             |
| `target`         | `string \| HTMLElement` | `document.body`            | Where to mount the widget.                        |

Returns a `WidgetInstance`: `open()`, `close()`, `toggle()`, `send(message)`, `destroy()`.

---

## SDK reference

### Create a client

```ts
import { FluxChat } from '@fluxchat_sdk/sdk';

const fluxchat = new FluxChat({
  apiKey: 'bfx_xxx',            // X-API-Key auth (public bot + bot:write KB)
  // token: 'eyJ...',           // OR a JWT for admin operations
  // baseUrl: 'https://dev-api.fluxchat-corp.com/api/v2',
  organizationId: 'org-uuid',   // default org for knowledge/config helpers
});
```

### `ask(options)`

```ts
const res = await fluxchat.ask({
  message: 'Comment retourner un article ?',
  context: 'Politique de retour: 30 jours, gratuit pour les membres Premium.',
  conversationId: undefined,    // omit for a stateless one-off answer
});
// res.reply, res.conversationId, res.intent, res.confidence
```

### `testKey()`

```ts
const { organizationId, scopes } = await fluxchat.testKey();
```

### Knowledge base

```ts
// Writes need an API key with the `bot:write` scope:
const article = await fluxchat.knowledge.create({
  title: 'Horaires',
  content: 'Lun–Ven 9h–18h.',
  category: 'general',
  keywords: ['horaires', 'ouverture'],
});

await fluxchat.knowledge.update(article.id, { content: 'Lun–Ven 8h–19h.' });
await fluxchat.knowledge.remove(article.id);

// Reads need a JWT token:
const all = await fluxchat.knowledge.list();
const one = await fluxchat.knowledge.get(article.id);
```

### Persona config

```ts
await fluxchat.config.update({
  assistantName: 'Léa',
  tone: 'chaleureux et concis',
  styleRules: 'Tutoie le client, évite le jargon.',
  captureTrainingData: false,
});

const cfg = await fluxchat.config.get();
```

### Errors

Every failure is a typed subclass of `FluxChatError`:

```ts
import { FluxChatApiError, FluxChatConfigError, FluxChatNetworkError } from '@fluxchat_sdk/sdk';

try {
  await fluxchat.knowledge.create({ title: 'x', content: 'y' });
} catch (err) {
  if (err instanceof FluxChatApiError) {
    console.error(err.status, err.message); // e.g. 403 "API key missing required scope(s): bot:write"
  }
}
```

---

## CLI reference

```bash
fluxchat [global options] <command>
```

**Global options** (or env vars): `--api-key` (`FLUXCHAT_API_KEY`), `--token` (`FLUXCHAT_TOKEN`), `--base-url` (`FLUXCHAT_BASE_URL`), `--org` (`FLUXCHAT_ORG_ID`), `--json`.

| Command                                | Description                                  |
| -------------------------------------- | -------------------------------------------- |
| `fluxchat test`                        | Verify the API key and show its scopes.      |
| `fluxchat ask <message> [-c ctx]`      | Send a message (with optional `--context`).  |
| `fluxchat kb list`                     | List knowledge articles *(needs `--token`)*. |
| `fluxchat kb get <id>`                 | Show one article *(needs `--token`)*.        |
| `fluxchat kb create --title --content` | Create an article *(`bot:write`)*.           |
| `fluxchat kb update <id> [...]`        | Update an article *(`bot:write`)*.           |
| `fluxchat kb delete <id>`              | Delete an article *(`bot:write`)*.           |
| `fluxchat config get`                  | Show the persona config.                     |
| `fluxchat config set [...]`            | Update the persona *(needs `--token`)*.      |

```bash
# Examples
fluxchat ask "Quels sont vos tarifs ?" --json
fluxchat kb create --title "FAQ livraison" --content "Livraison sous 48h." --keywords "livraison,délai"
fluxchat config set --name "Léa" --tone "amical" --token "$JWT"
```

---

## Popular tasks

<details>
<summary><b>Inject the logged-in user as context</b></summary>

```ts
await fluxchat.ask({
  message: 'Ai-je des factures impayées ?',
  context: `Utilisateur: ${user.name} (id ${user.id}). Factures impayées: ${unpaid.length}.`,
});
```
</details>

<details>
<summary><b>Sync your FAQ into the knowledge base (CI script)</b></summary>

```ts
import { FluxChat } from '@fluxchat_sdk/sdk';
const fx = new FluxChat({ apiKey: process.env.FLUXCHAT_API_KEY!, organizationId: process.env.ORG! });

for (const item of faq) {
  await fx.knowledge.create({ title: item.q, content: item.a, category: 'support' });
}
```
</details>

<details>
<summary><b>Brand the widget to match your site</b></summary>

```js
FluxChatWidget.init({
  apiKey: 'bfx_xxx',
  clientName: 'Acme Bank',
  assistantName: 'Léa',
  primaryColor: '#0a7c4a',
  theme: 'dark',
  position: 'left',
  greeting: 'Une question sur votre compte ?',
});
```
</details>

<details>
<summary><b>Open the widget from your own button</b></summary>

```js
const widget = FluxChatWidget.init({ apiKey: 'bfx_xxx' });
document.querySelector('#help').addEventListener('click', () => widget.open());
```
</details>

<details>
<summary><b>Stateless one-off answer (no conversation stored)</b></summary>

```ts
const { reply, conversationId } = await fluxchat.ask({ message: 'Bonjour' });
// conversationId === "" → nothing was persisted server-side
```
</details>

---

## API versions

The FluxChat API is versioned. This SDK and the widget target **v2** by default.

| Version | Base URL | Notes |
| ------- | ------------------------------------------ | ----------------------------------------------- |
| **v2** *(default)* | `https://dev-api.fluxchat-corp.com/api/v2` | Per-request `context`, stateless public asks. |
| **v1** *(legacy)*  | `https://dev-api.fluxchat-corp.com/api/v1` | Stable, backward-compatible. **Does not accept `context`.** |

Pin a version explicitly via `baseUrl` (SDK) or the `baseUrl` widget option. Passing
`context` against **v1** returns `400` — use v2 for context-aware answers.

---

## Authentication &amp; scopes

| Operation                                  | Auth                             |
| ------------------------------------------ | -------------------------------- |
| `ask`, `testKey`, widget                   | API key (`X-API-Key`)            |
| Knowledge **write** (create/update/delete) | API key with `bot:write` scope   |
| Knowledge **read**, persona `config`       | JWT (admin) token                |

Create and manage API keys from the **[FluxChat dashboard](https://fluxchat-corp.com)** → Organization settings → API Keys.

---

## Development

```bash
npm install
npm run build      # tsup → ESM + CJS + d.ts + CLI + widget
npm test           # vitest
npm run typecheck
```

---

<div align="center">

A product by **[Benflux](https://benflux-corp.com)** · MIT Licensed

</div>
