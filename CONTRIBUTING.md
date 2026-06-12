# Contributing to FluxChat SDK

This document is the **authoritative reference for SDK contributors**. It explains the full FluxChat system so you can implement a correct, idiomatic SDK in any language or framework.

Read this entirely before writing a single line of code.

---

## Table of contents

1. [Developer sandbox](#0-developer-sandbox)
2. [System architecture](#1-system-architecture)
3. [API reference — every endpoint you need](#2-api-reference)
4. [The bot pipeline — how a question becomes an answer](#3-the-bot-pipeline)
5. [Zero-config features — autoCapture, autoContext, platformApi](#4-zero-config-features)
6. [Implementing a new language SDK — checklist](#5-implementing-a-new-language-sdk)
7. [Contributing to the JS/TypeScript SDK](#6-contributing-to-the-jstypescript-sdk)

---

## 0. Developer sandbox

The sandbox is a real FluxChat organization reserved for contributors. It has an active subscription — all features unlocked. Use it to test your SDK against the live API without creating your own account.

> **These credentials are public. Do not store personal data in the sandbox.**

| Field | Value |
|---|---|
| Dashboard | https://fluxchat-corp.com |
| Login | `heyakaf832@ocuser.com` |
| Password | `Test1234567890@` |
| Org ID | `ba134db3-993d-4076-8431-bb2c922d4db2` |
| API Key | `fc_prod_f45868df738ddbec537c6c929570f1dad830fb0ca0cd5f82652e9eb7db4ede16` |
| Base URL | `https://dev-api.fluxchat-corp.com/api/v2` |

### Verifying your capture works — 5-step protocol

Testing `capturePage` is not just about getting a 204 back. You need to prove the full pipeline ran end-to-end: the page arrived, the AI extracted the knowledge, and the bot uses it when answering. Run these 5 steps every time.

#### Step 1 — Send a capture with a unique invented phrase

Use a phrase that could not come from general AI knowledge — something fictional and specific. This eliminates false positives.

```http
POST https://dev-api.fluxchat-corp.com/api/v2/public/bot/pages
Content-Type: application/json
X-API-Key: fc_prod_f45868df738ddbec537c6c929570f1dad830fb0ca0cd5f82652e9eb7db4ede16

{
  "url": "https://test.example.com/about",
  "title": "About FluxTest",
  "content": "FluxTest is a fictional company founded in 2099 by Zara Kowalski. Our slogan is: code never lies, only humans do."
}
```

**Expected:** `HTTP 204 No Content`

204 = capture received and queued for extraction. Wait ~5 seconds — extraction runs async.

#### Step 2 — Ask the bot about the unique phrase

```http
POST https://dev-api.fluxchat-corp.com/api/v2/public/bot/ask
Content-Type: application/json
X-API-Key: fc_prod_f45868df738ddbec537c6c929570f1dad830fb0ca0cd5f82652e9eb7db4ede16

{
  "message": "Who founded FluxTest and what is their slogan?"
}
```

**Expected reply (proof that extraction worked):**
```json
{
  "success": true,
  "data": {
    "reply": "FluxTest was founded in 2099 by Zara Kowalski. Their slogan is: code never lies, only humans do.",
    "conversationId": "",
    "confidence": 1
  }
}
```

If the bot answers with details from your captured page — your SDK works.
If it says "I don't have this information", either:
- The capture did not reach the server (check your HTTP request)
- Extraction is still running (retry after 10 seconds)

#### Step 3 — Confirm in the dashboard

1. Go to https://fluxchat-corp.com and log in with the sandbox credentials above.
2. In the sidebar, click **Bot** → **Base de connaissances**.
3. You should see an entry titled **"About FluxTest"** with the extracted content.
4. If the entry is NOT there after 30 seconds, the content was too short or had no extractable facts (min ~50 words recommended).

#### Step 4 — Test context maintenance (sessionId)

A correct SDK must pass the **same `sessionId`** on every request. Without it, the bot loses context between messages.

```http
// Message 1 — introduce a fact
POST /public/bot/ask
{ "message": "My name is Zara.", "sessionId": "test-session-001" }
→ bot: "Nice to meet you, Zara!"

// Message 2 — SAME sessionId — test context retention
POST /public/bot/ask
{ "message": "What is my name?", "sessionId": "test-session-001" }
→ bot: "Your name is Zara."   ← PASS

// Message 2 — DIFFERENT sessionId — test that context is absent
POST /public/bot/ask
{ "message": "What is my name?", "sessionId": "test-session-002" }
→ bot: "I don't have your name."   ← PASS (different session = no context)
```

If the second call with the **same** `sessionId` does NOT remember "Zara": your SDK is generating a new session ID per request. Fix it by generating the sessionId once (store in memory or persistent storage) and reusing it for the entire session.

#### Step 5 — Known failure modes

```
400 Bad Request   → missing required field (url, title, or content is empty)
401 Unauthorized  → API key header missing or malformed
403 Forbidden     → API key lacks bot:write scope (sandbox key above has all scopes)
413               → content exceeds 6000 chars — truncate before sending
204 but bot doesn't answer  → extraction still running — wait 10s and retry
204 but no KB entry         → content too short or no extractable facts (min ~50 words)
```

---

## 1. System architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                                 │
│                                                                     │
│  ┌────────────────┐    ┌───────────────────────────────────────┐   │
│  │  Host website  │    │          FluxChat SDK                  │   │
│  │  (any stack)   │───▶│  • Widget (HTML/CSS/JS bubble)         │   │
│  │                │    │  • autoCapture  → POST /public/bot/    │   │
│  │                │    │    pages  (passive DOM capture)        │   │
│  │                │    │  • autoContext  → injects page ctx     │   │
│  │                │    │    into every /ask request             │   │
│  │                │    │  • platformApi  → calls host API,      │   │
│  │                │    │    appends results to context          │   │
│  └────────────────┘    └───────────────┬───────────────────────┘   │
│                                         │ HTTPS                     │
└─────────────────────────────────────────┼───────────────────────────┘
                                          │
┌─────────────────────────────────────────▼───────────────────────────┐
│                       FluxChat Backend (NestJS)                     │
│                                                                     │
│  API v2: https://dev-api.fluxchat-corp.com/api/v2                   │
│                                                                     │
│  Public (API key only):                                             │
│    POST /public/bot/ask      ← chat message                         │
│    POST /public/bot/pages    ← passive page capture                 │
│    GET  /public/bot/test     ← key validation                       │
│    POST /public/bot/knowledge/crawl  ← crawl a URL (bot:write)      │
│                                                                     │
│  Admin (JWT):                                                       │
│    /bot/knowledge  CRUD      ← manage KB articles                   │
│    /bot/config     GET/PATCH ← persona configuration                │
│    /bot/session-pages-count  ← count captured pages                 │
│    /bot/import-sessions      ← import captured pages into KB        │
│                                                                     │
│  Multi-tenant: each organization has its own PostgreSQL schema.     │
│  Resolved from the API key on every public request.                 │
└─────────────────────────────────────────────────────────────────────┘
                                          │
                           ┌──────────────▼──────────────┐
                           │   Per-org PostgreSQL schema  │
                           │                              │
                           │  bot_knowledge   (KB articles│
                           │  bot_session_page (captured  │
                           │    pages, upsert on URL)     │
                           │  bot_conversation            │
                           │  bot_config  (persona)       │
                           └──────────────────────────────┘
```

### Key concepts

| Concept | What it means |
|---|---|
| **Organization** | A FluxChat tenant. Each has its own API keys, KB, and DB schema. |
| **API key** | `fc_prod_xxx` — identifies the org on every public request via `X-API-Key` header. |
| **Knowledge base (KB)** | Articles the bot uses to answer questions. Managed by admins. |
| **Session pages** | Pages passively captured from the host site by the SDK (`autoCapture`). Stored in `bot_session_page`. Available to the bot immediately — no admin import needed. |
| **Context** | A string injected per-request by the SDK, treated as a **priority source of truth** above the KB. Used for page content, user info, live API data. |
| **Stateless mode** | v2 `/ask` calls without a `conversationId` are never persisted in the DB. The SDK uses this for anonymous users. |

---

## 2. API reference

Base URL: `https://dev-api.fluxchat-corp.com/api/v2`

### Authentication

All public endpoints require `X-API-Key: <your_api_key>` header.

Admin endpoints require `Authorization: Bearer <jwt>`.

### POST `/public/bot/ask`

Send a message and get an AI reply.

**Request:**
```json
{
  "message": "What are your opening hours?",
  "conversationId": "uuid-optional",
  "context": "string up to 8000 chars — optional but strongly recommended",
  "sessionId": "string-optional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "We are open Monday to Friday, 9am–6pm.",
    "conversationId": "uuid-or-empty-string",
    "intent": "hours_query",
    "confidence": 0.95
  }
}
```

- `conversationId` is empty string when stateless (no `conversationId` sent).
- `context` is **not persisted** and **not used for KB search** — it is injected as a priority source of truth into the AI prompt only.
- v1 (`/api/v1/public/bot/ask`) does not accept `context` — always use v2.

### POST `/public/bot/pages`

Passive page capture. Stores (or updates) the rendered text of a page so the bot can answer questions about it.

**Request:**
```json
{
  "url": "https://example.com/about",
  "title": "About Us",
  "content": "rendered visible text of the page, max 6000 chars"
}
```

**Response:** `204 No Content`

- Idempotent — duplicate URLs are updated in place (`upsert on url`).
- No `bot:write` scope required — any valid API key works.
- Pages are immediately searchable by the bot (ILIKE search, no import step needed).

### GET `/public/bot/test`

Verify the API key. Returns organization info and scopes.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "API key is valid",
    "organizationId": "uuid",
    "scopes": ["bot:write"]
  }
}
```

### POST `/public/bot/knowledge/crawl`

Crawl a URL and auto-populate the KB. Requires `bot:write` scope.

**Request:**
```json
{ "url": "https://example.com/faq" }
```

### Knowledge base (admin — requires JWT)

| Method | Path | Description |
|---|---|---|
| `GET` | `/bot/knowledge` | List all KB articles |
| `GET` | `/bot/knowledge/:id` | Get one article |
| `POST` | `/bot/knowledge` | Create article |
| `PATCH` | `/bot/knowledge/:id` | Update article |
| `DELETE` | `/bot/knowledge/:id` | Delete article |

**Article schema:**
```json
{
  "id": "uuid",
  "title": "FAQ delivery",
  "content": "Delivery takes 48 hours.",
  "category": "support",
  "keywords": ["delivery", "shipping"],
  "isActive": true,
  "createdAt": "2026-06-11T00:00:00.000Z"
}
```

### Persona config (admin — requires JWT)

| Method | Path | Description |
|---|---|---|
| `GET` | `/bot/config` | Get current persona |
| `PATCH` | `/bot/config` | Update persona |

**Config schema:**
```json
{
  "assistantName": "Léa",
  "tone": "friendly and concise",
  "styleRules": "Use 'tu' form. Avoid jargon.",
  "captureTrainingData": false,
  "strictMode": false
}
```

`strictMode: true` forces the bot to only answer using KB + captured pages.

---

## 3. The bot pipeline

Understanding this pipeline is mandatory for building a correct SDK.

```
User message arrives at POST /public/bot/ask
           │
           ▼
1. Authenticate API key → resolve organizationId + org config
           │
           ▼
2. If requestContext (from SDK) → upsert into bot_session_page
   (done BEFORE stateless check so pages are always captured)
           │
           ▼
3. Stateless check: if no conversationId → skip DB conversation load
           │
           ▼
4. Build knowledge context:
   a. searchKnowledge(message)        → ILIKE search in bot_knowledge
   b. searchSessionPages(message)     → ILIKE search in bot_session_page
           │
           ▼
5. Intent detection (BEFORE AI call):
   → Pattern match on message to detect intents
   → If matched → call the action (fetch from org's own API or DB)
   → Action result injected as highest-priority context
           │
           ▼
6. Build system prompt:
   - Org persona (name, tone, style rules)
   - Anti-hallucination rule (never invent org-specific details)
   - KB context (from step 4a)
   - Session page context (from step 4b)
   - Action data (from step 5) — highest priority
   - Per-request context (from SDK)
           │
           ▼
7. FluxChat AI call
           │
           ▼
8. Return { reply, conversationId }   ← conversationId is "" if stateless
```

### Context priority (highest → lowest)

1. **Action data** — live DB/API result from intent detection
2. **Per-request `context`** — injected by SDK per message
3. **KB articles** — curated by admins
4. **Session pages** — passively captured by SDK
5. **AI general knowledge** — only when nothing above matches AND strictMode is off

---

## 4. Zero-config features

### 4.1 `autoCapture` — passive page capture

**Goal:** The bot knows the entire site without any admin setup.

**How it works (JS SDK):**

1. On widget init, `startPassiveCapture()` intercepts SPA navigation:
   - `history.pushState` / `history.replaceState` → capture 400ms after render
   - `popstate` / `hashchange` → same

2. On each new URL, reads visible text from `<main>` or `<body>` (max 5000 chars), skips under 80 chars, skips already-captured URLs, POSTs to `/public/bot/pages`.

**Implementing `autoCapture` in mobile SDKs (Flutter/Swift/Kotlin/React Native):**

Expose a manual API and call it from screen lifecycle hooks:

```dart
// Flutter
@override
void initState() {
  super.initState();
  FluxChat.capturePage(
    url: 'app://my-app/${widget.routeName}',
    title: widget.title,
    content: extractVisibleText(),
  );
}
```

```js
// React Native
useEffect(() => {
  fluxchat.capturePage({
    url: `app://my-app/${route.name}`,
    title: route.params?.title ?? route.name,
    content: extractScreenText(),
  });
}, [route]);
```

### 4.2 `autoContext` — per-request context injection

**Goal:** The bot always knows what page/screen the user is on and who they are.

**Priority order when building the context string:**

1. `window.fluxchatContext` (or platform equivalent) — user, org, any runtime data
2. `data-fluxchat="..."` attributes on DOM / screen elements
3. Screen title + current URL / route
4. Visible text from `<main>` (first message only, max 3000 chars)

**Rules:**
- Set persistent data (user, org) at root, not per-screen.
- Always merge page-specific data — never overwrite the full object.
- Clean up page-specific keys on screen unmount.

### 4.3 `platformApi` — live data from host REST API

On each user message, the SDK scores GET endpoints from the host OpenAPI spec against the question, calls the top 2, and appends the results to the `context` string.

---

## 5. Implementing a new language SDK

### Repository structure

This repo is a monorepo. The root is the official JS/TS SDK. Each community SDK lives in `sdk/<language>/`.

```
fluxchat-sdk/               ← root = official JS/TS SDK (published to npm)
├── src/
├── package.json
│
├── sdk/                    ← community SDKs
│   ├── python/
│   │   ├── README.md
│   │   ├── src/
│   │   ├── tests/
│   │   └── pyproject.toml
│   ├── flutter/
│   ├── go/
│   ├── react-native/
│   ├── php/
│   ├── dotnet/
│   ├── swift/
│   └── kotlin/
```

### Minimum required surface

| Feature | Required | Notes |
|---|---|---|
| `ask(message, context?, sessionId?)` | Yes | POST /public/bot/ask |
| `testKey()` | Yes | GET /public/bot/test |
| `capturePage(url, title, content)` | Yes | POST /public/bot/pages |
| `knowledge.create/update/delete` | Yes | Needs `bot:write` scope |
| `knowledge.list/get` | Yes | Needs JWT |
| Typed errors | Yes | Network, API (4xx/5xx), config |

### Test coverage required

- `ask` — successful response parsing
- `ask` — stateless (no conversationId, returns empty string)
- `testKey` — parse organizationId + scopes
- `capturePage` — 204 handling
- `knowledge.create` — create + parse response
- `knowledge.list` — list parsing
- `knowledge.delete` — 204 handling
- Network error (connection refused) → typed `NetworkError`
- 401 Unauthorized → typed `ApiError(401)`
- 403 Forbidden → typed `ApiError(403)`

### Response envelope

Every API response:
```json
{ "success": true, "data": { ... }, "timestamp": "..." }
```

Error response:
```json
{ "success": false, "statusCode": 403, "message": "API key missing required scope(s): bot:write" }
```

### Error types to implement

| Class | When |
|---|---|
| `FluxChatNetworkError` | Connection refused, timeout, DNS failure |
| `FluxChatApiError(status, message)` | HTTP 4xx / 5xx |
| `FluxChatConfigError(message)` | Missing API key, invalid baseUrl |

### Workflow

```bash
# 1. Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/fluxchat-sdk.git
cd fluxchat-sdk

# 2. Create your branch
git checkout -b sdk/python

# 3. Work inside sdk/python/
#    - README.md
#    - src/
#    - tests/
#    - pyproject.toml (or equivalent)

# 4. Run the 5-step verification protocol (section 0 above)

# 5. Push and open a PR against main
git push origin sdk/python
```

All PRs require one review by [@benbaruka](https://github.com/benbaruka) before merge.

---

## 6. Contributing to the JS/TypeScript SDK

### Setup

```bash
git clone https://github.com/benflux-company/fluxchat-sdk.git
cd fluxchat-sdk
npm install
npm run build
npm test
npm run typecheck
```

### File structure

```
src/
├── index.ts            # main SDK entry (FluxChat class, errors)
├── client.ts           # HTTP client
├── knowledge.ts        # KB CRUD
├── config.ts           # persona config
├── cli/
│   └── index.ts        # CLI commands
└── widget/
    ├── widget.ts        # embeddable widget
    ├── types.ts         # WidgetOptions interfaces
    └── styles.ts        # widget styles
```

### Branch naming

- `feat/<description>` for new features
- `fix/<description>` for bug fixes
- `sdk/<language>` for new language SDKs

### Pull request rules

- All tests must pass (`npm test`)
- TypeScript must compile clean (`npm run typecheck`)
- One PR per feature or fix
- New features need a test
- PRs reviewed by [@benbaruka](https://github.com/benbaruka)

---

## Code of conduct

Be respectful, constructive, and patient. This is maintained by a small team.
