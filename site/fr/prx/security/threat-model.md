---
title: Modele de menaces
description: PRX modele de menaces covering adversarial inputs, prompt injection, tool abuse, and data exfiltration.
---

# Threat Model

This page documents the PRX threat model -- the set of threats we envisagez, our security assumptions, and the mitigations in place.

## Threat Categories

### 1. Prompt Injection

**Threat**: Adversarial content in user input or retrieved data manipulates l'agent into performing unintended actions.

**Mitigations**:
- Tool call approval workflow
- Policy engine restricts available actions
- Input assainissement for known injection patterns

### 2. Tool Abuse

**Threat**: L'agent uses tools in unintended ways (e.g., reading sensitive files, making unauthorized network requests).

**Mitigations**:
- Sandbox isolation for execution d'outil
- Policy engine with deny-by-default rules
- Per-tool rate limiting
- Audit logging of all appels d'outils

### 3. Data Exfiltration

**Threat**: Sensitive data depuis le local system est envoye a external services via LLM context or appels d'outils.

**Mitigations**:
- Network allowlisting in sandbox
- Content filtering for sensitive patterns (API keys, passwords)
- Policy rules restricting data flow

### 4. Supply Chain

**Threat**: Malicious plugins or dependencies compromise l'agent.

**Mitigations**:
- WASM sandbox for plugins
- Plugin permission manifests
- Dependency auditing (cargo audit)

## Securite Assumptions

- L'hote operating system is trusted
- LLM fournisseurs handle API keys securely
- L'utilisateur est responsable de reviewing agent actions when approval est requis

## Reporting Vulnerabilities

Si vous discover a security vulnerability, please report it to `security@openprx.dev`.

## Voir aussi Pages

- [Security Overview](./)
- [Moteur de politiques](./policy-engine)
- [Sandbox](./sandbox)
