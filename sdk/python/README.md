# FluxChat Python SDK

SDK officiel pour intégrer FluxChat dans vos applications Python.

## Installation

```bash
pip install fluxchat
```

## Utilisation rapide

```python
from fluxchat import FluxChat

client = FluxChat(api_key="VOTRE_API_KEY")

response = client.ask("Bonjour !")
print(response.reply)
print(response.conversation_id)
```

## Options du client

```python
client = FluxChat(
    api_key="sk-...",
    base_url="https://mon-proxy.com/api/v2",  # optionnel
    jwt_token="mon-jwt",                      # requis pour TOUT le CRUD knowledge
    timeout=60.0,                             # timeout en secondes
)
```

## Ask avec paramètres et Session

Pour garder le contexte d'une conversation entre plusieurs requêtes, utilisez `session_id` (pas stocké en base) ou `conversation_id`.

```python
response = client.ask(
    "Quelle est votre politique de retour ?",
    context="E-commerce support",
    conversation_id="conv-abc123",
    session_id="session-user-xyz",
)
```

## Capturer une page passivement

```python
client.capture_page(
    url="https://example.com/faq",
    title="FAQ",
    content="Contenu de la page...",
)
```

## Vérifier la clé API

```python
info = client.test_key()
print(f"Organisation : {info.organization_id}")
print(f"Scopes : {info.scopes}")
```

## Knowledge Base (CRUD - requiert jwt_token)

```python
# Créer
item = client.knowledge.create(
    title="FAQ",
    content="Contenu de la FAQ...",
    category="support",
    keywords=["retour", "remboursement"],
)

# Mettre à jour (champs partiels supportés via PATCH)
updated = client.knowledge.update(item.id, title="FAQ v2")

# Supprimer
client.knowledge.delete(item.id)

# Lister
items = client.knowledge.list()

# Récupérer par ID
item = client.knowledge.get("abc123")
```

## Gestion des erreurs

```python
from fluxchat import FluxChatApiError, FluxChatNetworkError, FluxChatConfigError

try:
    response = client.ask("Bonjour")
except FluxChatConfigError as e:
    print(f"Erreur de configuration: {e}")
except FluxChatApiError as e:
    print(f"Erreur API {e.status_code}: {e.api_message}")
except FluxChatNetworkError as e:
    print(f"Erreur réseau: {e}")
```

## Lancer les tests

```bash
pip install -e ".[dev]"
pytest tests/
```

## Structure du package

```
sdk/python/
├── README.md
├── pyproject.toml
├── fluxchat/
│   ├── __init__.py       ← Exports publics
│   ├── client.py         ← FluxChat (ask, test_key, knowledge)
│   ├── knowledge.py      ← KnowledgeClient (CRUD)
│   ├── models.py         ← AskResponse, KeyInfo, KnowledgeItem (dataclasses)
│   ├── exceptions.py     ← FluxChatApiError, FluxChatNetworkError, FluxChatConfigError
│   └── _http.py          ← HttpHelper interne (httpx)
└── tests/
    └── test_client.py    ← Tests pytest avec MockTransport
```

## Prérequis

- Python 3.10+
- `httpx >= 0.27`
