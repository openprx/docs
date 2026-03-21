---
title: Apercu des canaux
description: PRX se connecte a 19 plateformes de messagerie. Apercu de tous les canaux, matrice de comparaison, schemas de configuration et politiques de messages prives.
---

# Canaux

Les canaux sont des integrations de plateformes de messagerie qui connectent PRX au monde exterieur. Chaque canal implemente une interface unifiee pour l'envoi et la reception de messages, la gestion des medias, les indicateurs de saisie et les verifications de sante. PRX peut executer plusieurs canaux simultanement depuis un seul processus daemon.

## Canaux pris en charge

PRX prend en charge 19 canaux de messagerie couvrant les plateformes grand public, les outils d'entreprise, les protocoles open source et les interfaces developpeur.

### Matrice de comparaison des canaux

| Canal | MP | Groupe | Media | Voix | E2EE | Plateforme | Statut |
|-------|:--:|:------:|:-----:|:----:|:----:|------------|:------:|
| [Telegram](./telegram) | Oui | Oui | Oui | Non | Non | Multi-plateforme | Stable |
| [Discord](./discord) | Oui | Oui | Oui | Non | Non | Multi-plateforme | Stable |
| [Slack](./slack) | Oui | Oui | Oui | Non | Non | Multi-plateforme | Stable |
| [WhatsApp](./whatsapp) | Oui | Oui | Oui | Non | Oui | Cloud API | Stable |
| [WhatsApp Web](./whatsapp-web) | Oui | Oui | Oui | Non | Oui | Multi-appareils | Beta |
| [Signal](./signal) | Oui | Oui | Oui | Non | Oui | Multi-plateforme | Stable |
| [iMessage](./imessage) | Oui | Oui | Oui | Non | Oui | macOS uniquement | Beta |
| [Matrix](./matrix) | Oui | Oui | Oui | Non | Oui | Federe | Stable |
| [Email](./email) | Oui | Non | Oui | Non | Non | IMAP/SMTP | Stable |
| [Lark / Feishu](./lark) | Oui | Oui | Oui | Non | Non | Multi-plateforme | Stable |
| [DingTalk](./dingtalk) | Oui | Oui | Oui | Non | Non | Multi-plateforme | Stable |
| [QQ](./qq) | Oui | Oui | Oui | Non | Non | Multi-plateforme | Beta |
| [Mattermost](./mattermost) | Oui | Oui | Oui | Non | Non | Auto-heberge | Stable |
| [Nextcloud Talk](./nextcloud-talk) | Oui | Oui | Oui | Non | Non | Auto-heberge | Beta |
| [IRC](./irc) | Oui | Oui | Non | Non | Non | Federe | Stable |
| [LINQ](./linq) | Oui | Oui | Oui | Non | Non | Partner API | Alpha |
| [CLI](./cli) | Oui | Non | Non | Non | N/A | Terminal | Stable |
| Terminal | Oui | Non | Non | Non | N/A | Terminal | Stable |
| Wacli | Oui | Oui | Oui | Non | Oui | JSON-RPC | Beta |

**Legende :**
- **Stable** -- Pret pour la production, entierement teste
- **Beta** -- Fonctionnel avec des limitations connues
- **Alpha** -- Experimental, l'API peut changer

## Schema de configuration commun

Tous les canaux sont configures sous la section `[channels]` de `~/.config/openprx/openprx.toml`. Chaque canal possede sa propre sous-section avec des parametres specifiques a la plateforme.

### Structure de base

```toml
[channels]
# Enable the built-in CLI channel (default: true)
cli = true

# Per-message processing timeout in seconds (default: 300)
message_timeout_secs = 300

# ── Telegram ──────────────────────────────────────────────
[channels.telegram]
bot_token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
allowed_users = ["alice", "bob"]
stream_mode = "edit"            # "edit" | "append" | "none"
mention_only = false

# ── Discord ───────────────────────────────────────────────
[channels.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXX"
guild_id = "1234567890"         # optional: restrict to one server
allowed_users = []              # empty = allow all
listen_to_bots = false
mention_only = false

# ── Slack ─────────────────────────────────────────────────
[channels.slack]
bot_token = "xoxb-..."
app_token = "xapp-..."
allowed_users = []
mention_only = true
```

### Exemples par canal

**Lark / Feishu :**

```toml
[channels.lark]
app_id = "cli_xxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = []
use_feishu = false              # true for Feishu (China), false for Lark (International)
receive_mode = "websocket"      # "websocket" | "webhook"
mention_only = false
```

**Signal :**

```toml
[channels.signal]
phone_number = "+1234567890"
signal_cli_path = "/usr/local/bin/signal-cli"
allowed_users = ["+1987654321"]
```

**Matrix (avec E2EE) :**

```toml
[channels.matrix]
homeserver_url = "https://matrix.org"
username = "@prx-bot:matrix.org"
password = "secure-password"
allowed_users = ["@alice:matrix.org"]
```

**Email (IMAP/SMTP) :**

```toml
[channels.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 587
username = "prx-bot@gmail.com"
password = "app-specific-password"
allowed_from = ["alice@example.com"]
```

**DingTalk :**

```toml
[channels.dingtalk]
app_key = "dingxxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
robot_code = "dingxxxxxxxxx"
allowed_users = []
```

## Politiques de messages prives

PRX offre un controle precis sur qui peut envoyer des messages prives a votre agent. La politique de MP est configuree par canal et determine comment les messages prives entrants sont traites.

### Types de politiques

| Politique | Comportement |
|-----------|-------------|
| `pairing` | Necessite un echange d'appairage avant que l'expediteur soit accepte. L'utilisateur doit completer un flux defi-reponse pour s'authentifier. Fonctionnalite future -- se rabat actuellement sur `allowlist`. |
| `allowlist` | **(Par defaut)** Seuls les expediteurs listes dans le tableau `allowed_users` du canal peuvent interagir avec l'agent. Les messages d'expediteurs non listes sont silencieusement ignores. |
| `open` | N'importe quel utilisateur peut envoyer des messages prives a l'agent. A utiliser avec precaution en production. |
| `disabled` | Tous les messages prives sont ignores. Utile lorsque PRX ne doit repondre que dans les groupes. |

### Configuration

Les politiques de MP sont definies au premier niveau de la configuration des canaux :

```toml
[channels]
dm_policy = "allowlist"         # "pairing" | "allowlist" | "open" | "disabled"
```

Le tableau `allowed_users` de chaque canal constitue la liste autorisee pour ce canal :

```toml
[channels.telegram]
bot_token = "..."
allowed_users = ["alice", "bob"]  # Only these users can DM
```

Lorsque `dm_policy = "open"`, le champ `allowed_users` est ignore et tous les expediteurs sont acceptes.

## Politiques de groupe

De maniere similaire aux politiques de MP, PRX controle les conversations de groupe auxquelles l'agent participe :

| Politique | Comportement |
|-----------|-------------|
| `allowlist` | **(Par defaut)** Seuls les groupes listes dans la liste autorisee du canal sont surveilles. |
| `open` | L'agent repond dans n'importe quel groupe ou il est ajoute. |
| `disabled` | Tous les messages de groupe sont ignores. |

```toml
[channels]
group_policy = "allowlist"

[channels.telegram]
bot_token = "..."
# Group allowlist is configured per-channel
```

## Mode mention uniquement

La plupart des canaux prennent en charge un drapeau `mention_only`. Quand il est active, l'agent ne repond qu'aux messages qui le mentionnent explicitement (via @mention, reponse, ou declencheur specifique a la plateforme). Cela est utile dans les chats de groupe pour eviter que l'agent reponde a chaque message.

```toml
[channels.discord]
bot_token = "..."
mention_only = true   # Only respond when @mentioned
```

## Mode streaming

Certains canaux prennent en charge le streaming des reponses LLM en temps reel. Le parametre `stream_mode` controle comment la sortie en streaming est affichee :

| Mode | Comportement |
|------|-------------|
| `edit` | Edite le meme message au fur et a mesure que les tokens arrivent (Telegram, Discord) |
| `append` | Ajoute le nouveau texte au message |
| `none` | Attend la reponse complete avant d'envoyer |

```toml
[channels.telegram]
bot_token = "..."
stream_mode = "edit"
draft_update_interval_ms = 1000   # How often to update the draft (ms)
```

## Ajouter un nouveau canal

Les canaux PRX sont bases sur le trait `Channel`. Pour connecter un nouveau canal :

1. Ajoutez la configuration du canal dans votre `openprx.toml`
2. Redemarrez le daemon : `prx daemon`

Alternativement, utilisez l'assistant interactif de canal :

```bash
prx channel add telegram
```

Pour lister les canaux actifs :

```bash
prx channel list
```

Pour diagnostiquer les problemes de connectivite des canaux :

```bash
prx channel doctor
```

## Architecture des canaux

En interne, chaque canal :

1. **Ecoute** les messages entrants de la plateforme (via polling, webhooks ou WebSocket)
2. **Filtre** les messages en fonction des politiques de MP/groupe et des listes autorisees
3. **Route** les messages acceptes vers la boucle de l'agent pour traitement
4. **Envoie** la reponse de l'agent via l'API de la plateforme
5. **Rapporte** l'etat de sante et se reconnecte automatiquement avec backoff exponentiel

Tous les canaux s'executent de maniere concurrente au sein du processus daemon, partageant le runtime de l'agent, la memoire et les sous-systemes d'outils.

## Prochaines etapes

Choisissez un canal pour en savoir plus sur sa configuration specifique :

- [Telegram](./telegram) -- Integration Bot API
- [Discord](./discord) -- Bot avec commandes slash
- [Slack](./slack) -- Application Slack avec Socket Mode
- [WhatsApp](./whatsapp) -- Integration Cloud API
- [Signal](./signal) -- Pont Signal CLI
- [Matrix](./matrix) -- Chat federe avec E2EE
- [Lark / Feishu](./lark) -- Messagerie d'entreprise
- [Email](./email) -- Integration IMAP/SMTP
