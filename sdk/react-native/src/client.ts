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

export class FluxChatClient {
  public readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: FluxChatOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://dev-api.fluxchat-corp.com/api/v2').replace(/\/$/, '');
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
}
