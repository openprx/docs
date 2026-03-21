---
title: prx evolution
description: Surveiller et controler le moteur d'auto-evolution PRX.
---

# prx evolution

Inspecter et controler le moteur d'auto-evolution. PRX prend en charge trois niveaux d'evolution autonome : L1 (memoire), L2 (prompts) et L3 (strategies). Cette commande vous permet de verifier l'etat de l'evolution, consulter l'historique, mettre a jour la configuration et declencher des cycles d'evolution manuels.

## Utilisation

```bash
prx evolution <SOUS-COMMANDE> [OPTIONS]
```

## Sous-commandes

### `prx evolution status`

Afficher l'etat actuel du moteur d'evolution.

```bash
prx evolution status [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--json` | `-j` | `false` | Sortie au format JSON |

**Exemple de sortie :**

```
 Evolution Engine Status
 ───────────────────────
 Engine:    running
 L1 Memory:    enabled   (last: 2h ago, next: in 4h)
 L2 Prompt:    enabled   (last: 1d ago, next: in 23h)
 L3 Strategy:  disabled
 Total cycles: 142
 Rollbacks:    3
```

### `prx evolution history`

Afficher le journal de l'historique d'evolution.

```bash
prx evolution history [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--limit` | `-n` | `20` | Nombre d'entrees a afficher |
| `--level` | `-l` | tous | Filtrer par niveau : `l1`, `l2`, `l3` |
| `--json` | `-j` | `false` | Sortie au format JSON |

```bash
# Afficher les 10 dernieres evolutions L2
prx evolution history --limit 10 --level l2
```

**Exemple de sortie :**

```
 Time                Level  Action                          Status
 2026-03-21 08:00    L1     memory consolidation            success
 2026-03-20 20:00    L1     memory consolidation            success
 2026-03-20 09:00    L2     prompt refinement (system)      success
 2026-03-19 14:22    L2     prompt refinement (tool-use)    rolled back
```

### `prx evolution config`

Voir ou mettre a jour la configuration d'evolution.

```bash
prx evolution config [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--set` | | | Definir une valeur de configuration (ex. `--set l1.enabled=true`) |
| `--json` | `-j` | `false` | Sortie au format JSON |

```bash
# Voir la configuration actuelle
prx evolution config

# Activer l'evolution de strategies L3
prx evolution config --set l3.enabled=true

# Definir l'intervalle L1 a 2 heures
prx evolution config --set l1.interval=7200
```

### `prx evolution trigger`

Declencher manuellement un cycle d'evolution.

```bash
prx evolution trigger [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--level` | `-l` | `l1` | Niveau d'evolution a declencher : `l1`, `l2`, `l3` |
| `--dry-run` | | `false` | Previsualiser l'evolution sans appliquer les modifications |

```bash
# Declencher l'evolution memoire L1
prx evolution trigger --level l1

# Previsualiser une evolution de prompts L2
prx evolution trigger --level l2 --dry-run
```

## Niveaux d'evolution

| Niveau | Cible | Description |
|--------|-------|-------------|
| **L1** | Memoire | Consolide, deduplique et organise les entrees memoire |
| **L2** | Prompts | Affine les prompts systeme et les instructions d'utilisation des outils en fonction des schemas d'interaction |
| **L3** | Strategies | Adapte les strategies comportementales de haut niveau (necessite une activation explicite) |

Toutes les modifications d'evolution sont reversibles. Le moteur maintient un historique de retour en arriere et revient automatiquement aux modifications qui causent une degradation des performances.

## Voir aussi

- [Apercu de l'auto-evolution](/fr/prx/self-evolution/) -- architecture et concepts
- [L1 : Evolution memoire](/fr/prx/self-evolution/l1-memory) -- details de la consolidation memoire
- [L2 : Evolution des prompts](/fr/prx/self-evolution/l2-prompt) -- pipeline d'affinage des prompts
- [L3 : Evolution des strategies](/fr/prx/self-evolution/l3-strategy) -- adaptation des strategies
- [Securite de l'evolution](/fr/prx/self-evolution/safety) -- mecanismes de retour en arriere et de securite
