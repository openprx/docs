---
title: prx chat
description: Chat terminal enrichi avec reponses en streaming, navigation dans l'historique et saisie multi-lignes.
---

# prx chat

Demarrer une session de chat interactive dans le terminal avec des reponses en streaming, un historique de conversation et un acces complet aux outils.

## Utilisation

```bash
prx chat [OPTIONS]
```

## Options

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--provider` | `-P` | defaut config | Fournisseur LLM a utiliser (ex. `anthropic`, `openai`, `ollama`) |
| `--model` | `-m` | defaut fournisseur | Identifiant du modele (ex. `claude-sonnet-4-20250514`, `gpt-4o`) |
| `--system` | `-s` | | Prompt systeme personnalise (remplace la config) |
| `--session` | `-S` | nouvelle session | Reprendre une session nommee |
| `--no-tools` | | `false` | Desactiver l'utilisation des outils pour cette session |
| `--no-memory` | | `false` | Desactiver les lectures et ecritures memoire |
| `--no-stream` | | `false` | Attendre la reponse complete au lieu du streaming |
| `--max-turns` | | illimite | Nombre maximum de tours de conversation avant sortie automatique |
| `--temperature` | `-t` | defaut fournisseur | Temperature d'echantillonnage (0.0 - 2.0) |

## Controles interactifs

Une fois dans la session de chat, les raccourcis clavier suivants sont disponibles :

| Touche | Action |
|--------|--------|
| `Enter` | Envoyer le message |
| `Shift+Enter` ou `\` puis `Enter` | Nouvelle ligne (saisie multi-lignes) |
| `Up` / `Down` | Naviguer dans l'historique des messages |
| `Ctrl+C` | Annuler la generation en cours |
| `Ctrl+D` | Quitter la session de chat |
| `Ctrl+L` | Effacer l'ecran |

## Commandes slash

Tapez ces commandes directement dans le champ de saisie du chat :

| Commande | Description |
|----------|-------------|
| `/help` | Afficher les commandes disponibles |
| `/model <name>` | Changer de modele en cours de session |
| `/provider <name>` | Changer de fournisseur en cours de session |
| `/system <prompt>` | Mettre a jour le prompt systeme |
| `/clear` | Effacer l'historique de conversation |
| `/save [name]` | Sauvegarder la session en cours |
| `/load <name>` | Charger une session sauvegardee |
| `/sessions` | Lister les sessions sauvegardees |
| `/tools` | Lister les outils disponibles |
| `/exit` | Quitter le chat |

## Exemples

```bash
# Demarrer avec les parametres par defaut
prx chat

# Utiliser un modele specifique
prx chat --provider anthropic --model claude-sonnet-4-20250514

# Reprendre une session precedente
prx chat --session project-planning

# Question rapide avec un modele local
prx chat --provider ollama --model llama3

# Limiter a 10 tours (utile pour les workflows scriptes)
prx chat --max-turns 10
```

## Gestion des sessions

Les sessions de chat sont automatiquement sauvegardees a la sortie. Chaque session enregistre :

- Les messages de conversation (utilisateur + assistant)
- Les appels d'outils et leurs resultats
- Le fournisseur et le modele utilises
- L'horodatage et la duree

Les sessions sont stockees dans le repertoire de donnees PRX (`~/.local/share/prx/sessions/` par defaut).

```bash
# Lister toutes les sessions
prx chat --session ""  # un nom vide liste les sessions

# Reprendre par nom
prx chat --session my-project
```

## Saisie multi-lignes

Pour les prompts plus longs, utilisez le mode multi-lignes. Appuyez sur `Shift+Enter` pour inserer un saut de ligne sans envoyer. L'indicateur de prompt passe de `>` a `...` pour montrer que vous etes en mode multi-lignes.

Alternativement, redirigez l'entree depuis un fichier :

```bash
# Le chat s'ouvre toujours de maniere interactive, avec le contenu du fichier comme premier message
prx chat < prompt.txt
```

## Remplacement du fournisseur et du modele

Les drapeaux `--provider` et `--model` remplacent les valeurs par defaut de votre fichier de configuration pour la duree de la session. Vous pouvez egalement changer en cours de session en utilisant les commandes slash.

```bash
# Demarrer avec OpenAI, basculer vers Anthropic en cours de conversation
prx chat --provider openai
# Dans le chat : /provider anthropic
# Dans le chat : /model claude-sonnet-4-20250514
```

## Voir aussi

- [prx agent](./agent) -- mode non interactif en un tour
- [Apercu des fournisseurs](/fr/prx/providers/) -- fournisseurs LLM pris en charge
- [Apercu de la memoire](/fr/prx/memory/) -- fonctionnement de la memoire dans les conversations
- [Apercu des outils](/fr/prx/tools/) -- outils disponibles pendant le chat
