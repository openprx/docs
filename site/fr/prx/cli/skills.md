---
title: prx skills
description: Gerer les competences installables qui etendent les capacites de l'agent PRX.
---

# prx skills

Gerer les competences -- des paquets de capacites modulaires qui etendent ce que l'agent PRX peut faire. Les competences regroupent des prompts, des configurations d'outils et des plugins WASM en unites installables.

## Utilisation

```bash
prx skills <SOUS-COMMANDE> [OPTIONS]
```

## Sous-commandes

### `prx skills list`

Lister les competences installees et les competences disponibles depuis le registre.

```bash
prx skills list [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--installed` | | `false` | Afficher uniquement les competences installees |
| `--available` | | `false` | Afficher uniquement les competences disponibles (pas encore installees) |
| `--json` | `-j` | `false` | Sortie au format JSON |

**Exemple de sortie :**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

Installer une competence depuis le registre ou un chemin local.

```bash
prx skills install <NOM|CHEMIN> [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--version` | `-v` | derniere | Version specifique a installer |
| `--force` | `-f` | `false` | Reinstaller meme si deja installe |

```bash
# Installer depuis le registre
prx skills install code-review

# Installer une version specifique
prx skills install web-research --version 1.0.2

# Installer depuis un chemin local
prx skills install ./my-custom-skill/

# Forcer la reinstallation
prx skills install code-review --force
```

### `prx skills remove`

Desinstaller une competence.

```bash
prx skills remove <NOM> [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--force` | `-f` | `false` | Ignorer l'invite de confirmation |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## Structure d'une competence

Un paquet de competence contient :

```
my-skill/
  skill.toml          # Metadonnees et configuration de la competence
  system_prompt.md    # Instructions supplementaires du prompt systeme
  tools.toml          # Definitions et permissions des outils
  plugin.wasm         # Binaire de plugin WASM optionnel
```

Le manifeste `skill.toml` :

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## Repertoire des competences

Les competences installees sont stockees dans :

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## Voir aussi

- [Apercu des plugins](/fr/prx/plugins/) -- systeme de plugins WASM
- [Apercu des outils](/fr/prx/tools/) -- outils integres
- [Guide du developpeur](/fr/prx/plugins/developer-guide) -- creer des plugins personnalises
