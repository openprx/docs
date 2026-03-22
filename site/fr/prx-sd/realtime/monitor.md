---
title: Surveillance de fichiers
description: Surveillance du système de fichiers en temps réel avec sd monitor pour détecter les menaces au moment où elles apparaissent sur le disque.
---

# Surveillance de fichiers

La commande `sd monitor` surveille les répertoires pour l'activité du système de fichiers et analyse les fichiers nouveaux ou modifiés en temps réel. C'est le moyen principal de détecter les logiciels malveillants au moment où ils atterrissent sur le disque, avant qu'ils aient la chance de s'exécuter.

## Utilisation

```bash
sd monitor [OPTIONS] [PATHS...]
```

Si aucun chemin n'est spécifié, `sd monitor` surveille le répertoire de travail actuel.

## Options

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--recursive` | `-r` | `true` | Surveiller les répertoires de manière récursive |
| `--block` | `-b` | `false` | Bloquer l'exécution des fichiers jusqu'à la fin de l'analyse (Linux uniquement) |
| `--daemon` | `-d` | `false` | Exécuter en arrière-plan comme processus démon |
| `--pid-file` | | | Écrire le PID dans le fichier spécifié (implique `--daemon`) |
| `--exclude` | `-e` | | Motifs glob à exclure (répétable) |
| `--log-file` | | | Écrire la sortie de journal dans un fichier plutôt que stderr |
| `--auto-quarantine` | `-q` | `false` | Mettre automatiquement en quarantaine les menaces détectées |
| `--events` | | tous | Liste séparée par des virgules des événements à surveiller |
| `--json` | | `false` | Sortir les événements en lignes JSON |

## Mécanismes de plateforme

PRX-SD utilise l'API du système de fichiers la plus capable disponible sur chaque plateforme :

| Plateforme | API | Capacités |
|------------|-----|-----------|
| **Linux** | fanotify (kernel 5.1+) | Surveillance à l'échelle du système, contrôle des permissions d'exécution, transmission de descripteur de fichier |
| **Linux (repli)** | inotify | Surveillance par répertoire, pas de support de blocage |
| **macOS** | FSEvents | Surveillance récursive à faible latence, relecture d'événements historiques |
| **Windows** | ReadDirectoryChangesW | Surveillance asynchrone par répertoire avec ports de complétion |

::: tip
Sur Linux, `sd monitor` nécessite la capacité `CAP_SYS_ADMIN` (ou root) pour utiliser fanotify. Si non disponible, il se replie automatiquement sur inotify avec un avertissement.
:::

## Événements surveillés

Les événements du système de fichiers suivants déclenchent une analyse :

| Événement | Description | Plateformes |
|-----------|-------------|-------------|
| `Create` | Un nouveau fichier est créé | Toutes |
| `Modify` | Le contenu du fichier est écrit | Toutes |
| `CloseWrite` | Fichier fermé après écriture (évite les analyses partielles) | Linux |
| `Delete` | Un fichier est supprimé | Toutes |
| `Rename` | Un fichier est renommé ou déplacé | Toutes |
| `Open` | Un fichier est ouvert en lecture | Linux (fanotify) |
| `Execute` | Un fichier est sur le point d'être exécuté | Linux (fanotify) |

Filtrez les événements qui déclenchent des analyses avec `--events` :

```bash
# Analyser uniquement les nouveaux fichiers et les modifications
sd monitor --events Create,CloseWrite /home
```

## Mode blocage

Sur Linux avec fanotify, `--block` active le mode `FAN_OPEN_EXEC_PERM`. Dans ce mode, le kernel suspend l'exécution du processus jusqu'à ce que PRX-SD retourne un verdict :

```bash
sudo sd monitor --block /usr/local/bin /tmp
```

::: warning
Le mode blocage ajoute de la latence à chaque lancement de programme dans les chemins surveillés. Utilisez-le uniquement sur les répertoires à haut risque comme `/tmp` ou les dossiers de téléchargement, pas sur les chemins à l'échelle du système comme `/usr` ou `/lib`.
:::

Quand une menace est détectée en mode blocage :

1. L'ouverture/exécution du fichier est **refusée** par le kernel
2. L'événement est journalisé avec le verdict `BLOCKED`
3. Si `--auto-quarantine` est défini, le fichier est déplacé vers le coffre-fort de quarantaine

## Mode démon

Utilisez `--daemon` pour détacher le moniteur du terminal :

```bash
sd monitor --daemon --pid-file /var/run/sd-monitor.pid /home /tmp /var/www
```

Arrêtez le démon en envoyant `SIGTERM` :

```bash
kill $(cat /var/run/sd-monitor.pid)
```

Ou utilisez `sd daemon stop` si vous l'exécutez via le gestionnaire de démon. Consultez [Démon](./daemon) pour les détails.

## Exemples

```bash
# Surveiller les répertoires home et tmp
sd monitor /home /tmp

# Surveiller avec mise en quarantaine automatique
sd monitor --auto-quarantine /home/downloads

# Mode blocage sur Linux pour un répertoire sensible
sudo sd monitor --block --auto-quarantine /tmp

# Exclure les artefacts de build et node_modules
sd monitor -e "*.o" -e "node_modules/**" /home/dev/projects

# Exécuter comme démon avec journalisation JSON
sd monitor --daemon --json --log-file /var/log/sd-monitor.json /home

# Surveiller avec des événements spécifiques uniquement
sd monitor --events Create,Modify,Rename /var/www
```

## Sortie JSON

Lorsque `--json` est activé, chaque événement produit une seule ligne JSON :

```json
{
  "timestamp": "2026-03-21T10:15:32.456Z",
  "event": "CloseWrite",
  "path": "/tmp/payload.exe",
  "verdict": "malicious",
  "threat": "Win.Trojan.Agent-123456",
  "action": "quarantined",
  "scan_ms": 12
}
```

## Étapes suivantes

- [Démon](./daemon) -- exécuter la surveillance comme service en arrière-plan géré
- [Protection contre les ransomwares](./ransomware) -- détection comportementale spécialisée des ransomwares
- [Gestion de la quarantaine](/fr/prx-sd/quarantine/) -- gérer les fichiers mis en quarantaine
- [Réponse aux menaces](/fr/prx-sd/remediation/) -- configurer les politiques de réponse automatique
