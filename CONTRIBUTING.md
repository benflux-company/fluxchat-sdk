# Contributing to FluxChat SDK

Thank you for your interest in contributing! The JS/TypeScript SDK is the reference implementation. Community contributions for other languages and frameworks are welcome.

---

## How to contribute

### 1. Fork the repository

Click **Fork** on GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/fluxchat-sdk.git
cd fluxchat-sdk
```

### 2. Pick an issue

Browse open issues tagged with a stack label:

- [`sdk/dart`](../../issues?q=label%3Asdk%2Fdart)
- [`sdk/python`](../../issues?q=label%3Asdk%2Fpython)
- [`sdk/php`](../../issues?q=label%3Asdk%2Fphp)
- [`sdk/go`](../../issues?q=label%3Asdk%2Fgo)
- [`sdk/dotnet`](../../issues?q=label%3Asdk%2Fdotnet)
- [`sdk/swift`](../../issues?q=label%3Asdk%2Fswift)
- [`sdk/kotlin`](../../issues?q=label%3Asdk%2Fkotlin)
- [`sdk/react-native`](../../issues?q=label%3Asdk%2Freact-native)

Comment on the issue to claim it before starting.

### 3. Create a branch

Use the naming convention `sdk/<language>`:

```bash
git checkout -b sdk/dart
```

### 4. Implement the SDK

Place your code in `sdk/<language>/`. Each SDK must implement at minimum:

| Feature | Description |
|---------|-------------|
| `ask(message, context?)` | Send a message, return `reply` + `conversationId` |
| `testKey()` | Verify the API key, return org info + scopes |
| `knowledge.create/update/delete` | Knowledge base write operations |
| `knowledge.list/get` | Knowledge base read operations |
| Error handling | Typed errors for network, API, and config failures |

Use the TypeScript SDK (`src/`) as the reference for behavior and types.

#### API endpoint

All SDKs target:

```
POST https://dev-api.fluxchat-corp.com/api/v2/public/bot/ask
X-API-Key: fc_prod_your_key
Content-Type: application/json

{ "message": "...", "context": "...", "conversationId": "..." }
```

#### Required files

```
sdk/<language>/
├── README.md          # installation + quickstart for this language
├── src/               # source code
├── tests/             # test suite
└── <package config>   # pubspec.yaml / pyproject.toml / composer.json / etc.
```

### 5. Tests

Every SDK must include tests that cover:

- Successful `ask` with a mock HTTP response
- `testKey` parsing
- Knowledge CRUD operations
- Network error handling
- Invalid API key (401) handling

### 6. Open a Pull Request

Push to your fork and open a PR against `main`:

```bash
git push origin sdk/dart
```

- Title: `feat(sdk/dart): initial Dart SDK`
- Link the issue: `Closes #<issue number>`
- All tests must pass

> **Note:** PRs are reviewed and merged exclusively by [@benbaruka](https://github.com/benbaruka). Please be patient — reviews happen weekly.

---

## JS/TypeScript SDK (reference)

To contribute to the JS SDK itself:

```bash
npm install
npm run build      # tsup → ESM + CJS + d.ts
npm test           # vitest
npm run typecheck
```

Bug fixes and improvements are welcome via PR. For new features, open an issue first to discuss.

---

## Code of conduct

Be respectful, constructive, and patient. This is a small open-source project maintained by a single developer.
