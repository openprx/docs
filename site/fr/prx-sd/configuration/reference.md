---
title: Référence de configuration
description: Référence complète de chaque clé de configuration PRX-SD, incluant les types, les valeurs par défaut et les descriptions détaillées.
---

# Référence de configuration

Cette page documente chaque clé de configuration dans `~/.prx-sd/config.json`. Utilisez `sd config set <key> <value>` pour modifier n'importe quel paramètre, ou éditez directement le fichier JSON.

## Paramètres d'analyse (`scan.*`)

Paramètres qui contrôlent la façon dont le moteur d'analyse traite les fichiers.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `scan.max_file_size` | `integer` | `104857600` (100 Mio) | Taille maximale du fichier en octets. Les fichiers plus grands que cette valeur sont ignorés lors de l'analyse. Définissez à `0` pour désactiver la limite (non recommandé). |
| `scan.threads` | `integer \| null` | `null` (auto) | Nombre de threads d'analyse parallèles. Lorsque `null`, PRX-SD utilise le nombre de cœurs CPU logiques. Définissez un nombre spécifique pour limiter ou augmenter le parallélisme. |
| `scan.timeout_per_file_ms` | `integer` | `30000` (30 s) | Temps maximum en millisecondes autorisé pour analyser un seul fichier. Si dépassé, le fichier est marqué comme erreur et l'analyse continue au fichier suivant. |
| `scan.scan_archives` | `boolean` | `true` | Indique s'il faut recurser dans les fichiers d'archive (ZIP, tar.gz, 7z, RAR, etc.) et analyser leur contenu. |
| `scan.max_archive_depth` | `integer` | `3` | Profondeur d'imbrication maximale lors de la récursion dans les archives. Par exemple, un ZIP dans un ZIP dans un ZIP nécessiterait une profondeur de 3. Prévient les attaques zip-bomb. |
| `scan.heuristic_threshold` | `integer` | `60` | Score heuristique minimum (0-100) pour marquer un fichier comme **Malveillant**. Les fichiers avec un score entre 30 et ce seuil sont marqués comme **Suspects**. Des valeurs plus basses augmentent la sensibilité mais peuvent produire plus de faux positifs. |
| `scan.exclude_paths` | `string[]` | `[]` | Liste de motifs glob ou préfixes de chemins à exclure de l'analyse. Supporte les caractères génériques `*` (n'importe quel caractère) et `?` (caractère unique). |

### Exemples

```bash
# Augmenter la taille maximale du fichier à 500 Mio
sd config set scan.max_file_size 524288000

# Utiliser exactement 4 threads
sd config set scan.threads 4

# Augmenter le délai d'attente par fichier à 60 secondes
sd config set scan.timeout_per_file_ms 60000

# Désactiver l'analyse des archives
sd config set scan.scan_archives false

# Définir la profondeur d'imbrication des archives à 5
sd config set scan.max_archive_depth 5

# Abaisser le seuil heuristique pour plus de sensibilité
sd config set scan.heuristic_threshold 40

# Exclure des chemins
sd config set scan.exclude_paths '["/proc", "/sys", "/dev", "*.log", "*.tmp"]'
```

## Paramètres de surveillance (`monitor.*`)

Paramètres qui contrôlent la surveillance du système de fichiers en temps réel (`sd monitor` et `sd daemon`).

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `monitor.block_mode` | `boolean` | `false` | Lorsque `true`, utiliser les événements de permission fanotify (Linux uniquement) pour **bloquer** l'accès aux fichiers malveillants avant que le processus demandeur puisse les lire. Nécessite des privilèges root. Lorsque `false`, les fichiers sont analysés après leur création/modification et les menaces sont signalées mais non bloquées. |
| `monitor.channel_capacity` | `integer` | `4096` | Taille du tampon du canal d'événements interne entre l'observateur du système de fichiers et le scanner. Augmentez cette valeur si vous voyez des avertissements "channel full" sous une activité intense du système de fichiers. |

### Exemples

```bash
# Activer le mode blocage (nécessite root)
sd config set monitor.block_mode true

# Augmenter le tampon de canal pour les serveurs très actifs
sd config set monitor.channel_capacity 16384
```

::: warning
Le mode blocage (`monitor.block_mode = true`) utilise les événements de permission fanotify Linux. Cela nécessite :
- Des privilèges root
- Un noyau Linux avec `CONFIG_FANOTIFY_ACCESS_PERMISSIONS` activé
- Le démon PRX-SD s'exécutant en tant que root

Sur macOS et Windows, le mode blocage n'est pas disponible et ce paramètre est ignoré.
:::

## Paramètres de mise à jour

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `update_server_url` | `string` | `null` | URL du serveur de mise à jour des signatures. Le moteur récupère `<url>/manifest.json` pour vérifier les mises à jour. Remplacez ceci pour utiliser un miroir privé ou un serveur de mise à jour en réseau isolé. |

### Exemples

```bash
# Utiliser un miroir privé
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"

# Réinitialiser au serveur officiel
sd config set update_server_url null
```

## Paramètres de quarantaine (`quarantine.*`)

Paramètres qui contrôlent le coffre-fort de quarantaine chiffré.

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `quarantine.auto_quarantine` | `boolean` | `false` | Lorsque `true`, déplacer automatiquement les fichiers détectés comme **Malveillants** vers le coffre-fort de quarantaine lors de l'analyse. Lorsque `false`, les menaces sont signalées mais les fichiers restent en place. |
| `quarantine.max_vault_size_mb` | `integer` | `1024` (1 Gio) | Taille totale maximale du coffre-fort de quarantaine en Mio. Lorsque cette limite est atteinte, les nouveaux fichiers ne peuvent pas être mis en quarantaine jusqu'à ce que des entrées plus anciennes soient supprimées. |

### Exemples

```bash
# Activer la mise en quarantaine automatique
sd config set quarantine.auto_quarantine true

# Augmenter la taille du coffre à 5 Gio
sd config set quarantine.max_vault_size_mb 5120

# Désactiver la mise en quarantaine automatique (rapport uniquement)
sd config set quarantine.auto_quarantine false
```

## Configuration par défaut complète

Pour référence, voici la configuration par défaut complète :

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
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

## Règles d'analyse des valeurs

Lors de l'utilisation de `sd config set`, les valeurs sont automatiquement analysées dans cet ordre :

1. **Booléen** -- `true` ou `false`
2. **Null** -- `null`
3. **Entier** -- par exemple `42`, `104857600`
4. **Flottant** -- par exemple `3.14`
5. **Tableau/objet JSON** -- par exemple `'["/proc", "*.log"]'`, `'{"key": "value"}'`
6. **Chaîne** -- tout le reste, par exemple `"https://example.com"`

::: tip
Lors de la définition de tableaux ou d'objets, encadrez la valeur de guillemets simples pour éviter l'expansion shell :
```bash
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'
```
:::

## Commandes associées

| Commande | Description |
|----------|-------------|
| `sd config show` | Afficher la configuration actuelle |
| `sd config set <key> <value>` | Définir une valeur de configuration |
| `sd config reset` | Réinitialiser tous les paramètres aux valeurs par défaut |
| `sd policy show` | Afficher la politique de remédiation |
| `sd policy set <key> <value>` | Définir une valeur de politique de remédiation |
| `sd policy reset` | Réinitialiser la politique de remédiation aux valeurs par défaut |

## Étapes suivantes

- Retournez à la [Présentation de la configuration](./index) pour une introduction générale
- Apprenez comment les paramètres `scan.*` affectent l'[Analyse de fichiers](../scanning/file-scan)
- Configurez la [Surveillance en temps réel](../realtime/) avec les paramètres `monitor.*`
- Configurez la [Quarantaine](../quarantine/) avec la mise en quarantaine automatique
