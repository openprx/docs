---
title: prx onboard
description: Assistant de configuration interactif pour la premiere utilisation de PRX.
---

# prx onboard

Lancer l'assistant de configuration pour configurer PRX lors de la premiere utilisation. L'assistant vous guide a travers la selection du fournisseur, la configuration de la cle API, la configuration des canaux et les preferences de base.

## Utilisation

```bash
prx onboard [OPTIONS]
```

## Options

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--quick` | `-q` | `false` | Mode rapide -- invites minimales, parametres par defaut raisonnables |
| `--provider` | `-P` | | Pre-selectionner un fournisseur (ignorer l'etape de selection du fournisseur) |
| `--config` | `-c` | `~/.config/prx/config.toml` | Chemin de sortie du fichier de configuration |
| `--force` | `-f` | `false` | Ecraser le fichier de configuration existant |
| `--non-interactive` | | `false` | Mode non interactif (necessite `--provider` et des variables d'environnement pour les cles) |

## Etapes de l'assistant

L'assistant interactif vous guide a travers les etapes suivantes :

1. **Selection du fournisseur** -- choisir votre fournisseur LLM principal (Anthropic, OpenAI, Ollama, etc.)
2. **Configuration de la cle API** -- saisir et valider votre cle API
3. **Selection du modele** -- choisir un modele par defaut parmi le fournisseur choisi
4. **Configuration des canaux** (optionnel) -- configurer un ou plusieurs canaux de messagerie
5. **Backend memoire** -- choisir ou stocker la memoire de conversation (markdown, SQLite, PostgreSQL)
6. **Securite** -- configurer le code d'appairage et les preferences de sandbox
7. **Revision de la configuration** -- previsualiser la configuration generee et confirmer

## Exemples

```bash
# Assistant interactif complet
prx onboard

# Configuration rapide avec Anthropic
prx onboard --quick --provider anthropic

# Non interactif (cle API depuis l'environnement)
export ANTHROPIC_API_KEY="sk-ant-..."
prx onboard --non-interactive --provider anthropic

# Ecrire la configuration dans un chemin personnalise
prx onboard --config /etc/prx/config.toml

# Relancer l'assistant (ecraser la configuration existante)
prx onboard --force
```

## Mode rapide

Le mode rapide (`--quick`) ignore les etapes optionnelles et utilise des valeurs par defaut raisonnables :

- Backend memoire : SQLite
- Securite : sandbox activee, pas d'appairage requis
- Canaux : aucun (ajouter plus tard avec `prx channel add`)
- Evolution : desactivee (activer plus tard dans la configuration)

C'est la methode la plus rapide pour obtenir une configuration fonctionnelle :

```bash
prx onboard --quick --provider ollama
```

## Apres la configuration

Une fois la configuration terminee, vous pouvez :

```bash
# Verifier la configuration
prx doctor

# Commencer a discuter
prx chat

# Ajouter d'autres canaux
prx channel add

# Demarrer le daemon complet
prx daemon
```

## Voir aussi

- [Demarrage rapide](/fr/prx/getting-started/quickstart) -- guide de demarrage rapide
- [Apercu de la configuration](/fr/prx/config/) -- format et options du fichier de configuration
- [prx config](./config) -- modifier la configuration apres la configuration initiale
- [prx channel](./channel) -- ajouter des canaux apres la configuration
