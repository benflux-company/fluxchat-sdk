/// FluxChat Flutter widget — complete example app.
///
/// Demonstrates all three integration patterns:
///   A) FluxChatOverlay  — floating FAB over the whole app (default)
///   B) FluxChatFab      — FAB placed manually inside a Stack
///   C) FluxChatPage     — full-screen chat navigated to as a route
///
/// Replace [_apiKey] with your key from the FluxChat dashboard.
library;

import 'package:flutter/material.dart';
import 'package:fluxchat_sdk/widget.dart';

// ─── Replace with your real key ───────────────────────────────────────────────
const _apiKey = 'fc_live_your_key_here';

void main() {
  runApp(const FluxChatExampleApp());
}

// ─── Root app ─────────────────────────────────────────────────────────────────

class FluxChatExampleApp extends StatelessWidget {
  const FluxChatExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FluxChat Widget Demo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          // Seed with the FluxChat indigo — override with your brand colour.
          seedColor: const Color(0xFF4F46E5),
          brightness: Brightness.light,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          brightness: Brightness.dark,
        ),
      ),
      themeMode: ThemeMode.system,

      // ── Option A: FluxChatOverlay wraps the entire app ──────────────────
      // The FAB and panel will float above every route automatically.
      builder: FluxChatOverlay.builder(
        options: FluxChatOptions(
          apiKey: _apiKey,
          assistantName: 'Léa',
          clientName: 'Acme Bank',
          greeting: 'Hello! How can I help you today?',
          placeholder: 'Write a message…',
          position: FabPosition.bottomRight,
          showBranding: true,
          themeMode: FluxChatThemeMode.system,
          // Inject real-time context before every message.
          contextBuilder: () {
            // In a real app, read from your auth state / route:
            // return 'User: ${authState.user.name}, plan: ${authState.plan}';
            return 'Page: Home screen, demo mode.';
          },
          onReply: (reply) => debugPrint('[FluxChat] Bot replied: $reply'),
          onError: (err) => debugPrint('[FluxChat] Error: $err'),
        ),
      ),

      home: const _HomeScreen(),
      routes: {
        '/fab-manual': (_) => const _ManualFabScreen(),
        '/chat-page': (_) => _ChatPageScreen(),
        '/programmatic': (_) => const _ProgrammaticScreen(),
      },
    );
  }
}

// ─── Home screen ──────────────────────────────────────────────────────────────

class _HomeScreen extends StatelessWidget {
  const _HomeScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FluxChat Widget Demo')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _SectionTitle('Integration patterns'),
          const SizedBox(height: 16),
          _DemoCard(
            title: 'A — FluxChatOverlay (active)',
            subtitle:
                'The FAB in the bottom-right corner is already active. '
                'Tap it to open the chat panel.',
            icon: Icons.layers_rounded,
            color: Colors.indigo,
          ),
          const SizedBox(height: 12),
          _DemoCard(
            title: 'B — FluxChatFab in a Stack',
            subtitle: 'Navigate to a screen where the FAB is placed manually.',
            icon: Icons.flip_to_front_rounded,
            color: Colors.teal,
            onTap: () => Navigator.pushNamed(context, '/fab-manual'),
          ),
          const SizedBox(height: 12),
          _DemoCard(
            title: 'C — FluxChatPage (full screen)',
            subtitle: 'Open the full-screen ChatGPT-style experience.',
            icon: Icons.fullscreen_rounded,
            color: Colors.deepPurple,
            onTap: () => Navigator.pushNamed(context, '/chat-page'),
          ),
          const SizedBox(height: 12),
          _DemoCard(
            title: 'Programmatic control',
            subtitle: 'Open / close / send from code using a controller.',
            icon: Icons.code_rounded,
            color: Colors.orange,
            onTap: () => Navigator.pushNamed(context, '/programmatic'),
          ),
          const SizedBox(height: 32),
          _SectionTitle('Customisation'),
          const SizedBox(height: 16),
          const _ThemeShowcase(),
        ],
      ),
    );
  }
}

// ─── Option B: manual FAB inside a Stack ──────────────────────────────────────

class _ManualFabScreen extends StatelessWidget {
  const _ManualFabScreen();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(title: const Text('Manual FAB placement')),
          body: const Center(
            child: Text(
              'The FAB below is a FluxChatFab placed\n'
              'directly inside a Stack.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
        // ── Option B ────────────────────────────────────────────────────────
        FluxChatFab(
          options: FluxChatOptions(
            apiKey: _apiKey,
            assistantName: 'Support',
            position: FabPosition.bottomLeft,
            primaryColor: Colors.teal,
            greeting: 'Hi! Need help?',
            placeholder: 'Ask anything…',
          ),
        ),
      ],
    );
  }
}

// ─── Option C: full-screen page ────────────────────────────────────────────────

class _ChatPageScreen extends StatelessWidget {
  _ChatPageScreen();

  // The dev can keep a reference to the controller for programmatic access.
  final _ctrl = FluxChatController(
    options: FluxChatOptions(
      apiKey: _apiKey,
      assistantName: 'Léa',
      clientName: 'Acme Bank',
      greeting: 'Hello! What can I help you with today?',
      placeholder: 'Write a message…',
      contextBuilder: () => 'Page: full-screen chat demo.',
    ),
  );

  @override
  Widget build(BuildContext context) {
    return FluxChatPage(options: _ctrl.options, controller: _ctrl);
  }
}

// ─── Programmatic control demo ────────────────────────────────────────────────

class _ProgrammaticScreen extends StatefulWidget {
  const _ProgrammaticScreen();

  @override
  State<_ProgrammaticScreen> createState() => _ProgrammaticScreenState();
}

class _ProgrammaticScreenState extends State<_ProgrammaticScreen> {
  late final FluxChatController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = FluxChatController(
      options: FluxChatOptions(
        apiKey: _apiKey,
        assistantName: 'Léa',
        greeting: 'I was opened programmatically!',
        placeholder: 'Type something…',
      ),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(title: const Text('Programmatic control')),
          body: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Control the chat session from outside the widget:',
                  style: TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: _ctrl.open,
                  icon: const Icon(Icons.open_in_new_rounded),
                  label: const Text('Open chat'),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: _ctrl.close,
                  icon: const Icon(Icons.close_rounded),
                  label: const Text('Close chat'),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => _ctrl.send('Hello from a button!'),
                  icon: const Icon(Icons.send_rounded),
                  label: const Text('Send a pre-built message'),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _ctrl.clearHistory,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Clear history'),
                ),
              ],
            ),
          ),
        ),
        // The FAB is driven entirely by _ctrl.
        FluxChatFab(options: _ctrl.options, controller: _ctrl),
      ],
    );
  }
}

// ─── Shared widgets ───────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context)
          .textTheme
          .titleMedium
          ?.copyWith(fontWeight: FontWeight.w600),
    );
  }
}

class _DemoCard extends StatelessWidget {
  const _DemoCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: Theme.of(context)
                            .textTheme
                            .titleSmall
                            ?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(subtitle,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: scheme.onSurfaceVariant,
                            )),
                  ],
                ),
              ),
              if (onTap != null)
                Icon(Icons.chevron_right_rounded,
                    color: scheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}

/// Shows a mini preview of each theme mode option.
class _ThemeShowcase extends StatelessWidget {
  const _ThemeShowcase();

  @override
  Widget build(BuildContext context) {
    final seeds = [
      ('Indigo (default)', const Color(0xFF4F46E5)),
      ('Teal', Colors.teal),
      ('Rose', Colors.pink),
      ('Amber', Colors.amber),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: seeds.map((pair) {
        final (label, seed) = pair;
        final mini = ColorScheme.fromSeed(seedColor: seed);

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Container(
                width: 28, height: 28,
                decoration: BoxDecoration(
                  color: mini.primary,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Text(label, style: Theme.of(context).textTheme.bodyMedium),
              const Spacer(),
              // Mini color strip.
              ...([mini.primary, mini.secondary, mini.tertiary].map((c) =>
                  Container(
                    width: 18, height: 18, margin: const EdgeInsets.only(left: 4),
                    decoration:
                        BoxDecoration(color: c, shape: BoxShape.circle),
                  ))),
            ],
          ),
        );
      }).toList(),
    );
  }
}

