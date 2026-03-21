---
title: საფრთხის მოდელი
description: PRX threat model covering adversarial inputs, prompt injection, tool abuse, and data exfiltration.
---

# Threat Model

This page documents the PRX threat model -- the set of threats we consider, our security assumptions, and the mitigations in place.

## Threat Categories

### 1. Prompt Injection

**Threat**: Adversarial content in user input or retrieved data manipulates the agent into performing unintended actions.

**Mitigations**:
- Tool call approval workflow
- Policy engine restricts available actions
- Input sanitization for known injection patterns

### 2. Tool Abuse

**Threat**: The agent uses tools in unintended ways (e.g., reading sensitive files, making unauthorized network requests).

**Mitigations**:
- Sandbox isolation for tool execution
- Policy engine with deny-by-default rules
- Per-tool rate limiting
- Audit logging of all tool calls

### 3. Data Exfiltration

**Threat**: Sensitive data from the local system is sent to external services via LLM context or tool calls.

**Mitigations**:
- Network allowlisting in sandbox
- Content filtering for sensitive patterns (API keys, passwords)
- Policy rules restricting data flow

### 4. Supply Chain

**Threat**: Malicious plugins or dependencies compromise the agent.

**Mitigations**:
- WASM sandbox for plugins
- Plugin permission manifests
- Dependency auditing (cargo audit)

## Security Assumptions

- The host operating system is trusted
- LLM providers handle API keys securely
- The user is responsible for reviewing agent actions when approval is required

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it to `security@openprx.dev`.

## Related Pages

- [Security Overview](./)
- [Policy Engine](./policy-engine)
- [Sandbox](./sandbox)
