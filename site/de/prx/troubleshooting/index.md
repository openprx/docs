---
title: Fehlerbehebung
description: Haufige Probleme und Losungen fur PRX, einschliesslich Diagnosewerkzeuge und FAQ.
---

# Fehlerbehebung

Dieser Abschnitt behandelt haufige Probleme beim Betrieb von PRX und wie sie behoben werden konnen.

## Schnelldiagnose

Fuhren Sie den integrierten Doctor-Befehl fur eine umfassende Gesundheitsprufung aus:

```bash
prx doctor
```

Dies pruft:

- Konfigurationsdatei-Validitat
- Anbieter-Konnektivitat und Authentifizierung
- Systemabhangigkeiten
- Festplattenplatz und Berechtigungen
- Aktiver Daemon-Status

## Haufige Probleme

### Daemon startet nicht

**Symptome**: `prx daemon` beendet sich sofort oder kann nicht binden.

**Losungen**:
- Prufen, ob eine andere Instanz lauft: `prx daemon status`
- Verifizieren, dass der Port verfugbar ist: `ss -tlnp | grep 3120`
- Logs prufen: `prx daemon logs`
- Konfiguration validieren: `prx config check`

### Anbieter-Authentifizierung schlagt fehl

**Symptome**: "Unauthorized"- oder "Invalid API key"-Fehler.

**Losungen**:
- API-Schlussel verifizieren: `prx auth status`
- Erneut authentifizieren: `prx auth login <anbieter>`
- Umgebungsvariablen prufen: `env | grep API_KEY`

### Hoher Speicherverbrauch

**Symptome**: PRX-Prozess verbraucht ubermassig viel Speicher.

**Losungen**:
- Gleichzeitige Sitzungen reduzieren: `[agent.limits] max_concurrent_sessions` setzen
- Gedachtnis-Hygiene aktivieren: `prx memory compact`
- Auf lang laufende Sitzungen prufen: `prx session list`

### Werkzeugausfuhrung hangt

**Symptome**: Agent scheint wahrend der Werkzeugausfuhrung festzustecken.

**Losungen**:
- Sandbox-Konfiguration prufen
- Verifizieren, dass Werkzeugabhangigkeiten installiert sind
- Timeout setzen: `[agent] session_timeout_secs = 300`
- Sitzung abbrechen: `prx session cancel <id>`

## Hilfe erhalten

- Die Seite [Diagnostik](./diagnostics) fur detaillierte Diagnoseverfahren prufen
- Ein Issue auf GitHub offnen: `https://github.com/openprx/prx/issues`
- Dem Community-Discord fur Echtzeit-Hilfe beitreten

## Verwandte Seiten

- [Diagnostik](./diagnostics)
