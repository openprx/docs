---
title: prx cron
description: Gerer les taches cron planifiees qui s'executent sur le daemon PRX.
---

# prx cron

Gerer les taches planifiees qui s'executent sur le planificateur cron PRX. Les taches cron peuvent executer des prompts LLM, des commandes shell ou des invocations d'outils selon un calendrier defini.

## Utilisation

```bash
prx cron <SOUS-COMMANDE> [OPTIONS]
```

## Sous-commandes

### `prx cron list`

Lister toutes les taches cron configurees et leur etat.

```bash
prx cron list [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--json` | `-j` | `false` | Sortie au format JSON |
| `--verbose` | `-v` | `false` | Afficher les details complets de la tache incluant l'expression de planification |

**Exemple de sortie :**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

Ajouter une nouvelle tache cron.

```bash
prx cron add [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--name` | `-n` | requis | Nom de la tache |
| `--schedule` | `-s` | requis | Expression cron (5 ou 6 champs) |
| `--prompt` | `-p` | | Prompt LLM a executer |
| `--command` | `-c` | | Commande shell a executer |
| `--channel` | | | Canal ou envoyer la sortie |
| `--provider` | `-P` | defaut config | Fournisseur LLM pour les taches de type prompt |
| `--model` | `-m` | defaut fournisseur | Modele pour les taches de type prompt |
| `--enabled` | | `true` | Activer la tache immediatement |

Soit `--prompt`, soit `--command` doit etre fourni.

```bash
# Planifier un resume quotidien
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# Planifier une commande de sauvegarde
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# Rapport hebdomadaire chaque lundi a 10h
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

Supprimer une tache cron par ID ou par nom.

```bash
prx cron remove <ID|NOM> [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--force` | `-f` | `false` | Ignorer l'invite de confirmation |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

Mettre en pause une tache cron. La tache reste configuree mais ne s'executera pas tant qu'elle n'est pas reprise.

```bash
prx cron pause <ID|NOM>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

Reprendre une tache cron en pause.

```bash
prx cron resume <ID|NOM>
```

```bash
prx cron resume weekly-report
```

## Format des expressions cron

PRX utilise les expressions cron standard a 5 champs :

```
 ┌───────── minute (0-59)
 │ ┌───────── heure (0-23)
 │ │ ┌───────── jour du mois (1-31)
 │ │ │ ┌───────── mois (1-12)
 │ │ │ │ ┌───────── jour de la semaine (0-7, 0 et 7 = dimanche)
 │ │ │ │ │
 * * * * *
```

Exemples courants :

| Expression | Description |
|------------|-------------|
| `0 9 * * *` | Chaque jour a 9h00 |
| `*/15 * * * *` | Toutes les 15 minutes |
| `0 */6 * * *` | Toutes les 6 heures |
| `0 10 * * 1` | Chaque lundi a 10h00 |
| `0 0 1 * *` | Le premier jour de chaque mois a minuit |

## Voir aussi

- [Apercu de la planification](/fr/prx/cron/) -- architecture cron et heartbeat
- [Taches cron](/fr/prx/cron/tasks) -- types de taches et details d'execution
- [prx daemon](./daemon) -- le daemon qui execute le planificateur cron
