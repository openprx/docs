---
title: Gestion de la quarantaine
description: "Gérer les menaces mises en quarantaine avec un coffre-fort chiffré AES-256-GCM, restaurer des fichiers et examiner les statistiques de quarantaine."
---

# Gestion de la quarantaine

Lorsque PRX-SD détecte une menace, il peut isoler le fichier dans un coffre-fort de quarantaine chiffré. Les fichiers mis en quarantaine sont chiffrés avec AES-256-GCM, renommés et déplacés vers un répertoire sécurisé où ils ne peuvent pas être exécutés accidentellement. Toutes les métadonnées originales sont préservées pour l'analyse forensique.

## Fonctionnement de la quarantaine

```
Menace détectée
  1. Générer une clé AES-256-GCM aléatoire
  2. Chiffrer le contenu du fichier
  3. Stocker le blob chiffré dans vault.bin
  4. Sauvegarder les métadonnées (chemin original, hachage, infos de détection) en JSON
  5. Supprimer le fichier original du disque
  6. Journaliser l'événement de quarantaine
```

Le coffre-fort de quarantaine est stocké dans `~/.prx-sd/quarantine/` :

```
~/.prx-sd/quarantine/
  vault.bin                    # Magasin de fichiers chiffrés (ajout uniquement)
  index.json                   # Index de quarantaine avec métadonnées
  entries/
    a1b2c3d4.json             # Métadonnées par entrée
    e5f6g7h8.json
```

Chaque entrée de quarantaine contient :

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
Le coffre-fort de quarantaine utilise le chiffrement authentifié (AES-256-GCM). Cela empêche à la fois l'exécution accidentelle des logiciels malveillants mis en quarantaine et la falsification des preuves.
:::

## Lister les fichiers en quarantaine

```bash
sd quarantine list [OPTIONS]
```

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--json` | | `false` | Sortie en JSON |
| `--sort` | `-s` | `date` | Trier par : `date`, `name`, `size`, `severity` |
| `--filter` | `-f` | | Filtrer par gravité : `malicious`, `suspicious` |
| `--limit` | `-n` | tous | Nombre maximum d'entrées à afficher |

### Exemple

```bash
sd quarantine list
```

```
Quarantine Vault (4 entries, 1.2 MB)

ID        Date                 Size     Severity   Detection              Original Path
a1b2c3d4  2026-03-21 10:15:32  240 KB   malicious  Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   malicious  Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    suspicious  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   malicious  SHA256_Match          /tmp/dropper.bin
```

## Restaurer des fichiers

Restaurer un fichier mis en quarantaine à son emplacement d'origine ou à un chemin spécifié :

```bash
sd quarantine restore <ID> [OPTIONS]
```

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--to` | `-t` | chemin d'origine | Restaurer vers un emplacement différent |
| `--force` | `-f` | `false` | Écraser si la destination existe |

::: warning
La restauration d'un fichier en quarantaine replace un fichier malveillant ou suspect connu sur le disque. Ne restaurez les fichiers que si vous les avez confirmés comme faux positifs ou si vous en avez besoin pour une analyse dans un environnement isolé.
:::

### Exemples

```bash
# Restaurer à l'emplacement d'origine
sd quarantine restore a1b2c3d4

# Restaurer vers un répertoire spécifique pour analyse
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# Forcer l'écrasement si le fichier existe à la destination
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## Supprimer les fichiers en quarantaine

Supprimer définitivement les entrées en quarantaine :

```bash
# Supprimer une seule entrée
sd quarantine delete <ID>

# Supprimer toutes les entrées
sd quarantine delete-all

# Supprimer les entrées de plus de 30 jours
sd quarantine delete --older-than 30d

# Supprimer toutes les entrées avec une gravité spécifique
sd quarantine delete --filter malicious
```

Lors de la suppression, les données chiffrées sont écrasées avec des zéros avant d'être supprimées du coffre-fort.

::: warning
La suppression est permanente. Les données de fichier chiffrées et les métadonnées sont irrécupérables après la suppression. Envisagez d'exporter les entrées pour archivage avant de les supprimer.
:::

## Statistiques de quarantaine

Afficher des statistiques agrégées sur le coffre-fort de quarantaine :

```bash
sd quarantine stats
```

```
Quarantine Statistics
  Total entries:       47
  Total size:          28.4 MB (encrypted)
  Oldest entry:        2026-02-15
  Newest entry:        2026-03-21

  By severity:
    Malicious:         31 (65.9%)
    Suspicious:        16 (34.1%)

  By detection engine:
    YARA rules:        22 (46.8%)
    Hash match:        15 (31.9%)
    Heuristic:          7 (14.9%)
    Ransomware:         3 (6.4%)

  Top detections:
    Win_Trojan_Agent    8 entries
    Ransom_LockBit3     5 entries
    SHA256_Match        5 entries
    Suspicious_Script   4 entries
```

## Quarantaine automatique

Activer la mise en quarantaine automatique lors des analyses ou de la surveillance :

```bash
# Analyser avec mise en quarantaine automatique
sd scan /tmp --auto-quarantine

# Surveiller avec mise en quarantaine automatique
sd monitor --auto-quarantine /home /tmp

# Démon avec mise en quarantaine automatique
sd daemon start --auto-quarantine
```

Ou la définir comme politique par défaut :

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## Exporter les données de quarantaine

Exporter les métadonnées de quarantaine pour les rapports ou l'intégration SIEM :

```bash
# Exporter toutes les métadonnées en JSON
sd quarantine list --json > quarantine_report.json

# Exporter les statistiques en JSON
sd quarantine stats --json > quarantine_stats.json
```

## Étapes suivantes

- [Réponse aux menaces](/fr/prx-sd/remediation/) -- configurer les politiques de réponse au-delà de la quarantaine
- [Surveillance de fichiers](/fr/prx-sd/realtime/monitor) -- protection en temps réel avec mise en quarantaine automatique
- [Alertes webhook](/fr/prx-sd/alerts/webhook) -- être notifié lorsque des fichiers sont mis en quarantaine
- [Renseignements sur les menaces](/fr/prx-sd/signatures/) -- présentation de la base de données de signatures
