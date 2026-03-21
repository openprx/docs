---
title: Noeuds distants
description: Apercu du systeme de noeuds distants de PRX pour l'execution distribuee d'agents sur plusieurs machines.
---

# Noeuds distants

PRX prend en charge l'execution distribuee d'agents via des noeuds distants. Un noeud est une instance PRX s'executant sur une machine separee qui peut etre appairee avec un controleur pour l'execution deleguee de taches.

## Apercu

Le systeme de noeuds permet :

- **Execution distribuee** -- executer des taches d'agent sur des machines distantes
- **Environnements specialises** -- noeuds avec acces GPU, outils specifiques ou emplacements reseau
- **Distribution de charge** -- repartir la charge de travail de l'agent sur plusieurs machines
- **Fonctionnement headless** -- les noeuds s'executent comme daemons sans interface utilisateur locale

## Architecture

```
┌──────────────┐         ┌──────────────┐
│  Controleur  │◄──────► │   Noeud A    │
│  (principal) │         │  (hote GPU)  │
│              │         └──────────────┘
│              │         ┌──────────────┐
│              │◄──────► │   Noeud B    │
│              │         │  (staging)   │
└──────────────┘         └──────────────┘
```

## Configuration

```toml
[node]
mode = "controller"  # "controller" | "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"  # "static" | "mdns"
peers = ["192.168.1.101:3121"]
```

## Pages associees

- [Appairage de noeuds](./pairing)
- [Protocole de communication](./protocol)
- [Appairage securise](/fr/prx/security/pairing)
