---
title: Importer des hachages
description: Importer des listes de blocage de hachages personnalisées et des bases de données de signatures ClamAV dans PRX-SD.
---

# Importer des hachages

PRX-SD vous permet d'importer des listes de blocage de hachages personnalisées et des bases de données de signatures ClamAV pour étendre la couverture de détection avec vos propres renseignements sur les menaces ou des listes de blocage organisationnelles.

## Importer des hachages personnalisés

### Utilisation

```bash
sd import [OPTIONS] <FILE>
```

### Options

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--format` | `-f` | auto-détecté | Format de hachage : `sha256`, `sha1`, `md5`, `auto` |
| `--label` | `-l` | nom de fichier | Étiquette pour l'ensemble importé |
| `--replace` | | `false` | Remplacer les entrées existantes avec la même étiquette |
| `--dry-run` | | `false` | Valider le fichier sans importer |
| `--quiet` | `-q` | `false` | Supprimer la sortie de progression |

### Formats de fichiers de hachage supportés

PRX-SD accepte plusieurs formats courants :

**Liste simple** -- un hachage par ligne :

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**Hachage avec étiquette** -- hachage suivi d'un espace et d'une description optionnelle :

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**Format CSV** -- séparé par des virgules avec en-têtes :

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**Lignes de commentaire** -- les lignes commençant par `#` sont ignorées :

```
# Custom blocklist - updated 2026-03-21
# Source: internal threat hunting team
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
Le format de hachage est auto-détecté en fonction de la longueur : 32 caractères = MD5, 40 caractères = SHA-1, 64 caractères = SHA-256. Utilisez `--format` pour forcer si la détection échoue.
:::

### Exemples d'import

```bash
# Importer une liste de blocage SHA-256
sd import threat_hashes.txt

# Importer avec format et étiquette explicites
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# Simulation pour valider le fichier
sd import --dry-run suspicious_hashes.csv

# Remplacer un ensemble d'import existant
sd import --replace --label "daily-feed" today_hashes.txt
```

### Sortie d'import

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## Importer des bases de données ClamAV

### Utilisation

```bash
sd import-clamav [OPTIONS] <FILE>
```

### Options

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--type` | `-t` | auto-détecté | Type de base de données : `cvd`, `cld`, `hdb`, `hsb`, `auto` |
| `--quiet` | `-q` | `false` | Supprimer la sortie de progression |

### Formats ClamAV supportés

| Format | Extension | Description |
|--------|-----------|-------------|
| **CVD** | `.cvd` | Base de données de virus ClamAV (compressée, signée) |
| **CLD** | `.cld` | Base de données locale ClamAV (mises à jour incrémentielles) |
| **HDB** | `.hdb` | Base de données de hachages MD5 (texte brut) |
| **HSB** | `.hsb` | Base de données de hachages SHA-256 (texte brut) |
| **NDB** | `.ndb` | Format de signature étendu (basé sur le corps) |

::: warning
Les fichiers CVD/CLD peuvent être très volumineux. Le fichier `main.cvd` seul contient plus de 6 millions de signatures et nécessite environ 300 Mo d'espace disque après l'import.
:::

### Exemples d'import ClamAV

```bash
# Importer la base de données principale ClamAV
sd import-clamav /var/lib/clamav/main.cvd

# Importer la base de données de mise à jour quotidienne
sd import-clamav /var/lib/clamav/daily.cvd

# Importer une base de données de hachages en texte brut
sd import-clamav custom_sigs.hdb

# Importer une base de données de hachages SHA-256
sd import-clamav my_hashes.hsb
```

### Configuration de l'intégration ClamAV

Pour utiliser les signatures ClamAV avec PRX-SD :

1. Installer freshclam (programme de mise à jour ClamAV) :

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. Télécharger les bases de données :

```bash
sudo freshclam
```

3. Importer dans PRX-SD :

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. Activer ClamAV dans la configuration :

```toml
[signatures.sources]
clamav = true
```

## Gérer les hachages importés

Afficher les ensembles de hachages importés :

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

Supprimer un ensemble importé :

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## Étapes suivantes

- [Règles YARA personnalisées](./custom-rules) -- écrire des règles de détection basées sur des motifs
- [Sources de signatures](./sources) -- toutes les sources de renseignements sur les menaces disponibles
- [Mettre à jour les signatures](./update) -- maintenir les bases de données à jour
- [Présentation du renseignement sur les menaces](./index) -- architecture de la base de données
