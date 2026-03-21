---
title: Knoten-Kopplung
description: Wie PRX-Knoten mit einem Controller fur sichere verteilte Ausfuhrung gekoppelt werden.
---

# Knoten-Kopplung

Bevor ein Knoten Aufgaben von einem Controller empfangen kann, mussen sie gekoppelt werden. Die Kopplung stellt gegenseitiges Vertrauen durch kryptografische Identitatsverifizierung her.

## Kopplungsprozess

1. Den Knoten im Kopplungsmodus starten: `prx node pair`
2. Der Knoten zeigt einen Kopplungscode (6-stellige PIN) an
3. Auf dem Controller die Kopplung einleiten: `prx pair add --address <knoten-ip>:3121`
4. Den Kopplungscode bei Aufforderung eingeben
5. Beide Seiten tauschen Ed25519-offentliche Schlussel aus und verifizieren sie

## Konfiguration

```toml
[node.pairing]
auto_accept = false
pairing_timeout_secs = 120
max_paired_controllers = 3
```

## Knoten verwalten

```bash
# Auf dem Controller
prx node list              # Gekoppelte Knoten auflisten
prx node status <node-id>  # Knotenstatus prufen
prx node unpair <node-id>  # Knoten-Kopplung entfernen

# Auf dem Knoten
prx node pair              # Kopplungsmodus betreten
prx node info              # Knotenidentitat anzeigen
```

## Verwandte Seiten

- [Knoten-Ubersicht](./)
- [Kommunikationsprotokoll](./protocol)
- [Gerate-Kopplung](/de/prx/security/pairing)
