---
title: Geheimnisverwaltung
description: Sichere Speicherung und Zugriffskontrolle fur API-Schlussel und Anmeldedaten in PRX.
---

# Geheimnisverwaltung

PRX bietet sichere Speicherung fur sensible Daten wie API-Schlussel, Tokens und Anmeldedaten. Geheimnisse werden im Ruhezustand verschlusselt und uber eine kontrollierte API abgerufen.

## Ubersicht

Das Geheimnissystem:

- Verschlusselt Geheimnisse im Ruhezustand mit AES-256-GCM
- Leitet Verschlusselungsschlussel von einem Master-Passwort oder System-Keyring ab
- Bietet Umgebungsvariablen-Injektion fur die Werkzeugausfuhrung
- Unterstutzt Geheimnis-Rotation und -Ablauf

## Speicherung

Geheimnisse werden in einer verschlusselten Datei unter `~/.local/share/openprx/secrets.enc` gespeichert. Der Verschlusselungsschlussel wird abgeleitet von:

1. System-Keyring (bevorzugt, wenn verfugbar)
2. Master-Passwort (interaktive Eingabe)
3. Umgebungsvariable `PRX_MASTER_KEY` (fur Automatisierung)

## Konfiguration

```toml
[security.secrets]
store_path = "~/.local/share/openprx/secrets.enc"
key_derivation = "argon2id"
auto_rotate_days = 90
```

## CLI-Befehle

```bash
prx secret set OPENAI_API_KEY      # Ein Geheimnis setzen (fordert zur Eingabe auf)
prx secret get OPENAI_API_KEY      # Ein Geheimnis abrufen
prx secret list                    # Geheimnisnamen auflisten (nicht die Werte)
prx secret delete OPENAI_API_KEY   # Ein Geheimnis loschen
prx secret rotate                  # Den Master-Schlussel rotieren
```

## Verwandte Seiten

- [Sicherheitsubersicht](./)
- [Authentifizierung](/de/prx/auth/)
