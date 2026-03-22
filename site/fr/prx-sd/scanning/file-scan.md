---
title: Analyse de fichiers et répertoires
description: "Référence complète de la commande sd scan. Analyser des fichiers et répertoires à la recherche de logiciels malveillants avec correspondance de hachages, règles YARA et analyse heuristique."
---

# Analyse de fichiers et répertoires

La commande `sd scan` est le moyen principal de vérifier les fichiers et répertoires à la recherche de logiciels malveillants. Elle fait passer chaque fichier par le pipeline de détection multicouche -- correspondance de hachages, règles YARA et analyse heuristique -- et signale un verdict pour chaque fichier.

## Utilisation de base

Analyser un seul fichier :

```bash
sd scan /path/to/file
```

Analyser un répertoire (non récursif par défaut) :

```bash
sd scan /home/user/downloads
```

Analyser un répertoire et tous ses sous-répertoires :

```bash
sd scan /home --recursive
```

## Options de commande

| Option | Court | Défaut | Description |
|--------|-------|--------|-------------|
| `--recursive` | `-r` | désactivé | Recurser dans les sous-répertoires |
| `--json` | `-j` | désactivé | Sortie des résultats en format JSON |
| `--threads` | `-t` | Cœurs CPU | Nombre de threads d'analyse parallèles |
| `--auto-quarantine` | `-q` | désactivé | Mettre automatiquement en quarantaine les menaces détectées |
| `--remediate` | | désactivé | Tenter une remédiation automatique (supprimer/mettre en quarantaine selon la politique) |
| `--exclude` | `-e` | aucun | Motif glob pour exclure des fichiers ou répertoires |
| `--report` | | aucun | Écrire le rapport d'analyse dans un chemin de fichier |
| `--max-size-mb` | | 100 | Ignorer les fichiers plus grands que cette taille en mégaoctets |
| `--no-yara` | | désactivé | Ignorer l'analyse des règles YARA |
| `--no-heuristics` | | désactivé | Ignorer l'analyse heuristique |
| `--min-severity` | | `suspicious` | Gravité minimale à signaler (`suspicious` ou `malicious`) |

## Flux de détection

Lorsque `sd scan` traite un fichier, il passe par le pipeline de détection dans l'ordre :

```
Fichier → Détection du nombre magique → Déterminer le type de fichier
  │
  ├─ Couche 1 : Lookup de hachage SHA-256 (LMDB)
  │   Hit → MALICIOUS (instantané, ~1μs par fichier)
  │
  ├─ Couche 2 : Analyse de règles YARA-X (38 800+ règles)
  │   Hit → MALICIOUS avec nom de règle
  │
  ├─ Couche 3 : Analyse heuristique (adaptée au type de fichier)
  │   Score ≥ 60 → MALICIOUS
  │   Score 30-59 → SUSPICIOUS
  │   Score < 30 → CLEAN
  │
  └─ Agrégation des résultats → la gravité la plus élevée l'emporte
```

Le pipeline court-circuite : si une correspondance de hachage est trouvée, YARA et l'analyse heuristique sont ignorées pour ce fichier. Cela rend l'analyse des grands répertoires rapide -- la plupart des fichiers sains sont résolus à la couche de hachage en microsecondes.

## Formats de sortie

### Lisible par un humain (par défaut)

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### Sortie JSON

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### Fichier de rapport

Écrire les résultats dans un fichier pour l'archivage :

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## Motifs d'exclusion

Utilisez `--exclude` pour ignorer les fichiers ou répertoires correspondant à des motifs glob. Plusieurs motifs peuvent être spécifiés :

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip Performance
Exclure les grands répertoires comme `node_modules`, `.git` et les images de machines virtuelles améliore significativement la vitesse d'analyse.
:::

## Mise en quarantaine automatique

L'indicateur `--auto-quarantine` déplace les menaces détectées vers le coffre-fort de quarantaine pendant l'analyse :

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

Les fichiers mis en quarantaine sont chiffrés avec AES-256 et stockés dans `~/.local/share/prx-sd/quarantine/`. Ils ne peuvent pas être exécutés accidentellement. Consultez la [documentation Quarantaine](../quarantine/) pour les détails.

## Exemples de scénarios

### Analyse de pipeline CI/CD

Analyser les artefacts de build avant le déploiement :

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

Utilisez le code de sortie pour l'automatisation : `0` = propre, `1` = menaces trouvées, `2` = erreur d'analyse.

### Analyse quotidienne d'un serveur web

Planifier une analyse nocturne des répertoires accessibles par le web :

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### Investigation forensique

Analyser une image disque montée en lecture seule :

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning Grandes analyses
Lors de l'analyse de millions de fichiers, utilisez `--threads` pour contrôler l'utilisation des ressources et `--max-size-mb` pour ignorer les fichiers surdimensionnés qui pourraient ralentir l'analyse.
:::

### Vérification rapide du répertoire personnel

Analyse rapide des emplacements courants de menaces :

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## Optimisation des performances

| Fichiers | Temps approximatif | Notes |
|----------|--------------------|-------|
| 1 000 | < 1 seconde | La couche de hachage résout la plupart des fichiers |
| 10 000 | 2-5 secondes | Les règles YARA ajoutent ~0,3 ms par fichier |
| 100 000 | 20-60 secondes | Dépend des tailles et types de fichiers |
| 1 000 000+ | 5-15 minutes | Utilisez `--threads` et `--exclude` |

Facteurs affectant la vitesse d'analyse :

- **E/S disque** -- SSD est 5-10x plus rapide que HDD pour les lectures aléatoires
- **Distribution de la taille des fichiers** -- De nombreux petits fichiers sont plus rapides que peu de grands fichiers
- **Couches de détection** -- Les analyses par hachage uniquement (`--no-yara --no-heuristics`) sont les plus rapides
- **Nombre de threads** -- Plus de threads aident sur les systèmes multicœurs avec un stockage rapide

## Étapes suivantes

- [Analyse de la mémoire](./memory-scan) -- Analyser la mémoire des processus en cours d'exécution
- [Détection de rootkits](./rootkit) -- Vérifier les menaces au niveau du kernel
- [Analyse USB](./usb-scan) -- Analyser les supports amovibles
- [Moteur de détection](../detection/) -- Comment chaque couche de détection fonctionne
