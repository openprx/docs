---
title: Moteur de politiques
description: Declarative security moteur de politiques for controlling agent tool access and data flow in PRX.
---

# Moteur de politiques

The moteur de politiques is a declarative rule system qui controle what tools an agent can use, what files it can access, et what network requests it can make. Policies are evaluated before every appel d'outil.

## Apercu

Policies sont definis as rules with conditions and actions:

- **Allow rules** -- explicitly permit specific operations
- **Deny rules** -- explicitly block specific operations
- **Defaut action** -- applied when no rule matches (deny par defaut)

## Policy Format

```toml
[security.policy]
default_action = "deny"

[[security.policy.rules]]
name = "allow-read-workspace"
action = "allow"
tools = ["fs_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-dirs"
action = "deny"
tools = ["fs_read", "fs_write"]
paths = ["/etc/**", "/root/**", "**/.ssh/**"]

[[security.policy.rules]]
name = "allow-http-approved-domains"
action = "allow"
tools = ["http_request"]
domains = ["api.github.com", "api.openai.com"]
```

## Rule Evaluation

Rules are evaluated in order. The first matching rule determine the action. Si aucun rule matches, la valeur par defaut action is applied.

## Built-in Policies

PRX ships with sensible default policies that:

- Block access to system directories and sensitive files
- Require explicit approval for destructive operations
- Rate-limit network requests
- Log all execution d'outils for audit

## Voir aussi Pages

- [Security Overview](./)
- [Sandbox](./sandbox)
- [Threat Model](./threat-model)
