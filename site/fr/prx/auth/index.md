---
title: Authentification
description: Apercu du systeme d'authentification de PRX incluant les flux OAuth2 et les profils de fournisseurs.
---

# Authentification

PRX prend en charge plusieurs mecanismes d'authentification pour les fournisseurs LLM, l'acces API et la communication inter-noeuds. Le systeme d'authentification gere les flux OAuth2, la gestion des cles API et l'authentification specifique aux fournisseurs.

## Apercu

L'authentification dans PRX opere a plusieurs niveaux :

| Niveau | Mecanisme | Objectif |
|--------|-----------|----------|
| Auth fournisseur | OAuth2 / cles API | S'authentifier aupres des fournisseurs LLM |
| Auth passerelle | Tokens Bearer | Authentifier les clients API |
| Auth noeud | Appairage Ed25519 | Authentifier les noeuds distribues |

## Authentification des fournisseurs

Chaque fournisseur LLM a sa propre methode d'authentification :

- **Cle API** -- cle statique transmise dans les en-tetes de requete (la plupart des fournisseurs)
- **OAuth2** -- flux d'autorisation via navigateur (Anthropic, Google, GitHub Copilot)
- **AWS IAM** -- authentification basee sur les roles pour Bedrock

## Configuration

```toml
[auth]
default_method = "api_key"

[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
```

## Pages associees

- [Flux OAuth2](./oauth2)
- [Profils de fournisseurs](./profiles)
- [Gestion des secrets](/fr/prx/security/secrets)
