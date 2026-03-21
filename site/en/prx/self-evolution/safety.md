---
title: Evolution Safety
description: Rollback protection, sanity checks, and safety mechanisms for PRX self-evolution.
---

# Evolution Safety

Safety is the top priority of the self-evolution system. Every change includes rollback capability, pre/post sanity checks, and automatic regression detection to prevent harmful modifications.

## Safety Mechanisms

### Rollback Protection

Every evolution change creates a snapshot before application. If issues are detected, the system can instantly revert to the previous state:

- **Automatic rollback** -- triggered when post-change sanity checks fail
- **Manual rollback** -- available via CLI for human-initiated reversions
- **Time-based rollback** -- changes auto-revert if not explicitly confirmed within the rollback window

### Sanity Checks

Before and after every change, the system validates:

- Core functionality still works (smoke tests)
- Safety invariants are maintained (e.g., no security policy weakening)
- Performance metrics remain within acceptable bounds
- No circular dependencies or conflicting rules

### Regression Detection

After a change is applied, the system monitors key metrics for a configurable period:

- Task completion rate
- Error rate
- Average response quality
- User satisfaction signals

If any metric degrades beyond a threshold, the change is automatically rolled back.

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

## Related Pages

- [Self-Evolution Overview](./)
- [Evolution Pipeline](./pipeline)
- [Security Policy Engine](/en/prx/security/policy-engine)
