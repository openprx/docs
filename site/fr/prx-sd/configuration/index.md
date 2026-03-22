---
title: Présentation de la configuration
description: "Comprendre le fonctionnement de la configuration de PRX-SD, où les fichiers de configuration sont stockés, et comment afficher, modifier et réinitialiser les paramètres avec la commande sd config."
---

# Présentation de la configuration

PRX-SD stocke toute la configuration dans un seul fichier JSON situé à `~/.prx-sd/config.json`. Ce fichier est créé automatiquement lors du premier démarrage avec des valeurs par défaut sensées. Vous pouvez afficher, modifier et réinitialiser la configuration à l'aide de la commande `sd config` ou en éditant directement le fichier JSON.

## Emplacement du fichier de configuration

| Plateforme | Chemin par défaut |
|------------|------------------|
| Linux / macOS | `~/.prx-sd/config.json` |
| Windows | `%USERPROFILE%\.prx-sd\config.json` |
| Personnalisé | `--data-dir /path/to/dir` (indicateur CLI global) |

L'indicateur global `--data-dir` remplace l'emplacement par défaut. Lorsqu'il est défini, le fichier de configuration est lu depuis `<data-dir>/config.json`.

```bash
# Utiliser un répertoire de données personnalisé
sd --data-dir /opt/prx-sd config show
```

## La commande `sd config`

### Afficher la configuration actuelle

Afficher tous les paramètres actuels, y compris le chemin du fichier de configuration :

```bash
sd config show
```

Sortie :

```
Current Configuration
  File: /home/user/.prx-sd/config.json

{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

### Définir une valeur de configuration

Définissez n'importe quelle clé de configuration en utilisant la notation pointée. Les valeurs sont automatiquement analysées comme le type JSON approprié (booléen, entier, flottant, tableau, objet ou chaîne).

```bash
sd config set <key> <value>
```

Exemples :

```bash
# Définir la taille maximale du fichier à 200 Mio
sd config set scan.max_file_size 209715200

# Définir les threads d'analyse à 8
sd config set scan.threads 8

# Activer la mise en quarantaine automatique
sd config set quarantine.auto_quarantine true

# Définir le seuil heuristique à 50 (plus sensible)
sd config set scan.heuristic_threshold 50

# Ajouter des chemins d'exclusion comme tableau JSON
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'

# Changer l'URL du serveur de mise à jour
sd config set update_server_url "https://custom-update.example.com/v1"
```

Sortie :

```
OK Set scan.max_file_size = 209715200 (was 104857600)
```

::: tip
Les clés imbriquées utilisent la notation pointée. Par exemple, `scan.max_file_size` navigue dans l'objet `scan` et définit le champ `max_file_size`. Les objets intermédiaires sont créés automatiquement s'ils n'existent pas.
:::

### Réinitialiser aux valeurs par défaut

Restaurer toute la configuration aux valeurs d'usine par défaut :

```bash
sd config reset
```

Sortie :

```
OK Configuration reset to defaults.
```

::: warning
La réinitialisation de la configuration ne supprime pas les bases de données de signatures, les règles YARA ou les fichiers mis en quarantaine. Elle réinitialise uniquement le fichier `config.json` aux valeurs par défaut.
:::

## Catégories de configuration

La configuration est organisée en quatre sections principales :

| Section | Objectif |
|---------|---------|
| `scan.*` | Comportement d'analyse des fichiers : limites de taille, threads, délais d'attente, archives, heuristiques |
| `monitor.*` | Surveillance en temps réel : mode blocage, capacité du canal d'événements |
| `quarantine.*` | Coffre-fort de quarantaine : mise en quarantaine automatique, taille maximale du coffre |
| `update_server_url` | Point de terminaison du serveur de mise à jour des signatures |

Pour une référence complète de chaque clé de configuration, son type, sa valeur par défaut et sa description, consultez la [Référence de configuration](./reference).

## Configuration par défaut

Lors du premier démarrage, PRX-SD génère la configuration par défaut suivante :

```json
{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": "https://update.prx-sd.dev/v1",
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

Valeurs par défaut clés :

- **Taille maximale du fichier :** 100 Mio (les fichiers plus grands sont ignorés)
- **Threads :** `null` (auto-détection basée sur le nombre de CPU)
- **Délai d'attente :** 30 secondes par fichier
- **Archives :** Analysées, jusqu'à 3 niveaux d'imbrication
- **Seuil heuristique :** 60 (score 60+ = malveillant, 30-59 = suspect)
- **Mode blocage :** Désactivé (le moniteur signale mais ne bloque pas l'accès aux fichiers)
- **Mise en quarantaine automatique :** Désactivée (les menaces sont signalées mais non déplacées)
- **Limite de taille du coffre :** 1024 Mio

## Modifier directement le fichier de configuration

Vous pouvez également éditer `~/.prx-sd/config.json` avec n'importe quel éditeur de texte. PRX-SD lit le fichier au démarrage de chaque commande, donc les modifications prennent effet immédiatement.

```bash
# Ouvrir dans votre éditeur
$EDITOR ~/.prx-sd/config.json
```

Assurez-vous que le fichier est du JSON valide. S'il est malformé, PRX-SD revient aux valeurs par défaut et affiche un avertissement.

## Structure du répertoire de données

```
~/.prx-sd/
  config.json       # Configuration du moteur
  signatures/       # Base de données de signatures de hachage LMDB
  yara/             # Fichiers de règles YARA compilées
  quarantine/       # Coffre-fort de quarantaine chiffré AES-256-GCM
  adblock/          # Listes de filtres adblock et journaux
  plugins/          # Répertoires de plugins WASM
  audit/            # Journaux d'audit d'analyse (JSONL)
  prx-sd.pid        # Fichier PID du démon (lorsqu'en cours d'exécution)
```

## Étapes suivantes

- Consultez la [Référence de configuration](./reference) pour chaque clé, type et valeur par défaut
- Découvrez l'[Analyse](../scanning/file-scan) pour comprendre comment la configuration affecte les analyses
- Configurez la [Surveillance en temps réel](../realtime/) et configurez `monitor.block_mode`
- Configurez le comportement de mise en quarantaine automatique de la [Quarantaine](../quarantine/)
