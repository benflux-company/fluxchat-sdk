import { Command } from 'commander';
import pc from 'picocolors';
import { FluxChatApiError, FluxChatError } from '../errors.js';
import {
  createClient,
  parseBool,
  parseList,
  type GlobalOptions,
} from './client-factory.js';

const VERSION = '0.1.0';

function out(data: unknown, json: boolean | undefined): void {
  if (json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else if (typeof data === 'string') {
    process.stdout.write(data + '\n');
  } else {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  }
}

function fail(err: unknown): never {
  if (err instanceof FluxChatApiError) {
    process.stderr.write(
      pc.red(`✖ API error ${err.status}: ${err.message}`) + '\n',
    );
  } else if (err instanceof FluxChatError) {
    process.stderr.write(pc.red(`✖ ${err.message}`) + '\n');
  } else {
    process.stderr.write(pc.red(`✖ ${(err as Error).message}`) + '\n');
  }
  process.exit(1);
}

/** Build the full CLI program. Pure construction — no parsing side effects. */
export function buildProgram(): Command {
  const program = new Command();

  program
    .name('fluxchat')
    .description('FluxChat SDK CLI — talk to your assistant and manage its knowledge base')
    .version(VERSION, '-v, --version')
    .option('--api-key <key>', 'API key (or env FLUXCHAT_API_KEY)')
    .option('--token <jwt>', 'JWT token (or env FLUXCHAT_TOKEN)')
    .option('--base-url <url>', 'API base URL (or env FLUXCHAT_BASE_URL)')
    .option('--org <id>', 'Organization id (or env FLUXCHAT_ORG_ID)')
    .option('--json', 'Output raw JSON');

  const globals = (cmd: Command): GlobalOptions & { json?: boolean } =>
    cmd.optsWithGlobals();

  // ── ask ───────────────────────────────────────────────
  program
    .command('ask')
    .description('Send a message to the assistant')
    .argument('<message>', 'The message to send')
    .option('-c, --context <context>', 'Real-time context (priority over the knowledge base)')
    .option('--conversation <id>', 'Continue an existing conversation')
    .action(async (message: string, opts: { context?: string; conversation?: string }, cmd: Command) => {
      const g = globals(cmd);
      try {
        const client = createClient(g);
        const res = await client.ask({
          message,
          context: opts.context,
          conversationId: opts.conversation,
        });
        out(g.json ? res : res.reply, g.json);
      } catch (err) {
        fail(err);
      }
    });

  // ── test ──────────────────────────────────────────────
  program
    .command('test')
    .description('Verify the API key and show its scopes')
    .action(async (_opts: unknown, cmd: Command) => {
      const g = globals(cmd);
      try {
        const client = createClient(g);
        const res = await client.testKey();
        out(
          g.json
            ? res
            : pc.green(`✓ Valid key`) +
                ` — org ${res.organizationId}, scopes: ${res.scopes.join(', ') || '(none)'}`,
          g.json,
        );
      } catch (err) {
        fail(err);
      }
    });

  // ── kb ────────────────────────────────────────────────
  const kb = program.command('kb').description('Manage the knowledge base');

  kb.command('list')
    .description('List knowledge articles (requires --token)')
    .action(async (_opts: unknown, cmd: Command) => {
      const g = globals(cmd);
      try {
        const res = await createClient(g).knowledge.list(g.org);
        out(g.json ? res : res.map((k) => `${k.id}  [${k.category}]  ${k.title}`).join('\n'), g.json);
      } catch (err) {
        fail(err);
      }
    });

  kb.command('get')
    .description('Get a knowledge article (requires --token)')
    .argument('<id>', 'Article id')
    .action(async (id: string, _opts: unknown, cmd: Command) => {
      const g = globals(cmd);
      try {
        out(await createClient(g).knowledge.get(id, g.org), true);
      } catch (err) {
        fail(err);
      }
    });

  kb.command('create')
    .description('Create a knowledge article (API key with bot:write)')
    .requiredOption('--title <title>', 'Article title')
    .requiredOption('--content <content>', 'Article content')
    .option('--category <category>', 'general|product|pricing|support|contact|policy|custom')
    .option('--keywords <list>', 'Comma-separated keywords')
    .option('--priority <n>', 'Priority (integer)')
    .action(async (opts: { title: string; content: string; category?: string; keywords?: string; priority?: string }, cmd: Command) => {
      const g = globals(cmd);
      try {
        const res = await createClient(g).knowledge.create(
          {
            title: opts.title,
            content: opts.content,
            category: opts.category as never,
            keywords: parseList(opts.keywords),
            priority: opts.priority !== undefined ? Number(opts.priority) : undefined,
          },
          g.org,
        );
        out(g.json ? res : pc.green(`✓ Created article ${res.id}`), g.json);
      } catch (err) {
        fail(err);
      }
    });

  kb.command('update')
    .description('Update a knowledge article (API key with bot:write)')
    .argument('<id>', 'Article id')
    .option('--title <title>', 'New title')
    .option('--content <content>', 'New content')
    .option('--category <category>', 'New category')
    .option('--keywords <list>', 'Comma-separated keywords')
    .option('--priority <n>', 'Priority (integer)')
    .option('--active <bool>', 'true/false')
    .action(async (id: string, opts: { title?: string; content?: string; category?: string; keywords?: string; priority?: string; active?: string }, cmd: Command) => {
      const g = globals(cmd);
      try {
        const res = await createClient(g).knowledge.update(
          id,
          {
            title: opts.title,
            content: opts.content,
            category: opts.category as never,
            keywords: parseList(opts.keywords),
            priority: opts.priority !== undefined ? Number(opts.priority) : undefined,
            isActive: parseBool(opts.active),
          },
          g.org,
        );
        out(g.json ? res : pc.green(`✓ Updated article ${res.id}`), g.json);
      } catch (err) {
        fail(err);
      }
    });

  kb.command('delete')
    .description('Delete a knowledge article (API key with bot:write)')
    .argument('<id>', 'Article id')
    .action(async (id: string, _opts: unknown, cmd: Command) => {
      const g = globals(cmd);
      try {
        await createClient(g).knowledge.remove(id, g.org);
        out(g.json ? { deleted: id } : pc.green(`✓ Deleted article ${id}`), g.json);
      } catch (err) {
        fail(err);
      }
    });

  kb.command('crawl')
    .description('Crawl a URL (or sitemap) and auto-populate the KB (API key with bot:write)')
    .requiredOption('--url <url>', 'Page URL or sitemap.xml URL to crawl')
    .option('--sitemap', 'Treat the URL as a sitemap.xml', false)
    .option('--max-pages <n>', 'Max pages when using a sitemap (default: 10)', '10')
    .action(async (opts: { url: string; sitemap: boolean; maxPages: string }, cmd: Command) => {
      const g = globals(cmd);
      try {
        const res = await createClient(g).knowledge.crawl(
          { url: opts.url, isSitemap: opts.sitemap, maxPages: Number(opts.maxPages) },
          g.org,
        );
        if (g.json) {
          out(res, true);
        } else {
          process.stdout.write(
            pc.green(`✓ Crawl done`) +
            ` — ${res.created} created, ${res.skipped} skipped` +
            (res.errors.length ? pc.yellow(` (${res.errors.length} errors)`) : '') +
            '\n',
          );
          if (res.articles.length) {
            res.articles.forEach(a => process.stdout.write(`  + ${a.title} (${a.id})\n`));
          }
          if (res.errors.length) {
            res.errors.forEach(e => process.stderr.write(pc.yellow(`  ⚠ ${e}`) + '\n'));
          }
        }
      } catch (err) {
        fail(err);
      }
    });

  // ── config ────────────────────────────────────────────
  const config = program.command('config').description('Manage the bot persona');

  config
    .command('get')
    .description('Show the persona config')
    .action(async (_opts: unknown, cmd: Command) => {
      const g = globals(cmd);
      try {
        out(await createClient(g).config.get(g.org), true);
      } catch (err) {
        fail(err);
      }
    });

  config
    .command('set')
    .description('Update the persona config (requires --token admin)')
    .option('--name <name>', 'Assistant name')
    .option('--tone <tone>', 'Tone of voice')
    .option('--style <rules>', 'Style rules')
    .option('--instructions <text>', 'Custom instructions')
    .option('--capture <bool>', 'Capture training data (true/false)')
    .action(async (opts: { name?: string; tone?: string; style?: string; instructions?: string; capture?: string }, cmd: Command) => {
      const g = globals(cmd);
      try {
        const res = await createClient(g).config.update(
          {
            assistantName: opts.name,
            tone: opts.tone,
            styleRules: opts.style,
            customInstructions: opts.instructions,
            captureTrainingData: parseBool(opts.capture),
          },
          g.org,
        );
        out(g.json ? res : pc.green('✓ Persona updated'), g.json);
      } catch (err) {
        fail(err);
      }
    });

  return program;
}
