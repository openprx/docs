---
title: Référence des commandes CLI
description: "Référence complète de toutes les commandes et sous-commandes CLI de PRX-WAF. Gestion du serveur, opérations sur les règles, intégration CrowdSec et détection de bots."
---

# Référence des commandes CLI

L'interface en ligne de commande `prx-waf` fournit des commandes pour la gestion du serveur, les opérations sur les règles, l'intégration CrowdSec et la détection de bots.

## Options globales

| Flag | Défaut | Description |
|------|--------|-------------|
| `-c, --config <FILE>` | `configs/default.toml` | Chemin vers le fichier de configuration TOML |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## Commandes du serveur

| Commande | Description |
|----------|-------------|
| `prx-waf run` | Démarrer le proxy inverse + l'API de gestion (bloque indéfiniment) |
| `prx-waf migrate` | Exécuter les migrations de base de données uniquement |
| `prx-waf seed-admin` | Créer l'utilisateur admin par défaut (admin/admin) |

```bash
# Démarrer le serveur
prx-waf -c configs/default.toml run

# Exécuter les migrations avant le premier démarrage
prx-waf -c configs/default.toml migrate

# Créer l'utilisateur admin
prx-waf -c configs/default.toml seed-admin
```

::: tip
Pour la configuration initiale, exécutez `migrate` et `seed-admin` avant `run`. Les démarrages suivants n'ont besoin que de `run` -- les migrations sont vérifiées automatiquement.
:::

## Gestion des règles

Commandes pour gérer les règles de détection. Toutes les commandes de règles opèrent sur le répertoire de règles configuré.

| Commande | Description |
|----------|-------------|
| `prx-waf rules list` | Lister toutes les règles chargées |
| `prx-waf rules list --category <CAT>` | Filtrer les règles par catégorie |
| `prx-waf rules list --source <SRC>` | Filtrer les règles par source |
| `prx-waf rules info <RULE-ID>` | Afficher les informations détaillées d'une règle |
| `prx-waf rules enable <RULE-ID>` | Activer une règle désactivée |
| `prx-waf rules disable <RULE-ID>` | Désactiver une règle |
| `prx-waf rules reload` | Recharger à chaud toutes les règles depuis le disque |
| `prx-waf rules validate <PATH>` | Valider un fichier de règles pour sa correction |
| `prx-waf rules import <PATH\|URL>` | Importer des règles depuis un fichier ou une URL |
| `prx-waf rules export [--format yaml]` | Exporter l'ensemble de règles actuel |
| `prx-waf rules update` | Récupérer les dernières règles depuis les sources distantes |
| `prx-waf rules search <QUERY>` | Rechercher des règles par nom ou description |
| `prx-waf rules stats` | Afficher les statistiques des règles |

### Exemples

```bash
# Lister toutes les règles d'injection SQL
prx-waf rules list --category sqli

# Lister les règles OWASP CRS
prx-waf rules list --source owasp

# Afficher les détails d'une règle spécifique
prx-waf rules info CRS-942100

# Désactiver une règle causant des faux positifs
prx-waf rules disable CRS-942100

# Recharger après modification des règles
prx-waf rules reload

# Valider les règles personnalisées avant déploiement
prx-waf rules validate rules/custom/myapp.yaml

# Importer des règles depuis une URL
prx-waf rules import https://example.com/rules/custom.yaml

# Exporter toutes les règles en YAML
prx-waf rules export --format yaml > all-rules.yaml

# Afficher les statistiques
prx-waf rules stats
```

## Gestion des sources de règles

Commandes pour gérer les sources de règles distantes.

| Commande | Description |
|----------|-------------|
| `prx-waf sources list` | Lister les sources de règles configurées |
| `prx-waf sources add <NAME> <URL>` | Ajouter une source de règles distante |
| `prx-waf sources remove <NAME>` | Supprimer une source de règles |
| `prx-waf sources update [NAME]` | Récupérer les dernières règles depuis une source spécifique (ou toutes) |
| `prx-waf sources sync` | Synchroniser toutes les sources distantes |

### Exemples

```bash
# Lister toutes les sources
prx-waf sources list

# Ajouter une source personnalisée
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# Synchroniser toutes les sources
prx-waf sources sync

# Mettre à jour une source spécifique
prx-waf sources update owasp-crs
```

## Intégration CrowdSec

Commandes pour gérer l'intégration de l'intelligence sur les menaces CrowdSec.

| Commande | Description |
|----------|-------------|
| `prx-waf crowdsec status` | Afficher l'état de l'intégration CrowdSec |
| `prx-waf crowdsec decisions` | Lister les décisions actives depuis le LAPI |
| `prx-waf crowdsec test` | Tester la connectivité LAPI |
| `prx-waf crowdsec setup` | Assistant de configuration CrowdSec interactif |

### Exemples

```bash
# Vérifier l'état de l'intégration
prx-waf crowdsec status

# Lister les décisions de blocage/captcha actives
prx-waf crowdsec decisions

# Tester la connectivité avec le LAPI CrowdSec
prx-waf crowdsec test

# Lancer l'assistant de configuration
prx-waf crowdsec setup
```

## Détection de bots

Commandes pour gérer les règles de détection de bots.

| Commande | Description |
|----------|-------------|
| `prx-waf bot list` | Lister les signatures de bots connues |
| `prx-waf bot add <PATTERN> [--action ACTION]` | Ajouter un pattern de détection de bot |
| `prx-waf bot remove <PATTERN>` | Supprimer un pattern de détection de bot |
| `prx-waf bot test <USER-AGENT>` | Tester un user-agent contre les règles de bots |

### Exemples

```bash
# Lister toutes les signatures de bots
prx-waf bot list

# Ajouter un nouveau pattern de bot
prx-waf bot add "(?i)my-bad-bot" --action block

# Ajouter un pattern de bot en mode journalisation uniquement
prx-waf bot add "(?i)suspicious-crawler" --action log

# Tester une chaîne user-agent
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# Supprimer un pattern de bot
prx-waf bot remove "(?i)my-bad-bot"
```

## Cas d'utilisation courants

### Configuration initiale

```bash
# 1. Exécuter les migrations
prx-waf -c configs/default.toml migrate

# 2. Créer l'utilisateur admin
prx-waf -c configs/default.toml seed-admin

# 3. Démarrer le serveur
prx-waf -c configs/default.toml run
```

### Flux de maintenance des règles

```bash
# 1. Vérifier les mises à jour de règles en amont
prx-waf rules update

# 2. Valider après mise à jour
prx-waf rules validate rules/

# 3. Examiner les changements
prx-waf rules stats

# 4. Recharger à chaud
prx-waf rules reload
```

### Configuration de l'intégration CrowdSec

```bash
# 1. Lancer l'assistant de configuration
prx-waf crowdsec setup

# 2. Tester la connectivité
prx-waf crowdsec test

# 3. Vérifier que les décisions arrivent
prx-waf crowdsec decisions
```

## Étapes suivantes

- [Démarrage rapide](../getting-started/quickstart) -- Démarrer avec PRX-WAF
- [Moteur de règles](../rules/) -- Comprendre le pipeline de détection
- [Référence de configuration](../configuration/reference) -- Toutes les clés de configuration
