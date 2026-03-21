---
title: Reference CLI
description: Reference complete de l'interface en ligne de commande prx.
---

# Reference CLI

Le binaire `prx` est le point d'entree unique pour toutes les operations PRX -- chat interactif, gestion du daemon, administration des canaux et diagnostics systeme.

## Drapeaux globaux

Ces drapeaux sont acceptes par toutes les sous-commandes.

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Chemin vers le fichier de configuration |
| `--log-level` | `-l` | `info` | Niveau de verbosity des logs : `trace`, `debug`, `info`, `warn`, `error` |
| `--no-color` | | `false` | Desactiver la sortie coloree |
| `--quiet` | `-q` | `false` | Supprimer la sortie non essentielle |
| `--help` | `-h` | | Afficher l'aide |
| `--version` | `-V` | | Afficher la version |

## Commandes

| Commande | Description |
|----------|-------------|
| [`prx agent`](./agent) | Interaction LLM en un tour (compatible avec le piping) |
| [`prx chat`](./chat) | Chat terminal enrichi avec streaming et historique |
| [`prx daemon`](./daemon) | Demarrer le runtime complet PRX (passerelle + canaux + cron + evolution) |
| [`prx gateway`](./gateway) | Serveur de passerelle HTTP/WebSocket autonome |
| [`prx onboard`](./onboard) | Assistant de configuration interactif |
| [`prx channel`](./channel) | Gestion des canaux (list, add, remove, start, doctor) |
| [`prx cron`](./cron) | Gestion des taches cron (list, add, remove, pause, resume) |
| [`prx evolution`](./evolution) | Operations d'auto-evolution (status, history, config, trigger) |
| [`prx auth`](./auth) | Gestion des profils OAuth (login, refresh, logout) |
| [`prx config`](./config) | Operations de configuration (schema, split, merge, get, set) |
| [`prx doctor`](./doctor) | Diagnostics systeme (sante du daemon, etat des canaux, disponibilite des modeles) |
| [`prx service`](./service) | Gestion des services systemd/OpenRC (install, start, stop, status) |
| [`prx skills`](./skills) | Gestion des competences (list, install, remove) |
| `prx status` | Tableau de bord de l'etat du systeme |
| `prx models refresh` | Rafraichir les catalogues de modeles des fournisseurs |
| `prx providers` | Lister tous les fournisseurs LLM pris en charge |
| `prx completions` | Generer les completions shell (bash, zsh, fish) |

## Exemples rapides

```bash
# Configuration initiale
prx onboard

# Demarrer un chat interactif
prx chat

# Question en un tour (scriptable)
echo "Summarize this file" | prx agent -f report.pdf

# Demarrer le daemon avec tous les services
prx daemon

# Verifier la sante du systeme
prx doctor
```

## Completions shell

Generez les completions pour votre shell et ajoutez-les a votre profil :

```bash
# Bash
prx completions bash > ~/.local/share/bash-completion/completions/prx

# Zsh
prx completions zsh > ~/.zfunc/_prx

# Fish
prx completions fish > ~/.config/fish/completions/prx.fish
```

## Variables d'environnement

PRX respecte les variables d'environnement suivantes (elles prennent le pas sur les valeurs du fichier de configuration) :

| Variable | Description |
|----------|-------------|
| `PRX_CONFIG` | Chemin vers le fichier de configuration (equivalent a `--config`) |
| `PRX_LOG` | Niveau de log (equivalent a `--log-level`) |
| `PRX_DATA_DIR` | Repertoire de donnees (defaut : `~/.local/share/prx`) |
| `ANTHROPIC_API_KEY` | Cle API du fournisseur Anthropic |
| `OPENAI_API_KEY` | Cle API du fournisseur OpenAI |
| `GOOGLE_API_KEY` | Cle API du fournisseur Google Gemini |

## Voir aussi

- [Apercu de la configuration](/fr/prx/config/) -- format et options du fichier de configuration
- [Demarrage](/fr/prx/getting-started/installation) -- instructions d'installation
- [Depannage](/fr/prx/troubleshooting/) -- erreurs courantes et solutions
