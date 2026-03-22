# Référence de configuration

OpenPR-Webhook utilise un seul fichier de configuration TOML. Par défaut, il recherche `config.toml` dans le répertoire courant. Vous pouvez spécifier un chemin personnalisé comme premier argument de la ligne de commande.

## Schéma complet

```toml
# ─── Serveur ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # Adresse et port d'écoute

# ─── Sécurité ─────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # Secrets HMAC-SHA256 (supporte la rotation)
allow_unsigned = false                     # Autoriser les requêtes non signées (défaut : false)

# ─── Flags de fonctionnalité ────────────────────────────────────────
[features]
tunnel_enabled = false                 # Activer le sous-système tunnel WSS (défaut : false)
cli_enabled = false                    # Activer l'exécuteur d'agent CLI (défaut : false)
callback_enabled = false               # Activer les callbacks de transition d'état (défaut : false)

# ─── Réglage d'exécution ───────────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # Tâches CLI concurrentes max (défaut : 1)
http_timeout_secs = 15                 # Délai d'expiration client HTTP (défaut : 15)
tunnel_reconnect_backoff_max_secs = 60 # Backoff max reconnexion tunnel (défaut : 60)

# ─── Tunnel WSS ───────────────────────────────────────────
[tunnel]
enabled = false                        # Activer cette instance de tunnel (défaut : false)
url = "wss://control.example.com/ws"   # URL WebSocket
agent_id = "my-agent"                  # Identifiant de l'agent
auth_token = "bearer-token"            # Jeton d'authentification Bearer
reconnect_secs = 3                     # Intervalle de reconnexion de base (défaut : 3)
heartbeat_secs = 20                    # Intervalle de heartbeat (défaut : 20, min : 3)
hmac_secret = "envelope-signing-key"   # Secret de signature HMAC de l'enveloppe
require_inbound_sig = false            # Exiger des signatures sur les messages entrants (défaut : false)

# ─── Agents ───────────────────────────────────────────────

# --- Agent OpenClaw ---
[[agents]]
id = "notify-signal"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- Agent OpenPRX (mode API HTTP) ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- Agent OpenPRX (mode CLI) ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Agent Webhook ---
[[agents]]
id = "forward-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # Optionnel : signer les requêtes sortantes

# --- Agent personnalisé ---
[[agents]]
id = "custom-script"
name = "Custom Script"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- Agent CLI ---
[[agents]]
id = "ai-coder"
name = "AI Coder"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
```

## Référence des sections

### `[server]`

| Champ | Type | Requis | Défaut | Description |
|-------|------|--------|--------|-------------|
| `listen` | Chaîne | Oui | -- | Adresse TCP d'écoute au format `host:port` |

### `[security]`

| Champ | Type | Requis | Défaut | Description |
|-------|------|--------|--------|-------------|
| `webhook_secrets` | Tableau de chaînes | Non | `[]` | Liste des secrets HMAC-SHA256 valides pour la vérification entrante. Plusieurs secrets permettent la rotation des clés. |
| `allow_unsigned` | Booléen | Non | `false` | Accepter les requêtes non signées sans vérification de signature. **Non recommandé en production.** |

**La vérification de signature** vérifie deux en-têtes dans l'ordre :
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

La valeur de l'en-tête doit être au format `sha256={hex-digest}`. Le service essaie chaque secret dans `webhook_secrets` jusqu'à ce qu'un corresponde.

### `[features]`

Tous les flags de fonctionnalité sont par défaut à `false`. Cette approche de défense en profondeur garantit que les fonctionnalités dangereuses sont explicitement activées.

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `tunnel_enabled` | Booléen | `false` | Activer le sous-système tunnel WSS |
| `cli_enabled` | Booléen | `false` | Activer l'exécuteur d'agent CLI |
| `callback_enabled` | Booléen | `false` | Activer les callbacks de transition d'état |

### `[runtime]`

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `cli_max_concurrency` | Entier | `1` | Nombre maximum de tâches d'agent CLI concurrentes |
| `http_timeout_secs` | Entier | `15` | Délai d'expiration pour les requêtes HTTP sortantes (transfert webhook, callbacks, API Signal) |
| `tunnel_reconnect_backoff_max_secs` | Entier | `60` | Intervalle de backoff maximum pour la reconnexion du tunnel |

### `[tunnel]`

Voir [Tunnel WSS](../tunnel/index.md) pour la documentation détaillée.

### `[[agents]]`

Voir [Types d'agents](../agents/index.md) et [Référence des exécuteurs](../agents/executors.md) pour la documentation détaillée.

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `OPENPR_WEBHOOK_SAFE_MODE` | Définir à `1`, `true`, `yes` ou `on` pour désactiver les fonctionnalités tunnel, CLI et callback indépendamment de la configuration. Utile pour un verrouillage d'urgence. |
| `RUST_LOG` | Contrôle la verbosité des journaux. Défaut : `openpr_webhook=info`. Exemples : `openpr_webhook=debug`, `openpr_webhook=trace` |

## Mode sécurisé

Définir `OPENPR_WEBHOOK_SAFE_MODE=1` désactive :

- L'exécution d'agent CLI (`cli_enabled` forcé à `false`)
- L'envoi de callbacks (`callback_enabled` forcé à `false`)
- Le tunnel WSS (`tunnel_enabled` forcé à `false`)

Les agents non dangereux (openclaw, openprx, webhook, custom) continuent de fonctionner normalement. Cela vous permet de verrouiller rapidement le service sans modifier le fichier de configuration.

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## Configuration minimale

La configuration valide la plus petite :

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

Cela démarre le service sans agents ni vérification de signature. Utile uniquement pour le développement.

## Liste de vérification pour la production

- [ ] Définir au moins une entrée dans `webhook_secrets`
- [ ] Définir `allow_unsigned = false`
- [ ] Configurer au moins un agent
- [ ] Si utilisation d'agents CLI : définir `cli_enabled = true` et vérifier la liste blanche des exécuteurs
- [ ] Si utilisation du tunnel : utiliser `wss://` (pas `ws://`), définir `hmac_secret` et `require_inbound_sig = true`
- [ ] Définir `RUST_LOG=openpr_webhook=info` (éviter `debug`/`trace` en production pour les performances)
- [ ] Envisager d'exécuter avec `OPENPR_WEBHOOK_SAFE_MODE=1` initialement pour vérifier les fonctionnalités non-CLI
