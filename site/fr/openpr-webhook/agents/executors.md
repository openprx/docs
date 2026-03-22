# Référence des exécuteurs

Cette page documente en détail les 5 types d'exécuteurs, y compris leurs champs de configuration, leur comportement et des exemples.

## openclaw

Envoie des notifications via des plateformes de messagerie (Signal, Telegram) via l'outil CLI OpenClaw.

**Fonctionnement :** Construit une commande shell qui invoque le binaire OpenClaw avec les arguments `--channel`, `--target` et `--message`.

**Configuration :**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # Chemin vers le binaire OpenClaw
channel = "signal"                     # Canal : "signal" ou "telegram"
target = "+1234567890"                 # Numéro de téléphone, ID de groupe ou nom de canal
```

**Champs :**

| Champ | Requis | Description |
|-------|----------|-------------|
| `command` | Oui | Chemin vers le binaire CLI OpenClaw |
| `channel` | Oui | Canal de messagerie (`signal`, `telegram`) |
| `target` | Oui | Identifiant du destinataire (numéro de téléphone, ID de groupe, etc.) |

---

## openprx

Envoie des messages via l'infrastructure de messagerie OpenPRX. Prend en charge deux modes : API HTTP (démon Signal) ou commande CLI.

**Mode 1 : API Signal (recommandé)**

Envoie un POST JSON à un démon API REST signal-cli :

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # URL de base de l'API REST signal-cli
account = "+1234567890"                 # Numéro de téléphone de l'expéditeur
target = "+0987654321"                  # Numéro de téléphone ou UUID du destinataire
channel = "signal"                      # Défaut : "signal"
```

La requête HTTP envoyée à l'API Signal :

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**Mode 2 : Commande CLI**

Revient à l'exécution d'une commande shell si `signal_api` n'est pas défini :

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**Champs :**

| Champ | Requis | Description |
|-------|----------|-------------|
| `signal_api` | Non | URL de base de l'API HTTP du démon Signal |
| `account` | Non | Numéro de téléphone du compte (utilisé avec `signal_api`) |
| `target` | Oui | Numéro de téléphone ou UUID du destinataire |
| `channel` | Non | Nom du canal (défaut : `signal`) |
| `command` | Non | Commande CLI (fallback quand `signal_api` n'est pas défini) |

Au moins un parmi `signal_api` ou `command` doit être fourni.

---

## webhook

Transfère l'intégralité du payload webhook tel quel vers un point de terminaison HTTP. Utile pour s'intégrer avec Slack, Discord, des API personnalisées, ou pour chaîner vers un autre service webhook.

**Fonctionnement :** Envoie un POST JSON à l'URL configurée avec le payload original. Signe optionnellement les requêtes sortantes avec HMAC-SHA256.

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Optionnel : signer les requêtes sortantes
```

**Champs :**

| Champ | Requis | Description |
|-------|----------|-------------|
| `url` | Oui | URL de destination |
| `secret` | Non | Secret HMAC-SHA256 pour la signature sortante (envoyé comme en-tête `X-Webhook-Signature`) |

Quand `secret` est défini, la requête sortante inclut un en-tête `X-Webhook-Signature: sha256=...` calculé sur le corps JSON, permettant au destinataire de vérifier l'authenticité.

---

## custom

Exécute une commande shell arbitraire, en passant le message formaté comme argument. Utile pour des intégrations personnalisées, la journalisation ou le déclenchement de scripts externes.

**Fonctionnement :** Exécute `sh -c '{command} "{message}"'` où `{message}` est le modèle rendu avec les caractères spéciaux échappés.

```toml
[[agents]]
id = "custom-logger"
name = "Log to File"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # Arguments supplémentaires optionnels
```

**Champs :**

| Champ | Requis | Description |
|-------|----------|-------------|
| `command` | Oui | Chemin vers l'exécutable ou commande shell |
| `args` | Non | Arguments de ligne de commande supplémentaires |

**Note de sécurité :** L'exécuteur custom exécute des commandes shell. Assurez-vous que le chemin de la commande est fiable et non contrôlable par l'utilisateur.

---

## cli

Exécute des agents de code IA pour traiter des tickets. C'est le type d'exécuteur le plus puissant, conçu pour la génération de code automatisée et la résolution de tickets.

**Nécessite :** `features.cli_enabled = true` dans la configuration. Bloqué quand `OPENPR_WEBHOOK_SAFE_MODE=1`.

**Exécuteurs pris en charge (liste blanche) :**

| Exécuteur | Binaire | Modèle de commande |
|----------|--------|-----------------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

Tout exécuteur absent de cette liste blanche est rejeté.

**Configuration :**

```toml
[features]
cli_enabled = true
callback_enabled = true  # Requis pour les transitions d'état

[[agents]]
id = "my-coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # Un parmi : codex, claude-code, opencode
workdir = "/opt/projects/backend"      # Répertoire de travail pour l'outil CLI
timeout_secs = 900                     # Délai d'expiration en secondes (défaut : 900)
max_output_chars = 12000               # Nombre max de caractères à capturer depuis stdout/stderr (défaut : 12000)
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"

# Transitions d'état (nécessite callback_enabled)
update_state_on_start = "in_progress"  # Définir l'état du ticket au démarrage de la tâche
update_state_on_success = "done"       # Définir l'état du ticket en cas de succès
update_state_on_fail = "todo"          # Définir l'état du ticket en cas d'échec/expiration

# Configuration du callback
callback = "mcp"                       # Mode callback : "mcp" ou "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # Jeton Bearer optionnel pour le callback
```

**Champs :**

| Champ | Requis | Défaut | Description |
|-------|----------|---------|-------------|
| `executor` | Oui | -- | Nom de l'outil CLI (`codex`, `claude-code`, `opencode`) |
| `workdir` | Non | -- | Répertoire de travail |
| `timeout_secs` | Non | 900 | Délai d'expiration du processus |
| `max_output_chars` | Non | 12000 | Limite de capture de la fin de sortie |
| `prompt_template` | Non | `Fix issue {issue_id}: {title}\nContext: {reason}` | Prompt envoyé à l'outil CLI |
| `update_state_on_start` | Non | -- | État du ticket au démarrage de la tâche |
| `update_state_on_success` | Non | -- | État du ticket en cas de succès |
| `update_state_on_fail` | Non | -- | État du ticket en cas d'échec ou d'expiration |
| `callback` | Non | `mcp` | Protocole de callback (`mcp` ou `api`) |
| `callback_url` | Non | -- | URL vers laquelle envoyer les callbacks |
| `callback_token` | Non | -- | Jeton Bearer pour l'authentification du callback |

**Espaces réservés du modèle de prompt (spécifiques à cli) :**

| Espace réservé | Source |
|-------------|--------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**Payload du callback (mode MCP) :**

Quand `callback = "mcp"`, le service envoie un POST de style JSON-RPC à `callback_url` :

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**Cycle de vie des transitions d'état :**

```
Événement reçu
    |
    v
[update_state_on_start] --> état du ticket = "in_progress"
    |
    v
Outil CLI s'exécute (jusqu'à timeout_secs)
    |
    +-- succès --> [update_state_on_success] --> état du ticket = "done"
    |
    +-- échec --> [update_state_on_fail] --> état du ticket = "todo"
    |
    +-- expiration --> [update_state_on_fail] --> état du ticket = "todo"
```
