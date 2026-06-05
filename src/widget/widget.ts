import { widgetCss } from './styles.js';
import type { WidgetInstance, WidgetOptions } from './types.js';

const STYLE_ID = 'fluxchat-widget-styles';
const BENFLUX_URL = 'https://benflux-corp.com';

const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" style="vertical-align:-1px"><path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
};

interface Resolved extends Required<Omit<WidgetOptions, 'avatarUrl' | 'logoUrl' | 'context' | 'target'>> {
  avatarUrl?: string;
  logoUrl?: string;
  context?: string;
  target?: string | HTMLElement;
}

function resolve(options: WidgetOptions): Resolved {
  if (!options.apiKey) throw new Error('[FluxChatWidget] `apiKey` is required.');
  return {
    apiKey: options.apiKey,
    baseUrl: (options.baseUrl ?? 'https://dev-api.fluxchat-corp.com/api/v1').replace(/\/+$/, ''),
    clientName: options.clientName ?? '',
    assistantName: options.assistantName ?? 'Assistant',
    headerSubtitle: options.headerSubtitle ?? 'En ligne',
    primaryColor: options.primaryColor ?? '#4f46e5',
    theme: options.theme ?? 'light',
    themeToggle: options.themeToggle ?? true,
    position: options.position ?? 'right',
    radius: options.radius ?? 20,
    zIndex: options.zIndex ?? 2147483000,
    greeting: options.greeting ?? 'Bonjour, comment puis-je vous aider ?',
    placeholder: options.placeholder ?? 'Écrivez votre message…',
    launcherLabel: options.launcherLabel ?? 'Discuter',
    openOnLoad: options.openOnLoad ?? false,
    showBranding: options.showBranding ?? true,
    avatarUrl: options.avatarUrl,
    logoUrl: options.logoUrl,
    context: options.context,
    target: options.target,
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
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

export class FluxChatWidget implements WidgetInstance {
  private readonly o: Resolved;
  private root!: HTMLDivElement;
  private messagesEl!: HTMLDivElement;
  private input!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private isOpen = false;
  private busy = false;
  private conversationId = '';
  private theme: 'light' | 'dark' = 'light';

  constructor(options: WidgetOptions) {
    this.o = resolve(options);
    this.injectStyles();
    this.build();
    if (this.o.openOnLoad) this.open();
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
    root.setAttribute('data-position', this.o.position);
    root.setAttribute('data-open', 'false');
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
      <button class="fcw-launcher" aria-label="${this.attr(this.o.launcherLabel)}" title="${this.attr(this.o.launcherLabel)}">${ICONS.chat}</button>
    `;

    this.root = root;
    this.messagesEl = root.querySelector('.fcw-messages')!;
    this.input = root.querySelector('.fcw-input')!;
    this.sendBtn = root.querySelector('.fcw-send')!;

    root.querySelector('.fcw-launcher')!.addEventListener('click', () => this.toggle());
    root.querySelector('.fcw-close')!.addEventListener('click', () => this.close());
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
    const res = await fetch(`${this.o.baseUrl}/public/bot/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': this.o.apiKey },
      body: JSON.stringify({
        message,
        context: this.o.context,
        conversationId: this.conversationId || undefined,
      }),
    });
    const json = await res.json().catch(() => undefined);
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
