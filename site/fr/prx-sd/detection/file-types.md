---
title: Types de fichiers supportés
description: "Matrice des types de fichiers supportés par PRX-SD. Détection par nombre magique pour PE, ELF, Mach-O, PDF, Office, archives et scripts avec analyse récursive des archives."
---

# Types de fichiers supportés

PRX-SD identifie les types de fichiers en utilisant la détection par nombre magique (en examinant les premiers octets d'un fichier) plutôt qu'en se basant sur les extensions de fichier. Cela garantit une identification précise même lorsque les fichiers sont renommés ou ont des extensions manquantes.

## Matrice des types de fichiers

Le tableau suivant montre tous les types de fichiers supportés et les couches de détection applicables à chacun :

| Type de fichier | Extensions | Octets magiques | Hachage | YARA | Heuristiques | Récursion d'archive |
|-----------------|------------|-----------------|---------|------|--------------|---------------------|
| **PE (Windows)** | .exe, .dll, .sys, .scr, .ocx | `4D 5A` (MZ) | Oui | Oui | Oui | -- |
| **ELF (Linux)** | .so, .o, (sans ext) | `7F 45 4C 46` | Oui | Oui | Oui | -- |
| **Mach-O (macOS)** | .dylib, .bundle, (sans ext) | `FE ED FA CE/CF` ou `CE FA ED FE/CF` | Oui | Oui | Oui | -- |
| **Binaire universel** | (sans ext) | `CA FE BA BE` | Oui | Oui | Oui | -- |
| **PDF** | .pdf | `25 50 44 46` (%PDF) | Oui | Oui | Oui | -- |
| **Office (OLE)** | .doc, .xls, .ppt | `D0 CF 11 E0` | Oui | Oui | Oui | -- |
| **Office (OOXML)** | .docx, .xlsx, .pptx | `50 4B 03 04` (ZIP) + `[Content_Types].xml` | Oui | Oui | Oui | Extrait |
| **ZIP** | .zip | `50 4B 03 04` | Oui | Oui | Limité | Récursif |
| **7-Zip** | .7z | `37 7A BC AF 27 1C` | Oui | Oui | Limité | Récursif |
| **tar** | .tar | `75 73 74 61 72` au décalage 257 | Oui | Oui | Limité | Récursif |
| **gzip** | .gz, .tgz | `1F 8B` | Oui | Oui | Limité | Récursif |
| **bzip2** | .bz2 | `42 5A 68` (BZh) | Oui | Oui | Limité | Récursif |
| **xz** | .xz | `FD 37 7A 58 5A 00` | Oui | Oui | Limité | Récursif |
| **RAR** | .rar | `52 61 72 21` (Rar!) | Oui | Oui | Limité | Récursif |
| **CAB** | .cab | `4D 53 43 46` (MSCF) | Oui | Oui | Limité | Récursif |
| **ISO** | .iso | `43 44 30 30 31` au décalage 32769 | Oui | Oui | Limité | Récursif |
| **Script shell** | .sh, .bash | `23 21` (#!) | Oui | Oui | Motif | -- |
| **Python** | .py, .pyc | Texte / `42 0D 0D 0A` | Oui | Oui | Motif | -- |
| **JavaScript** | .js, .mjs | Détection texte | Oui | Oui | Motif | -- |
| **PowerShell** | .ps1, .psm1 | Détection texte | Oui | Oui | Motif | -- |
| **VBScript** | .vbs, .vbe | Détection texte | Oui | Oui | Motif | -- |
| **Batch** | .bat, .cmd | Détection texte | Oui | Oui | Motif | -- |
| **Java** | .class, .jar | `CA FE BA BE` / ZIP | Oui | Oui | Limité | .jar récursif |
| **WebAssembly** | .wasm | `00 61 73 6D` | Oui | Oui | Limité | -- |
| **DEX (Android)** | .dex | `64 65 78 0A` (dex\n) | Oui | Oui | Limité | -- |
| **APK (Android)** | .apk | ZIP + `AndroidManifest.xml` | Oui | Oui | Limité | Récursif |

### Légende des couches de détection

| Couche | Signification |
|--------|---------------|
| **Hachage** | Hachage SHA-256/MD5 vérifié par rapport à la base de données de signatures |
| **YARA** | Ensemble complet de règles YARA appliqué au contenu du fichier |
| **Heuristiques : Oui** | Analyse heuristique complète spécifique au type de fichier (voir [Heuristiques](./heuristics)) |
| **Heuristiques : Limité** | Vérifications de base d'entropie et de structure uniquement |
| **Heuristiques : Motif** | Correspondance de motifs textuelle pour les commandes suspectes et l'obfuscation |
| **Récursion d'archive** | Le contenu est extrait et chaque fichier est analysé individuellement |

## Détection par nombre magique

PRX-SD lit les 8 192 premiers octets de chaque fichier pour déterminer son type. Cette approche est plus fiable que la détection basée sur l'extension :

```
File: invoice.pdf.exe
Extension suggests: PDF
Magic bytes: 4D 5A → PE executable
PRX-SD identifies: PE (correct)
```

::: warning Discordance d'extension
Lorsque l'extension du fichier ne correspond pas au nombre magique détecté, PRX-SD ajoute une note au rapport d'analyse. Les discordances d'extensions sont une technique courante d'ingénierie sociale (par exemple, `photo.jpg.exe`).
:::

### Priorité de détection par nombre magique

Lorsque plusieurs signatures pourraient correspondre (par exemple, la signature magique ZIP pour les fichiers .zip et .docx), PRX-SD utilise une inspection plus approfondie :

1. Lire les octets magiques au décalage 0
2. Si ambigu (par exemple, ZIP), inspecter la structure interne
3. Pour les formats basés sur ZIP, rechercher `[Content_Types].xml` (OOXML), `META-INF/MANIFEST.MF` (JAR), `AndroidManifest.xml` (APK)
4. Retomber sur le type de conteneur générique

## Analyse récursive des archives

Lorsque PRX-SD rencontre une archive (ZIP, 7z, tar, gzip, RAR, etc.), il extrait le contenu vers un répertoire temporaire et analyse chaque fichier individuellement à travers le pipeline de détection complet.

### Profondeur de récursion

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `max_archive_depth` | 5 | Niveaux d'imbrication maximum pour les archives dans les archives |
| `max_archive_files` | 10 000 | Nombre maximum de fichiers à extraire d'une seule archive |
| `max_archive_size_mb` | 500 | Taille totale extraite maximale avant l'arrêt |

Ces limites empêchent l'épuisement des ressources dû aux bombes zip et aux archives profondément imbriquées.

```toml
# ~/.config/prx-sd/config.toml
[scanning]
max_archive_depth = 5
max_archive_files = 10000
max_archive_size_mb = 500
```

::: warning Bombes zip
PRX-SD détecte les bombes zip (archives avec des taux de compression extrêmes) et arrête l'extraction avant de consommer un espace disque ou une mémoire excessive. Une détection de bombe zip est signalée comme `SUSPICIOUS` dans les résultats d'analyse.
:::

### Archives protégées par mot de passe

PRX-SD ne peut pas extraire les archives protégées par mot de passe. Celles-ci sont signalées comme `ignorées` dans les résultats d'analyse avec une note sur le chiffrement. Le fichier d'archive lui-même est toujours vérifié par rapport aux bases de données de hachages et YARA.

## Détection de scripts

Pour les fichiers de script textuels (shell, Python, JavaScript, PowerShell, VBScript, batch), PRX-SD applique des heuristiques basées sur des motifs :

| Motif | Points | Description |
|-------|--------|-------------|
| Chaînes obfusquées | 10-20 | Commandes encodées en base64, concaténation de chaînes excessive |
| Téléchargement + exécution | 15-25 | `curl/wget` canalisé vers `bash/sh`, `Invoke-WebRequest` + `Invoke-Expression` |
| Shell inversé | 20-30 | Motifs de shell inversé connus (`/dev/tcp`, `nc -e`, `bash -i`) |
| Accès aux identifiants | 10-15 | Lecture de `/etc/shadow`, magasins d'identifiants de navigateur, trousseau |
| Mécanismes de persistance | 10-15 | Ajout de tâches cron, services systemd, clés de registre |

## Fichiers non supportés

Les fichiers qui ne correspondent à aucun nombre magique connu sont toujours vérifiés par rapport aux bases de données de hachages et YARA. L'analyse heuristique n'est pas appliquée aux types de fichiers inconnus. Exemples courants :

- Données binaires brutes
- Formats propriétaires sans nombres magiques publics
- Fichiers chiffrés (sauf si le format de conteneur est reconnu)

Ces fichiers apparaissent avec `type: unknown` dans les rapports d'analyse et reçoivent uniquement l'analyse par hachage + YARA.

## Étapes suivantes

- [Analyse heuristique](./heuristics) -- Vérifications heuristiques détaillées par type de fichier
- [Règles YARA](./yara-rules) -- Règles ciblant les structures de format de fichier spécifiques
- [Analyse de fichiers et répertoires](../scanning/file-scan) -- Analyser des fichiers en pratique
- [Présentation du moteur de détection](./index) -- Comment toutes les couches fonctionnent ensemble
