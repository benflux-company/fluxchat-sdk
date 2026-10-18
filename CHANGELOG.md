# Changelog

All notable changes to `fluxchat-sdk` are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.0] — 2026-10-18

### Added
- **Human handoff that stays a conversation.** `humanHandoff` collects name / e-mail / message inline and posts to `POST /public/bot/escalate`; from then on the widget is a view onto that support ticket rather than an e-mail dead end. The composer writes into the ticket, the thread is polled every 5s, and agent replies arrive in their own bubble with the agent's name.
- **Thread resumes across visits.** The ticket (`{id, email}`) is kept in `localStorage`, so a reload or a return visit restores the whole conversation — including the bot turns from before the handoff, which the backend copies into the ticket. A ticket that no longer exists (404) is dropped instead of trapping the visitor in a dead thread.
- **Status strip** under the header: transmitted (amber) → *<agent> is answering* (emerald) → closed (slate, composer locked, with a "new conversation" reset).
- New widget-side theme tokens for the agent accent (`--fcw-agent-*`, `--fcw-waiting-*`, `--fcw-closed-*`), deliberately never `--fcw-primary`, so "a person answered" reads even when an integrator sets the brand colour to green.

### Changed
- `humanHandoffSuccessMessage`'s default no longer promises an e-mail-only follow-up — the reply lands in the widget.
- Ownership of a visitor's own ticket is the e-mail they escalated with: no account, no session, no token.

### Requires
- An API running api-chat-integration ≥ the support-thread release (`GET|POST /api/v2/public/bot/tickets/:id[/messages]`). Against an older API the handoff still creates a ticket; only the in-widget thread is unavailable.

## [0.1.5] — 2026-06-11

### Added
- **`autoCapture: true`** — passively captures every page the user visits (DOM text + URL + title) and stores it in FluxChat so the bot can answer questions about the entire site. Works on static HTML, WordPress, React/Vue/Angular SPAs — any site, no API required. SPA navigation (pushState / replaceState / popstate / hashchange) is intercepted automatically.
- **`POST /public/bot/pages`** — new public endpoint that receives passive page captures from the SDK. Idempotent (upsert on URL). No `bot:write` scope required.
- **`searchSessionPages`** — bot now searches passively-captured pages (ILIKE) in addition to the KB on every question. No admin import step needed.
- **`platformApi`** — optional: provide your platform's REST API base URL and the widget auto-discovers GET endpoints via OpenAPI/Swagger spec, scores them against each user question, calls the top matches, and appends results as live context before sending to FluxChat.
- **`BotSessionPage` entity** — new per-tenant `bot_session_page` table, lazy-created with `CREATE TABLE IF NOT EXISTS` (works for existing orgs without migration).
- **`autoContext: true`** — documented in types: auto-inject page title, URL, DOM text, and `window.fluxchatContext` into every message.
- **CONTRIBUTING.md** — full system architecture, bot pipeline, API reference, and implementation guides in Python, Go, Flutter/Dart for contributors building SDKs in other languages.

### Fixed
- Intent detection now runs **before** the AI call so action results are injected into the prompt as live data.
- `upsertSessionPage` called before the stateless check — page context is always captured even on stateless v2 calls.

## [0.1.4] — 2026-06-10

### Added
- **React component widget** — documented native React/Next.js/Vite/CRA widget approach with `buildContext()` and DOM-pollution guard.
- **`window.fluxchatContext`** — full documentation of the context injection pattern, schema, framework examples (React, Next.js), and merge/cleanup rules.
- **CONTRIBUTING.md** — fork workflow, branch naming (`sdk/<language>`), required implementation checklist, and PR rules.

### Changed
- API key format updated from `bfx_xxx` to `fc_prod_...` throughout README and examples.

## [0.1.0] — 2026-06-05

### Added
- **SDK** (`FluxChat` client): `ask` with per-request `context`, `testKey`,
  `knowledge` CRUD, and persona `config` get/update. Dual ESM + CJS + types.
- **CLI** (`fluxchat`): `ask`, `test`, `kb` (list/get/create/update/delete),
  `config` (get/set). Credentials via flags or `FLUXCHAT_*` env vars.
- **Widget**: embeddable, fully customizable chat bubble (brand name, assistant
  name, colors, theme, position, greeting, context…), with a "Powered by
  Benflux" footer. Ships as a `<script>` global and an ESM subpath import.
- Typed error hierarchy: `FluxChatApiError`, `FluxChatConfigError`,
  `FluxChatNetworkError`.
