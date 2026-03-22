# OpenPR-Webhook

OpenPR-Webhook est un service de dispatch d'événements webhook pour [OpenPR](https://github.com/openprx/openpr). Il reçoit les événements webhook de la plateforme OpenPR, les filtre selon le contexte bot, et les achemine vers un ou plusieurs agents configurables pour traitement.

## Ce qu'il fait

Lorsqu'un événement se produit dans OpenPR (par exemple, un ticket est créé ou mis à jour), la plateforme envoie une requête POST webhook à ce service. OpenPR-Webhook effectue alors les opérations suivantes :

1. **Vérifie la requête** via la validation de signature HMAC-SHA256
2. **Filtre les événements** -- seuls les événements avec `bot_context.is_bot_task = true` sont traités
3. **Achemine vers les agents** -- associe l'événement à un agent configuré par nom ou par type
4. **Dispatch** -- exécute l'action de l'agent (envoyer un message, appeler un outil CLI, transférer vers un autre webhook, etc.)

## Architecture générale

```
Plateforme OpenPR
    |
    | POST /webhook (signé HMAC-SHA256)
    v
+-------------------+
| openpr-webhook    |
|                   |
| Vérif. signature  |
| Filtrage événem.  |
| Matching agent    |
+-------------------+
    |           |           |
    v           v           v
 openclaw    webhook     agent cli
 (Signal/    (transfert  (codex /
  Telegram)  HTTP)       claude-code)
```

## Fonctionnalités clés

- **Vérification de signature HMAC-SHA256** sur les webhooks entrants avec support de rotation multi-secret
- **Filtrage des tâches bot** -- ignore silencieusement les événements non destinés aux bots
- **5 types d'agents/exécuteurs** -- openclaw, openprx, webhook, custom, cli
- **Modèles de messages** avec variables de substitution pour un formatage flexible des notifications
- **Transitions d'état** -- met à jour automatiquement l'état du ticket au démarrage, au succès ou à l'échec de la tâche
- **Tunnel WSS** (Phase B) -- connexion WebSocket active vers un plan de contrôle pour le dispatch de tâches en mode push
- **Sécurité par défaut** -- les fonctionnalités dangereuses (tunnel, cli, callback) sont DÉSACTIVÉES par défaut, conditionnées par des flags de fonctionnalité et le mode sécurisé

## Types d'agents pris en charge

| Type | Objectif | Protocole |
|------|---------|-----------|
| `openclaw` | Envoyer des notifications via Signal/Telegram via le CLI OpenClaw | Commande shell |
| `openprx` | Envoyer des messages via l'API Signal OpenPRX ou CLI | API HTTP / Shell |
| `webhook` | Transférer l'intégralité du payload vers un point de terminaison HTTP | HTTP POST |
| `custom` | Exécuter une commande shell arbitraire avec le message comme argument | Commande shell |
| `cli` | Exécuter un agent de code IA (codex, claude-code, opencode) sur le ticket | Sous-processus |

## Liens rapides

- [Installation](getting-started/installation.md)
- [Démarrage rapide](getting-started/quickstart.md)
- [Types d'agents](agents/index.md)
- [Référence des exécuteurs](agents/executors.md)
- [Tunnel WSS](tunnel/index.md)
- [Référence de configuration](configuration/index.md)
- [Dépannage](troubleshooting/index.md)

## Dépôt

Code source : [github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

Licence : MIT OR Apache-2.0
