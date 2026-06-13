export interface WidgetOptions {
  /** API key of the organization (X-API-Key). Required. */
  apiKey: string;
  /** API base URL (defaults to the FluxChat production API). */
  baseUrl?: string;

  /** Brand / company name shown in the header (e.g. "Acme Bank"). */
  clientName?: string;
  /** Assistant display name (e.g. "Léa"). */
  assistantName?: string;
  /** Small subtitle under the assistant name (e.g. "En ligne"). */
  headerSubtitle?: string;
  /** Avatar image URL. If omitted, the assistant initial is shown. */
  avatarUrl?: string;
  /** Logo image URL shown in the header (optional). */
  logoUrl?: string;

  /** Primary brand color (any CSS color). Default: #4f46e5. */
  primaryColor?: string;
  /** Initial color theme. Default: 'light'. */
  theme?: 'light' | 'dark';
  /** Show a sun/moon button in the header so users can switch theme. Default: true. */
  themeToggle?: boolean;
  /**
   * Display mode. Default: 'floating'.
   * - `floating`: a launcher bubble in a corner that opens a chat panel.
   * - `inline`: the chat is rendered directly inside `target`, always open and
   *   filling its container — ideal for a dedicated support / help page.
   */
  mode?: 'floating' | 'inline';
  /** Launcher corner in floating mode. Default: 'right'. */
  position?: 'right' | 'left';
  /** Border radius in px for the panel. Default: 20. */
  radius?: number;
  /** CSS z-index for the widget. Default: 2147483000. */
  zIndex?: number;

  /** First assistant message shown when the panel opens. */
  greeting?: string;
  /** Input placeholder text. */
  placeholder?: string;
  /** Tooltip/label on the launcher button. */
  launcherLabel?: string;
  /**
   * Quick reply suggestions shown below the greeting when the panel first opens.
   * Each item is a short label the user can tap to send that message instantly.
   * @example ['Quels sont vos horaires ?', 'Comment vous contacter ?']
   */
  quickReplies?: string[];

  /**
   * Static real-time context sent with every message (priority over the KB).
   * Useful to inject the logged-in user, current page, cart, etc.
   */
  context?: string;

  /** Open the panel automatically on load. Default: false. */
  openOnLoad?: boolean;
  /** Show the "Powered by Benflux" footer. Default: true. */
  showBranding?: boolean;
  /** DOM element (or selector) to mount into. Default: document.body. */
  target?: string | HTMLElement;
  /**
   * Silently crawl the current page URL on first widget load and store it in
   * the organization's knowledge base (requires API key with bot:write scope).
   * Errors are swallowed — the widget works normally even if the crawl fails.
   * Default: false.
   */
  autoCrawl?: boolean;

  /**
   * Auto-detect the environment from the hostname and API key prefix.
   * When true (default), the widget shows a DEV badge on localhost / *.local / *.dev
   * and sends X-FluxChat-Env: development with every request.
   * Set to false to disable detection entirely.
   */
  autoEnvDetect?: boolean;

  /**
   * Automatically capture page context on every message send and inject it
   * into the v2 `context` field. Captures (in priority order):
   *   1. `window.fluxchatContext` — set by your app at runtime (any value/object)
   *   2. `data-fluxchat="..."` attributes on DOM elements
   *   3. Page title + current URL
   *   4. Visible text from <main> (or <body> if absent), truncated to 3 000 chars
   * Merged with the static `context` option if both are set.
   * Default: true. Set to false to rely solely on the static `context` option.
   */
  autoContext?: boolean;

  /**
   * Passively capture every page the user visits and send the rendered content
   * to FluxChat so the bot can answer questions about the entire site.
   *
   * Works on **any** site — static HTML, WordPress, React/Vue/Angular SPAs,
   * e-commerce stores, etc. No API, no configuration required. The widget
   * intercepts SPA route changes (pushState / replaceState / hashchange) and
   * captures the rendered DOM text ~300 ms after each navigation.
   *
   * Each unique URL is captured only once per browser session.
   * Captured pages are immediately available to the bot as context; no admin
   * "import" step is needed.
   *
   * Default: true. Set to false only if you handle KB population yourself.
   */
  autoCapture?: boolean;

  /**
   * Platform API integration — lets the widget automatically query the host
   * application's own API to enrich bot answers with live data.
   *
   * On init, the widget fetches the platform's OpenAPI spec (tried at common
   * paths: /openapi.json, /swagger.json, …). For each user message it scores
   * all GET endpoints against the question text and calls the top matches,
   * appending the JSON results to the context before sending to FluxChat.
   *
   * The user's auth token is read automatically from localStorage (common key
   * names are tried unless `authTokenKeys` overrides them).
   *
   * This is the "zero-config live data" feature — install the SDK and the bot
   * instantly answers questions about sermons, events, products, orders, etc.
   * by querying your own API, no manual action/intent setup required.
   *
   * @example
   * FluxChat.widget({
   *   apiKey: 'fc_live_xxx',
   *   platformApi: { baseUrl: 'https://api.my-app.com' },
   * });
   */
  platformApi?: {
    /** Base URL of the host platform's REST API (no trailing slash). */
    baseUrl: string;
    /**
     * localStorage keys to search for a Bearer token, tried in order.
     * Default: ['member_token', 'admin_token', 'token', 'auth_token', 'access_token']
     */
    authTokenKeys?: string[];
  };
}

export interface WidgetInstance {
  open(): void;
  close(): void;
  toggle(): void;
  /** Programmatically send a message as the user. */
  send(message: string): void;
  /** Switch the widget between light and dark. */
  setTheme(theme: 'light' | 'dark'): void;
  /** Toggle the widget theme. */
  toggleTheme(): void;
  /** Remove the widget from the DOM. */
  destroy(): void;
}
