---
title: prx config
description: Inspecter et modifier la configuration PRX depuis la ligne de commande.
---

# prx config

Lire, ecrire, valider et transformer le fichier de configuration PRX sans editer le TOML a la main.

## Utilisation

```bash
prx config <SOUS-COMMANDE> [OPTIONS]
```

## Sous-commandes

### `prx config get`

Lire une valeur de configuration par son chemin de cle en notation pointee.

```bash
prx config get <CLE> [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Chemin du fichier de configuration |
| `--json` | `-j` | `false` | Sortie de la valeur au format JSON |

```bash
# Obtenir le fournisseur par defaut
prx config get providers.default

# Obtenir le port de la passerelle
prx config get gateway.port

# Obtenir une section entiere en JSON
prx config get providers --json
```

### `prx config set`

Definir une valeur de configuration.

```bash
prx config set <CLE> <VALEUR> [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Chemin du fichier de configuration |

```bash
# Changer le fournisseur par defaut
prx config set providers.default "anthropic"

# Changer le port de la passerelle
prx config set gateway.port 8080

# Definir un booleen
prx config set evolution.l1.enabled true

# Definir une valeur imbriquee
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

Afficher le schema JSON complet de la configuration. Utile pour l'autocompletion dans les editeurs et la validation.

```bash
prx config schema [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--output` | `-o` | stdout | Ecrire le schema dans un fichier |
| `--format` | | `json` | Format de sortie : `json` ou `yaml` |

```bash
# Afficher le schema sur stdout
prx config schema

# Sauvegarder le schema pour l'integration editeur
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

Scinder un fichier de configuration monolithique en fichiers par section. Cela cree un repertoire de configuration avec des fichiers separes pour les fournisseurs, les canaux, le cron, etc.

```bash
prx config split [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Fichier de configuration source |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | Repertoire de sortie |

```bash
prx config split

# Resultat :
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

Fusionner un repertoire de configuration scinde en un seul fichier.

```bash
prx config merge [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | Repertoire source |
| `--output` | `-o` | `~/.config/prx/config.toml` | Fichier de sortie |
| `--force` | `-f` | `false` | Ecraser le fichier de sortie existant |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## Exemples

```bash
# Inspection rapide de la configuration
prx config get .  # afficher toute la configuration

# Mettre a jour la cle du fournisseur
prx config set providers.anthropic.api_key "sk-ant-..."

# Generer le schema pour VS Code
prx config schema --output ~/.config/prx/schema.json
# Puis dans VS Code settings.json :
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# Sauvegarder et scinder pour le controle de version
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## Voir aussi

- [Apercu de la configuration](/fr/prx/config/) -- format et structure du fichier de configuration
- [Reference complete](/fr/prx/config/reference) -- toutes les options de configuration
- [Rechargement a chaud](/fr/prx/config/hot-reload) -- rechargement de la configuration en cours d'execution
- [Variables d'environnement](/fr/prx/config/environment) -- surcharges par variables d'environnement
