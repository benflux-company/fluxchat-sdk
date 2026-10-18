export class FluxChatError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(`FluxChat API Error ${statusCode}: ${message}`);
    this.name = 'FluxChatError';
  }
}

export class FluxChatNetworkError extends Error {
  constructor(message: string) {
    super(`FluxChat Network Error: ${message}`);
    this.name = 'FluxChatNetworkError';
  }
}

export interface FluxChatOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface AskOptions {
  context?: string;
  conversationId?: string;
  sessionId?: string;
}

export interface KnowledgeItem {
  id?: string;
  title?: string;
  content?: string;
  category?: string;
  keywords?: string[];
  isActive?: boolean;
  createdAt?: string;
}

export class KnowledgeClient {
  constructor(private client: FluxChatClient, private jwtToken: string) {}

  private async fetch<T>(method: string, path: string, body?: any): Promise<T> {
    return this.client['fetchEnveloped']<T>(method, `/bot/knowledge${path}`, body, this.jwtToken);
  }

  async list(): Promise<KnowledgeItem[]> {
    return this.fetch<KnowledgeItem[]>('GET', '');
  }

  async get(id: string): Promise<KnowledgeItem> {
    return this.fetch<KnowledgeItem>('GET', `/${id}`);
  }

  async create(title: string, content: string, category?: string, keywords?: string[]): Promise<KnowledgeItem> {
    return this.fetch<KnowledgeItem>('POST', '', { title, content, category, keywords });
  }

  async update(id: string, title?: string, content?: string, category?: string, keywords?: string[], isActive?: boolean): Promise<KnowledgeItem> {
    return this.fetch<KnowledgeItem>('PATCH', `/${id}`, { title, content, category, keywords, isActive });
  }

  async delete(id: string): Promise<void> {
    await this.fetch<void>('DELETE', `/${id}`);
  }
}

/** Qui a écrit une ligne du fil de ticket. */
export type TicketMessageRole = 'bot' | 'visitor' | 'agent';

export interface TicketMessage {
  id: string;
  content: string;
  role: TicketMessageRole;
  createdAt?: string;
}

/** Fil complet d'un ticket, tel que le visiteur le voit. */
export interface TicketThread {
  ticketId: string;
  subject: string;
  /** `open` | `in_progress` | `resolved` | `closed`. */
  status: string;
  /** Vrai une fois qu'un humain a réellement écrit, pas seulement été assigné. */
  agentConnected: boolean;
  agentName: string | null;
  /** `resolved` ou `closed` : le visiteur peut lire mais plus écrire. */
  closed: boolean;
  messages: TicketMessage[];
}

export interface EscalateOptions {
  name: string;
  email: string;
  message: string;
  /**
   * Le même sessionId que celui passé à `ask`. S'il est fourni, tout ce que le
   * bot a déjà dit est recopié dans le ticket, pour que l'agent prenne la
   * conversation en cours de route.
   */
  sessionId?: string;
}

/**
 * Transfert vers un humain et fil de support du visiteur.
 *
 * Le visiteur n'a ni compte ni session : l'e-mail avec lequel il a demandé un
 * humain est ce qui prouve que le ticket est le sien, en lecture comme en
 * écriture. La recherche est aussi limitée à l'organisation de la clé API.
 *
 * Le fil se lit en polling — il n'y a pas de socket sur la surface publique.
 * 5 s est la cadence du widget officiel et celle pour laquelle les quotas de
 * la route sont dimensionnés.
 */
export class SupportClient {
  constructor(private readonly client: FluxChatClient) {}

  /** Transfère un visiteur à un humain : crée un vrai ticket de support. */
  async escalate(options: EscalateOptions): Promise<{ ticketId: string; status: string }> {
    return this.client['fetchEnveloped']<{ ticketId: string; status: string }>('POST', '/public/bot/escalate', {
      name: options.name,
      email: options.email,
      message: options.message,
      sessionId: options.sessionId,
    });
  }

  /**
   * Lit le fil du ticket, chaque ligne étiquetée par rôle.
   *
   * 404 aussi bien quand le ticket n'existe pas que quand `email` n'est pas
   * celui avec lequel il a été ouvert : les deux cas sont volontairement
   * indiscernables, pour qu'un id deviné n'apprenne rien.
   */
  async thread(ticketId: string, email: string): Promise<TicketThread> {
    const path =
      `/public/bot/tickets/${encodeURIComponent(ticketId)}` +
      `?email=${encodeURIComponent(email)}`;
    return this.client['fetchEnveloped']<TicketThread>('GET', path);
  }

  /**
   * Poste la réponse du visiteur dans son propre ticket. Une réponse sur un
   * ticket `resolved` le rouvre ; un ticket `closed` refuse l'écriture (403).
   */
  async reply(ticketId: string, email: string, content: string): Promise<void> {
    await this.client['fetchEnveloped']<void>(
      'POST',
      `/public/bot/tickets/${encodeURIComponent(ticketId)}/messages`,
      { email, content },
    );
  }
}

export class FluxChatClient {
  public readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: FluxChatOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.fluxchat-corp.com/api/v2').replace(/\/$/, '');
  }

  protected async fetchEnveloped<T>(method: string, path: string, body?: any, jwtToken?: string): Promise<T> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      } else {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        let apiMsg = response.statusText;
        try {
          const errData = await response.json();
          apiMsg = errData.message || apiMsg;
        } catch (e) {}
        throw new FluxChatError(response.status, apiMsg);
      }

      if (response.status === 204) {
        return undefined as any;
      }

      const envelope = await response.json();
      if (envelope && envelope.success !== undefined) {
        return envelope.data;
      }
      return envelope;
    } catch (error) {
      if (error instanceof FluxChatError) throw error;
      throw new FluxChatNetworkError(error instanceof Error ? error.message : String(error));
    }
  }

  async ask(message: string, options?: AskOptions): Promise<{ reply: string; conversationId?: string }> {
    return this.fetchEnveloped('POST', '/public/bot/ask', {
      message,
      context: options?.context,
      conversationId: options?.conversationId,
      sessionId: options?.sessionId,
    });
  }

  async testKey(): Promise<{ organizationId: string; scopes: string[] }> {
    return this.fetchEnveloped('GET', '/public/bot/test');
  }

  async capturePage(url: string, title: string, content: string): Promise<void> {
    await this.fetchEnveloped('POST', '/public/bot/pages', { url, title, content });
  }

  knowledge(jwtToken: string): KnowledgeClient {
    return new KnowledgeClient(this, jwtToken);
  }

  /**
   * Transfert vers un humain et fil de support du visiteur.
   * Nécessite que le plan de l'organisation inclue `supportTickets`.
   */
  support(): SupportClient {
    return new SupportClient(this);
  }
}
