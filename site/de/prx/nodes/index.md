---
title: Remote-Knoten
description: Ubersicht uber das PRX-Remote-Knotensystem fur verteilte Agentenausfuhrung uber mehrere Maschinen.
---

# Remote-Knoten

PRX unterstutzt verteilte Agentenausfuhrung uber Remote-Knoten. Ein Knoten ist eine PRX-Instanz, die auf einer separaten Maschine lauft und mit einem Controller fur delegierte Aufgabenausfuhrung gekoppelt werden kann.

## Ubersicht

Das Knotensystem ermoglicht:

- **Verteilte Ausfuhrung** -- Agentenaufgaben auf entfernten Maschinen ausfuhren
- **Spezialisierte Umgebungen** -- Knoten mit GPU-Zugang, spezifischen Werkzeugen oder Netzwerkstandorten
- **Lastverteilung** -- Agenten-Arbeitslast uber mehrere Maschinen verteilen
- **Headless-Betrieb** -- Knoten laufen als Daemons ohne lokale Benutzeroberflache

## Architektur

```
┌──────────────┐         ┌──────────────┐
│  Controller  │◄──────► │   Knoten A   │
│  (primar)    │         │  (GPU-Host)  │
│              │         └──────────────┘
│              │         ┌──────────────┐
│              │◄──────► │   Knoten B   │
│              │         │  (Staging)   │
└──────────────┘         └──────────────┘
```

## Konfiguration

```toml
[node]
mode = "controller"  # "controller" | "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"  # "static" | "mdns"
peers = ["192.168.1.101:3121"]
```

## Verwandte Seiten

- [Knoten-Kopplung](./pairing)
- [Kommunikationsprotokoll](./protocol)
- [Sicherheits-Kopplung](/de/prx/security/pairing)
