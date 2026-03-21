---
title: Google Gemini
description: Google Gemini als LLM-Anbieter in PRX konfigurieren
---

# Google Gemini

> Zugriff auf Gemini-Modelle über die Google Generative Language API mit Unterstützung für API-Schlüssel, Gemini CLI OAuth-Tokens und lange Kontextfenster bis zu 2M Tokens.

## Voraussetzungen

- Ein Google AI Studio API-Schlüssel von [aistudio.google.com](https://aistudio.google.com/app/apikey), **oder**
- Gemini CLI installiert und authentifiziert (`gemini`-Befehl), **oder**
- Eine `GEMINI_API_KEY`- oder `GOOGLE_API_KEY`-Umgebungsvariable

## Schnelleinrichtung

### 1. API-Schlüssel erhalten

**Option A: API-Schlüssel (empfohlen für die meisten Benutzer)**

1. Besuchen Sie [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Klicken Sie auf **Create API key**
3. Kopieren Sie den Schlüssel

**Option B: Gemini CLI (Zero-Config für bestehende Benutzer)**

Wenn Sie bereits die Gemini CLI verwenden, erkennt PRX automatisch Ihr OAuth-Token aus `~/.gemini/oauth_creds.json`. Keine zusätzliche Konfiguration erforderlich.

### 2. Konfigurieren

```toml
[default]
provider = "gemini"
model = "gemini-2.5-flash"

[providers.gemini]
api_key = "${GEMINI_API_KEY}"
```

Oder setzen Sie die Umgebungsvariable:

```bash
export GEMINI_API_KEY="AIza..."
```

### 3. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

| Modell | Kontext | Vision | Werkzeugnutzung | Hinweise |
|--------|---------|--------|----------|-------|
| `gemini-2.5-pro` | 1M | Ja | Ja | Leistungsfähigstes Gemini-Modell |
| `gemini-2.5-flash` | 1M | Ja | Ja | Schnell und kosteneffektiv |
| `gemini-2.0-flash` | 1M | Ja | Ja | Vorherige Generation Flash |
| `gemini-1.5-pro` | 2M | Ja | Ja | Längstes Kontextfenster |
| `gemini-1.5-flash` | 1M | Ja | Ja | Vorherige Generation |

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | optional | Google AI API-Schlüssel (`AIza...`) |
| `model` | String | `gemini-2.5-flash` | Standardmäßig zu verwendendes Modell |

## Funktionen

### Mehrere Authentifizierungsmethoden

PRX löst Gemini-Anmeldedaten in dieser Prioritätsreihenfolge auf:

| Priorität | Quelle | Funktionsweise |
|----------|--------|--------------|
| 1 | Expliziter API-Schlüssel in der Konfiguration | Gesendet als `?key=`-Abfrageparameter zur öffentlichen API |
| 2 | `GEMINI_API_KEY`-Umgebungsvariable | Wie oben |
| 3 | `GOOGLE_API_KEY`-Umgebungsvariable | Wie oben |
| 4 | Gemini CLI OAuth-Token | Gesendet als `Authorization: Bearer` zur internen Code Assist API |

### Gemini CLI OAuth-Integration

Wenn Sie sich mit der Gemini CLI (`gemini`-Befehl) authentifiziert haben, führt PRX automatisch folgende Schritte durch:

1. Liest `~/.gemini/oauth_creds.json`
2. Prüft Token-Ablauf (überspringt abgelaufene Tokens mit einer Warnung)
3. Leitet Anfragen an Googles interne Code Assist API (`cloudcode-pa.googleapis.com`) im korrekten Envelope-Format weiter

Das bedeutet, bestehende Gemini CLI-Benutzer können PRX ohne zusätzliche Einrichtung nutzen.

### Lange Kontextfenster

Gemini-Modelle unterstützen extrem lange Kontextfenster (bis zu 2M Tokens für Gemini 1.5 Pro). PRX setzt `maxOutputTokens` standardmäßig auf 8192. Der vollständige Gesprächsverlauf wird als `contents` mit korrekter Rollenzuordnung (`user`/`model`) gesendet.

### System-Instruktionen

System-Prompts werden über Geminis natives `systemInstruction`-Feld gesendet (nicht als reguläre Nachricht), was sicherstellt, dass sie korrekt vom Modell behandelt werden.

### Automatische Modellnamen-Formatierung

PRX fügt automatisch `models/` vor Modellnamen hinzu, wenn nötig. Sowohl `gemini-2.5-flash` als auch `models/gemini-2.5-flash` funktionieren korrekt.

## Anbieter-Aliase

Die folgenden Namen werden alle zum Gemini-Anbieter aufgelöst:

- `gemini`
- `google`
- `google-gemini`

## Fehlerbehebung

### "Gemini API key not found"

PRX konnte keine Authentifizierung finden. Optionen:

1. `GEMINI_API_KEY`-Umgebungsvariable setzen
2. Die `gemini`-CLI zur Authentifizierung ausführen (Tokens werden automatisch wiederverwendet)
3. Einen API-Schlüssel von [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) holen
4. `prx onboard` für interaktive Konfiguration ausführen

### "400 Bad Request: API key not valid" mit Gemini CLI

Dies tritt auf, wenn OAuth-Tokens von der Gemini CLI an den öffentlichen API-Endpunkt gesendet werden. PRX behandelt dies, indem OAuth-Tokens automatisch an den internen `cloudcode-pa.googleapis.com`-Endpunkt weitergeleitet werden. Wenn Sie diesen Fehler sehen, stellen Sie sicher, dass Sie die neueste Version von PRX verwenden.

### "Gemini CLI OAuth token expired"

Führen Sie die `gemini`-CLI erneut aus, um Ihr Token zu erneuern. PRX erneuert Gemini CLI-Tokens nicht automatisch (im Gegensatz zu Anthropic OAuth-Tokens).

### 403 Forbidden

Ihr API-Schlüssel hat möglicherweise nicht die Generative Language API aktiviert. Gehen Sie zur [Google Cloud Console](https://console.cloud.google.com/) und aktivieren Sie die **Generative Language API** für Ihr Projekt.
