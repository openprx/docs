---
title: prx evolution
description: Monitor and control the PRX self-evolution engine.
---

# prx evolution

Inspect and control the self-evolution engine. PRX supports three levels of autonomous evolution: L1 (memory), L2 (prompts), and L3 (strategies). This command lets you check evolution status, review history, update configuration, and trigger manual evolution cycles.

## Usage

```bash
prx evolution <SUBCOMMAND> [OPTIONS]
```

## Subcommands

### `prx evolution status`

Display the current state of the evolution engine.

```bash
prx evolution status [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--json` | `-j` | `false` | Output as JSON |

**Example output:**

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

Show the evolution history log.

```bash
prx evolution history [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--limit` | `-n` | `20` | Number of entries to show |
| `--level` | `-l` | all | Filter by level: `l1`, `l2`, `l3` |
| `--json` | `-j` | `false` | Output as JSON |

```bash
# Show last 10 L2 evolutions
prx evolution history --limit 10 --level l2
```

**Example output:**

```
 Time                Level  Action                          Status
 2026-03-21 08:00    L1     memory consolidation            success
 2026-03-20 20:00    L1     memory consolidation            success
 2026-03-20 09:00    L2     prompt refinement (system)      success
 2026-03-19 14:22    L2     prompt refinement (tool-use)    rolled back
```

### `prx evolution config`

View or update evolution configuration.

```bash
prx evolution config [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--set` | | | Set a config value (e.g., `--set l1.enabled=true`) |
| `--json` | `-j` | `false` | Output as JSON |

```bash
# View current config
prx evolution config

# Enable L3 strategy evolution
prx evolution config --set l3.enabled=true

# Set L1 interval to 2 hours
prx evolution config --set l1.interval=7200
```

### `prx evolution trigger`

Manually trigger an evolution cycle.

```bash
prx evolution trigger [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--level` | `-l` | `l1` | Evolution level to trigger: `l1`, `l2`, `l3` |
| `--dry-run` | | `false` | Preview the evolution without applying changes |

```bash
# Trigger L1 memory evolution
prx evolution trigger --level l1

# Preview a L2 prompt evolution
prx evolution trigger --level l2 --dry-run
```

## Evolution Levels

| Level | Target | Description |
|-------|--------|-------------|
| **L1** | Memory | Consolidates, deduplicates, and organizes memory entries |
| **L2** | Prompts | Refines system prompts and tool-use instructions based on interaction patterns |
| **L3** | Strategies | Adapts high-level behavioral strategies (requires explicit opt-in) |

All evolution changes are reversible. The engine maintains a rollback history and will automatically revert changes that cause degraded performance.

## Related

- [Self-Evolution Overview](/en/prx/self-evolution/) -- architecture and concepts
- [L1: Memory Evolution](/en/prx/self-evolution/l1-memory) -- memory consolidation details
- [L2: Prompt Evolution](/en/prx/self-evolution/l2-prompt) -- prompt refinement pipeline
- [L3: Strategy Evolution](/en/prx/self-evolution/l3-strategy) -- strategy adaptation
- [Evolution Safety](/en/prx/self-evolution/safety) -- rollback and safety mechanisms
