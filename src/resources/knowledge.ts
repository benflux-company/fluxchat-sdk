import type { HttpClient } from '../http.js';
import { FluxChatConfigError } from '../errors.js';
import type {
  CreateKnowledgeInput,
  KnowledgeArticle,
  UpdateKnowledgeInput,
} from '../types.js';

/**
 * Knowledge-base management.
 *
 * Writes (`create`, `update`, `remove`) work with an API key carrying the
 * `bot:write` scope. Reads (`list`, `get`) require a JWT (admin) token.
 */
export class KnowledgeResource {
  constructor(
    private readonly http: HttpClient,
    private readonly defaultOrgId?: string,
  ) {}

  private orgId(explicit?: string): string {
    const id = explicit ?? this.defaultOrgId;
    if (!id) {
      throw new FluxChatConfigError(
        'organizationId is required. Pass it to the method or set it in the client options.',
      );
    }
    return id;
  }

  /** List all knowledge articles for the organization. Requires a JWT token. */
  async list(organizationId?: string): Promise<KnowledgeArticle[]> {
    return this.http.request<KnowledgeArticle[]>({
      method: 'GET',
      path: `/bot/organizations/${this.orgId(organizationId)}/knowledge`,
    });
  }

  /** Get a single knowledge article. Requires a JWT token. */
  async get(id: string, organizationId?: string): Promise<KnowledgeArticle> {
    return this.http.request<KnowledgeArticle>({
      method: 'GET',
      path: `/bot/organizations/${this.orgId(organizationId)}/knowledge/${id}`,
    });
  }

  /** Create a knowledge article. Works with an API key scoped `bot:write`. */
  async create(
    input: CreateKnowledgeInput,
    organizationId?: string,
  ): Promise<KnowledgeArticle> {
    return this.http.request<KnowledgeArticle>({
      method: 'POST',
      path: `/bot/organizations/${this.orgId(organizationId)}/knowledge`,
      body: input,
    });
  }

  /** Update a knowledge article. Works with an API key scoped `bot:write`. */
  async update(
    id: string,
    input: UpdateKnowledgeInput,
    organizationId?: string,
  ): Promise<KnowledgeArticle> {
    return this.http.request<KnowledgeArticle>({
      method: 'PATCH',
      path: `/bot/organizations/${this.orgId(organizationId)}/knowledge/${id}`,
      body: input,
    });
  }

  /** Delete a knowledge article. Works with an API key scoped `bot:write`. */
  async remove(id: string, organizationId?: string): Promise<{ message: string }> {
    return this.http.request<{ message: string }>({
      method: 'DELETE',
      path: `/bot/organizations/${this.orgId(organizationId)}/knowledge/${id}`,
    });
  }

  /**
   * Crawl a URL (or sitemap.xml) and auto-populate the knowledge base.
   * Requires an API key with the `bot:write` scope. v2 only.
   */
  async crawl(
    input: { url: string; isSitemap?: boolean; maxPages?: number },
    organizationId?: string,
  ): Promise<{ created: number; skipped: number; errors: string[]; articles: { id: string; title: string }[] }> {
    return this.http.request({
      method: 'POST',
      path: `/bot/organizations/${this.orgId(organizationId)}/knowledge/crawl`,
      body: input,
    });
  }
}
