import { widgetCss } from './styles.js';
import type { WidgetInstance, WidgetOptions } from './types.js';

const STYLE_ID = 'fluxchat-widget-styles';
const BENFLUX_URL = 'https://benflux-corp.com';

const DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
const DEV_SUFFIXES  = ['.local', '.dev', '.test', '.localhost', '.internal'];

function detectEnv(apiKey: string, autoDetect: boolean): 'dev' | 'prod' {
  if (!autoDetect) return 'prod';
  // API key prefix is the strongest signal
  if (apiKey.startsWith('fc_dev_')) return 'dev';
  // Fallback: hostname-based detection (runs in browser only)
  if (typeof globalThis.window !== 'undefined') {
    const host = globalThis.window.location.hostname;
    if (DEV_HOSTNAMES.has(host)) return 'dev';
    if (DEV_SUFFIXES.some(s => host.endsWith(s))) return 'dev';
  }
  return 'prod';
}

const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" style="vertical-align:-1px"><path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
};

interface Resolved extends Required<Omit<WidgetOptions, 'avatarUrl' | 'logoUrl' | 'context' | 'target' | 'platformApi'>> {
  avatarUrl?: string;
  logoUrl?: string;
  context?: string;
  target?: string | HTMLElement;
  platformApi?: WidgetOptions['platformApi'];
  autoCapture: boolean;
}

// ─── Platform API auto-enrichment types ────────────────────────────────────

interface EndpointInfo {
  path: string;
  summary: string;
  keywords: string;
}

function resolve(options: WidgetOptions): Resolved {
  if (!options.apiKey) throw new Error('[FluxChatWidget] `apiKey` is required.');
  return {
    apiKey: options.apiKey,
    baseUrl: (options.baseUrl ?? 'https://dev-api.fluxchat-corp.com/api/v2').replace(/\/+$/, ''),
    clientName: options.clientName ?? '',
    assistantName: options.assistantName ?? 'Assistant',
    headerSubtitle: options.headerSubtitle ?? 'En ligne',
    primaryColor: options.primaryColor ?? '#4f46e5',
    theme: options.theme ?? 'light',
    themeToggle: options.themeToggle ?? true,
    mode: options.mode ?? 'floating',
    position: options.position ?? 'right',
    radius: options.radius ?? 20,
    zIndex: options.zIndex ?? 2147483000,
    greeting: options.greeting ?? 'Bonjour, comment puis-je vous aider ?',
    placeholder: options.placeholder ?? 'Écrivez votre message…',
    launcherLabel: options.launcherLabel ?? 'Discuter',
    openOnLoad: options.openOnLoad ?? false,
    showBranding: options.showBranding ?? true,
    autoEnvDetect: options.autoEnvDetect ?? true,
    autoContext: options.autoContext ?? true,
    autoCapture: options.autoCapture ?? true,
    autoCrawl: options.autoCrawl ?? false,
    avatarUrl: options.avatarUrl,
    logoUrl: options.logoUrl,
    context: options.context,
    target: options.target,
    platformApi: options.platformApi,
  };
}

/** Escape HTML, then apply a tiny safe subset of markdown (**bold**, links, newlines). */
function renderMarkup(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
}

export class FluxChatWidget implements WidgetInstance {
  private readonly o: Resolved;
  private readonly isDevMode: boolean;
  private root!: HTMLDivElement;
  private messagesEl!: HTMLDivElement;
  private input!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private isOpen = false;
  private busy = false;
  private conversationId = '';
  private sessionId = '';
  private theme: 'light' | 'dark' = 'light';
  private platformEndpoints: EndpointInfo[] = [];
  private lastPlatformData = '';

  constructor(options: WidgetOptions) {
    this.o = resolve(options);
    this.isDevMode = detectEnv(this.o.apiKey, this.o.autoEnvDetect) === 'dev';
    this.sessionId = (() => {
      try {
        const k = `fcw_sid_${this.o.apiKey.slice(-8)}`;
        const stored = localStorage.getItem(k);
        if (stored) return stored;
        const id = crypto.randomUUID();
        localStorage.setItem(k, id);
        return id;
      } catch { return crypto.randomUUID(); }
    })();
    if (this.isDevMode) {
      // eslint-disable-next-line no-console
      console.debug('[FluxChatWidget] DEV mode — requests will include X-FluxChat-Env: development');
    }
    this.injectStyles();
    this.build();
    if (this.o.mode === 'inline' || this.o.openOnLoad) this.open();
    if (this.o.autoCrawl) this.triggerAutoCrawl();
    if (this.o.autoCapture) this.startPassiveCapture();
    if (this.o.platformApi?.baseUrl) void this.initPlatformApi();
  }

  // ── Public API ──────────────────────────────────────────
  open(): void {
    this.isOpen = true;
    this.root.setAttribute('data-open', 'true');
    if (this.messagesEl.childElementCount === 0 && this.o.greeting) {
      this.addBubble('bot', this.o.greeting);
    }
    setTimeout(() => this.input.focus(), 200);
  }
  close(): void {
    this.isOpen = false;
    this.root.setAttribute('data-open', 'false');
  }
  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }
  send(message: string): void {
    void this.handleSend(message);
  }
  /** Switch the widget between light and dark. */
  setTheme(theme: 'light' | 'dark'): void {
    this.theme = theme;
    this.root.setAttribute('data-theme', theme);
    const btn = this.root.querySelector('.fcw-theme');
    if (btn) btn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
  }
  toggleTheme(): void {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }
  destroy(): void {
    this.restoreInterceptions();
    this.root.remove();
  }

  // ── Build ───────────────────────────────────────────────
  private injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = widgetCss();
      document.head.appendChild(style);
    }
  }

  private build(): void {
    this.theme = this.o.theme;
    const root = document.createElement('div');
    root.className = 'fcw-root';
    root.setAttribute('data-theme', this.theme);
    root.setAttribute('data-mode', this.o.mode);
    root.setAttribute('data-position', this.o.position);
    root.setAttribute('data-open', this.o.mode === 'inline' ? 'true' : 'false');
    root.style.setProperty('--fcw-primary', this.o.primaryColor);
    root.style.setProperty('--fcw-radius', `${this.o.radius}px`);
    root.style.zIndex = String(this.o.zIndex);

    root.innerHTML = `
      <div class="fcw-panel" role="dialog" aria-label="${this.attr(this.o.assistantName)}">
        <div class="fcw-header">
          <div class="fcw-avatar">${this.avatarMarkup()}</div>
          <div class="fcw-head-text">
            <span class="fcw-title">${this.esc(this.o.assistantName)}</span>
            <span class="fcw-subtitle">${this.o.clientName ? this.esc(this.o.clientName) : `<span class="fcw-dot"></span>${this.esc(this.o.headerSubtitle)}`}</span>
          </div>
          <div class="fcw-hbtns">
            ${this.isDevMode ? '<span class="fcw-dev-badge">DEV</span>' : ''}
            ${this.o.themeToggle ? `<button class="fcw-hbtn fcw-theme" aria-label="Changer de thème">${this.theme === 'dark' ? ICONS.sun : ICONS.moon}</button>` : ''}
            <button class="fcw-hbtn fcw-close" aria-label="Fermer">${ICONS.close}</button>
          </div>
        </div>
        <div class="fcw-messages"></div>
        <div class="fcw-composer">
          <textarea class="fcw-input" rows="1" placeholder="${this.attr(this.o.placeholder)}"></textarea>
          <button class="fcw-send" aria-label="Envoyer">${ICONS.send}</button>
        </div>
        ${this.o.showBranding ? `<div class="fcw-footer">${ICONS.bolt} Propulsé par <a href="${BENFLUX_URL}" target="_blank" rel="noopener noreferrer">Benflux</a></div>` : ''}
      </div>
      ${this.o.mode === 'floating' ? `<button class="fcw-launcher" aria-label="${this.attr(this.o.launcherLabel)}" title="${this.attr(this.o.launcherLabel)}">${ICONS.chat}</button>` : ''}
    `;

    this.root = root;
    this.messagesEl = root.querySelector('.fcw-messages')!;
    this.input = root.querySelector('.fcw-input')!;
    this.sendBtn = root.querySelector('.fcw-send')!;

    root.querySelector('.fcw-launcher')?.addEventListener('click', () => this.toggle());
    root.querySelector('.fcw-close')?.addEventListener('click', () => this.close());
    root.querySelector('.fcw-theme')?.addEventListener('click', () => this.toggleTheme());
    this.sendBtn.addEventListener('click', () => this.handleSend(this.input.value));
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void this.handleSend(this.input.value);
      }
    });
    this.input.addEventListener('input', () => this.autosize());

    const target = this.resolveTarget();
    target.appendChild(root);
  }

  private resolveTarget(): HTMLElement {
    if (!this.o.target) return document.body;
    if (typeof this.o.target === 'string') {
      return document.querySelector<HTMLElement>(this.o.target) ?? document.body;
    }
    return this.o.target;
  }

  private avatarMarkup(): string {
    if (this.o.avatarUrl) return `<img src="${this.attr(this.o.avatarUrl)}" alt="" />`;
    if (this.o.logoUrl) return `<img src="${this.attr(this.o.logoUrl)}" alt="" />`;
    return this.esc((this.o.assistantName[0] ?? 'A').toUpperCase());
  }

  // ── Passive page capture ────────────────────────────────
  // Captures the rendered DOM of every page the user visits and sends it to
  // FluxChat so the bot learns the entire site without any configuration.
  // Works on static sites AND SPAs (intercepts pushState / replaceState).

  private readonly capturedUrls = new Set<string>();

  private startPassiveCapture(): void {
    if (typeof window === 'undefined') return;

    // Intercept all fetch/XHR API calls made by the host app
    this.startApiInterception();

    // Capture the current page on load
    void this.captureCurrentPage();

    // SPA route changes via History API — save originals for destroy()
    this._origHistoryPush = history.pushState.bind(history);
    const origPush = this._origHistoryPush;
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      origPush(...args);
      setTimeout(() => void this.captureCurrentPage(), 400);
    };
    this._origHistoryReplace = history.replaceState.bind(history);
    const origReplace = this._origHistoryReplace;
    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      origReplace(...args);
      setTimeout(() => void this.captureCurrentPage(), 400);
    };

    // Hash-based routing and browser back/forward — save for destroy()
    this._popstateHandler = () => setTimeout(() => void this.captureCurrentPage(), 400);
    this._hashchangeHandler = () => void this.captureCurrentPage();
    window.addEventListener('popstate', this._popstateHandler);
    window.addEventListener('hashchange', this._hashchangeHandler);
  }

  private async captureCurrentPage(): Promise<void> {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const url = window.location.href;
    if (this.capturedUrls.has(url)) return; // once per URL per session
    this.capturedUrls.add(url);

    const title = document.title;
    const container = document.querySelector('main') ?? document.body;
    const text = (container as HTMLElement).innerText
      ?.replace(/\s+/g, ' ')
      .trim()
      .substring(0, 4000);

    if (!text || text.length < 80) return; // skip empty / not-yet-rendered pages

    // Capture visible links so the bot knows the direct URL of each item on this page
    // (sermons, events, products, recipes, articles — any content type).
    const links = Array.from(container.querySelectorAll('a[href]'))
      .map(a => {
        const el = a as HTMLAnchorElement;
        const label = el.innerText?.replace(/\s+/g, ' ').trim();
        const href = el.href;
        return label && href && !href.startsWith('javascript') ? `[${label}](${href})` : null;
      })
      .filter(Boolean)
      .slice(0, 60) // keep the first 60 links per page
      .join('\n');

    const content = links
      ? `${text}\n\nLiens sur cette page:\n${links}`.substring(0, 6000)
      : text;

    this.sendCapture({ type: 'page', url, title, content });
  }

  // ── Universal API interception ─────────────────────────
  // Intercepts window.fetch and XMLHttpRequest to auto-capture every
  // JSON API response the host app makes, regardless of the library used
  // (axios, React Query, SWR, tRPC, GraphQL, etc.).

  private readonly capturedApiHashes = new Set<string>();
  private static readonly HASH_CAP = 500;
  // URLs to never capture: auth, uploads, binaries, streaming, internal
  private readonly SKIP_URL_RE = /\/(login|logout|auth|token|refresh|signup|register|upload|avatar|thumbnail|image|blob|socket\.io|ws|sse|metrics|health|ping|favicon)/i;
  private readonly SKIP_EXT_RE = /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|pdf|zip|mp4|mp3|csv)(\?|$)/i;

  // Store originals so destroy() can fully restore them
  private _origFetch: typeof globalThis.fetch | undefined;
  private _origXhrOpen: typeof XMLHttpRequest.prototype.open | undefined;
  private _origXhrSend: typeof XMLHttpRequest.prototype.send | undefined;
  private _origHistoryPush: typeof history.pushState | undefined;
  private _origHistoryReplace: typeof history.replaceState | undefined;
  private _popstateHandler: (() => void) | undefined;
  private _hashchangeHandler: (() => void) | undefined;

  private startApiInterception(): void {
    this.interceptFetch();
    this.interceptXhr();
    this.captureLocalStorage();
  }

  private interceptFetch(): void {
    const origFetch = globalThis.fetch?.bind(globalThis);
    if (!origFetch) return;
    this._origFetch = origFetch;
    const self = this;
    globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const res = await origFetch(input, init);
      try {
        const rawUrl = typeof input === 'string' ? input
          : input instanceof URL ? input.href
          : (input as Request).url;
        const method = (init?.method ?? 'GET').toUpperCase();
        if (method === 'GET' && !self.SKIP_URL_RE.test(rawUrl) && !self.SKIP_EXT_RE.test(rawUrl)) {
          const ct = res.headers.get('content-type') ?? '';
          if (ct.includes('application/json') || ct.includes('text/json')) {
            res.clone().json().then((data: unknown) => self.captureApiData(rawUrl, data)).catch(() => undefined);
          }
        }
      } catch { /* never break the host app's fetch */ }
      return res;
    };
  }

  private interceptXhr(): void {
    if (typeof XMLHttpRequest === 'undefined') return;
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    this._origXhrOpen = origOpen;
    this._origXhrSend = origSend;
    const self = this;

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: [boolean?, string?, string?]) {
      (this as any)._fcUrl = String(url);
      (this as any)._fcMethod = method;
      return origOpen.apply(this, [method, url, ...rest] as Parameters<typeof origOpen>);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener('load', function () {
        try {
          const url: string = (this as any)._fcUrl ?? '';
          const method: string = ((this as any)._fcMethod ?? 'GET').toUpperCase();
          if (method !== 'GET') return;
          if (self.SKIP_URL_RE.test(url) || self.SKIP_EXT_RE.test(url)) return;
          const ct = this.getResponseHeader('content-type') ?? '';
          if (!ct.includes('application/json') && !ct.includes('text/json')) return;
          const data = JSON.parse(this.responseText) as unknown;
          self.captureApiData(url, data);
        } catch { /* ignore */ }
      });
      return origSend.apply(this, [body] as Parameters<typeof origSend>);
    };
  }

  private restoreInterceptions(): void {
    if (this._origFetch) {
      globalThis.fetch = this._origFetch;
      this._origFetch = undefined;
    }
    if (this._origXhrOpen) {
      XMLHttpRequest.prototype.open = this._origXhrOpen;
      this._origXhrOpen = undefined;
    }
    if (this._origXhrSend) {
      XMLHttpRequest.prototype.send = this._origXhrSend;
      this._origXhrSend = undefined;
    }
    if (this._origHistoryPush) {
      history.pushState = this._origHistoryPush;
      this._origHistoryPush = undefined;
    }
    if (this._origHistoryReplace) {
      history.replaceState = this._origHistoryReplace;
      this._origHistoryReplace = undefined;
    }
    if (this._popstateHandler) {
      window.removeEventListener('popstate', this._popstateHandler);
      this._popstateHandler = undefined;
    }
    if (this._hashchangeHandler) {
      window.removeEventListener('hashchange', this._hashchangeHandler);
      this._hashchangeHandler = undefined;
    }
    this.capturedApiHashes.clear();
    this.capturedUrls.clear();
  }

  private captureApiData(apiUrl: string, data: unknown): void {
    if (!data || typeof data !== 'object') return;
    const str = JSON.stringify(data);
    // Skip trivial responses and huge payloads (images/blobs encoded as base64, etc.)
    if (str.length < 100 || str.length > 80_000) return;

    const hash = this.captureHash(str);
    if (this.capturedApiHashes.has(hash)) return;
    // Cap the dedup set to avoid unbounded memory growth on long sessions
    if (this.capturedApiHashes.size >= FluxChatWidget.HASH_CAP) {
      this.capturedApiHashes.clear();
    }
    this.capturedApiHashes.add(hash);

    let absUrl = apiUrl;
    try { absUrl = new URL(apiUrl, globalThis.location?.origin ?? '').href; } catch { /* keep relative */ }

    this.sendCapture({
      type: 'api',
      url: absUrl,
      title: apiUrl,
      content: str,
      pageUrl: globalThis.location?.href,
      pageTitle: globalThis.document?.title,
    });
  }

  private captureLocalStorage(): void {
    try {
      const ls = globalThis.localStorage;
      if (!ls || ls.length === 0) return;
      const pairs: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (!key) continue;
        if (/token|auth|jwt|session|password|secret|api.?key|csrf|nonce|theme|lang|color|dark|locale|sidebar/i.test(key)) continue;
        const val = ls.getItem(key);
        if (!val || val.length < 20 || val.length > 8_000) continue;
        pairs.push(`${key}: ${val.substring(0, 500)}`);
      }
      if (!pairs.length) return;
      const content = pairs.join('\n');
      const hash = this.captureHash(content);
      if (this.capturedApiHashes.has(hash)) return;
      this.capturedApiHashes.add(hash);
      this.sendCapture({
        type: 'cache',
        url: `cache://localStorage@${globalThis.location?.host ?? 'unknown'}`,
        title: 'localStorage',
        content,
        pageUrl: globalThis.location?.href,
        pageTitle: globalThis.document?.title,
      });
    } catch { /* ignore — e.g. Safari ITP in private mode */ }
  }

  /** Fire-and-forget POST to the passive capture endpoint. */
  private sendCapture(payload: {
    type: 'page' | 'api' | 'cache';
    url: string;
    title?: string;
    content: string;
    pageUrl?: string;
    pageTitle?: string;
  }): void {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.o.apiKey,
    };
    // keepalive keeps the request alive even when the page is unloading (like sendBeacon but with custom headers)
    fetch(`${this.o.baseUrl}/public/bot/pages`, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
    }).catch(() => undefined);
  }

  /** FNV-1a-like hash for client-side deduplication (non-crypto, fast). */
  private captureHash(str: string): string {
    let h = 0x811c9dc5;
    const s = str.substring(0, 3000);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16);
  }

  // ── Platform API auto-enrichment ───────────────────────

  private async initPlatformApi(): Promise<void> {
    const base = this.o.platformApi!.baseUrl.replace(/\/+$/, '');
    const candidates = [
      '/openapi.json', '/swagger.json', '/api-docs.json',
      '/api/openapi.json', '/api/swagger.json', '/docs/swagger.json',
    ];
    for (const path of candidates) {
      try {
        const res = await fetch(`${base}${path}`, { headers: this.getPlatformAuthHeaders() });
        if (!res.ok) continue;
        const spec: unknown = await res.json();
        this.parsePlatformSpec(spec, base);
        if (this.platformEndpoints.length > 0) return;
      } catch { /* try next */ }
    }
  }

  private parsePlatformSpec(spec: unknown, base: string): void {
    const paths = (spec as Record<string, unknown>)?.paths as Record<string, Record<string, unknown>> | undefined;
    if (!paths) return;
    for (const [path, methods] of Object.entries(paths)) {
      if (path.includes('{')) continue; // skip endpoints needing a path param
      const op = methods['get'] as Record<string, unknown> | undefined;
      if (!op) continue;
      const tags = Array.isArray(op['tags']) ? (op['tags'] as string[]).join(' ') : '';
      this.platformEndpoints.push({
        path: `${base}${path}`,
        summary: String(op['summary'] ?? op['operationId'] ?? ''),
        keywords: `${op['summary'] ?? ''} ${op['description'] ?? ''} ${tags}`.toLowerCase(),
      });
    }
  }

  private getPlatformAuthHeaders(): Record<string, string> {
    if (typeof localStorage === 'undefined') return {};
    const keys = this.o.platformApi?.authTokenKeys ?? [
      'member_token', 'admin_token', 'token', 'auth_token', 'access_token',
    ];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) return { Authorization: `Bearer ${val}` };
    }
    return {};
  }

  private isFollowUp(text: string): boolean {
    const n = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return text.trim().length < 40 && (
      /^[?!]+$/.test(n.trim()) ||
      /lequel|lesquels|premier|deuxi|troisieme|detail|plus|encore|montre|donne|liste|combien|comment|pourquoi|expliqu|precis/.test(n)
    );
  }

  private async enrichWithPlatformData(question: string): Promise<string> {
    if (!this.platformEndpoints.length) return '';

    // Reuse last platform data for follow-up questions ("lesquels ?", "le premier", etc.)
    if (this.isFollowUp(question) && this.lastPlatformData) {
      return this.lastPlatformData;
    }

    const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (!words.length) return '';

    const scored = this.platformEndpoints
      .map(ep => ({ ep, score: words.filter(w => ep.keywords.includes(w)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    if (!scored.length) return '';

    const parts: string[] = [];
    await Promise.allSettled(scored.map(async ({ ep }) => {
      try {
        const res = await fetch(ep.path, { headers: this.getPlatformAuthHeaders() });
        if (!res.ok) return;
        const json: unknown = await res.json();
        const data = (json as Record<string, unknown>)?.data ?? json;
        const str = JSON.stringify(data).substring(0, 2500);
        parts.push(`${ep.summary || ep.path}:\n${str}`);
      } catch { /* silent */ }
    }));

    const result = parts.join('\n\n');
    if (result) this.lastPlatformData = result;
    return result;
  }

  // ── Auto-crawl ──────────────────────────────────────────
  private triggerAutoCrawl(): void {
    if (typeof globalThis.window === 'undefined') return;
    const url = globalThis.window.location.href;
    // Fire-and-forget — errors are swallowed intentionally
    fetch(`${this.o.baseUrl}/public/bot/knowledge/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.o.apiKey,
        'X-FluxChat-Env': this.isDevMode ? 'development' : 'production',
      },
      body: JSON.stringify({ url }),
    }).catch(() => undefined);
  }

  // ── Auto-context (DOM capture) ──────────────────────────
  private buildAutoContext(): string | undefined {
    if (!this.o.autoContext) return undefined;
    if (typeof document === 'undefined') return undefined;

    const parts: string[] = [];

    // 1. window.fluxchatContext — set by the host app at runtime (highest priority)
    const win = globalThis.window as (Window & { fluxchatContext?: unknown }) | undefined;
    if (win?.fluxchatContext !== undefined) {
      const raw = win.fluxchatContext;
      parts.push(typeof raw === 'string' ? raw : JSON.stringify(raw));
    }

    // 2. data-fluxchat attributes on any DOM element
    document.querySelectorAll<HTMLElement>('[data-fluxchat]').forEach(el => {
      const val = el.dataset['fluxchat'];
      if (val) parts.push(val);
    });

    // 3. Page title + URL
    parts.push(`Page: ${document.title} (${globalThis.window?.location.href ?? ''})`);

    // 4. Visible text from <main> or <body>, capped at 3 000 chars
    const container = document.querySelector('main') ?? document.body;
    const pageText = (container as HTMLElement).innerText
      ?.replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);
    if (pageText) parts.push(`Contenu visible:\n${pageText}`);

    return parts.length > 0 ? parts.join('\n\n') : undefined;
  }

  // ── Messaging ───────────────────────────────────────────
  private async handleSend(raw: string): Promise<void> {
    const text = raw.trim();
    if (!text || this.busy) return;
    if (!this.isOpen) this.open();

    this.input.value = '';
    this.autosize();
    this.addBubble('user', text);
    this.setBusy(true);
    const typing = this.addTyping();

    try {
      const reply = await this.askApi(text);
      typing.remove();
      this.addBubble('bot', reply);
    } catch (err) {
      typing.remove();
      this.addBubble('bot', "⚠️ Désolé, une erreur est survenue. Réessayez dans un instant.");
      // eslint-disable-next-line no-console
      console.error('[FluxChatWidget]', err);
    } finally {
      this.setBusy(false);
      this.input.focus();
    }
  }

  private async askApi(message: string): Promise<string> {
    const env = this.isDevMode ? 'development' : 'production';

    // Merge auto-captured DOM context with static context option.
    // window.fluxchatContext + DOM data is captured fresh on every send.
    // Static context (this.o.context) is appended after so auto data takes priority.
    const autoCtx = this.buildAutoContext();
    // Enrich with live platform API data when platformApi is configured
    const platformData = this.o.platformApi?.baseUrl
      ? await this.enrichWithPlatformData(message)
      : '';
    const mergedContext = [autoCtx, platformData ? `DONNÉES EN DIRECT:\n${platformData}` : '', this.o.context]
      .filter(Boolean)
      .join('\n\n')
      .substring(0, 12000) || undefined;

    const payload = {
      message,
      context: mergedContext,
      conversationId: this.conversationId || undefined,
      sessionId: this.sessionId,
    };

    if (this.isDevMode) {
      // eslint-disable-next-line no-console
      console.debug('[FluxChatWidget] →', payload);
    }

    const res = await fetch(`${this.o.baseUrl}/public/bot/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.o.apiKey,
        'X-FluxChat-Env': env,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => undefined);

    if (this.isDevMode) {
      // eslint-disable-next-line no-console
      console.debug('[FluxChatWidget] ←', json);
    }

    if (!res.ok) {
      throw new Error(json?.message || `HTTP ${res.status}`);
    }
    const data = json?.data ?? json;
    if (data?.conversationId) this.conversationId = data.conversationId;
    return data?.reply ?? '…';
  }

  // ── DOM helpers ─────────────────────────────────────────
  private addBubble(role: 'user' | 'bot', text: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = `fcw-row ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'fcw-bubble';
    bubble.innerHTML = renderMarkup(text);
    row.appendChild(bubble);
    this.messagesEl.appendChild(row);
    this.scrollToBottom();
    return row;
  }

  private addTyping(): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'fcw-row bot';
    row.innerHTML = `<div class="fcw-bubble fcw-typing"><span></span><span></span><span></span></div>`;
    this.messagesEl.appendChild(row);
    this.scrollToBottom();
    return row;
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.sendBtn.disabled = busy;
  }

  private autosize(): void {
    this.input.style.height = 'auto';
    this.input.style.height = `${Math.min(this.input.scrollHeight, 120)}px`;
  }

  private scrollToBottom(): void {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  private attr(s: string): string {
    return this.esc(s).replace(/"/g, '&quot;');
  }
}

/** Convenience factory: create and mount a widget in one call. */
export function init(options: WidgetOptions): WidgetInstance {
  return new FluxChatWidget(options);
}
