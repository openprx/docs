---
title: Trust Scores
description: OpenPR's trust scoring system tracks per-user reputation based on participation, decision quality, and team feedback. Trust scores influence voting weight.
---

# Trust Scores

Trust scores are a per-user reputation metric in OpenPR that tracks participation quality and decision-making history. When weighted voting is enabled, trust scores directly influence voting power.

## How Trust Scores Work

Each workspace member has a trust score that reflects their governance participation:

| Factor | Impact | Description |
|--------|--------|-------------|
| Proposal quality | Positive | Proposals that get approved increase score |
| Voting participation | Positive | Regular voting increases score |
| Aligned decisions | Positive | Voting with the eventual majority |
| Rejected proposals | Negative | Proposals that get rejected decrease score |
| Vetoed decisions | Negative | Having proposals vetoed |
| Appeals | Variable | Successful appeals restore score |

## Score Range

Trust scores are normalized to a numeric range. Higher scores indicate more reliable governance participation:

| Range | Level | Voting Weight |
|-------|-------|---------------|
| 80-100 | High Trust | 1.5x weight |
| 50-79 | Normal | 1.0x weight |
| 20-49 | Low Trust | 0.75x weight |
| 0-19 | Minimal | 0.5x weight |

::: tip Weighted Voting
Trust score weighting only applies when **weighted voting** is enabled in the workspace governance configuration. Otherwise, all votes have equal weight.
:::

## Viewing Trust Scores

### Via the Web UI

Navigate to **Workspace Settings** > **Governance** > **Trust Scores** to see all member scores and history.

### Via the API

```bash
# Get trust scores for the workspace
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/trust-scores

# Get a specific user's trust score history
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/trust-scores/<user_id>/history
```

## Trust Score History

Every change to a trust score is recorded in the `trust_score_logs` table with:

- The user affected
- Previous and new score values
- The reason for the change
- Timestamp
- Related proposal or decision (if applicable)

This history provides transparency into how scores evolve over time.

## Appeals

If a member believes their trust score was unfairly affected, they can file an appeal:

1. Navigate to their trust score history.
2. Click **Appeal** on a specific score change.
3. Provide a reason for the appeal.
4. Workspace admins review and decide on the appeal.

Successful appeals restore the score change. Appeal records are preserved in the audit log.

```bash
# File an appeal
curl -X POST http://localhost:8080/api/trust-scores/<user_id>/appeals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"reason": "Score decreased due to a test proposal that was not meant for production."}'
```

## Impact Reviews

Trust scores are one input into **impact reviews** -- assessments of how a proposal or decision affects the project. Impact reviews include:

- Quantitative metrics (estimated effort, risk level, scope)
- Qualitative assessments from review participants
- Historical data from similar decisions

## Next Steps

- [Voting & Decisions](./voting) -- How trust scores influence voting outcomes
- [Proposals](./proposals) -- Create proposals that affect trust scores
- [Governance Overview](./index) -- Full governance module reference
