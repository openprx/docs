---
title: Reference de la configuration
description: Reference complete champ par champ de toutes les sections et options de configuration PRX.
---

# Reference de la configuration

Cette page documente chaque section et champ de la configuration dans le fichier `config.toml` de PRX. Les champs marques avec une valeur par defaut peuvent etre omis -- PRX utilisera la valeur par defaut.

## Premier niveau (parametres par defaut)

Ces champs apparaissent au niveau racine de `config.toml`, en dehors de tout en-tete de section.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `default_provider` | `string` | `"openrouter"` | ID ou alias du fournisseur (ex. `"anthropic"`, `"openai"`, `"ollama"`) |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | Identifiant du modele route via le fournisseur selectionne |
| `default_temperature` | `float` | `0.7` | Temperature d'echantillonnage (0.0--2.0). Plus basse = plus deterministe |
| `api_key` | `string?` | `null` | Cle API pour le fournisseur selectionne. Surcharge par les variables d'environnement specifiques au fournisseur |
| `api_url` | `string?` | `null` | Surcharge de l'URL de base pour l'API du fournisseur (ex. endpoint Ollama distant) |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

Serveur de passerelle HTTP pour les endpoints webhook, l'appairage et l'API web.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `host` | `string` | `"127.0.0.1"` | Adresse de liaison. Utilisez `"0.0.0.0"` pour l'acces public |
| `port` | `u16` | `16830` | Port d'ecoute |
| `require_pairing` | `bool` | `true` | Exiger l'appairage d'appareil avant d'accepter les requetes API |
| `allow_public_bind` | `bool` | `false` | Autoriser la liaison a une adresse non-localhost sans tunnel |
| `pair_rate_limit_per_minute` | `u32` | `5` | Nombre max de requetes d'appairage par minute par client |
| `webhook_rate_limit_per_minute` | `u32` | `60` | Nombre max de requetes webhook par minute par client |
| `api_rate_limit_per_minute` | `u32` | `120` | Nombre max de requetes API par minute par token authentifie |
| `trust_forwarded_headers` | `bool` | `false` | Faire confiance aux en-tetes `X-Forwarded-For` / `X-Real-IP` (activer uniquement derriere un proxy inverse) |
| `request_timeout_secs` | `u64` | `300` | Delai d'attente du gestionnaire HTTP en secondes |
| `idempotency_ttl_secs` | `u64` | `300` | TTL pour les cles d'idempotence des webhooks |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
La modification de `host` ou `port` necessite un redemarrage complet. Ces valeurs sont liees au demarrage du serveur et ne peuvent pas etre rechargees a chaud.
:::

## `[channels_config]`

Configuration des canaux de premier niveau. Les canaux individuels sont des sous-sections imbriquees.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `cli` | `bool` | `true` | Activer le canal CLI interactif |
| `message_timeout_secs` | `u64` | `300` | Delai de traitement par message (LLM + outils) |

### `[channels_config.telegram]`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `bot_token` | `string` | *(requis)* | Token de l'API Bot Telegram depuis @BotFather |
| `allowed_users` | `string[]` | `[]` | ID ou noms d'utilisateur Telegram autorises. Vide = tout refuser |
| `mention_only` | `bool` | `false` | Dans les groupes, repondre uniquement aux messages qui mentionnent le bot avec @ |
| `stream_mode` | `"off" \| "partial"` | `"off"` | Mode streaming : `off` envoie la reponse complete, `partial` edite un brouillon progressivement |
| `draft_update_interval_ms` | `u64` | `1000` | Intervalle minimum entre les editions de brouillon (protection de limite de debit) |
| `interrupt_on_new_message` | `bool` | `false` | Annuler la reponse en cours lorsque le meme utilisateur envoie un nouveau message |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `bot_token` | `string` | *(requis)* | Token du bot Discord depuis le portail developpeur |
| `guild_id` | `string?` | `null` | Restreindre a un seul serveur (guild) |
| `allowed_users` | `string[]` | `[]` | ID d'utilisateurs Discord autorises. Vide = tout refuser |
| `listen_to_bots` | `bool` | `false` | Traiter les messages d'autres bots (les propres messages sont toujours ignores) |
| `mention_only` | `bool` | `false` | Repondre uniquement aux @-mentions |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `bot_token` | `string` | *(requis)* | Token OAuth du bot Slack (`xoxb-...`) |
| `app_token` | `string?` | `null` | Token au niveau de l'application pour le mode Socket (`xapp-...`) |
| `channel_id` | `string?` | `null` | Restreindre a un seul canal |
| `allowed_users` | `string[]` | `[]` | ID d'utilisateurs Slack autorises. Vide = tout refuser |
| `mention_only` | `bool` | `false` | Repondre uniquement aux @-mentions dans les groupes |

### `[channels_config.lark]`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `app_id` | `string` | *(requis)* | ID de l'application Lark/Feishu |
| `app_secret` | `string` | *(requis)* | Secret de l'application Lark/Feishu |
| `encrypt_key` | `string?` | `null` | Cle de chiffrement des evenements |
| `verification_token` | `string?` | `null` | Token de verification des evenements |
| `allowed_users` | `string[]` | `[]` | ID d'utilisateurs autorises. Vide = tout refuser |
| `use_feishu` | `bool` | `false` | Utiliser les endpoints API Feishu (Chine) au lieu de Lark (international) |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | Mode de reception des messages |
| `port` | `u16?` | `null` | Port d'ecoute webhook (uniquement pour le mode webhook) |
| `mention_only` | `bool` | `false` | Repondre uniquement aux @-mentions |

PRX prend egalement en charge ces canaux supplementaires (configures sous `[channels_config.*]`) :

- **Matrix** -- `homeserver`, `access_token`, listes d'autorisation de salons
- **Signal** -- via l'API REST signal-cli
- **WhatsApp** -- API Cloud ou mode Web
- **iMessage** -- macOS uniquement, listes d'autorisation de contacts
- **DingTalk** -- Mode Stream avec `client_id` / `client_secret`
- **QQ** -- SDK Bot officiel avec `app_id` / `app_secret`
- **Email** -- IMAP/SMTP
- **IRC** -- Serveur, canal, pseudo
- **Mattermost** -- URL + token de bot
- **Nextcloud Talk** -- URL de base + token d'application
- **Webhook** -- Webhooks entrants generiques

## `[memory]`

Backend memoire pour l'historique de conversation, les connaissances et les embeddings.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `backend` | `string` | `"sqlite"` | Type de backend : `"sqlite"`, `"lucid"`, `"postgres"`, `"markdown"`, `"none"` |
| `auto_save` | `bool` | `true` | Sauvegarder automatiquement les entrees de conversation de l'utilisateur en memoire |
| `acl_enabled` | `bool` | `false` | Activer les listes de controle d'acces memoire |
| `hygiene_enabled` | `bool` | `true` | Executer l'archivage periodique et le nettoyage de retention |
| `archive_after_days` | `u32` | `7` | Archiver les fichiers quotidiens/de session plus anciens que cette valeur |
| `purge_after_days` | `u32` | `30` | Purger les fichiers archives plus anciens que cette valeur |
| `conversation_retention_days` | `u32` | `3` | SQLite : elaguer les lignes de conversation plus anciennes que cette valeur |
| `daily_retention_days` | `u32` | `7` | SQLite : elaguer les lignes quotidiennes plus anciennes que cette valeur |
| `embedding_provider` | `string` | `"none"` | Fournisseur d'embeddings : `"none"`, `"openai"`, `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | Nom du modele d'embedding |
| `embedding_dimensions` | `usize` | `1536` | Dimensions du vecteur d'embedding |
| `vector_weight` | `f64` | `0.7` | Poids de la similarite vectorielle dans la recherche hybride (0.0--1.0) |
| `keyword_weight` | `f64` | `0.3` | Poids de la recherche par mots-cles BM25 (0.0--1.0) |
| `min_relevance_score` | `f64` | `0.4` | Score hybride minimum pour inclure la memoire dans le contexte |
| `embedding_cache_size` | `usize` | `10000` | Nombre max d'entrees de cache d'embeddings avant eviction LRU |
| `snapshot_enabled` | `bool` | `false` | Exporter les memoires centrales vers `MEMORY_SNAPSHOT.md` |
| `snapshot_on_hygiene` | `bool` | `false` | Executer le snapshot pendant les passes d'hygiene |
| `auto_hydrate` | `bool` | `true` | Charger automatiquement depuis le snapshot quand `brain.db` est absent |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

Routeur LLM heuristique pour les deploiements multi-modeles. Evalue les modeles candidats en utilisant une formule ponderee combinant capacite, score Elo, cout et latence.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `false` | Activer le routage heuristique |
| `alpha` | `f32` | `0.0` | Poids du score de similarite |
| `beta` | `f32` | `0.5` | Poids du score de capacite |
| `gamma` | `f32` | `0.3` | Poids du score Elo |
| `delta` | `f32` | `0.1` | Coefficient de penalite de cout |
| `epsilon` | `f32` | `0.1` | Coefficient de penalite de latence |
| `knn_enabled` | `bool` | `false` | Activer le routage semantique KNN depuis l'historique |
| `knn_min_records` | `usize` | `10` | Nombre minimum d'enregistrements historiques avant que le KNN n'affecte le routage |
| `knn_k` | `usize` | `7` | Nombre de plus proches voisins pour le vote |

### `[router.automix]`

Politique d'escalade adaptative : commencer avec un modele economique, escalader vers le premium quand la confiance diminue.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `false` | Activer l'escalade Automix |
| `confidence_threshold` | `f32` | `0.7` | Escalader quand la confiance tombe en dessous de cette valeur (0.0--1.0) |
| `cheap_model_tiers` | `string[]` | `[]` | Niveaux de modeles consideres comme "economiques d'abord" |
| `premium_model_id` | `string` | `""` | Modele utilise pour l'escalade |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

Securite au niveau OS : sandboxing, limites de ressources et journalisation d'audit.

### `[security.sandbox]`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool?` | `null` (auto-detection) | Activer l'isolation sandbox |
| `backend` | `string` | `"auto"` | Backend : `"auto"`, `"landlock"`, `"firejail"`, `"bubblewrap"`, `"docker"`, `"none"` |
| `firejail_args` | `string[]` | `[]` | Arguments Firejail personnalises |

### `[security.resources]`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `max_memory_mb` | `u32` | `512` | Memoire maximum par commande (Mo) |
| `max_cpu_time_seconds` | `u64` | `60` | Temps CPU maximum par commande |
| `max_subprocesses` | `u32` | `10` | Nombre maximum de sous-processus |
| `memory_monitoring` | `bool` | `true` | Activer la surveillance de l'utilisation memoire |

### `[security.audit]`

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `true` | Activer la journalisation d'audit |
| `log_path` | `string` | `"audit.log"` | Chemin du fichier de journal d'audit (relatif au repertoire de configuration) |
| `max_size_mb` | `u32` | `100` | Taille maximum du journal avant rotation |
| `sign_events` | `bool` | `false` | Signer les evenements avec HMAC pour la preuve d'integrite |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

Backend de metriques et de tracing distribue.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `backend` | `string` | `"none"` | Backend : `"none"`, `"log"`, `"prometheus"`, `"otel"` |
| `otel_endpoint` | `string?` | `null` | URL du endpoint OTLP (ex. `"http://localhost:4318"`) |
| `otel_service_name` | `string?` | `null` | Nom du service pour le collecteur OTel (par defaut `"prx"`) |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

Integration du serveur [Model Context Protocol](https://modelcontextprotocol.io/). PRX agit en tant que client MCP, se connectant a des serveurs MCP externes pour des outils supplementaires.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `false` | Activer l'integration client MCP |

### `[mcp.servers.<name>]`

Chaque serveur nomme est une sous-section sous `[mcp.servers]`.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `true` | Commutateur d'activation par serveur |
| `transport` | `"stdio" \| "http"` | `"stdio"` | Type de transport |
| `command` | `string?` | `null` | Commande pour le mode stdio |
| `args` | `string[]` | `[]` | Arguments de commande pour le mode stdio |
| `url` | `string?` | `null` | URL pour le transport HTTP |
| `env` | `map<string, string>` | `{}` | Variables d'environnement pour le mode stdio |
| `startup_timeout_ms` | `u64` | `10000` | Delai de demarrage |
| `request_timeout_ms` | `u64` | `30000` | Delai par requete |
| `tool_name_prefix` | `string` | `"mcp"` | Prefixe pour les noms d'outils exposes |
| `allow_tools` | `string[]` | `[]` | Liste blanche d'outils (vide = tous) |
| `deny_tools` | `string[]` | `[]` | Liste noire d'outils |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

Configuration de l'outil d'automatisation du navigateur.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `false` | Activer l'outil `browser_open` |
| `allowed_domains` | `string[]` | `[]` | Domaines autorises (correspondance exacte ou sous-domaine) |
| `session_name` | `string?` | `null` | Session de navigateur nommee pour l'automatisation |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

Configuration des outils de recherche web et de telechargement d'URL.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `false` | Activer l'outil `web_search` |
| `provider` | `string` | `"duckduckgo"` | Fournisseur de recherche : `"duckduckgo"` (gratuit) ou `"brave"` (cle API requise) |
| `brave_api_key` | `string?` | `null` | Cle API Brave Search |
| `max_results` | `usize` | `5` | Nombre maximum de resultats par recherche (1--10) |
| `timeout_secs` | `u64` | `15` | Delai de la requete |
| `fetch_enabled` | `bool` | `true` | Activer l'outil `web_fetch` |
| `fetch_max_chars` | `usize` | `10000` | Nombre max de caracteres retournes par `web_fetch` |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

Moteur de taches autonomes Xin (coeur/esprit) -- planifie et execute les taches en arriere-plan incluant l'evolution, les verifications de fitness et les operations d'hygiene.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `false` | Activer le moteur de taches Xin |
| `interval_minutes` | `u32` | `5` | Intervalle de tick en minutes (minimum 1) |
| `max_concurrent` | `usize` | `4` | Nombre maximum d'executions de taches concurrentes par tick |
| `max_tasks` | `usize` | `128` | Nombre maximum total de taches dans le stockage |
| `stale_timeout_minutes` | `u32` | `60` | Minutes avant qu'une tache en cours soit marquee comme perimee |
| `builtin_tasks` | `bool` | `true` | Enregistrer automatiquement les taches systeme integrees |
| `evolution_integration` | `bool` | `false` | Laisser Xin gerer la planification de l'evolution/fitness |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

Limites de depenses et tarification par modele pour le suivi des couts.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `false` | Activer le suivi des couts |
| `daily_limit_usd` | `f64` | `10.0` | Limite de depenses quotidienne en USD |
| `monthly_limit_usd` | `f64` | `100.0` | Limite de depenses mensuelle en USD |
| `warn_at_percent` | `u8` | `80` | Avertir quand les depenses atteignent ce pourcentage de la limite |
| `allow_override` | `bool` | `false` | Autoriser les requetes a depasser le budget avec le drapeau `--override` |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

Configuration de la chaine de reessai et de basculement pour un acces resilient aux fournisseurs.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `max_retries` | `u32` | `3` | Nombre maximum de tentatives de reessai pour les echecs transitoires |
| `fallback_providers` | `string[]` | `[]` | Liste ordonnee de noms de fournisseurs de secours |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

Stockage de secrets chiffres utilisant ChaCha20-Poly1305.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `encrypt` | `bool` | `true` | Activer le chiffrement des cles API et tokens dans la configuration |

## `[auth]`

Parametres d'import d'identifiants externes.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `codex_auth_json_auto_import` | `bool` | `true` | Importer automatiquement les identifiants OAuth depuis le fichier `auth.json` de Codex CLI |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | Chemin vers le fichier auth de Codex CLI |

## `[proxy]`

Configuration de proxy sortant HTTP/HTTPS/SOCKS5.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `false` | Activer le proxy |
| `http_proxy` | `string?` | `null` | URL du proxy HTTP |
| `https_proxy` | `string?` | `null` | URL du proxy HTTPS |
| `all_proxy` | `string?` | `null` | Proxy de secours pour tous les schemas |
| `no_proxy` | `string[]` | `[]` | Liste de contournement (meme format que `NO_PROXY`) |
| `scope` | `string` | `"zeroclaw"` | Portee : `"environment"`, `"zeroclaw"`, `"services"` |
| `services` | `string[]` | `[]` | Selecteurs de services quand la portee est `"services"` |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```
