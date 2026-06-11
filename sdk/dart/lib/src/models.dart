/// Réponse de la méthode [FluxChat.ask].
class AskResponse {
  final String reply;
  final String? conversationId;

  const AskResponse({required this.reply, this.conversationId});

  factory AskResponse.fromJson(Map<String, dynamic> json) => AskResponse(
        reply: json['text'] as String? ?? json['reply'] as String? ?? '',
        conversationId: json['conversation_id'] as String?,
      );
}

/// Réponse de la méthode [FluxChat.testKey].
class KeyInfo {
  final String? organizationId;
  final List<String> scopes;

  const KeyInfo({this.organizationId, this.scopes = const []});

  factory KeyInfo.fromJson(Map<String, dynamic> json) => KeyInfo(
        organizationId: json['organization_id'] as String?,
        scopes: (json['scopes'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
      );
}

/// Élément de la base de connaissance.
class KnowledgeItem {
  final String? id;
  final String title;
  final String content;

  const KnowledgeItem({this.id, required this.title, required this.content});

  factory KnowledgeItem.fromJson(Map<String, dynamic> json) => KnowledgeItem(
        id: json['id'] as String?,
        title: json['title'] as String? ?? '',
        content: json['content'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'title': title,
        'content': content,
      };
}
