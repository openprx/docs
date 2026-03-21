---
title: prx auth
description: OAuth-Authentifizierungsprofile für LLM-Anbieter und Dienste verwalten.
---

# prx auth

Verwaltet OAuth-Authentifizierungsprofile. PRX verwendet OAuth2-Flows für Anbieter und Dienste, die diese unterstützen (GitHub Copilot, Google Gemini usw.). Authentifizierungsprofile speichern Token sicher im PRX-Schlüsselspeicher.

## Verwendung

```bash
prx auth <UNTERBEFEHL> [OPTIONS]
```

## Unterbefehle

### `prx auth login`

Bei einem Anbieter oder Dienst authentifizieren.

```bash
prx auth login [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--provider` | `-P` | | Anbieter für die Authentifizierung (z.B. `github-copilot`, `google-gemini`) |
| `--profile` | | `default` | Benanntes Profil für mehrere Konten |
| `--browser` | | `true` | Browser für OAuth-Flow öffnen |
| `--device-code` | | `false` | Device-Code-Flow verwenden (für Umgebungen ohne Bildschirm) |

```bash
# Bei GitHub Copilot anmelden
prx auth login --provider github-copilot

# Device-Code-Flow (kein Browser)
prx auth login --provider github-copilot --device-code

# Mit benanntem Profil anmelden
prx auth login --provider google-gemini --profile work
```

Der Anmeldeablauf:

1. PRX öffnet einen Browser (oder zeigt einen Device-Code an) für die OAuth-Zustimmungsseite des Anbieters
2. Sie autorisieren PRX im Browser
3. PRX empfängt und speichert sicher die Zugangs- und Aktualisierungstoken
4. Das Token wird automatisch für nachfolgende API-Aufrufe verwendet

### `prx auth refresh`

Abgelaufenes Zugangstoken manuell erneuern.

```bash
prx auth refresh [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--provider` | `-P` | alle | Zu erneuernder Anbieter (erneuert alle, wenn weggelassen) |
| `--profile` | | `default` | Zu erneuerndes benanntes Profil |

```bash
# Alle Anbieter-Token erneuern
prx auth refresh

# Bestimmten Anbieter erneuern
prx auth refresh --provider github-copilot
```

::: tip
Die Token-Erneuerung erfolgt während des normalen Betriebs automatisch. Verwenden Sie diesen Befehl nur bei der Fehlerbehebung von Authentifizierungsproblemen.
:::

### `prx auth logout`

Gespeicherte Zugangsdaten für einen Anbieter entfernen.

```bash
prx auth logout [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--provider` | `-P` | | Anbieter zum Abmelden (erforderlich) |
| `--profile` | | `default` | Benanntes Profil zum Abmelden |
| `--all` | | `false` | Von allen Anbietern und Profilen abmelden |

```bash
# Von GitHub Copilot abmelden
prx auth logout --provider github-copilot

# Von allem abmelden
prx auth logout --all
```

## Authentifizierungsprofile

Profile ermöglichen mehrere Konten für denselben Anbieter. Dies ist nützlich, wenn Sie separate Arbeits- und Privatkonten haben.

```bash
# Mit zwei verschiedenen Google-Konten anmelden
prx auth login --provider google-gemini --profile personal
prx auth login --provider google-gemini --profile work

# Bestimmtes Profil im Chat verwenden
prx chat --provider google-gemini  # verwendet "default"-Profil
```

Setzen Sie das aktive Profil pro Anbieter in der Konfigurationsdatei:

```toml
[providers.google-gemini]
auth_profile = "work"
```

## Token-Speicherung

Token werden mit der ChaCha20-Poly1305-Chiffre verschlüsselt und im PRX-Schlüsselspeicher unter `~/.local/share/prx/secrets/` gespeichert. Der Verschlüsselungsschlüssel wird aus der Maschinenidentität abgeleitet.

## Verwandte Themen

- [Authentifizierungsübersicht](/de/prx/auth/) -- Authentifizierungsarchitektur
- [OAuth2-Flow](/de/prx/auth/oauth2) -- Detaillierte OAuth2-Flow-Dokumentation
- [Authentifizierungsprofile](/de/prx/auth/profiles) -- Profilverwaltung
- [Schlüsselspeicher](/de/prx/security/secrets) -- Wie Token sicher gespeichert werden
