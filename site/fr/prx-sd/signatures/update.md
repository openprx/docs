---
title: Mettre à jour les signatures
description: Maintenir les bases de données de renseignements sur les menaces à jour avec sd update, incluant les mises à jour incrémentielles et la vérification Ed25519.
---

# Mettre à jour les signatures

La commande `sd update` télécharge les dernières signatures de menaces de toutes les sources configurées. Les mises à jour régulières sont cruciales -- de nouveaux échantillons de logiciels malveillants apparaissent toutes les quelques minutes, et une base de données de signatures obsolète laisse des lacunes dans la protection.

## Utilisation

```bash
sd update [OPTIONS]
```

## Options

| Indicateur | Court | Défaut | Description |
|------------|-------|--------|-------------|
| `--check-only` | | `false` | Vérifier les mises à jour disponibles sans télécharger |
| `--force` | `-f` | `false` | Forcer le re-téléchargement de toutes les signatures, en ignorant le cache |
| `--source` | `-s` | tous | Mettre à jour uniquement une catégorie de source spécifique : `hashes`, `yara`, `ioc`, `clamav` |
| `--full` | | `false` | Inclure les grands ensembles de données (VirusShare 20M+ hachages MD5) |
| `--server-url` | | officiel | URL de serveur de mise à jour personnalisée |
| `--no-verify` | | `false` | Ignorer la vérification de signature Ed25519 (non recommandé) |
| `--timeout` | `-t` | `300` | Délai de téléchargement par source en secondes |
| `--parallel` | `-p` | `4` | Nombre de téléchargements parallèles |
| `--quiet` | `-q` | `false` | Supprimer la sortie de progression |

## Fonctionnement des mises à jour

### Flux de mise à jour

```
sd update
  1. Récupérer metadata.json depuis le serveur de mise à jour
  2. Comparer les versions locales avec les versions distantes
  3. Pour chaque source obsolète :
     a. Télécharger le diff incrémentiel (ou le fichier complet si aucun diff disponible)
     b. Vérifier la signature Ed25519
     c. Appliquer à la base de données locale
  4. Recompiler les règles YARA
  5. Mettre à jour le metadata.json local
```

### Mises à jour incrémentielles

PRX-SD utilise des mises à jour incrémentielles pour minimiser la bande passante :

| Type de source | Méthode de mise à jour | Taille typique |
|----------------|----------------------|----------------|
| Bases de données de hachages | Diff delta (ajouts + suppressions) | 50-200 Ko |
| Règles YARA | Correctifs de style Git | 10-50 Ko |
| Flux IOC | Remplacement complet (petits fichiers) | 1-5 Mo |
| ClamAV | Mises à jour incrémentielles cdiff | 100-500 Ko |

Lorsque les mises à jour incrémentielles ne sont pas disponibles (première installation, corruption ou `--force`), les bases de données complètes sont téléchargées.

### Vérification de signature Ed25519

Chaque fichier téléchargé est vérifié par rapport à une signature Ed25519 avant d'être appliqué. Cela protège contre :

- **Falsification** -- les fichiers modifiés sont rejetés
- **Corruption** -- les téléchargements incomplets sont détectés
- **Attaques par rejeu** -- les anciennes signatures ne peuvent pas être rejouées (validation d'horodatage)

La clé publique de signature est intégrée dans le binaire `sd` au moment de la compilation.

::: warning
N'utilisez jamais `--no-verify` en production. La vérification de signature existe pour prévenir les attaques de la chaîne d'approvisionnement via des serveurs de mise à jour compromis ou des attaques de l'homme du milieu.
:::

## Vérifier les mises à jour

Pour voir quelles mises à jour sont disponibles sans télécharger :

```bash
sd update --check-only
```

```
Checking for updates...
  MalwareBazaar:    update available (v2026.0321.2, +847 hashes)
  URLhaus:          up to date (v2026.0321.1)
  Feodo Tracker:    update available (v2026.0321.3, +12 hashes)
  ThreatFox:        up to date (v2026.0321.1)
  YARA Community:   update available (v2026.0320.1, +3 rules)
  IOC Feeds:        update available (v2026.0321.1, +1,204 indicators)
  ClamAV:           not configured

3 sources have updates available.
Run 'sd update' to download.
```

## Serveur de mise à jour personnalisé

Pour les environnements isolés ou les organisations exécutant un miroir privé :

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

Définir le serveur de manière permanente dans `config.toml` :

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
Utilisez l'outil `prx-sd-mirror` pour configurer un miroir de signatures local. Consultez le [guide d'auto-hébergement](https://github.com/OpenPRX/prx-sd-signatures) pour les détails.
:::

## Alternative script shell

Pour les systèmes où `sd` n'est pas installé, utilisez le script shell fourni :

```bash
# Mise à jour standard (hachages + YARA)
./tools/update-signatures.sh

# Mise à jour complète incluant VirusShare
./tools/update-signatures.sh --full

# Mettre à jour uniquement les hachages
./tools/update-signatures.sh --source hashes

# Mettre à jour uniquement les règles YARA
./tools/update-signatures.sh --source yara
```

## Exemples

```bash
# Mise à jour standard
sd update

# Forcer le re-téléchargement complet de tout
sd update --force

# Mettre à jour uniquement les règles YARA
sd update --source yara

# Mise à jour complète avec VirusShare (grand téléchargement)
sd update --full

# Mode silencieux pour les tâches cron
sd update --quiet

# Vérifier d'abord ce qui est disponible
sd update --check-only

# Utiliser un serveur personnalisé avec plus de parallélisme
sd update --server-url https://mirror.example.com --parallel 8
```

## Automatiser les mises à jour

### Avec sd daemon

Le démon gère les mises à jour automatiquement. Configurez l'intervalle :

```bash
sd daemon start --update-hours 4
```

### Avec cron

```bash
# Mettre à jour les signatures toutes les 6 heures
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### Avec minuterie systemd

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## Étapes suivantes

- [Sources de signatures](./sources) -- détails sur chaque source de renseignements sur les menaces
- [Importer des hachages](./import) -- ajouter des listes de blocage de hachages personnalisées
- [Démon](../realtime/daemon) -- mises à jour automatiques en arrière-plan
- [Présentation du renseignement sur les menaces](./index) -- présentation de l'architecture de la base de données
