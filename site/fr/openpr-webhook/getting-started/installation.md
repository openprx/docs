# Installation

## Prérequis

- Chaîne d'outils Rust (édition 2021 ou ultérieure)
- Une instance OpenPR en cours d'exécution capable d'envoyer des événements webhook

## Compilation depuis les sources

Clonez le dépôt et compilez en mode release :

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

Le binaire est produit à `target/release/openpr-webhook`.

## Dépendances

OpenPR-Webhook est construit sur les bibliothèques principales suivantes :

| Crate | Objectif |
|-------|---------|
| `axum` 0.8 | Framework de serveur HTTP |
| `tokio` 1 | Runtime asynchrone |
| `reqwest` 0.12 | Client HTTP pour le transfert de webhooks et les callbacks |
| `hmac` + `sha2` | Vérification de signature HMAC-SHA256 |
| `toml` 0.8 | Analyse de la configuration |
| `tokio-tungstenite` 0.28 | Client WebSocket pour le mode tunnel |
| `tracing` | Journalisation structurée |

## Fichier de configuration

Créez un fichier `config.toml`. Le service charge ce fichier au démarrage. Consultez la [Référence de configuration](../configuration/index.md) pour le schéma complet.

Exemple minimal :

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "Notification Bot"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## Exécution

```bash
# Par défaut : charge config.toml depuis le répertoire courant
./target/release/openpr-webhook

# Spécifier un chemin de config personnalisé
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## Journalisation

La journalisation est contrôlée par la variable d'environnement `RUST_LOG`. Le niveau par défaut est `openpr_webhook=info`.

```bash
# Journalisation debug
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# Journalisation trace (très verbeux)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## Vérification de santé

Le service expose un point de terminaison `GET /health` qui retourne `ok` lorsque le serveur est en cours d'exécution :

```bash
curl http://localhost:9000/health
# ok
```

## Service Systemd (optionnel)

Pour les déploiements en production sous Linux :

```ini
[Unit]
Description=OpenPR Webhook Dispatcher
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## Étapes suivantes

- [Démarrage rapide](quickstart.md) -- configurer votre premier agent et le tester de bout en bout
- [Référence de configuration](../configuration/index.md) -- documentation complète du schéma TOML
