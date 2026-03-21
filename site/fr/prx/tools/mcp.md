---
title: Integration MCP
description: Client Model Context Protocol pour la connexion a des serveurs MCP externes via les transports stdio ou HTTP avec decouverte dynamique d'outils et espacement de noms.
---

# Integration MCP

PRX implemente un client Model Context Protocol (MCP) qui se connecte a des serveurs MCP externes et expose leurs outils a l'agent. MCP est un protocole ouvert qui standardise la communication entre les applications LLM et les fournisseurs d'outils externes, permettant a PRX de s'integrer a un ecosysteme croissant de serveurs compatibles MCP pour les systemes de fichiers, les bases de donnees, les API et plus encore.

L'outil `mcp` est protege par un feature gate et necessite `mcp.enabled = true` avec au moins un serveur defini. PRX prend en charge le transport stdio (communication par processus local) et le transport HTTP (communication avec un serveur distant). Les outils des serveurs MCP sont decouverts dynamiquement a l'execution via la methode de protocole `tools/list` et sont espaces de noms pour eviter les collisions avec les outils integres.

PRX prend egalement en charge la decouverte locale de `mcp.json` dans l'espace de travail, suivant le meme format utilise par VS Code et Claude Desktop, facilitant le partage de configurations de serveurs MCP entre outils.

## Configuration

### Definitions de serveurs dans config.toml

Definissez les serveurs MCP dans la section `[mcp.servers]` :

```toml
[mcp]
enabled = true

# ── Transport stdio (processus local) ──────────────────────────
[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
enabled = true
startup_timeout_ms = 10000
request_timeout_ms = 30000
tool_name_prefix = "fs"

[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }
tool_name_prefix = "gh"

[mcp.servers.sqlite]
transport = "stdio"
command = "uvx"
args = ["mcp-server-sqlite", "--db-path", "/home/user/data.db"]
tool_name_prefix = "sql"

# ── Transport HTTP (serveur distant) ───────────────────────────
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/sse"
request_timeout_ms = 60000
tool_name_prefix = "api"

[mcp.servers.streamable]
transport = "streamable_http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 30000
```

### Configuration par serveur

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `enabled` | `bool` | `true` | Activer ou desactiver ce serveur |
| `transport` | `string` | `"stdio"` | Type de transport : `"stdio"`, `"http"`, `"streamable_http"` |
| `command` | `string` | -- | Commande pour le transport stdio (par ex., `"npx"`, `"uvx"`, `"node"`) |
| `args` | `string[]` | `[]` | Arguments pour la commande stdio |
| `url` | `string` | -- | URL pour le transport HTTP |
| `env` | `map` | `{}` | Variables d'environnement pour le processus stdio |
| `startup_timeout_ms` | `u64` | `10000` | Temps maximum d'attente pour le demarrage du serveur |
| `request_timeout_ms` | `u64` | `30000` | Delai d'attente par requete |
| `tool_name_prefix` | `string` | `"mcp"` | Prefixe pour les noms d'outils (par ex., `"fs"` donne `"fs_read_file"`) |
| `allow_tools` | `string[]` | `[]` | Liste d'autorisation d'outils (vide = autoriser tous les outils decouverts) |
| `deny_tools` | `string[]` | `[]` | Liste de refus d'outils (prioritaire sur la liste d'autorisation) |

### mcp.json local a l'espace de travail

PRX decouvre les serveurs MCP depuis un fichier `mcp.json` local a l'espace de travail, suivant le meme format que VS Code et Claude Desktop :

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    },
    "python-tools": {
      "command": "python3",
      "args": ["-m", "my_mcp_module"],
      "env": {}
    }
  }
}
```

Placez ce fichier dans le repertoire racine de l'espace de travail. PRX verifie `mcp.json` au demarrage et lors du rafraichissement des outils.

**Liste blanche de lanceurs securises** : Les commandes dans `mcp.json` sont restreintes a une liste blanche de lanceurs securises :

| Lanceur | Langage / Plateforme |
|---------|---------------------|
| `npx` | Node.js (npm) |
| `node` | Node.js |
| `python` | Python |
| `python3` | Python 3 |
| `uvx` | Python (uv) |
| `uv` | Python (uv) |
| `deno` | Deno |
| `bun` | Bun |
| `docker` | Docker |
| `cargo` | Rust |
| `go` | Go |
| `ruby` | Ruby |
| `php` | PHP |
| `dotnet` | .NET |
| `java` | Java |

Les commandes absentes de cette liste blanche sont rejetees pour empecher l'execution arbitraire de commandes via les fichiers `mcp.json`.

## Utilisation

### Decouverte dynamique d'outils

Les outils MCP sont decouverts automatiquement lorsque le client MCP se connecte aux serveurs. L'agent les voit comme des outils reguliers dans son registre d'outils :

```
Available MCP tools:
  fs_read_file          - Read the contents of a file
  fs_write_file         - Write content to a file
  fs_list_directory     - List directory contents
  gh_create_issue       - Create a GitHub issue
  gh_search_code        - Search code on GitHub
  sql_query             - Execute a SQL query
  sql_list_tables       - List database tables
```

### Espacement de noms des outils

Les outils de chaque serveur MCP sont prefixes avec le `tool_name_prefix` configure pour eviter les collisions de noms :

- Le serveur `filesystem` avec le prefixe `"fs"` expose `fs_read_file`, `fs_write_file`, etc.
- Le serveur `github` avec le prefixe `"gh"` expose `gh_create_issue`, `gh_search_code`, etc.
- Le serveur `sqlite` avec le prefixe `"sql"` expose `sql_query`, `sql_list_tables`, etc.

Si deux serveurs exposent un outil avec le meme nom de base, le prefixe les distingue.

### Rafraichissement des outils

L'outil `mcp` prend en charge un hook `refresh()` qui re-decouvre les outils avant chaque tour d'agent. Cela signifie :

- Les nouveaux outils ajoutes a un serveur MCP deviennent disponibles sans redemarrer PRX
- Les outils supprimes ne sont plus proposes au LLM
- Les modifications de schema d'outils sont refletees immediatement

### Invocation par l'agent

L'agent invoque les outils MCP de la meme maniere que les outils integres :

```json
{
  "name": "gh_create_issue",
  "arguments": {
    "owner": "openprx",
    "repo": "prx",
    "title": "Add support for MCP resource subscriptions",
    "body": "PRX should support MCP resource change notifications..."
  }
}
```

PRX route cet appel vers le serveur MCP approprie, envoie la requete via le transport configure et retourne le resultat au LLM.

## Details des transports

### Transport stdio

Le transport stdio lance le serveur MCP comme processus enfant et communique via stdin/stdout en utilisant JSON-RPC :

```
Processus PRX
    |
    +-- stdin  --> Processus serveur MCP
    +-- stdout <-- Processus serveur MCP
```

- Le serveur est demarre a la premiere utilisation (initialisation paresseuse) ou au demarrage du daemon
- Le cycle de vie du processus est gere par PRX (redemarrage automatique en cas de crash)
- La sortie stderr du serveur est capturee pour les diagnostics

### Transport HTTP

Le transport HTTP se connecte a un serveur MCP distant via HTTP :

```
PRX  --HTTP/SSE-->  Serveur MCP distant
```

- Prend en charge les Server-Sent Events (SSE) pour les reponses en streaming
- La connexion est etablie au premier appel d'outil
- Prend en charge l'authentification via les en-tetes (configurable par serveur)

### Transport HTTP streamable

Le transport HTTP streamable utilise le protocole HTTP streamable MCP plus recent :

```
PRX  --HTTP POST-->  Serveur MCP (streamable)
     <--Streaming--
```

Ce transport est plus efficace que le SSE pour la communication bidirectionnelle et constitue le transport recommande pour les nouvelles implementations de serveurs MCP.

## Parametres

L'outil MCP lui-meme n'a pas de parametres fixes. Chaque serveur MCP expose ses propres outils avec leurs propres schemas de parametres, decouverts via la methode de protocole `tools/list`. Les parametres sont definis par les implementations individuelles des serveurs MCP.

Le meta-outil MCP (utilise pour la gestion) prend en charge :

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|--------|--------|-------------|
| `action` | `string` | Non | -- | Action de gestion : `"status"`, `"refresh"`, `"servers"` |

## Securite

### Assainissement des variables d'environnement

PRX supprime automatiquement les variables d'environnement dangereuses des processus de serveurs MCP pour prevenir les attaques par injection :

| Variable supprimee | Risque |
|--------------------|--------|
| `LD_PRELOAD` | Injection de bibliotheque (Linux) |
| `DYLD_INSERT_LIBRARIES` | Injection de bibliotheque (macOS) |
| `NODE_OPTIONS` | Manipulation du runtime Node.js |
| `PYTHONPATH` | Detournement du chemin de modules Python |
| `PYTHONSTARTUP` | Injection de script de demarrage Python |
| `RUBYOPT` | Injection d'options du runtime Ruby |
| `PERL5OPT` | Injection d'options du runtime Perl |

Seules les variables `env` explicitement configurees plus les variables systeme securisees sont transmises au processus enfant.

### Liste blanche de commandes pour mcp.json

Le format de fichier `mcp.json` est pratique mais potentiellement dangereux. PRX attenue cela en restreignant les commandes a une liste blanche de lanceurs securises connus. Cela empeche un `mcp.json` malveillant d'executer des binaires arbitraires.

### Listes d'autorisation/refus d'outils

Le filtrage d'outils par serveur controle quels outils sont exposes a l'agent :

```toml
[mcp.servers.filesystem]
# N'exposer que ces outils
allow_tools = ["read_file", "list_directory"]
# Bloquer ces outils meme s'ils sont decouverts
deny_tools = ["write_file", "delete_file"]
```

La liste de refus a la priorite sur la liste d'autorisation. Cela permet une approche de defense en profondeur ou vous pouvez autoriser tous les outils par defaut mais bloquer explicitement les outils dangereux.

### Isolation reseau

Pour les serveurs a transport stdio, le processus serveur herite de la configuration du sandbox. Si le sandbox bloque l'acces reseau, le serveur MCP ne peut pas non plus effectuer de requetes reseau.

Pour les serveurs a transport HTTP, la securite du serveur distant est hors du controle de PRX. Assurez-vous que les URLs de transport HTTP pointent uniquement vers des serveurs de confiance.

### Moteur de politiques

Les outils MCP sont gouvernes par le moteur de politiques de securite :

```toml
[security.tool_policy.tools]
mcp = "allow"           # Autoriser tous les outils MCP globalement
fs_write_file = "deny"  # Bloquer des outils MCP specifiques par nom prefixe
```

### Journalisation d'audit

Toutes les invocations d'outils MCP sont enregistrees dans le journal d'audit, incluant :

- Le nom du serveur et le nom de l'outil
- Les arguments (avec les valeurs sensibles expurgees)
- Le statut de la reponse
- Le temps d'execution

## Voir aussi

- [Reference de configuration](/fr/prx/config/reference) -- parametres `[mcp]` et `[mcp.servers]`
- [Apercu des outils](/fr/prx/tools/) -- outils integres et apercu de l'integration MCP
- [Sandbox de securite](/fr/prx/security/sandbox) -- sandbox pour les processus de serveurs MCP
- [Gestion des secrets](/fr/prx/security/secrets) -- stockage chiffre pour les identifiants des serveurs MCP
- [Execution Shell](/fr/prx/tools/shell) -- alternative pour executer des outils via des commandes shell
