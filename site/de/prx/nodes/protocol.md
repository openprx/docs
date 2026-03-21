---
title: Knoten-Kommunikationsprotokoll
description: Technische Spezifikation des PRX-Knoten-zu-Knoten-Kommunikationsprotokolls.
---

# Knoten-Kommunikationsprotokoll

PRX-Knoten kommunizieren uber ein verschlusseltes, authentifiziertes Protokoll uber TCP. Diese Seite beschreibt das Wire-Format und die Nachrichtentypen.

## Transport

- **Protokoll**: TCP mit TLS 1.3 (gegenseitige Authentifizierung uber gekoppelte Schlussel)
- **Serialisierung**: Langenprafixierte MessagePack-Frames
- **Komprimierung**: Optionale LZ4-Frame-Komprimierung

## Nachrichtentypen

| Typ | Richtung | Beschreibung |
|-----|----------|-------------|
| `TaskRequest` | Controller -> Knoten | Dem Knoten eine Aufgabe zuweisen |
| `TaskResult` | Knoten -> Controller | Ergebnis der Aufgabenausfuhrung zuruckgeben |
| `StatusQuery` | Controller -> Knoten | Knotenstatus anfordern |
| `StatusReport` | Knoten -> Controller | Knotengesundheit und -kapazitat berichten |
| `Heartbeat` | Bidirektional | Keepalive und Latenzmessung |
| `Cancel` | Controller -> Knoten | Eine laufende Aufgabe abbrechen |

## Konfiguration

```toml
[node.protocol]
tls_version = "1.3"
compression = "lz4"  # "lz4" | "none"
max_frame_size_kb = 4096
heartbeat_interval_secs = 15
connection_timeout_secs = 10
```

## Verbindungslebenszyklus

1. **Verbinden** -- TCP-Verbindung herstellen
2. **TLS-Handshake** -- gegenseitige Authentifizierung mit gekoppelten Schlusseln
3. **Protokollverhandlung** -- Version und Komprimierung vereinbaren
4. **Aktiv** -- Nachrichten austauschen
5. **Ordnungsgemasses Schliessen** -- Trennungsnachricht senden und schliessen

## Verwandte Seiten

- [Knoten-Ubersicht](./)
- [Knoten-Kopplung](./pairing)
