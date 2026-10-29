// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FluxChatWidget, init } from '../src/widget/index.js';

describe('FluxChatWidget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    // A successful handoff persists the visitor's ticket so the thread
    // survives a reload — without this, one test's ticket would carry into
    // the next widget built with the same API key.
    localStorage.clear();
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

  it('inline mode: no launcher, panel open, mounted in target', () => {
    const host = document.createElement('div');
    host.id = 'support';
    document.body.appendChild(host);
    new FluxChatWidget({ apiKey: 'k', mode: 'inline', target: '#support', greeting: 'Salut' });
    const root = host.querySelector('.fcw-root') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.getAttribute('data-mode')).toBe('inline');
    expect(root.getAttribute('data-open')).toBe('true');
    expect(host.querySelector('.fcw-launcher')).toBeNull();
    expect(host.querySelector('.fcw-row.bot .fcw-bubble')?.textContent).toContain('Salut');
  });

  it('floating mode keeps the launcher (default)', () => {
    new FluxChatWidget({ apiKey: 'k' });
    expect(document.querySelector('.fcw-launcher')).not.toBeNull();
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

  it('H1: does not intercept fetch by default (autoCapture defaults to false)', () => {
    const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', mockFetch);
    try {
      new FluxChatWidget({ apiKey: 'k' });
      expect(globalThis.fetch).toBe(mockFetch);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('H1: intercepts fetch only when autoCapture is explicitly enabled', () => {
    const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', mockFetch);
    try {
      new FluxChatWidget({ apiKey: 'k', autoCapture: true });
      expect(globalThis.fetch).not.toBe(mockFetch);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('H2: escapes quotes so a message URL cannot break out of the href attribute', () => {
    const w = new FluxChatWidget({
      apiKey: 'k',
      greeting: 'See https://evil.test/"onmouseover="alert(1)"x="',
    });
    w.open();
    const bubble = document.querySelector('.fcw-row.bot .fcw-bubble') as HTMLElement;
    const anchor = bubble.querySelector('a');
    expect(anchor).not.toBeNull();
    // The whole malicious payload must stay inert data on the single href
    // attribute — no separate onmouseover attribute was created by the
    // quote breaking out of it.
    expect(anchor?.attributes.length).toBe(1);
    expect(anchor?.attributes[0]?.name).toBe('href');
    expect(anchor?.getAttribute('onmouseover')).toBeNull();
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

  it('human handoff: button opens a form, submit posts to /public/bot/escalate', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: { ticketId: 't1', status: 'open' } }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    new FluxChatWidget({ apiKey: 'secret', baseUrl: 'https://api.test/api/v1', humanHandoffSuccessMessage: 'Merci !' });
    (document.querySelector('.fcw-handoff') as HTMLButtonElement).click();

    const card = document.querySelector('.fcw-handoff-card') as HTMLElement;
    expect(card).not.toBeNull();
    (card.querySelector('[data-field="name"]') as HTMLInputElement).value = 'Jordan';
    (card.querySelector('[data-field="email"]') as HTMLInputElement).value = 'jordan@example.com';
    (card.querySelector('[data-field="message"]') as HTMLTextAreaElement).value = "J'ai besoin d'aide";
    (card.querySelector('.fcw-handoff-submit') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test/api/v1/public/bot/escalate',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      name: 'Jordan',
      email: 'jordan@example.com',
      message: "J'ai besoin d'aide",
    });

    await vi.waitFor(() => {
      expect(document.querySelector('.fcw-handoff-card')).toBeNull();
      const bot = document.querySelectorAll('.fcw-row.bot .fcw-bubble');
      expect(bot[bot.length - 1]?.textContent).toContain('Merci !');
    });
  });

  it('human handoff: shows the backend error instead of a silent failure', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Support tickets are not included in your plan' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    new FluxChatWidget({ apiKey: 'secret', baseUrl: 'https://api.test/api/v1' });
    (document.querySelector('.fcw-handoff') as HTMLButtonElement).click();
    const card = document.querySelector('.fcw-handoff-card') as HTMLElement;
    (card.querySelector('[data-field="name"]') as HTMLInputElement).value = 'Jordan';
    (card.querySelector('[data-field="email"]') as HTMLInputElement).value = 'jordan@example.com';
    (card.querySelector('[data-field="message"]') as HTMLTextAreaElement).value = 'Aide';
    (card.querySelector('.fcw-handoff-submit') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      const error = card.querySelector('.fcw-handoff-error') as HTMLElement;
      expect(error.hidden).toBe(false);
      expect(error.textContent).toContain('Support tickets are not included in your plan');
    });
    // Form stays open on error — nothing was silently lost.
    expect(document.querySelector('.fcw-handoff-card')).not.toBeNull();
  });

  it('human handoff: can be disabled', () => {
    new FluxChatWidget({ apiKey: 'k', humanHandoff: false });
    expect(document.querySelector('.fcw-handoff')).toBeNull();
  });

  describe('platform API auto-enrichment — admin endpoints excluded', () => {
    const PLATFORM_BASE = 'https://platform.test';
    const openApiSpec = {
      paths: {
        '/api/events': {
          get: { summary: 'List events', tags: ['Public'] },
        },
        '/api/admin/users': {
          get: { summary: 'List all users admin', tags: ['Admin'] },
        },
      },
    };

    function stubFetch() {
      const fetchMock = vi.fn(async (url: string) => {
        if (url === `${PLATFORM_BASE}/openapi.json`) {
          return { ok: true, json: async () => openApiSpec };
        }
        if (url === `${PLATFORM_BASE}/api/events`) {
          return { ok: true, json: async () => ({ data: { events: ['concert'] } }) };
        }
        if (url === `${PLATFORM_BASE}/api/admin/users`) {
          return { ok: true, json: async () => ({ data: { usersadmin: ['secret-pii'] } }) };
        }
        if (url === 'https://api.test/api/v1/public/bot/ask') {
          return { ok: true, json: async () => ({ success: true, data: { reply: 'ok', conversationId: '' } }) };
        }
        return { ok: false, json: async () => ({}) };
      });
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }

    it('never auto-discovers a path tagged/named admin, so its data cannot reach the chat context', async () => {
      const fetchMock = stubFetch();
      const w = new FluxChatWidget({
        apiKey: 'secret',
        baseUrl: 'https://api.test/api/v1',
        platformApi: { baseUrl: PLATFORM_BASE },
      });

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(`${PLATFORM_BASE}/openapi.json`, expect.anything());
      });
      // Let the openapi.json response's own .json()/parse microtasks settle
      // before sending — the waitFor above only proves the request was made.
      await new Promise((resolve) => setTimeout(resolve, 10));

      // "admin" matches the discovered admin endpoint's own summary keywords —
      // if the exclusion failed, this exact question is what would trigger it.
      w.send('tell me about admin users');

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/v1/public/bot/ask', expect.anything());
      });

      expect(fetchMock).not.toHaveBeenCalledWith(`${PLATFORM_BASE}/api/admin/users`, expect.anything());
      const askCall = fetchMock.mock.calls.find(([url]) => url === 'https://api.test/api/v1/public/bot/ask');
      const body = JSON.parse((askCall?.[1] as RequestInit).body as string);
      expect(body.context ?? '').not.toContain('secret-pii');
    });

    it('allowedPaths further restricts enrichment to an explicit opt-in subset', async () => {
      const fetchMock = stubFetch();
      const w = new FluxChatWidget({
        apiKey: 'secret',
        baseUrl: 'https://api.test/api/v1',
        platformApi: { baseUrl: PLATFORM_BASE, allowedPaths: ['/api/events'] },
      });

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(`${PLATFORM_BASE}/openapi.json`, expect.anything());
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      w.send('what events are happening');

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(`${PLATFORM_BASE}/api/events`, expect.anything());
      });
      expect(fetchMock).not.toHaveBeenCalledWith(`${PLATFORM_BASE}/api/admin/users`, expect.anything());
    });
  });
});

// Once a visitor has been handed off to a human, the widget stops talking to
// the bot and becomes a view onto their support ticket: one continuous
// thread, polled, surviving a reload. The handoff used to end at
// "we'll e-mail you".
describe('FluxChatWidget — support thread after handoff', () => {
  const BASE = 'https://api.test/api/v1';

  const thread = (over: Partial<Record<string, unknown>> = {}) => ({
    ticketId: 't1',
    subject: 'Aide',
    status: 'open',
    agentConnected: false,
    agentName: null,
    closed: false,
    messages: [{ id: 'm1', content: 'Aide', role: 'visitor', createdAt: '2026-10-18T10:00:00Z' }],
    ...over,
  });

  // One mock for every route the thread uses, so a test only declares what
  // the server currently holds.
  function mockApi(state: { thread: ReturnType<typeof thread>; escalateOk?: boolean }) {
    return vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/public/bot/escalate')) {
        return state.escalateOk === false
          ? { ok: false, status: 500, json: async () => ({ message: 'boom' }) }
          : { ok: true, json: async () => ({ success: true, data: { ticketId: 't1', status: 'open' } }) };
      }
      if (url.includes('/public/bot/tickets/t1/messages')) {
        const body = JSON.parse(String(init?.body ?? '{}'));
        state.thread.messages = [
          ...state.thread.messages,
          { id: `m${state.thread.messages.length + 1}`, content: body.content, role: 'visitor', createdAt: '2026-10-18T10:05:00Z' },
        ];
        return { ok: true, json: async () => ({ success: true, data: { ok: true } }) };
      }
      if (url.includes('/public/bot/tickets/t1')) {
        return { ok: true, json: async () => ({ success: true, data: state.thread }) };
      }
      return { ok: true, json: async () => ({ success: true, data: { reply: 'bot reply' } }) };
    });
  }

  async function escalate(opts: { apiKey?: string } = {}) {
    const state = { thread: thread() };
    const fetchMock = mockApi(state);
    vi.stubGlobal('fetch', fetchMock);
    const widget = new FluxChatWidget({ apiKey: opts.apiKey ?? 'secret', baseUrl: BASE });
    (document.querySelector('.fcw-handoff') as HTMLButtonElement).click();
    const card = document.querySelector('.fcw-handoff-card') as HTMLElement;
    (card.querySelector('[data-field="name"]') as HTMLInputElement).value = 'Jordan';
    (card.querySelector('[data-field="email"]') as HTMLInputElement).value = 'jordan@example.com';
    (card.querySelector('[data-field="message"]') as HTMLTextAreaElement).value = 'Aide';
    (card.querySelector('.fcw-handoff-submit') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(document.querySelector('.fcw-handoff-card')).toBeNull());
    return { widget, state, fetchMock };
  }

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();
  });

  it('shows the waiting strip and remembers the ticket', async () => {
    await escalate();

    const banner = document.querySelector('.fcw-banner') as HTMLElement;
    await vi.waitFor(() => expect(banner.dataset.tone).toBe('waiting'));
    expect(banner.hidden).toBe(false);
    expect(banner.textContent).toContain('transmise');
    expect(JSON.parse(localStorage.getItem('fcw_ticket_secret') ?? '{}')).toMatchObject({
      id: 't1',
      email: 'jordan@example.com',
    });
  });

  it('sends the next message into the ticket, not to the bot', async () => {
    const { widget, fetchMock } = await escalate();
    fetchMock.mockClear();

    widget.send('une précision');

    await vi.waitFor(() => {
      const call = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('/tickets/t1/messages'));
      expect(call).toBeDefined();
      expect(JSON.parse(String((call![1] as RequestInit).body))).toMatchObject({
        email: 'jordan@example.com',
        content: 'une précision',
      });
    });
    // The bot route must not be touched once a human owns the conversation.
    expect(fetchMock.mock.calls.some((c) => String(c[0]).endsWith('/public/bot/ask'))).toBe(false);
  });

  it('renders an agent reply once, with the agent name, and flips the strip', async () => {
    const { state } = await escalate();

    state.thread = thread({
      agentConnected: true,
      agentName: 'Awa',
      status: 'in_progress',
      messages: [
        ...thread().messages,
        { id: 'm2', content: 'Bonjour, je regarde ça.', role: 'agent', createdAt: '2026-10-18T10:02:00Z' },
      ],
    });

    await vi.waitFor(
      () => {
        expect(document.querySelectorAll('.fcw-row.agent').length).toBe(1);
      },
      { timeout: 8000 },
    );
    expect(document.querySelector('.fcw-agent-name')?.textContent).toContain('Awa');
    expect(document.querySelector('.fcw-agent-bubble')?.textContent).toContain('je regarde');
    expect((document.querySelector('.fcw-banner') as HTMLElement).dataset.tone).toBe('agent');

    // Still exactly one after further polls — ids are deduped, not re-rendered.
    await new Promise((r) => setTimeout(r, 6000));
    expect(document.querySelectorAll('.fcw-row.agent').length).toBe(1);
  }, 20000);

  it('locks the composer when the ticket is closed and offers a fresh start', async () => {
    const { state } = await escalate();
    state.thread = thread({ status: 'closed', closed: true });

    const banner = document.querySelector('.fcw-banner') as HTMLElement;
    await vi.waitFor(() => expect(banner.dataset.tone).toBe('closed'), { timeout: 8000 });
    expect((document.querySelector('.fcw-input') as HTMLTextAreaElement).disabled).toBe(true);

    (banner.querySelector('.fcw-banner-action') as HTMLButtonElement).click();
    expect(banner.hidden).toBe(true);
    expect((document.querySelector('.fcw-input') as HTMLTextAreaElement).disabled).toBe(false);
    expect(localStorage.getItem('fcw_ticket_secret')).toBeNull();
  }, 20000);

  it('restores the whole thread on reload instead of the greeting', async () => {
    localStorage.setItem('fcw_ticket_secret', JSON.stringify({ id: 't1', email: 'jordan@example.com' }));
    const state = {
      thread: thread({
        agentConnected: true,
        agentName: 'Awa',
        messages: [
          { id: 'm1', content: 'Bonjour !', role: 'bot', createdAt: '2026-10-18T09:00:00Z' },
          { id: 'm2', content: 'Aide', role: 'visitor', createdAt: '2026-10-18T10:00:00Z' },
          { id: 'm3', content: 'Je regarde.', role: 'agent', createdAt: '2026-10-18T10:02:00Z' },
        ],
      }),
    };
    vi.stubGlobal('fetch', mockApi(state));

    const w = new FluxChatWidget({ apiKey: 'secret', baseUrl: BASE, greeting: 'Salut !' });
    w.open();

    await vi.waitFor(() => expect(document.querySelectorAll('.fcw-row').length).toBe(3));
    const texts = [...document.querySelectorAll('.fcw-bubble')].map((b) => b.textContent);
    expect(texts.join(' ')).not.toContain('Salut !');
    expect(texts.join(' ')).toContain('Je regarde.');
  });

  it('drops a stale stored ticket instead of trapping the visitor', async () => {
    localStorage.setItem('fcw_ticket_secret', JSON.stringify({ id: 't1', email: 'jordan@example.com' }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ message: 'Ticket not found' }) })),
    );

    const w = new FluxChatWidget({ apiKey: 'secret', baseUrl: BASE, greeting: 'Salut !' });
    w.open();

    await vi.waitFor(() => {
      expect(localStorage.getItem('fcw_ticket_secret')).toBeNull();
      expect(document.querySelector('.fcw-bubble')?.textContent).toContain('Salut !');
    });
  });
});
