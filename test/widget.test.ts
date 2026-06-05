// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FluxChatWidget, init } from '../src/widget/index.js';

describe('FluxChatWidget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('throws without an apiKey', () => {
    expect(() => init({} as any)).toThrow(/apiKey/);
  });

  it('mounts a launcher and injects styles once', () => {
    init({ apiKey: 'k', assistantName: 'Léa' });
    init({ apiKey: 'k', assistantName: 'Léa' });
    expect(document.querySelectorAll('.fcw-root').length).toBe(2);
    expect(document.querySelectorAll('.fcw-launcher').length).toBe(2);
    // Styles are shared and injected only once.
    expect(document.querySelectorAll('#fluxchat-widget-styles').length).toBe(1);
  });

  it('shows the greeting when opened', () => {
    const w = new FluxChatWidget({ apiKey: 'k', greeting: 'Salut !' });
    w.open();
    const bubble = document.querySelector('.fcw-row.bot .fcw-bubble');
    expect(bubble?.textContent).toContain('Salut !');
  });

  it('applies the brand name and primary color', () => {
    new FluxChatWidget({ apiKey: 'k', clientName: 'Acme Bank', primaryColor: 'rgb(10, 20, 30)' });
    const root = document.querySelector('.fcw-root') as HTMLElement;
    expect(root.style.getPropertyValue('--fcw-primary')).toBe('rgb(10, 20, 30)');
    expect(document.querySelector('.fcw-subtitle')?.textContent).toContain('Acme Bank');
  });

  it('renders a theme toggle and switches light/dark', () => {
    const w = new FluxChatWidget({ apiKey: 'k', theme: 'light' });
    const root = document.querySelector('.fcw-root') as HTMLElement;
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(document.querySelector('.fcw-theme')).not.toBeNull();

    (document.querySelector('.fcw-theme') as HTMLButtonElement).click();
    expect(root.getAttribute('data-theme')).toBe('dark');

    w.setTheme('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('can hide the theme toggle', () => {
    new FluxChatWidget({ apiKey: 'k', themeToggle: false });
    expect(document.querySelector('.fcw-theme')).toBeNull();
  });

  it('renders the Benflux footer by default and hides it when disabled', () => {
    new FluxChatWidget({ apiKey: 'k' });
    const link = document.querySelector('.fcw-footer a') as HTMLAnchorElement;
    expect(link?.getAttribute('href')).toBe('https://benflux-corp.com');

    document.body.innerHTML = '';
    new FluxChatWidget({ apiKey: 'k', showBranding: false });
    expect(document.querySelector('.fcw-footer')).toBeNull();
  });

  it('escapes HTML in messages (no XSS) and sends to the API', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: { reply: 'Bonjour **toi**', conversationId: '' } }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const w = new FluxChatWidget({ apiKey: 'secret', baseUrl: 'https://api.test/api/v1' });
    w.send('<img src=x onerror=alert(1)>');
    await vi.waitFor(() => {
      expect(document.querySelector('.fcw-row.user .fcw-bubble')?.innerHTML).toContain('&lt;img');
    });

    // Reply renders **bold** as <strong>, not raw text.
    await vi.waitFor(() => {
      const bot = document.querySelectorAll('.fcw-row.bot .fcw-bubble');
      const last = bot[bot.length - 1];
      expect(last?.querySelector('strong')?.textContent).toBe('toi');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/api/v1/public/bot/ask',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
