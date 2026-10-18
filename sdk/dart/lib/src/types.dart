/// Data models that mirror the FluxChat public API payloads.
///
/// All models are immutable and carry named [fromJson] factories plus [toJson]
/// methods so they can be serialised/deserialised without code generation.
library;

// ─── Client options ───────────────────────────────────────────────────────────

/// Configuration passed to [FluxChat] at construction time.
class FluxChatClientOptions {
  const FluxChatClientOptions({
    this.apiKey,
    this.token,
    this.baseUrl,
    this.organizationId,
    this.timeout = const Duration(seconds: 30),
    this.headers,
  });

  /// API key sent as `X-API-Key`. Required for public bot endpoints and
  /// knowledge writes (`bot:write` scope).
  final String? apiKey;

  /// JWT bearer token. Alternative to [apiKey] for admin operations
  /// (knowledge reads, persona config).
  final String? token;

  /// Override the API base URL including the version prefix.
  /// Defaults to `https://api.fluxchat-corp.com/api/v2`.
  final String? baseUrl;

  /// Default organization id used by knowledge / config helpers.
  final String? organizationId;

  /// Per-request timeout. Defaults to 30 seconds.
  final Duration timeout;

  /// Extra HTTP headers forwarded on every request.
  final Map<String, String>? headers;
}

// ─── Bot / ask ────────────────────────────────────────────────────────────────

/// Options for a single [FluxChat.ask] call.
class AskOptions {
  const AskOptions({
    required this.message,
    this.context,
    this.conversationId,
    this.sessionId,
  });

  /// The user's message text.
  final String message;

  /// Real-time context for this request only (page content, cart, user data…).
  /// Treated by the bot as a priority source of truth above the knowledge base.
  final String? context;

  /// Pass an existing id to continue a conversation; omit for a stateless reply.
  final String? conversationId;

  /// Opaque session id for widget-level persistence across page reloads.
  final String? sessionId;

  Map<String, dynamic> toJson() => {
        'message': message,
        if (context != null) 'context': context,
        if (conversationId != null) 'conversationId': conversationId,
        if (sessionId != null) 'sessionId': sessionId,
      };
}

/// Response from a [FluxChat.ask] call.
class AskResponse {
  const AskResponse({
    required this.reply,
    this.intent,
    required this.confidence,
    required this.conversationId,
    this.actionResult,
    required this.context,
  });

  /// The assistant's reply (may contain Markdown).
  final String reply;

  /// Detected user intent, if any.
  final String? intent;

  /// Confidence score for the detected intent (0–1).
  final double confidence;

  /// Conversation id, or an empty string in stateless mode.
  final String conversationId;

  /// Result of any triggered action (depends on org configuration).
  final Map<String, dynamic>? actionResult;

  /// Model / usage metadata returned by the API.
  final Map<String, dynamic> context;

  factory AskResponse.fromJson(Map<String, dynamic> json) => AskResponse(
        reply: json['reply'] as String? ?? '',
        intent: json['intent'] as String?,
        confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
        conversationId: json['conversationId'] as String? ?? '',
        actionResult: json['actionResult'] as Map<String, dynamic>?,
        context: json['context'] as Map<String, dynamic>? ?? {},
      );
}

/// Response from [FluxChat.testKey].
class TestKeyResponse {
  const TestKeyResponse({
    required this.message,
    required this.organizationId,
    required this.scopes,
  });

  final String message;
  final String organizationId;

  /// List of permission scopes granted to the key (e.g. `['bot:write']`).
  final List<String> scopes;

  factory TestKeyResponse.fromJson(Map<String, dynamic> json) =>
      TestKeyResponse(
        message: json['message'] as String? ?? '',
        organizationId: json['organizationId'] as String? ?? '',
        scopes: (json['scopes'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
      );
}

// ─── Knowledge base ───────────────────────────────────────────────────────────

/// Allowed categories for knowledge articles.
enum KnowledgeCategory {
  general,
  product,
  pricing,
  support,
  contact,
  policy,
  custom;

  /// Serialises to the snake_case string expected by the API.
  String toJson() => name;

  static KnowledgeCategory fromJson(String value) =>
      KnowledgeCategory.values.firstWhere(
        (e) => e.name == value,
        orElse: () => KnowledgeCategory.general,
      );
}

/// A knowledge-base article returned by the API.
class KnowledgeArticle {
  const KnowledgeArticle({
    required this.id,
    required this.organizationId,
    required this.title,
    required this.content,
    required this.category,
    required this.keywords,
    required this.priority,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String organizationId;
  final String title;
  final String content;
  final KnowledgeCategory category;
  final List<String> keywords;
  final int priority;
  final bool isActive;
  final String createdAt;
  final String updatedAt;

  factory KnowledgeArticle.fromJson(Map<String, dynamic> json) =>
      KnowledgeArticle(
        id: json['id'] as String,
        organizationId: json['organizationId'] as String,
        title: json['title'] as String,
        content: json['content'] as String,
        category: KnowledgeCategory.fromJson(json['category'] as String? ?? 'general'),
        keywords: (json['keywords'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        priority: json['priority'] as int? ?? 0,
        isActive: json['isActive'] as bool? ?? true,
        createdAt: json['createdAt'] as String? ?? '',
        updatedAt: json['updatedAt'] as String? ?? '',
      );
}

/// Payload for creating a knowledge article.
class CreateKnowledgeInput {
  const CreateKnowledgeInput({
    required this.title,
    required this.content,
    this.category = KnowledgeCategory.general,
    this.keywords = const [],
    this.priority = 0,
  });

  final String title;
  final String content;
  final KnowledgeCategory category;
  final List<String> keywords;
  final int priority;

  Map<String, dynamic> toJson() => {
        'title': title,
        'content': content,
        'category': category.toJson(),
        'keywords': keywords,
        'priority': priority,
      };
}

/// Partial update payload for a knowledge article.
class UpdateKnowledgeInput {
  const UpdateKnowledgeInput({
    this.title,
    this.content,
    this.category,
    this.keywords,
    this.priority,
    this.isActive,
  });

  final String? title;
  final String? content;
  final KnowledgeCategory? category;
  final List<String>? keywords;
  final int? priority;
  final bool? isActive;

  Map<String, dynamic> toJson() => {
        if (title != null) 'title': title,
        if (content != null) 'content': content,
        if (category != null) 'category': category!.toJson(),
        if (keywords != null) 'keywords': keywords,
        if (priority != null) 'priority': priority,
        if (isActive != null) 'isActive': isActive,
      };
}

// ─── Bot config ───────────────────────────────────────────────────────────────

/// Persona configuration for the assistant.
class BotConfig {
  const BotConfig({
    this.assistantName,
    this.tone,
    this.styleRules,
    this.customInstructions,
    this.captureTrainingData,
  });

  /// Display name the assistant uses for itself.
  final String? assistantName;

  /// Desired tone of voice (e.g. "warm and concise").
  final String? tone;

  /// Style rules applied to every answer.
  final String? styleRules;

  /// Additional instructions injected into the system prompt.
  final String? customInstructions;

  /// Whether bot interactions are captured as training data.
  final bool? captureTrainingData;

  factory BotConfig.fromJson(Map<String, dynamic> json) => BotConfig(
        assistantName: json['assistantName'] as String?,
        tone: json['tone'] as String?,
        styleRules: json['styleRules'] as String?,
        customInstructions: json['customInstructions'] as String?,
        captureTrainingData: json['captureTrainingData'] as bool?,
      );

  Map<String, dynamic> toJson() => {
        if (assistantName != null) 'assistantName': assistantName,
        if (tone != null) 'tone': tone,
        if (styleRules != null) 'styleRules': styleRules,
        if (customInstructions != null) 'customInstructions': customInstructions,
        if (captureTrainingData != null) 'captureTrainingData': captureTrainingData,
      };
}

// ─── Support: human handoff and the visitor's own thread ─────────────────────

/// What a visitor submits when they ask for a human.
class EscalateOptions {
  const EscalateOptions({
    required this.name,
    required this.email,
    required this.message,
    this.sessionId,
  });

  /// Visitor's name, as they typed it.
  final String name;

  /// Visitor's e-mail — also what proves the resulting ticket is theirs.
  final String email;

  /// What they want help with. Becomes the ticket's first message.
  final String message;

  /// The same session id you pass to `ask`. When present, the bot
  /// conversation so far is copied into the ticket so the agent has context.
  final String? sessionId;

  Map<String, dynamic> toJson() => {
        'name': name,
        'email': email,
        'message': message,
        if (sessionId != null) 'sessionId': sessionId,
      };
}

/// Response from [SupportResource.escalate].
class EscalateResponse {
  const EscalateResponse({required this.ticketId, required this.status});

  /// Id of the created ticket — keep it, with the e-mail, to follow the thread.
  final String ticketId;

  /// Status at creation (`open`, or higher on a priority-support plan).
  final String status;

  factory EscalateResponse.fromJson(Map<String, dynamic> json) =>
      EscalateResponse(
        ticketId: json['ticketId'] as String? ?? '',
        status: json['status'] as String? ?? 'open',
      );
}

/// Who said a line in a ticket thread.
enum TicketMessageRole { bot, visitor, agent }

/// One line of a ticket conversation.
class TicketMessage {
  const TicketMessage({
    required this.id,
    required this.content,
    required this.role,
    this.createdAt,
  });

  final String id;
  final String content;
  final TicketMessageRole role;
  final String? createdAt;

  factory TicketMessage.fromJson(Map<String, dynamic> json) => TicketMessage(
        id: json['id'] as String? ?? '',
        content: json['content'] as String? ?? '',
        role: TicketMessageRole.values.firstWhere(
          (r) => r.name == json['role'],
          orElse: () => TicketMessageRole.visitor,
        ),
        createdAt: json['createdAt'] as String?,
      );
}

/// A visitor's ticket thread, exactly as they see it in the widget.
class TicketThread {
  const TicketThread({
    required this.ticketId,
    required this.subject,
    required this.status,
    required this.agentConnected,
    required this.agentName,
    required this.closed,
    required this.messages,
  });

  final String ticketId;
  final String subject;

  /// `open` | `in_progress` | `resolved` | `closed`.
  final String status;

  /// True once a human has actually written — not merely been assigned.
  final bool agentConnected;
  final String? agentName;

  /// `resolved` or `closed`: the visitor can read but no longer write.
  final bool closed;
  final List<TicketMessage> messages;

  factory TicketThread.fromJson(Map<String, dynamic> json) => TicketThread(
        ticketId: json['ticketId'] as String? ?? '',
        subject: json['subject'] as String? ?? '',
        status: json['status'] as String? ?? 'open',
        agentConnected: json['agentConnected'] as bool? ?? false,
        agentName: json['agentName'] as String?,
        closed: json['closed'] as bool? ?? false,
        messages: ((json['messages'] as List<dynamic>?) ?? const [])
            .map((m) => TicketMessage.fromJson(m as Map<String, dynamic>))
            .toList(growable: false),
      );
}
