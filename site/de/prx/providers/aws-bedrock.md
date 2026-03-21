---
title: AWS Bedrock
description: AWS Bedrock als LLM-Anbieter in PRX konfigurieren
---

# AWS Bedrock

> Zugriff auf Foundation-Modelle (Claude, Titan, Llama, Mistral und mehr) über die AWS Bedrock Converse API mit SigV4-Authentifizierung, nativem Tool Calling und Prompt-Caching.

## Voraussetzungen

- Ein AWS-Konto mit aktiviertem Bedrock-Modellzugriff
- AWS-Anmeldedaten (Access Key ID + Secret Access Key) mit `bedrock:InvokeModel`-Berechtigungen

## Schnelleinrichtung

### 1. Modellzugriff aktivieren

1. Öffnen Sie die [AWS Bedrock-Konsole](https://console.aws.amazon.com/bedrock/)
2. Navigieren Sie zu **Model access** in der linken Seitenleiste
3. Beantragen Sie Zugriff auf die gewünschten Modelle (z.B. Anthropic Claude, Meta Llama)

### 2. AWS-Anmeldedaten konfigurieren

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # optional, defaults to us-east-1
```

### 3. PRX konfigurieren

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. Überprüfen

```bash
prx doctor models
```

## Verfügbare Modelle

Modell-IDs folgen dem Bedrock-Format `<provider>.<model>-<version>`:

| Modell-ID | Anbieter | Kontext | Vision | Werkzeugnutzung | Hinweise |
|----------|----------|---------|--------|----------|-------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | Ja | Ja | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | Ja | Ja | Neuestes Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | Ja | Ja | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | Ja | Ja | Schnelles Claude-Modell |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | Nein | Ja | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | Nein | Ja | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | Nein | Nein | Amazon Titan |

Prüfen Sie die [AWS Bedrock-Dokumentation](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) für die vollständige Liste der verfügbaren Modelle in Ihrer Region.

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `model` | String | erforderlich | Bedrock-Modell-ID (z.B. `anthropic.claude-sonnet-4-6`) |

Die Authentifizierung erfolgt ausschließlich über AWS-Umgebungsvariablen:

| Umgebungsvariable | Erforderlich | Beschreibung |
|---------------------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Ja | AWS Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Ja | AWS Secret Access Key |
| `AWS_SESSION_TOKEN` | Nein | Temporäres Sitzungstoken (für angenommene Rollen) |
| `AWS_REGION` | Nein | AWS-Region (Standard: `us-east-1`) |
| `AWS_DEFAULT_REGION` | Nein | Fallback-Region, wenn `AWS_REGION` nicht gesetzt ist |

## Funktionen

### Abhängigkeitsfreies SigV4-Signing

PRX implementiert AWS SigV4-Anfragensignierung nur mit `hmac`- und `sha2`-Crates, ohne Abhängigkeit vom AWS SDK. Dies hält die Binärdatei klein und vermeidet SDK-Versionskonflikte. Die Signierung umfasst:

- HMAC-SHA256-Schlüsselableitungskette
- Kanonische Anfragekonstruktion mit sortierten Headern
- `x-amz-security-token`-Unterstützung für temporäre Anmeldedaten

### Converse API

PRX verwendet Bedrocks Converse API (nicht die Legacy InvokeModel API), die Folgendes bietet:
- Ein einheitliches Nachrichtenformat über alle Modellanbieter hinweg
- Strukturiertes Tool Calling mit `toolUse`- und `toolResult`-Blöcken
- System-Prompt-Unterstützung
- Konsistentes Antwortformat

### Natives Tool Calling

Werkzeuge werden im nativen Bedrock-`toolConfig`-Format mit `toolSpec`-Definitionen einschließlich `name`, `description` und `inputSchema` gesendet. Werkzeugergebnisse werden als `toolResult`-Inhaltsblöcke innerhalb von `user`-Nachrichten verpackt.

### Prompt-Caching

PRX wendet Bedrocks Prompt-Caching-Heuristiken an (unter Verwendung derselben Schwellenwerte wie beim Anthropic-Anbieter):
- System-Prompts > 3 KB erhalten einen `cachePoint`-Block
- Gespräche mit > 4 Nicht-System-Nachrichten haben die letzte Nachricht mit einem `cachePoint` annotiert

### URL-Kodierung für Modell-IDs

Bedrock-Modell-IDs mit Doppelpunkten (z.B. `v1:0`) erfordern besondere Behandlung. PRX:
- Sendet rohe Doppelpunkte in der HTTP-URL (wie reqwest es tut)
- Kodiert Doppelpunkte als `%3A` in der kanonischen URI für SigV4-Signierung
- Dieser duale Ansatz stellt sicher, dass sowohl HTTP-Routing als auch Signaturverifizierung erfolgreich sind

## Anbieter-Aliase

Die folgenden Namen werden zum Bedrock-Anbieter aufgelöst:

- `bedrock`
- `aws-bedrock`

## Fehlerbehebung

### "AWS Bedrock credentials not set"

Stellen Sie sicher, dass sowohl `AWS_ACCESS_KEY_ID` als auch `AWS_SECRET_ACCESS_KEY` als Umgebungsvariablen gesetzt sind. PRX liest nicht aus `~/.aws/credentials` oder `~/.aws/config`.

### 403 AccessDeniedException

Häufige Ursachen:
- Der IAM-Benutzer/-Rolle hat keine `bedrock:InvokeModel`-Berechtigung
- Sie haben keinen Zugriff auf das Modell in der Bedrock-Konsole beantragt
- Das Modell ist in Ihrer konfigurierten Region nicht verfügbar

### SignatureDoesNotMatch

Dies deutet normalerweise auf Zeitabweichung hin. Stellen Sie sicher, dass Ihre Systemuhr synchronisiert ist:
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```

### Modell nicht in Region verfügbar

Nicht alle Modelle sind in allen Regionen verfügbar. Prüfen Sie die [Bedrock-Modellverfügbarkeitsmatrix](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) und passen Sie `AWS_REGION` entsprechend an.

### Verwendung temporärer Anmeldedaten (STS)

Wenn Sie AWS STS (angenommene Rollen, SSO) verwenden, setzen Sie alle drei Variablen:
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

Das Sitzungstoken wird automatisch in die SigV4-Signatur als `x-amz-security-token`-Header einbezogen.
