/// FluxChat Dart SDK — pure-Dart quickstart (no Flutter required).
///
/// Run with: dart examples/dart_quickstart.dart
///
/// Set your API key before running:
///   export FLUXCHAT_API_KEY="fc_live_your_key"
///   export FLUXCHAT_ORG_ID="your-org-uuid"
library;

import 'dart:io';

import 'package:fluxchat_sdk/fluxchat_sdk.dart';

Future<void> main() async {
  final apiKey = Platform.environment['FLUXCHAT_API_KEY'] ?? '';
  final orgId = Platform.environment['FLUXCHAT_ORG_ID'];

  if (apiKey.isEmpty) {
    stderr.writeln('Set FLUXCHAT_API_KEY before running this example.');
    exit(1);
  }

  // ── 1. Create a client ────────────────────────────────────────────────────
  final fluxchat = FluxChat(
    apiKey: apiKey,
    organizationId: orgId,
  );

  // ── 2. Verify the key ─────────────────────────────────────────────────────
  print('→ Verifying API key…');
  final key = await fluxchat.testKey();
  print('   org: ${key.organizationId}  scopes: ${key.scopes.join(', ')}\n');

  // ── 3. One-shot ask (no conversation stored) ──────────────────────────────
  print('→ Sending a one-shot message…');
  final res = await fluxchat.ask(const AskOptions(
    message: 'What are your opening hours?',
    // context is injected per-request and treated as priority truth by the bot
    context: 'Customer is on the contact page.',
  ));
  print('   Bot: ${res.reply}\n');

  // ── 4. Stateful conversation (conversationId links turns server-side) ─────
  print('→ Starting a stateful conversation…');
  final turn1 = await fluxchat.ask(const AskOptions(
    message: 'Hello! My order has not arrived.',
  ));
  print('   Bot: ${turn1.reply}');

  final turn2 = await fluxchat.ask(AskOptions(
    message: 'My order number is #4521.',
    conversationId: turn1.conversationId,
  ));
  print('   Bot: ${turn2.reply}\n');

  // ── 5. Knowledge-base write (requires bot:write scope) ───────────────────
  if (orgId != null) {
    print('→ Creating a knowledge article…');
    final article = await fluxchat.knowledge.create(
      const CreateKnowledgeInput(
        title: 'Return Policy',
        content: 'Returns are free within 30 days for Premium members.',
        category: KnowledgeCategory.policy,
        keywords: ['return', 'refund', 'policy'],
      ),
    );
    print('   Created: ${article.id} — "${article.title}"\n');

    // Update it.
    await fluxchat.knowledge.update(
      article.id,
      const UpdateKnowledgeInput(
        content: 'Returns are free within 45 days for Premium members.',
      ),
    );
    print('   Updated content.\n');

    // Clean up.
    await fluxchat.knowledge.remove(article.id);
    print('   Removed.\n');
  }

  print('Done.');
}
