---
title: Evolution Safety
description: Rollback protection, sanity checks, and safety mechanisms for PRX self-evolution.
---

# Evolution Safety

La securite est la priorite absolue du systeme d'auto-evolution. Chaque changement inclut une capacite de retour en arriere, pre/post sanity checks, and automatic regression detection pour empecher harmful modifications.

## Safety Mechanisms

### Rollback Protection

Every evolution change creates a snapshot before application. Si des problemes sont detectes, le systeme peut instantly revert vers le previous state:

- **Automatic rollback** -- triggered when post-change sanity checks fail
- **Manual rollback** -- available via CLI for human-initiated reversions
- **Time-based rollback** -- changes auto-revert if not explicitly confirmed within the rollback window

### Sanity Checks

Before and after every change, le systeme validates:

- Core functionality still works (smoke tests)
- Safety invariants are maintained (e.g., no politique de securite weakening)
- Performance metrics remain within acceptable bounds
- Non circular dependencies or conflicting rules

### Regression Detection

After a change is applied, le systeme surveille key metrics pour un configurable period:

- Task completion rate
- Error rate
- Average response quality
- User satisfaction signals

Si unny metric degrades beyond a threshold, the change est automatiquement rolled back.

## Configuration

```toml
[self_evolution.safety]
rollback_enabled = true
rollback_window_hours = 168  # 7 days
sanity_check_timeout_secs = 30
regression_monitoring_hours = 24
max_regression_threshold = 0.1  # 10% degradation triggers rollback
```

## CLI Commands

```bash
prx evolution status          # View active evolution state
prx evolution rollback        # Rollback the last change
prx evolution history         # View evolution history
prx evolution approve <id>    # Approve a pending proposal
```

## Voir aussi Pages

- [Self-Evolution Overview](./)
- [Evolution Pipeline](./pipeline)
- [Security Moteur de politiques](/fr/prx/security/policy-engine)
