---
title: GitHub Copilot
description: GitHub Copilot als LLM-Anbieter in PRX konfigurieren
---

# GitHub Copilot

> Zugriff auf GitHub Copilot Chat-Modelle über die Copilot-API mit automatischer OAuth-Device-Flow-Authentifizierung und Token-Verwaltung.

## Voraussetzungen

- Ein GitHub-Konto mit einem aktiven **Copilot Individual**-, **Copilot Business**- oder **Copilot Enterprise**-Abonnement
- Optional ein GitHub Personal Access Token (andernfalls wird der interaktive Device-Flow-Login verwendet)

## Schnelleinrichtung

### 1. Authentifizieren

Bei der ersten Verwendung fordert PRX Sie auf, sich über GitHubs Device-Code-Flow zu authentifizieren:

```
GitHub Copilot authentication is required.
Visit: https://github.com/login/device
Code: XXXX-XXXX
Waiting for authorization...
```

Alternativ können Sie direkt ein GitHub-Token angeben:

```bash
export GITHUB_TOKEN="ghp_..."
```

### 2. Konfigurieren

```toml
[default]
provider = "copilot"
model = "gpt-4o"
```

### 3. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

GitHub Copilot bietet Zugriff auf eine kuratierte Auswahl von Modellen. Die genau verfügbaren Modelle hängen von Ihrer Copilot-Abonnementstufe ab:

| Modell | Kontext | Vision | Werkzeugnutzung | Hinweise |
|--------|---------|--------|----------|-------|
| `gpt-4o` | 128K | Ja | Ja | Standard-Copilot-Modell |
| `gpt-4o-mini` | 128K | Ja | Ja | Schneller, kosteneffektiv |
| `claude-sonnet-4` | 200K | Ja | Ja | Verfügbar bei Copilot Enterprise |
| `o3-mini` | 128K | Nein | Ja | Reasoning-Modell |

Die Modellverfügbarkeit kann je nach Ihrem GitHub Copilot-Plan und GitHubs aktuellem Modellangebot variieren.

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | String | optional | GitHub Personal Access Token (`ghp_...` oder `gho_...`) |
| `model` | String | `gpt-4o` | Standardmäßig zu verwendendes Modell |

## Funktionen

### Zero-Config-Authentifizierung

Der Copilot-Anbieter implementiert denselben OAuth-Device-Code-Flow, der von der VS Code Copilot-Erweiterung verwendet wird:

1. **Device-Code-Anfrage**: PRX fordert einen Gerätecode von GitHub an
2. **Benutzerautorisierung**: Sie besuchen `github.com/login/device` und geben den Code ein
3. **Token-Austausch**: Das GitHub-OAuth-Token wird gegen einen kurzlebigen Copilot-API-Schlüssel ausgetauscht
4. **Automatisches Caching**: Tokens werden in `~/.config/openprx/copilot/` mit sicheren Dateiberechtigungen (0600) gecacht
5. **Auto-Refresh**: Abgelaufene Copilot-API-Schlüssel werden automatisch ohne erneute Authentifizierung ausgetauscht

### Sichere Token-Speicherung

Tokens werden mit strikter Sicherheit gespeichert:
- Verzeichnis: `~/.config/openprx/copilot/` mit 0700-Berechtigungen
- Dateien: `access-token` und `api-key.json` mit 0600-Berechtigungen
- Auf Nicht-Unix-Plattformen wird die Standard-Dateierstellung verwendet

### Dynamischer API-Endpunkt

Die Copilot-API-Schlüssel-Antwort enthält ein `endpoints.api`-Feld, das den tatsächlichen API-Endpunkt angibt. PRX respektiert dies und fällt auf `https://api.githubcopilot.com` zurück, wenn kein Endpunkt angegeben ist.

### Natives Tool Calling

Werkzeuge werden im OpenAI-kompatiblen Format über die Copilot Chat Completions API (`/chat/completions`) gesendet. Der Anbieter unterstützt `tool_choice: "auto"` für automatische Werkzeugauswahl.

### Editor-Header

Anfragen enthalten Standard-Copilot-Editor-Identifikationsheader:
- `Editor-Version: vscode/1.85.1`
- `Editor-Plugin-Version: copilot/1.155.0`
- `User-Agent: GithubCopilot/1.155.0`

## Fehlerbehebung

### "Failed to get Copilot API key (401/403)"

Ihr GitHub-OAuth-Token ist möglicherweise abgelaufen oder Ihr Copilot-Abonnement ist inaktiv:
- Stellen Sie sicher, dass Ihr GitHub-Konto ein aktives Copilot-Abonnement hat
- PRX löscht automatisch das gecachte Zugriffstoken bei 401/403 und fordert erneut zum Device-Flow-Login auf

### "Timed out waiting for GitHub authorization"

Der Device-Code-Flow hat ein 15-Minuten-Timeout. Wenn es abläuft:
- Führen Sie Ihren PRX-Befehl erneut aus, um einen neuen Code zu erhalten
- Stellen Sie sicher, dass Sie die korrekte URL besuchen und den exakten angezeigten Code eingeben

### "GitHub device authorization expired"

Der Gerätecode ist abgelaufen. Versuchen Sie einfach Ihren Befehl erneut, um einen neuen Autorisierungsflow zu starten.

### Modelle nicht verfügbar

Die verfügbaren Modelle hängen von Ihrer Copilot-Abonnementstufe ab:
- **Copilot Individual**: GPT-4o, GPT-4o-mini
- **Copilot Business/Enterprise**: Kann zusätzliche Modelle wie Claude enthalten

Überprüfen Sie Ihr Abonnement unter [github.com/settings/copilot](https://github.com/settings/copilot).

### Ratenbegrenzung

GitHub Copilot hat eigene Ratenlimits, die von OpenAI getrennt sind. Wenn Sie auf Ratenbegrenzung stoßen, erwägen Sie die Verwendung von `fallback_providers` in Ihrer PRX-Konfiguration, um auf einen anderen Anbieter auszuweichen.
