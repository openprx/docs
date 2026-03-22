# Types d'agents

Les agents sont les unités de dispatch centrales d'OpenPR-Webhook. Chaque agent définit comment traiter un événement webhook correspondant. Vous pouvez configurer plusieurs agents dans un seul déploiement, et les événements sont acheminés vers l'agent approprié en fonction du `bot_context` dans le payload webhook.

## Aperçu

| Type | Cas d'utilisation | Nécessite un flag de fonctionnalité |
|------|----------|----------------------|
| `openclaw` | Envoyer des notifications via Signal/Telegram avec le CLI OpenClaw | Non |
| `openprx` | Envoyer des messages via l'API Signal OpenPRX ou CLI | Non |
| `webhook` | Transférer les événements vers des points de terminaison HTTP (Slack, Discord, etc.) | Non |
| `custom` | Exécuter des commandes shell arbitraires | Non |
| `cli` | Exécuter des agents de code IA (codex, claude-code, opencode) | Oui (`cli_enabled`) |

## Structure de configuration d'un agent

Chaque agent possède ces champs communs :

```toml
[[agents]]
id = "unique-id"              # Identifiant unique, utilisé pour la correspondance
name = "Human-Readable Name"  # Nom d'affichage, aussi utilisé pour la correspondance
agent_type = "openclaw"       # Un parmi : openclaw, openprx, webhook, custom, cli
message_template = "..."      # Optionnel : format de message personnalisé
```

Ensuite, selon l'`agent_type`, vous fournissez le bloc de configuration spécifique au type :

- `[agents.openclaw]` pour les agents openclaw
- `[agents.openprx]` pour les agents openprx
- `[agents.webhook]` pour les agents webhook
- `[agents.custom]` pour les agents custom
- `[agents.cli]` pour les agents cli

## Modèles de messages

Le champ `message_template` prend en charge des espaces réservés qui sont remplacés par les valeurs du payload webhook :

| Espace réservé | Source | Exemple |
|-------------|--------|---------|
| `{event}` | `payload.event` | `issue.updated` |
| `{title}` | `payload.data.issue.title` | `Fix login bug` |
| `{key}` | `payload.data.issue.key` | `PROJ-42` |
| `{issue_id}` | `payload.data.issue.id` | `123` |
| `{reason}` | `payload.bot_context.trigger_reason` | `assigned_to_bot` |
| `{actor}` | `payload.actor.name` | `alice` |
| `{project}` | `payload.project.name` | `backend` |
| `{workspace}` | `payload.workspace.name` | `IM` |
| `{state}` | `payload.data.issue.state` | `in_progress` |
| `{priority}` | `payload.data.issue.priority` | `high` |
| `{url}` | dérivé | `issue/123` |

Modèle par défaut (pour openclaw, openprx, webhook, custom) :

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## Logique de correspondance d'agents

Lorsqu'un événement webhook arrive avec `bot_context.is_bot_task = true` :

1. Le service extrait `bot_context.bot_name` et `bot_context.bot_agent_type`
2. Il recherche les agents dont l'`id` ou le `name` (insensible à la casse) correspond à `bot_name`
3. Si aucune correspondance par nom, il utilise en fallback le premier agent dont l'`agent_type` correspond à `bot_agent_type`
4. Si aucun agent ne correspond, l'événement est acquitté mais non dispatché

## Exemple multi-agents

```toml
# Agent 1 : Notification via Telegram
[[agents]]
id = "notify-tg"
name = "Telegram Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "telegram"
target = "@my-channel"

# Agent 2 : Transfert vers Slack
[[agents]]
id = "notify-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"

# Agent 3 : Agent de code IA
[[agents]]
id = "coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
```

Dans cette configuration, OpenPR peut acheminer différents événements vers différents agents en définissant le champ `bot_name` dans le payload webhook.

## Étapes suivantes

- [Référence des exécuteurs](executors.md) -- documentation détaillée pour chaque type d'exécuteur
- [Référence de configuration](../configuration/index.md) -- schéma TOML complet
