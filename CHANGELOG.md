# Changelog

All notable changes to `fluxchat-sdk` are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

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
