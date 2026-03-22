---
title: Analyses planifiées
description: "Configurer des tâches d'analyse récurrentes avec sd schedule pour une détection automatisée des menaces à intervalles réguliers."
---

# Analyses planifiées

La commande `sd schedule` gère les tâches d'analyse récurrentes qui s'exécutent à des intervalles définis. Les analyses planifiées complètent la surveillance en temps réel en effectuant des analyses complètes périodiques des répertoires spécifiés, détectant les menaces qui ont pu être manquées ou introduites pendant l'inactivité de la surveillance.

## Utilisation

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### Sous-commandes

| Sous-commande | Description |
|--------------|-------------|
| `add` | Créer une nouvelle tâche d'analyse planifiée |
| `remove` | Supprimer une tâche d'analyse planifiée |
| `list` | Lister toutes les tâches d'analyse planifiées |
| `status` | Afficher l'état des tâches planifiées incluant la dernière et prochaine exécution |
| `run` | Déclencher manuellement une tâche planifiée immédiatement |

## Ajouter une analyse planifiée

```bash
sd schedule add <PATH> [OPTIONS]
```

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--frequency` | `-f` | `daily` | Fréquence d'analyse : `hourly`, `4h`, `12h`, `daily`, `weekly` |
| `--name` | `-n` | généré automatiquement | Nom lisible par l'humain pour cette tâche |
| `--recursive` | `-r` | `true` | Analyser les répertoires de manière récursive |
| `--auto-quarantine` | `-q` | `false` | Mettre en quarantaine les menaces détectées |
| `--exclude` | `-e` | | Motifs glob à exclure (répétable) |
| `--notify` | | `true` | Envoyer des alertes lors de détection |
| `--time` | `-t` | aléatoire | Heure de début préférée (HH:MM, format 24h) |
| `--day` | `-d` | `monday` | Jour de la semaine pour les analyses hebdomadaires |

### Options de fréquence

| Fréquence | Intervalle | Cas d'utilisation |
|-----------|----------|----------|
| `hourly` | Toutes les 60 minutes | Répertoires à haut risque (uploads, temp) |
| `4h` | Toutes les 4 heures | Répertoires partagés, racines web |
| `12h` | Toutes les 12 heures | Répertoires personnels des utilisateurs |
| `daily` | Toutes les 24 heures | Analyses complètes générales |
| `weekly` | Tous les 7 jours | Archives à faible risque, vérification des sauvegardes |

### Exemples

```bash
# Analyse quotidienne des répertoires personnels
sd schedule add /home --frequency daily --name "home-daily"

# Analyse horaire du répertoire d'upload avec mise en quarantaine automatique
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# Analyse complète hebdomadaire en excluant les fichiers multimédia volumineux
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# Analyse toutes les 4 heures des répertoires temporaires
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# Analyse quotidienne à une heure spécifique
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# Analyse hebdomadaire le dimanche
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## Lister les analyses planifiées

```bash
sd schedule list
```

```
Scheduled Scan Jobs (4)

Name              Path              Frequency  Auto-Q  Next Run
home-daily        /home             daily      no      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly     yes     2026-03-21 11:00
tmp-4h            /tmp              4h         yes     2026-03-21 14:00
full-weekly       /                 weekly     no      2026-03-23 03:00 (Sun)
```

## Vérifier l'état des tâches

```bash
sd schedule status
```

```
Scheduled Scan Status

Name              Last Run              Duration  Files    Threats  Status
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        clean
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        threats found
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        clean
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        threats found
```

Obtenir l'état détaillé d'une tâche spécifique :

```bash
sd schedule status home-daily
```

```
Job: home-daily
  Path:           /home
  Frequency:      daily (every 24h)
  Preferred Time: 02:00
  Auto-Quarantine: no
  Recursive:      yes
  Excludes:       (none)

  Last Run:       2026-03-21 02:00:12 UTC
  Duration:       8 minutes 32 seconds
  Files Scanned:  45,231
  Threats Found:  0
  Result:         Clean

  Next Run:       2026-03-22 02:00 UTC
  Total Runs:     47
  Total Threats:  3 (across all runs)
```

## Supprimer des analyses planifiées

```bash
# Supprimer par nom
sd schedule remove home-daily

# Supprimer toutes les analyses planifiées
sd schedule remove --all
```

## Déclencher manuellement une analyse

Exécuter une tâche planifiée immédiatement sans attendre le prochain intervalle :

```bash
sd schedule run home-daily
```

Cela exécute l'analyse avec toutes les options configurées (quarantaine, exclusions, notifications) et met à jour l'horodatage de la dernière exécution de la tâche.

## Fonctionnement de la planification

PRX-SD utilise un planificateur interne, pas le cron système. Le planificateur s'exécute dans le cadre du processus démon :

```
sd daemon start
  └── Thread planificateur
        ├── Vérifier les intervalles de tâches toutes les 60 secondes
        ├── Lancer les tâches d'analyse quand l'intervalle est écoulé
        ├── Sérialiser les résultats dans ~/.prx-sd/schedule/
        └── Envoyer des notifications à la fin
```

::: warning
Les analyses planifiées ne s'exécutent que lorsque le démon est actif. Si le démon est arrêté, les analyses manquées s'exécuteront au prochain démarrage du démon. Utilisez `sd daemon start` pour assurer une planification continue.
:::

## Fichier de configuration

Les tâches planifiées sont persistées dans `~/.prx-sd/schedule.json` et peuvent également être définies dans `config.toml` :

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## Rapports d'analyse

Chaque analyse planifiée génère un rapport stocké dans `~/.prx-sd/reports/` :

```bash
# Afficher le dernier rapport d'une tâche
sd schedule report home-daily

# Exporter le rapport en JSON
sd schedule report home-daily --json > report.json

# Lister tous les rapports
sd schedule report --list
```

::: tip
Combinez les analyses planifiées avec les alertes par e-mail pour recevoir des rapports automatiques. Configurez `scan_completed` dans les événements e-mail pour recevoir un résumé après chaque analyse planifiée.
:::

## Étapes suivantes

- [Alertes webhook](./webhook) -- être notifié lorsque les analyses planifiées trouvent des menaces
- [Alertes e-mail](./email) -- rapports par e-mail des analyses planifiées
- [Démon](/fr/prx-sd/realtime/daemon) -- requis pour l'exécution des analyses planifiées
- [Réponse aux menaces](/fr/prx-sd/remediation/) -- configurer ce qui se passe quand des menaces sont trouvées
