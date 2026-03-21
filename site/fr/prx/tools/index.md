---
title: Apercu des outils
description: PRX fournit plus de 46 outils integres organises en 12 categories. Les outils sont des capacites que l'agent peut invoquer pendant les boucles agentiques pour interagir avec l'OS, le reseau, la memoire et les services externes.
---

# Apercu des outils

Les outils sont les capacites qu'un agent PRX peut invoquer pendant sa boucle de raisonnement. Lorsque le LLM decide qu'il doit effectuer une action -- executer une commande, lire un fichier, rechercher sur le web, stocker un souvenir -- il appelle un outil par son nom avec des arguments JSON structures. PRX execute l'outil, applique les politiques de securite et retourne le resultat au LLM pour l'etape de raisonnement suivante.

PRX est livre avec **plus de 46 outils integres** repartis en 12 categories, de l'E/S de fichiers basique a l'automatisation du navigateur, la delegation multi-agents et l'integration du protocole MCP.

## Architecture des outils

Chaque outil implemente le trait `Tool` :

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters_schema(&self) -> serde_json::Value;
    async fn execute(&self, args: serde_json::Value) -> Result<ToolResult>;
}
```

Chaque outil fournit un JSON Schema pour ses parametres, qui est envoye au LLM comme definition de fonction. Le LLM genere des appels structures, et PRX valide les arguments contre le schema avant l'execution.

## Registre d'outils : `default_tools()` vs `all_tools()`

PRX utilise un systeme de registre a deux niveaux :

### `default_tools()` -- Noyau minimal (3 outils)

L'ensemble minimal d'outils pour les agents legers ou restreints. Toujours disponible, aucune configuration supplementaire requise :

| Outil | Description |
|-------|-------------|
| `shell` | Execution de commandes shell avec isolation sandbox |
| `file_read` | Lecture du contenu des fichiers (compatible ACL) |
| `file_write` | Ecriture du contenu des fichiers |

### `all_tools()` -- Registre complet (46+ outils)

L'ensemble complet d'outils, assemble en fonction de votre configuration. Les outils sont enregistres conditionnellement selon les fonctionnalites activees :

- **Toujours enregistres** : outils de base, memoire, cron, planification, git, vision, noeuds, pushover, canvas, config proxy, schema
- **Enregistres conditionnellement** : navigateur (necessite `browser.enabled`), requetes HTTP (necessite `http_request.enabled`), recherche web (necessite `web_search.enabled`), web fetch (necessite `web_search.fetch_enabled` + `browser.allowed_domains`), MCP (necessite `mcp.enabled`), Composio (necessite une cle API), delegate/agents_list (necessite des definitions d'agents)

## Reference par categorie

### Noyau (3 outils) -- Toujours disponible

Les outils de fondation presents dans `default_tools()` et `all_tools()`.

| Outil | Description |
|-------|-------------|
| `shell` | Executer des commandes shell avec isolation sandbox configurable (Landlock/Firejail/Bubblewrap/Docker). Timeout de 60s, limite de sortie 1 Mo, environnement assaini. |
| `file_read` | Lire le contenu des fichiers avec validation de chemin. Lorsque l'ACL memoire est active, bloque l'acces aux fichiers markdown de memoire pour appliquer le controle d'acces. |
| `file_write` | Ecrire du contenu dans des fichiers. Soumis aux verifications de politique de securite. |

### Memoire (5 outils)

Operations de memoire a long terme pour stocker, recuperer et gerer les connaissances persistantes de l'agent.

| Outil | Description |
|-------|-------------|
| `memory_store` | Stocker des faits, preferences ou notes dans la memoire a long terme. Prend en charge les categories : `core` (permanent), `daily` (session), `conversation` (contexte de chat), ou personnalise. |
| `memory_forget` | Supprimer des entrees specifiques de la memoire a long terme. |
| `memory_get` | Recuperer une entree memoire specifique par cle. Compatible ACL lorsqu'active. |
| `memory_recall` | Rappeler des souvenirs par mot-cle ou similarite semantique. Desactive lorsque l'ACL memoire est activee. |
| `memory_search` | Recherche texte integral et vectorielle dans les entrees memoire. Compatible ACL lorsqu'active. |

### Cron / Planification (9 outils)

Automatisation de taches basee sur le temps et le moteur de planification Xin.

| Outil | Description |
|-------|-------------|
| `cron` | Point d'entree cron legacy -- creer ou gerer des taches planifiees. |
| `cron_add` | Ajouter une nouvelle tache cron avec expression cron, commande et description optionnelle. |
| `cron_list` | Lister toutes les taches cron enregistrees avec leurs planifications et statuts. |
| `cron_remove` | Supprimer une tache cron par ID. |
| `cron_update` | Mettre a jour la planification, la commande ou les parametres d'une tache cron existante. |
| `cron_run` | Declencher manuellement une tache cron immediatement. |
| `cron_runs` | Voir l'historique d'execution et les journaux des executions de taches cron. |
| `schedule` | Planifier une tache ponctuelle ou recurrente avec des expressions temporelles en langage naturel. |
| `xin` | Le moteur de planification Xin -- planification avancee de taches avec chaines de dependances et execution conditionnelle. |

### Navigateur / Vision (5 outils)

Automatisation web et traitement d'images. Les outils navigateur necessitent `[browser] enabled = true`.

| Outil | Description |
|-------|-------------|
| `browser` | Automatisation complete du navigateur avec backends interchangeables (agent-browser CLI, Rust natif, sidecar computer-use). Prend en charge la navigation, le remplissage de formulaires, les clics, les captures d'ecran et les actions au niveau OS. |
| `browser_open` | Ouverture simple d'URL dans le navigateur. Restreint par domaine via `browser.allowed_domains`. |
| `screenshot` | Capturer des captures d'ecran de l'ecran actuel ou de fenetres specifiques. |
| `image` | Traiter et transformer des images (redimensionner, rogner, convertir les formats). |
| `image_info` | Extraire les metadonnees et dimensions des fichiers image. |

### Reseau (4 outils)

Requetes HTTP, recherche web, extraction web et integration du protocole MCP.

| Outil | Description |
|-------|-------------|
| `http_request` | Effectuer des requetes HTTP vers des API. Refus par defaut : seuls les `allowed_domains` sont accessibles. Timeout et taille de reponse max configurables. |
| `web_search_tool` | Rechercher sur le web via DuckDuckGo (gratuit, sans cle) ou Brave Search (necessite une cle API). |
| `web_fetch` | Recuperer et extraire le contenu des pages web. Necessite `web_search.fetch_enabled` et `browser.allowed_domains` definis. |
| `mcp` | Client Model Context Protocol -- se connecter a des serveurs MCP externes (transports stdio ou HTTP) et invoquer leurs outils. Prend en charge la decouverte de `mcp.json` local au workspace. |

### Messagerie (2 outils)

Envoyer des messages via les canaux de communication.

| Outil | Description |
|-------|-------------|
| `message_send` | Envoyer un message (texte, media, voix) a tout canal et destinataire configure. Route automatiquement vers le canal actif. |
| `gateway` | Acces passerelle bas niveau pour envoyer des messages bruts via la passerelle HTTP/WebSocket Axum. |

### Sessions / Agents (8 outils)

Orchestration multi-agents : lancer des sous-agents, deleguer des taches et gerer des sessions concurrentes.

| Outil | Description |
|-------|-------------|
| `sessions_spawn` | Lancer un sous-agent asynchrone qui s'execute en arriere-plan. Retourne immediatement avec un ID d'execution ; le resultat est annonce automatiquement a la fin. Prend en charge les actions `history` et `steer`. |
| `sessions_send` | Envoyer un message a une session de sous-agent en cours d'execution. |
| `sessions_list` | Lister toutes les sessions de sous-agents actives avec leur statut. |
| `sessions_history` | Voir le journal de conversation d'une execution de sous-agent. |
| `session_status` | Verifier le statut d'une session specifique. |
| `subagents` | Gerer le pool de sous-agents -- lister, arreter ou inspecter les sous-agents. |
| `agents_list` | Lister tous les agents delegues configures avec leurs modeles et capacites. Enregistre uniquement lorsque des agents sont definis dans la configuration. |
| `delegate` | Deleguer une tache a un agent nomme avec son propre fournisseur, modele et ensemble d'outils. Prend en charge les identifiants de secours et les boucles agentiques isolees. |

### Appareils distants (2 outils)

Interagir avec les noeuds distants et les notifications push.

| Outil | Description |
|-------|-------------|
| `nodes` | Gerer et communiquer avec les noeuds PRX distants dans un deploiement distribue. |
| `pushover` | Envoyer des notifications push via le service Pushover. |

### Git (1 outil)

Operations de controle de version.

| Outil | Description |
|-------|-------------|
| `git_operations` | Effectuer des operations Git (status, diff, commit, push, pull, log, branch) sur le depot du workspace. |

### Configuration (2 outils)

Gestion de la configuration a l'execution.

| Outil | Description |
|-------|-------------|
| `config_reload` | Recharger a chaud le fichier de configuration PRX sans redemarrer le processus. |
| `proxy_config` | Voir et modifier la configuration proxy/reseau a l'execution. |

### Integration tierce (1 outil)

Connecteurs de plateformes externes.

| Outil | Description |
|-------|-------------|
| `composio` | Se connecter a plus de 250 applications et services via la plateforme Composio. Necessite une cle API Composio. |

### Rendu (2 outils)

Generation de contenu et formatage de sortie.

| Outil | Description |
|-------|-------------|
| `canvas` | Rendre du contenu structure (tableaux, graphiques, diagrammes) pour une sortie visuelle. |
| `tts` | Synthese vocale -- convertir du texte en message vocal et l'envoyer a la conversation en cours. Gere automatiquement la generation MP3, la conversion M4A et la livraison. |

### Administration (1 outil)

Schema interne et diagnostics.

| Outil | Description |
|-------|-------------|
| `schema` | Nettoyage et normalisation de JSON Schema pour la compatibilite LLM inter-fournisseurs. Resout les `$ref`, aplatit les unions, supprime les mots-cles non pris en charge. |

## Matrice complete des outils

| Outil | Categorie | Defaut | Condition |
|-------|-----------|--------|-----------|
| `shell` | Noyau | Oui | Toujours |
| `file_read` | Noyau | Oui | Toujours |
| `file_write` | Noyau | Oui | Toujours |
| `memory_store` | Memoire | -- | `all_tools()` |
| `memory_forget` | Memoire | -- | `all_tools()` |
| `memory_get` | Memoire | -- | `all_tools()` |
| `memory_recall` | Memoire | -- | `all_tools()`, desactive lorsque `memory.acl_enabled = true` |
| `memory_search` | Memoire | -- | `all_tools()` |
| `cron` | Cron | -- | `all_tools()` |
| `cron_add` | Cron | -- | `all_tools()` |
| `cron_list` | Cron | -- | `all_tools()` |
| `cron_remove` | Cron | -- | `all_tools()` |
| `cron_update` | Cron | -- | `all_tools()` |
| `cron_run` | Cron | -- | `all_tools()` |
| `cron_runs` | Cron | -- | `all_tools()` |
| `schedule` | Planification | -- | `all_tools()` |
| `xin` | Planification | -- | `all_tools()` |
| `browser` | Navigateur | -- | `browser.enabled = true` |
| `browser_open` | Navigateur | -- | `browser.enabled = true` |
| `screenshot` | Vision | -- | `all_tools()` |
| `image` | Vision | -- | `all_tools()` (implicite, via ImageTool) |
| `image_info` | Vision | -- | `all_tools()` |
| `http_request` | Reseau | -- | `http_request.enabled = true` |
| `web_search_tool` | Reseau | -- | `web_search.enabled = true` |
| `web_fetch` | Reseau | -- | `web_search.fetch_enabled = true` + `browser.allowed_domains` |
| `mcp` | Reseau | -- | `mcp.enabled = true` + serveurs definis |
| `message_send` | Messagerie | -- | Canal actif (enregistre au niveau passerelle) |
| `gateway` | Messagerie | -- | `all_tools()` |
| `sessions_spawn` | Sessions | -- | `all_tools()` |
| `sessions_send` | Sessions | -- | `all_tools()` |
| `sessions_list` | Sessions | -- | `all_tools()` |
| `sessions_history` | Sessions | -- | `all_tools()` |
| `session_status` | Sessions | -- | `all_tools()` |
| `subagents` | Sessions | -- | `all_tools()` |
| `agents_list` | Agents | -- | Sections `[agents.*]` definies |
| `delegate` | Agents | -- | Sections `[agents.*]` definies |
| `nodes` | Distant | -- | `all_tools()` |
| `pushover` | Distant | -- | `all_tools()` |
| `git_operations` | Git | -- | `all_tools()` |
| `config_reload` | Config | -- | `all_tools()` |
| `proxy_config` | Config | -- | `all_tools()` |
| `composio` | Tiers | -- | `composio.api_key` defini |
| `canvas` | Rendu | -- | `all_tools()` |
| `tts` | Rendu | -- | Canal actif (enregistre au niveau passerelle) |
| `schema` | Admin | -- | Interne (module de normalisation de schema) |

## Activer et desactiver des outils

### Outils conditionnes par fonctionnalite

De nombreux outils sont actives via leurs sections de configuration respectives. Ajoutez-les a votre `config.toml` :

```toml
# ── Browser tools ──────────────────────────────────────────────
[browser]
enabled = true
allowed_domains = ["github.com", "stackoverflow.com", "*.openprx.dev"]
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# ── HTTP request tool ─────────────────────────────────────────
[http_request]
enabled = true
allowed_domains = ["api.github.com", "api.openai.com"]
max_response_size = 1000000  # 1MB
timeout_secs = 30

# ── Web search tool ───────────────────────────────────────────
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (free) or "brave" (requires API key)
# brave_api_key = "..."
max_results = 5
timeout_secs = 10

# Also enable web_fetch for page content extraction:
fetch_enabled = true
fetch_max_chars = 50000

# ── Composio integration ──────────────────────────────────────
[composio]
enabled = true
api_key = "your-composio-key"
entity_id = "default"
```

### Pipeline de politique d'outils

Pour un controle granulaire, utilisez la section `[security.tool_policy]` pour autoriser, refuser ou superviser des outils individuels ou des groupes :

```toml
[security.tool_policy]
# Default policy: "allow", "deny", or "supervised"
default = "allow"

# Group-level policies
[security.tool_policy.groups]
sessions = "allow"
automation = "allow"
hardware = "deny"

# Per-tool overrides (highest priority)
[security.tool_policy.tools]
shell = "supervised"     # Requires approval before execution
gateway = "allow"
composio = "deny"        # Disable Composio even if API key is set
```

Ordre de resolution des politiques (priorite la plus haute en premier) :
1. Politique par outil (`security.tool_policy.tools.<name>`)
2. Politique de groupe (`security.tool_policy.groups.<group>`)
3. Politique par defaut (`security.tool_policy.default`)

### Restrictions d'outils des agents delegues

Lors de la configuration d'agents delegues, vous pouvez restreindre les outils auxquels ils ont acces :

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]
```

## Integration des outils MCP

PRX implemente le client Model Context Protocol (MCP), lui permettant de se connecter a des serveurs MCP externes et d'exposer leurs outils a l'agent.

### Configuration

Definissez les serveurs MCP dans `config.toml` :

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }

[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"
```

### `mcp.json` local au workspace

PRX decouvre egalement les serveurs MCP depuis un fichier `mcp.json` local au workspace, suivant le meme format que VS Code et Claude Desktop :

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

Les commandes dans `mcp.json` sont restreintes a une liste blanche de lanceurs surs : `npx`, `node`, `python`, `python3`, `uvx`, `uv`, `deno`, `bun`, `docker`, `cargo`, `go`, `ruby`, `php`, `dotnet`, `java`.

### Decouverte dynamique d'outils

Les outils MCP sont decouverts a l'execution via la methode de protocole `tools/list`. Les outils de chaque serveur MCP sont espaces par noms et exposes au LLM comme fonctions appelables. L'outil `mcp` prend en charge un hook `refresh()` qui redecouvre les outils avant chaque tour de l'agent.

Les variables d'environnement dangereuses (`LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH`, etc.) sont automatiquement retirees des processus serveur MCP.

## Securite : Sandbox et ACL

### Sandbox des outils

L'outil `shell` execute les commandes a l'interieur d'un sandbox configurable. PRX prend en charge 4 backends de sandbox plus un repli no-op :

```toml
[security.sandbox]
enabled = true           # None = auto-detect, true/false = explicit
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# Custom Firejail arguments (when backend = "firejail")
firejail_args = ["--net=none", "--noroot"]
```

| Backend | Plateforme | Niveau d'isolation | Notes |
|---------|-----------|-------------------|-------|
| Landlock | Linux (kernel LSM) | Systeme de fichiers | Natif au noyau, aucune dependance supplementaire |
| Firejail | Linux | Complet (reseau, systeme de fichiers, PID) | Espace utilisateur, largement disponible |
| Bubblewrap | Linux, macOS | Base sur les namespaces | Namespaces utilisateur, leger |
| Docker | Tout | Conteneur | Isolation complete par conteneur |
| None | Tout | Couche applicative uniquement | Aucune isolation au niveau OS |

Le mode auto-detection (`backend = "auto"`) sonde les backends disponibles dans l'ordre : Landlock, Firejail, Bubblewrap, Docker, puis repli vers None avec un avertissement.

### Assainissement de l'environnement shell

L'outil `shell` ne transmet qu'une liste blanche stricte de variables d'environnement aux processus enfants : `PATH`, `HOME`, `TERM`, `LANG`, `LC_ALL`, `LC_CTYPE`, `USER`, `SHELL`, `TMPDIR`. Les cles API, tokens et secrets ne sont jamais exposes.

### ACL memoire

Lorsque `memory.acl_enabled = true`, le controle d'acces est applique sur les operations de memoire :

- `file_read` bloque l'acces aux fichiers markdown de memoire
- `memory_recall` est completement desactive (retire du registre d'outils)
- `memory_get` et `memory_search` appliquent des restrictions d'acces par principal

### Politique de securite

Chaque appel d'outil passe par la couche `SecurityPolicy` avant l'execution. Le moteur de politique peut :

- Bloquer les operations selon les regles de politique d'outils
- Exiger l'approbation du superviseur pour les outils `supervised`
- Auditer toutes les invocations d'outils
- Appliquer les limites de debit et les contraintes de ressources

```toml
[security.resources]
max_memory_mb = 512
max_cpu_percent = 80
max_open_files = 256
```

## Extension : Ecrire des outils personnalises

Pour ajouter un nouvel outil :

1. Creez un nouveau module dans `src/tools/` implementant le trait `Tool`
2. Enregistrez-le dans `all_tools_with_runtime_ext()` dans `src/tools/mod.rs`
3. Ajoutez les entrees `pub mod` et `pub use` dans `mod.rs`

Exemple :

```rust
use super::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::json;

pub struct MyTool { /* ... */ }

#[async_trait]
impl Tool for MyTool {
    fn name(&self) -> &str { "my_tool" }

    fn description(&self) -> &str {
        "Does something useful."
    }

    fn parameters_schema(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "input": { "type": "string", "description": "The input value" }
            },
            "required": ["input"]
        })
    }

    async fn execute(&self, args: serde_json::Value) -> anyhow::Result<ToolResult> {
        let input = args["input"].as_str().unwrap_or_default();
        Ok(ToolResult {
            success: true,
            output: format!("Processed: {input}"),
            error: None,
        })
    }
}
```

Consultez `AGENTS.md` section 7.3 pour le guide complet de modification.
