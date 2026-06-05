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
  /** Launcher position. Default: 'right'. */
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
