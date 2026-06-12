# Contributing to FluxChat SDK

This document is the **authoritative reference for SDK contributors**. It explains the full FluxChat system so you can implement a correct, idiomatic SDK in any language or framework.

Read this entirely before writing a single line of code.

---

## Table of contents

1. [System architecture](#1-system-architecture)
2. [API reference — every endpoint you need](#2-api-reference)
3. [The bot pipeline — how a question becomes an answer](#3-the-bot-pipeline)
4. [Zero-config features — autoCapture, autoContext, platformApi](#4-zero-config-features)
5. [Implementing a new language SDK — checklist](#5-implementing-a-new-language-sdk)
6. [Contributing to the JS/TypeScript SDK](#6-contributing-to-the-jstypescript-sdk)

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
| **API key** | `fc_prod_xxx` or `fc_live_xxx` — identifies the org on every public request via `X-API-Key` header. |
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
    "message": "API key is valid ✓",
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
  "createdAt": "2026-06-10T00:00:00.000Z"
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

`strictMode: true` forces the bot to only answer using KB + captured pages, refusing any hallucination.

---

## 3. The bot pipeline

Understanding this pipeline is mandatory for building a correct SDK. Here is exactly what happens when the user sends a message:

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
   → Merge results as priority context
           │
           ▼
5. Intent detection (BEFORE AI call):
   → Pattern match on message to detect intents (hours, pricing, etc.)
   → If intent matched → call the action (fetch from org's own API or DB)
   → Action result injected as "LIVE DATA (ABSOLUTE SOURCE OF TRUTH)"
           │
           ▼
6. Build system prompt:
   - Org persona (name, tone, style rules)
   - Anti-hallucination rule (never invent org-specific details)
   - KB context (from step 4a)
   - Session page context (from step 4b)
   - Action data (from step 5) — highest priority
   - Per-request context (from SDK, e.g. user info, current page)
           │
           ▼
7. AI call (Claude claude-sonnet-4-6 or configured model)
           │
           ▼
8. Return reply + conversationId (empty string if stateless)
```

### Priority order for the AI (highest → lowest)

1. **Action data** (live DB/API result from step 5)
2. **Per-request `context`** (injected by SDK — page content, user info, live platform data)
3. **KB articles** (curated by admins)
4. **Session pages** (passively captured by SDK)
5. **AI general knowledge** (used only if nothing above is relevant, and only if not in strictMode)

---

## 4. Zero-config features

These three features make the bot work on any site without manual configuration.

### 4.1 `autoCapture` — passive DOM capture

**Goal:** The bot knows the entire site without any admin setup.

**How it works:**

1. On widget init, `startPassiveCapture()` intercepts SPA navigation:
   - `history.pushState` / `history.replaceState` → capture 400ms after (waits for DOM render)
   - `popstate` / `hashchange` → same

2. On each new URL, `captureCurrentPage()`:
   - Reads visible text from `<main>` or `<body>` (innerText, max 5000 chars)
   - Skips if under 80 chars (navigation, loading screens)
   - Skips if URL already captured this session (in-memory Set)
   - POSTs to `POST /public/bot/pages`

3. Backend upserts into `bot_session_page(url, title, content)` per org schema.

4. On next `/ask`, `buildKnowledgeContext` runs `searchSessionPages(message)` — ILIKE search — and injects results as context.

**Implementing `autoCapture` in other languages:**

For mobile SDKs (Flutter/Swift/Kotlin), instead of DOM capture, expose an API:
```
FluxChat.capturePage(url: string, title: string, content: string)
```
Call it from your screen/page lifecycle hooks. The SDK then POSTs to `/public/bot/pages`.

For React Native:
```js
// Call when screen focuses
useEffect(() => {
  fluxchat.capturePage({
    url: `app://my-app/${route.name}`,
    title: route.params?.title ?? route.name,
    content: extractScreenText(), // serialize your screen's visible text
  });
}, [route]);
```

### 4.2 `autoContext` — per-request context injection

**Goal:** The bot always knows what page/screen the user is on and who they are.

**How it works (priority order):**

1. `window.fluxchatContext` — set by the host app at runtime (user, org, any data)
2. `data-fluxchat="..."` attributes on DOM elements
3. Page title + current URL
4. Visible text from `<main>` (first message only, max 3000 chars)

The built context string is injected into every `/ask` request as the `context` field.

**The `window.fluxchatContext` contract:**

```js
window.fluxchatContext = {
  user: { name: 'Alice', email: 'alice@example.com', role: 'admin' },
  org:  { name: 'Acme Corp', id: 'org-uuid' },
  // any page-specific data:
  cart: { items: 3, total: '€89.99' },
}
```

**Rules:**
- Set persistent data (user, org) at root layout, not per-page.
- Always merge page-specific data; never overwrite the full object.
- Clean up page-specific keys on page unmount.
- DOM scraping only happens on the first message — subsequent messages use `window.fluxchatContext` only.

### 4.3 `platformApi` — live data from the host application's REST API

**Goal:** The bot answers "what are the latest sermons?" or "show my orders" using real-time data from the platform's own API.

**How it works:**

1. On widget init, try to fetch OpenAPI spec from:
   - `{baseUrl}/openapi.json`
   - `{baseUrl}/swagger.json`
   - `{baseUrl}/api-docs`
   - `{baseUrl}/api-docs.json`

2. For each user message, score all GET endpoints against the question:
   - Tokenize question into keywords (>3 chars)
   - Score each endpoint by path + summary keyword overlap
   - Take top 2 scoring endpoints above threshold

3. Call top endpoints with the user's auth token (read from localStorage):
   - Try keys: `member_token`, `admin_token`, `token`, `auth_token`, `access_token`
   - Pass as `Authorization: Bearer <token>`

4. Format results as JSON and append to the `context` string before calling `/ask`.

**Context format:**
```
[Platform API data — source of truth]
GET /api/events → {"data": [...], "total": 12}
GET /api/sermons?limit=5 → {"data": [...]}
```

This appears in the `context` field of `/ask` and is treated as the highest-priority source after action data.

---

## 5. Implementing a new language SDK

### Minimum required surface

| Feature | Required | Notes |
|---|---|---|
| `ask(message, context?)` | Yes | POST /public/bot/ask |
| `testKey()` | Yes | GET /public/bot/test |
| `knowledge.create/update/delete` | Yes | Needs `bot:write` scope |
| `knowledge.list/get` | Yes | Needs JWT |
| Typed errors | Yes | Network, API (4xx/5xx), config |
| `capturePage(url, title, content)` | Recommended | POST /public/bot/pages |
| Platform widget (mobile/web) | Optional | See widget section |

### Repository structure

```
sdk/<language>/
├── README.md          # install + quickstart for this language
├── src/               # source code
├── tests/             # test suite covering items below
└── <package config>   # pubspec.yaml / pyproject.toml / etc.
```

### Test coverage required

- `ask` — successful response parsing
- `ask` — stateless (no conversationId, returns empty conversationId)
- `testKey` — parse organizationId + scopes
- `knowledge.create` — create + parse response
- `knowledge.list` — list parsing
- `knowledge.delete` — 204 handling
- Network error (connection refused) → typed NetworkError
- 401 Unauthorized → typed ApiError with status 401
- 403 Forbidden (missing scope) → typed ApiError with status 403

### Implementation guide

**Python example (minimal `ask`):**

```python
import httpx
from dataclasses import dataclass

BASE_URL = "https://dev-api.fluxchat-corp.com/api/v2"

@dataclass
class AskResponse:
    reply: str
    conversation_id: str

class FluxChat:
    def __init__(self, api_key: str, base_url: str = BASE_URL):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self._headers = {"X-API-Key": api_key, "Content-Type": "application/json"}

    def ask(self, message: str, *, context: str | None = None, conversation_id: str | None = None) -> AskResponse:
        payload = {"message": message}
        if context:
            payload["context"] = context
        if conversation_id:
            payload["conversationId"] = conversation_id

        with httpx.Client() as client:
            r = client.post(f"{self.base_url}/public/bot/ask", json=payload, headers=self._headers)
        
        if not r.is_success:
            raise FluxChatApiError(r.status_code, r.text)
        
        data = r.json()["data"]
        return AskResponse(reply=data["reply"], conversation_id=data.get("conversationId", ""))

    def capture_page(self, url: str, title: str, content: str) -> None:
        payload = {"url": url, "title": title, "content": content[:6000]}
        with httpx.Client() as client:
            client.post(f"{self.base_url}/public/bot/pages", json=payload, headers=self._headers)
```

**Go example (minimal `ask`):**

```go
package fluxchat

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

const defaultBaseURL = "https://dev-api.fluxchat-corp.com/api/v2"

type Client struct {
    apiKey  string
    baseURL string
    http    *http.Client
}

type AskOptions struct {
    Message        string `json:"message"`
    Context        string `json:"context,omitempty"`
    ConversationID string `json:"conversationId,omitempty"`
}

type AskResponse struct {
    Reply          string `json:"reply"`
    ConversationID string `json:"conversationId"`
}

func New(apiKey string) *Client {
    return &Client{apiKey: apiKey, baseURL: defaultBaseURL, http: &http.Client{}}
}

func (c *Client) Ask(opts AskOptions) (*AskResponse, error) {
    body, _ := json.Marshal(opts)
    req, _ := http.NewRequest("POST", c.baseURL+"/public/bot/ask", bytes.NewReader(body))
    req.Header.Set("X-API-Key", c.apiKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := c.http.Do(req)
    if err != nil {
        return nil, fmt.Errorf("network error: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return nil, fmt.Errorf("api error %d", resp.StatusCode)
    }

    var envelope struct {
        Data AskResponse `json:"data"`
    }
    json.NewDecoder(resp.Body).Decode(&envelope)
    return &envelope.Data, nil
}
```

**Flutter/Dart example (minimal `ask`):**

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class FluxChat {
  final String apiKey;
  final String baseUrl;

  FluxChat({required this.apiKey, this.baseUrl = 'https://dev-api.fluxchat-corp.com/api/v2'});

  Future<Map<String, dynamic>> ask(String message, {String? context, String? conversationId}) async {
    final body = <String, dynamic>{'message': message};
    if (context != null) body['context'] = context;
    if (conversationId != null) body['conversationId'] = conversationId;

    final response = await http.post(
      Uri.parse('$baseUrl/public/bot/ask'),
      headers: {'X-API-Key': apiKey, 'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (response.statusCode >= 400) {
      throw Exception('FluxChat API error ${response.statusCode}: ${response.body}');
    }

    final data = jsonDecode(response.body)['data'];
    return {'reply': data['reply'], 'conversationId': data['conversationId'] ?? ''};
  }

  Future<void> capturePage(String url, String title, String content) async {
    await http.post(
      Uri.parse('$baseUrl/public/bot/pages'),
      headers: {'X-API-Key': apiKey, 'Content-Type': 'application/json'},
      body: jsonEncode({'url': url, 'title': title, 'content': content.substring(0, content.length.clamp(0, 6000))}),
    );
  }
}
```

### Response envelope

Every API response follows this shape:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "statusCode": 403,
  "message": "API key missing required scope(s): bot:write",
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

### Error types to implement

| Error class | When to throw |
|---|---|
| `FluxChatNetworkError` | Connection refused, timeout, DNS failure |
| `FluxChatApiError(status, message)` | HTTP 4xx or 5xx response |
| `FluxChatConfigError(message)` | Missing API key, invalid baseUrl |

401 = invalid/missing API key.
403 = valid key, missing scope (e.g. `bot:write` for KB writes).
404 = resource not found (knowledge article ID doesn't exist).
422 = validation error (message too long, etc.).

---

## 6. Contributing to the JS/TypeScript SDK

### Setup

```bash
git clone https://github.com/benflux-company/fluxchat-sdk.git
cd fluxchat-sdk
npm install
npm run build      # tsup → ESM + CJS + d.ts + CLI + widget
npm test           # vitest
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
    ├── widget.ts        # embeddable widget (DOM, SPA capture, context)
    ├── types.ts         # WidgetOptions, WidgetInstance interfaces
    └── styles.ts        # CSS-in-JS widget styles
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
- PRs are reviewed by [@benbaruka](https://github.com/benbaruka)

---

## Code of conduct

Be respectful, constructive, and patient. This is maintained by a small team.
