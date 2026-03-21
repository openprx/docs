---
title: Configuration
description: Apercu du systeme de configuration PRX -- configuration basee sur TOML avec rechargement a chaud, fichiers scindes, outils CLI et export de schema.
---

# Configuration

PRX utilise un systeme de configuration base sur TOML avec prise en charge du rechargement a chaud. Tous les parametres resident dans un seul fichier (avec des fragments scindes optionnels), et la plupart des modifications prennent effet immediatement sans redemarrer le daemon.

## Emplacement du fichier de configuration

Le fichier de configuration principal est :

```
~/.openprx/config.toml
```

PRX resout le repertoire de configuration dans l'ordre suivant :

1. Variable d'environnement `OPENPRX_CONFIG_DIR` (si definie)
2. Variable d'environnement `OPENPRX_WORKSPACE` (si definie)
3. Marqueur d'espace de travail actif (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (par defaut)

Le repertoire de l'espace de travail (ou sont stockes la memoire, les sessions et les donnees) est par defaut `~/.openprx/workspace/`.

## Format TOML

La configuration PRX utilise [TOML](https://toml.io/) -- un format minimal et lisible par l'homme. Voici une configuration minimale fonctionnelle :

```toml
# Provider and model selection
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (or use ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."

# Memory backend
[memory]
backend = "sqlite"
auto_save = true

# Gateway server
[gateway]
port = 16830
host = "127.0.0.1"
```

## Sections de la configuration

La configuration est organisee en ces sections de premier niveau :

| Section | Objectif |
|---------|----------|
| *(premier niveau)* | Fournisseur par defaut, modele, temperature, cle API |
| `[gateway]` | Passerelle HTTP : hote, port, appairage, limites de debit |
| `[channels_config]` | Canaux de messagerie : Telegram, Discord, Slack, etc. |
| `[channels_config.telegram]` | Configuration du bot Telegram |
| `[channels_config.discord]` | Configuration du bot Discord |
| `[memory]` | Backend memoire et parametres d'embeddings |
| `[router]` | Routeur LLM heuristique et Automix |
| `[security]` | Sandbox, limites de ressources, journalisation d'audit |
| `[autonomy]` | Niveaux d'autonomie et regles de portee des outils |
| `[observability]` | Backend de metriques et de tracing |
| `[mcp]` | Integration du serveur Model Context Protocol |
| `[browser]` | Parametres de l'outil d'automatisation du navigateur |
| `[web_search]` | Parametres des outils de recherche web et de telechargement |
| `[xin]` | Moteur de taches autonomes Xin |
| `[reliability]` | Chaines de reessai et de basculement des fournisseurs |
| `[cost]` | Limites de depenses et tarification des modeles |
| `[cron]` | Definitions de taches planifiees |
| `[self_system]` | Controles du moteur d'auto-evolution |
| `[proxy]` | Parametres de proxy HTTP/HTTPS/SOCKS5 |
| `[secrets]` | Stockage de secrets chiffres |
| `[auth]` | Import d'identifiants externes (Codex CLI, etc.) |
| `[storage]` | Fournisseur de stockage persistant |
| `[tunnel]` | Exposition par tunnel public |
| `[nodes]` | Configuration de proxy de noeuds distants |

Consultez la [Reference de la configuration](/fr/prx/config/reference) pour la documentation complete champ par champ.

## Fichiers de configuration scindes

Pour les deploiements complexes, PRX prend en charge le decoupage de la configuration en fichiers fragments sous un repertoire `config.d/` a cote de `config.toml` :

```
~/.openprx/
  config.toml          # Configuration principale (premier niveau + surcharges)
  config.d/
    channels.toml      # Section [channels_config]
    memory.toml        # Sections [memory] et [storage]
    security.toml      # Sections [security] et [autonomy]
    agents.toml        # Sections [agents] et [sessions_spawn]
    identity.toml      # Sections [identity] et [identity_bindings]
    network.toml       # Sections [gateway], [tunnel] et [proxy]
    scheduler.toml     # Sections [scheduler], [cron] et [heartbeat]
```

Les fichiers fragments sont fusionnes au-dessus de `config.toml` (les fragments ont la priorite). Les fichiers sont charges par ordre alphabetique.

## Comment modifier

### Assistant interactif

L'assistant de configuration vous guide a travers la selection du fournisseur, la configuration des canaux et la configuration memoire :

```bash
prx onboard
```

### Commandes CLI de configuration

Voir et modifier la configuration depuis la ligne de commande :

```bash
# Afficher la configuration actuelle
prx config show

# Modifier une valeur specifique
prx config set default_provider anthropic
prx config set default_model "anthropic/claude-sonnet-4-6"

# Declencher un rechargement manuel
prx config reload
```

### Edition directe

Ouvrez `~/.openprx/config.toml` dans n'importe quel editeur de texte. Les modifications sont detectees automatiquement par le surveillant de fichiers et appliquees en 1 seconde (voir [Rechargement a chaud](/fr/prx/config/hot-reload)).

### Export de schema

Exporter le schema complet de la configuration en JSON Schema pour l'autocompletion et la validation dans les editeurs :

```bash
prx config schema
```

Cela produit un document JSON Schema qui peut etre utilise avec VS Code, IntelliJ ou tout editeur prenant en charge la validation de schema TOML.

## Rechargement a chaud

La plupart des modifications de configuration sont appliquees immediatement sans redemarrer PRX. Le surveillant de fichiers utilise une fenetre de temporisation de 1 seconde et echange atomiquement la configuration active apres un analyse reussie. Si le nouveau fichier contient des erreurs de syntaxe, la configuration precedente est conservee et un avertissement est enregistre.

Consultez [Rechargement a chaud](/fr/prx/config/hot-reload) pour les details sur ce qui necessite un redemarrage.

## Prochaines etapes

- [Reference de la configuration](/fr/prx/config/reference) -- documentation complete champ par champ
- [Rechargement a chaud](/fr/prx/config/hot-reload) -- ce qui change en direct vs. necessite un redemarrage
- [Variables d'environnement](/fr/prx/config/environment) -- variables d'environnement, cles API et support `.env`
- [Fournisseurs LLM](/fr/prx/providers/) -- configuration specifique aux fournisseurs
