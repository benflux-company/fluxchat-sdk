/// Réponse de la méthode [FluxChat.ask].
class AskResponse {
  final String reply;
  final String? conversationId;

  const AskResponse({required this.reply, this.conversationId});

  factory AskResponse.fromJson(Map<String, dynamic> json) => AskResponse(
        reply: json['reply'] as String? ?? json['text'] as String? ?? '',
        conversationId: json['conversationId'] as String? ?? json['conversation_id'] as String?,
      );
}

/// Réponse de la méthode [FluxChat.testKey].
class KeyInfo {
  final String? organizationId;
  final List<String> scopes;

  const KeyInfo({this.organizationId, this.scopes = const []});

  factory KeyInfo.fromJson(Map<String, dynamic> json) => KeyInfo(
        organizationId: json['organizationId'] as String? ?? json['organization_id'] as String?,
        scopes: (json['scopes'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
      );
}

/// Élément de la base de connaissance.
class KnowledgeItem {
  final String? id;
  final String? title;
  final String? content;
  final String? category;
  final List<String>? keywords;
  final bool? isActive;
  final String? createdAt;

  const KnowledgeItem({
      this.id, 
      this.title, 
      this.content,
      this.category,
      this.keywords,
      this.isActive,
      this.createdAt,
  });

  factory KnowledgeItem.fromJson(Map<String, dynamic> json) => KnowledgeItem(
        id: json['id'] as String?,
        title: json['title'] as String?,
        content: json['content'] as String?,
        category: json['category'] as String?,
        keywords: (json['keywords'] as List<dynamic>?)?.map((e) => e as String).toList(),
        isActive: json['isActive'] as bool?,
        createdAt: json['createdAt'] as String?,
      );

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        if (title != null) 'title': title,
        if (content != null) 'content': content,
        if (category != null) 'category': category,
        if (keywords != null) 'keywords': keywords,
        if (isActive != null) 'isActive': isActive,
      };
}
