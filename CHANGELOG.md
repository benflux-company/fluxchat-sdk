# Changelog

All notable changes to `fluxchat-sdk` are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

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
