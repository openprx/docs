---
title: prx agent
description: Interaction LLM en un tour pour le scripting et le piping.
---

# prx agent

Executer une interaction LLM en un tour. L'agent traite un prompt, retourne la reponse et se termine. Concu pour le scripting, le piping et l'integration avec d'autres outils.

## Utilisation

```bash
prx agent [OPTIONS] [PROMPT]
```

Si `PROMPT` est omis, l'entree est lue depuis stdin.

## Options

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--provider` | `-P` | defaut config | Fournisseur LLM a utiliser |
| `--model` | `-m` | defaut fournisseur | Identifiant du modele |
| `--system` | `-s` | | Prompt systeme personnalise |
| `--file` | `-f` | | Joindre un fichier au contexte du prompt |
| `--no-tools` | | `false` | Desactiver l'utilisation des outils |
| `--no-memory` | | `false` | Desactiver les lectures et ecritures memoire |
| `--json` | `-j` | `false` | Sortie de la reponse JSON brute |
| `--temperature` | `-t` | defaut fournisseur | Temperature d'echantillonnage (0.0 - 2.0) |
| `--max-tokens` | | defaut fournisseur | Nombre maximum de tokens de reponse |
| `--timeout` | | `120` | Delai d'attente en secondes |

## Exemples

```bash
# Question simple
prx agent "What is the capital of France?"

# Rediriger du contenu pour analyse
cat error.log | prx agent "Summarize these errors"

# Joindre un fichier
prx agent -f report.pdf "Summarize the key findings"

# Utiliser un modele specifique
prx agent -P anthropic -m claude-sonnet-4-20250514 "Explain quantum entanglement"

# Sortie JSON pour le scripting
prx agent --json "List 5 programming languages" | jq '.content'

# Enchainer avec d'autres commandes
git diff HEAD~1 | prx agent "Write a commit message for this diff"
```

## Stdin vs argument

Le prompt peut etre fourni comme argument positionnel ou via stdin. Lorsque les deux sont presents, ils sont concatenes (contenu stdin en premier, puis l'argument comme instructions).

```bash
# Argument seul
prx agent "Hello"

# Stdin seul
echo "Hello" | prx agent

# Les deux : stdin comme contexte, argument comme instruction
cat data.csv | prx agent "Find anomalies in this dataset"
```

## Pieces jointes

Le drapeau `--file` ajoute le contenu d'un fichier au contexte du prompt. Plusieurs fichiers peuvent etre joints :

```bash
prx agent -f src/main.rs -f src/lib.rs "Review this code for bugs"
```

Les types de fichiers pris en charge incluent les fichiers texte, les PDF, les images (pour les modeles compatibles vision) et les formats de documents courants.

## Codes de sortie

| Code | Signification |
|------|---------------|
| `0` | Succes |
| `1` | Erreur generale (configuration invalide, echec reseau) |
| `2` | Delai d'attente depasse |
| `3` | Erreur du fournisseur (limite de debit, echec d'authentification) |

## Voir aussi

- [prx chat](./chat) -- chat interactif multi-tours
- [Apercu des fournisseurs](/fr/prx/providers/) -- fournisseurs LLM pris en charge
- [Apercu des outils](/fr/prx/tools/) -- outils disponibles pendant l'execution de l'agent
