---
title: Passerelle
description: Apercu de la couche passerelle de PRX fournissant des interfaces API HTTP, WebSocket et webhook.
---

# Passerelle

La passerelle PRX est la couche reseau qui expose les capacites de l'agent via plusieurs protocoles. Elle fournit des API REST HTTP, des connexions WebSocket pour le streaming en temps reel et des endpoints webhook pour les integrations evenementielles.

## Apercu

La passerelle s'execute dans le cadre du daemon PRX et gere :

- **API HTTP** -- Endpoints RESTful pour la gestion des sessions, l'execution d'outils et la configuration
- **WebSocket** -- Streaming bidirectionnel pour les interactions agent en temps reel
- **Webhooks** -- Notifications d'evenements sortants pour les integrations
- **Middleware** -- Authentification, limitation de debit, CORS et journalisation des requetes

## Architecture

```
┌─────────────────────────────────┐
│           Passerelle             │
│  ┌──────────┐  ┌─────────────┐  │
│  │ API HTTP │  │  WebSocket  │  │
│  └────┬─────┘  └──────┬──────┘  │
│       │               │         │
│  ┌────┴───────────────┴──────┐  │
│  │     Pile de middleware     │  │
│  └────────────┬──────────────┘  │
│               │                  │
│  ┌────────────┴──────────────┐  │
│  │     Runtime de l'agent     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Configuration

```toml
[gateway]
bind = "127.0.0.1:3120"
tls_cert = ""
tls_key = ""

[gateway.cors]
allowed_origins = ["*"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
```

## Pages associees

- [API HTTP](./http-api)
- [WebSocket](./websocket)
- [Webhooks](./webhooks)
- [Middleware](./middleware)
