---
title: Securite
description: Apercu du modele de securite de PRX couvrant le moteur de politiques, le sandbox, la gestion des secrets et le modele de menaces.
---

# Securite

La securite est une preoccupation fondamentale dans PRX. En tant que framework d'agents autonomes, PRX doit controler soigneusement les actions que les agents peuvent effectuer, les donnees auxquelles ils peuvent acceder et la facon dont ils interagissent avec les systemes externes.

## Couches de securite

PRX implemente une defense en profondeur a travers plusieurs couches de securite :

| Couche | Composant | Objectif |
|--------|-----------|----------|
| Politique | [Moteur de politiques](./policy-engine) | Regles declaratives pour l'acces aux outils et le flux de donnees |
| Isolation | [Sandbox](./sandbox) | Isolation de processus/conteneur pour l'execution des outils |
| Authentification | [Appairage](./pairing) | Appairage d'appareils et verification d'identite |
| Secrets | [Gestion des secrets](./secrets) | Stockage securise des cles API et identifiants |

## Configuration

```toml
[security]
sandbox_backend = "bubblewrap"  # "docker" | "firejail" | "bubblewrap" | "landlock" | "none"
require_tool_approval = true
max_tool_calls_per_turn = 10

[security.policy]
default_action = "deny"
```

## Modele de menaces

Le [modele de menaces](./threat-model) de PRX considere les entrees adversariales, l'injection de prompts, l'abus d'outils et l'exfiltration de donnees comme vecteurs de menaces principaux.

## Pages associees

- [Moteur de politiques](./policy-engine)
- [Appairage](./pairing)
- [Sandbox](./sandbox)
- [Gestion des secrets](./secrets)
- [Modele de menaces](./threat-model)
