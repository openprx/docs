---
title: Voting & Decisions
description: OpenPR's voting system supports weighted voting, configurable quorum, approval thresholds, and immutable decision records.
---

# Voting & Decisions

The voting system in OpenPR determines the outcome of governance proposals. It supports weighted voting, configurable quorum requirements, and approval thresholds. Every vote and decision is recorded with an immutable audit trail.

## Voting Process

1. A proposal enters the **Voting** state.
2. Eligible workspace members cast their votes (approve, reject, or abstain).
3. When the voting period ends or quorum is reached, votes are tallied.
4. The result is determined by the configured approval threshold.
5. A **decision record** is created with the outcome.

## Voting Configuration

Governance settings are configured per workspace:

| Setting | Description | Example |
|---------|-------------|---------|
| Quorum | Minimum percentage of eligible voters who must participate | 50% |
| Approval Threshold | Percentage of yes votes required to approve | 66% |
| Voting Period | Duration the voting window stays open | 7 days |
| Weighted Voting | Whether trust scores affect vote weight | On/Off |

Configure these in **Workspace Settings** > **Governance** > **Config**, or via the API:

```bash
curl -X PUT http://localhost:8080/api/governance/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "quorum_percentage": 50,
    "approval_threshold": 66,
    "voting_period_days": 7,
    "weighted_voting": true
  }'
```

## Weighted Voting

When weighted voting is enabled, each member's vote is multiplied by their trust score. Members with higher trust scores have more influence on the outcome. See [Trust Scores](./trust-scores) for details.

## Decision Records

Every completed vote creates a **decision record** -- an immutable log entry containing:

- The proposal that was voted on
- Vote tallies (approve, reject, abstain)
- The final outcome (approved or rejected)
- Timestamp and participating voters
- Decision domain (if categorized)

Decision records cannot be modified or deleted. They serve as the authoritative history of team decisions.

### Viewing Decisions

```bash
# List decisions
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/decisions

# Get a specific decision
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/decisions/<decision_id>
```

## Veto Mechanism

Designated vetoers (configured per workspace) can veto approved proposals:

1. **Veto** -- A vetoer blocks an approved proposal with a stated reason.
2. **Escalation** -- The proposer can escalate the veto to a broader vote.
3. **Appeal** -- Any member can file an appeal against a veto.

Veto power is designed as a safety mechanism for high-impact decisions. Configure vetoers in **Workspace Settings** > **Governance** > **Vetoers**.

## Audit Logs

All governance actions are recorded in the audit log:

- Proposal creation, submission, and archival
- Votes cast (who, when, what)
- Decision records
- Veto events and escalations
- Configuration changes

```bash
# View governance audit logs
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/governance/audit-logs
```

## Decision Domains

Decisions can be categorized into domains (e.g., "Architecture", "Process", "Tooling") for better organization and filtering. Domains are configured per workspace.

## Next Steps

- [Trust Scores](./trust-scores) -- How trust scores influence voting weight
- [Proposals](./proposals) -- Create proposals that go to vote
- [Governance Overview](./index) -- Full governance module reference
