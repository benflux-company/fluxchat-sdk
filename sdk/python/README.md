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
    base_url="https://mon-proxy.com/v1",  # optionnel
    jwt_token="mon-jwt",                  # optionnel, pour knowledge.list/get
    timeout=60.0,                         # timeout en secondes
)
```

## Ask avec paramètres

```python
response = client.ask(
    "Quelle est votre politique de retour ?",
    context="E-commerce support",
    conversation_id="conv-abc123",
)
```

## Vérifier la clé API

```python
info = client.test_key()
print(f"Organisation : {info.organization_id}")
print(f"Scopes : {info.scopes}")
```

## Knowledge Base (CRUD)

```python
# Créer
item = client.knowledge.create(
    title="FAQ",
    content="Contenu de la FAQ...",
    category="support",
    keywords=["retour", "remboursement"],
)

# Mettre à jour (champs partiels supportés)
updated = client.knowledge.update(item.id, title="FAQ v2")

# Supprimer
client.knowledge.delete(item.id)

# Lister (requiert jwt_token)
items = client.knowledge.list()

# Récupérer par ID (requiert jwt_token)
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
