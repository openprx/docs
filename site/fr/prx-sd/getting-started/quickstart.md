---
title: Démarrage rapide
description: Mettez PRX-SD en marche pour analyser les logiciels malveillants en 5 minutes. Installez, mettez à jour les signatures, analysez des fichiers, examinez les résultats et activez la surveillance en temps réel.
---

# Démarrage rapide

Ce guide vous amène de zéro à votre première analyse de logiciels malveillants en moins de 5 minutes. À la fin, vous aurez PRX-SD installé, les signatures mises à jour et la surveillance en temps réel en cours d'exécution.

::: tip Prérequis
Vous avez besoin d'un système Linux ou macOS avec `curl` installé. Consultez le [Guide d'installation](./installation) pour d'autres méthodes et détails par plateforme.
:::

## Étape 1 : Installer PRX-SD

Téléchargez et installez la dernière version avec le script d'installation :

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

Vérifiez l'installation :

```bash
sd --version
```

Vous devriez voir une sortie comme :

```
prx-sd 0.5.0
```

## Étape 2 : Mettre à jour la base de données de signatures

PRX-SD est livré avec une liste de blocage intégrée, mais vous devez télécharger les derniers renseignements sur les menaces pour une protection complète. La commande `update` récupère les signatures de hachage et les règles YARA de toutes les sources configurées :

```bash
sd update
```

Sortie attendue :

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip Mise à jour complète
Pour inclure la base de données VirusShare complète (20M+ hachages MD5), exécutez :
```bash
sd update --full
```
Cela prend plus de temps mais offre une couverture de hachage maximale.
:::

## Étape 3 : Analyser un fichier ou un répertoire

Analyser un seul fichier suspect :

```bash
sd scan /path/to/suspicious_file
```

Analyser un répertoire entier de manière récursive :

```bash
sd scan /home --recursive
```

Exemple de sortie pour un répertoire sain :

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

Exemple de sortie lorsque des menaces sont trouvées :

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## Étape 4 : Examiner les résultats et agir

Pour un rapport JSON détaillé adapté à l'automatisation ou à l'ingestion de journaux :

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

Pour mettre automatiquement en quarantaine les menaces détectées lors d'une analyse :

```bash
sd scan /home --recursive --auto-quarantine
```

Les fichiers mis en quarantaine sont déplacés vers un répertoire sécurisé et chiffré. Vous pouvez les lister et les restaurer :

```bash
# Lister les fichiers en quarantaine
sd quarantine list

# Restaurer un fichier par son ID de quarantaine
sd quarantine restore QR-20260321-001
```

::: warning Quarantaine
Les fichiers mis en quarantaine sont chiffrés et ne peuvent pas être exécutés accidentellement. N'utilisez `sd quarantine restore` que si vous êtes certain que le fichier est un faux positif.
:::

## Étape 5 : Activer la surveillance en temps réel

Démarrez le moniteur en temps réel pour surveiller les répertoires à la recherche de fichiers nouveaux ou modifiés :

```bash
sd monitor /home /tmp /var/www
```

Le moniteur s'exécute au premier plan et analyse les fichiers au fur et à mesure qu'ils sont créés ou modifiés :

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

Pour exécuter le moniteur comme service en arrière-plan :

```bash
# Installer et démarrer le service systemd
sd service install
sd service start

# Vérifier l'état du service
sd service status
```

## Ce que vous avez maintenant

Après avoir suivi ces étapes, votre système dispose de :

| Composant | État |
|-----------|------|
| Binaire `sd` | Installé dans le PATH |
| Base de données de hachages | 28 000+ hachages SHA-256/MD5 dans LMDB |
| Règles YARA | 38 800+ règles provenant de 8 sources |
| Moniteur en temps réel | Surveille les répertoires spécifiés |

## Étapes suivantes

- [Analyse de fichiers et répertoires](../scanning/file-scan) -- Explorez toutes les options de `sd scan` incluant les threads, les exclusions et les limites de taille
- [Analyse de la mémoire](../scanning/memory-scan) -- Analyser la mémoire des processus en cours d'exécution pour les menaces en mémoire
- [Détection de rootkits](../scanning/rootkit) -- Vérifier les rootkits kernel et espace utilisateur
- [Moteur de détection](../detection/) -- Comprendre le fonctionnement du pipeline multicouche
- [Règles YARA](../detection/yara-rules) -- En savoir plus sur les sources de règles et les règles personnalisées
