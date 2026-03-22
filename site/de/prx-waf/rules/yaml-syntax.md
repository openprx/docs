---
title: YAML-Regel-Syntax
description: "Vollständige Referenz für das PRX-WAF YAML-Regelformat. Schema, Feldreferenz, Operatorreferenz, Aktionsreferenz und kommentierte Beispiele."
---

# YAML-Regel-Syntax

Diese Seite dokumentiert das vollständige YAML-Regelschema, das von PRX-WAF verwendet wird. Jede Regeldatei folgt dieser Struktur.

## Dateistruktur

Jede YAML-Regeldatei hat einen übergeordneten Metadatenabschnitt, gefolgt von einer Liste von Regeln:

```yaml
version: "1.0"                     # Schema-Version (erforderlich)
description: "Short description"   # Lesbares Label (erforderlich)
source: "OWASP CRS v4.25.0"       # Ursprung der Regeln (optional)
license: "Apache-2.0"             # SPDX-Lizenzkennung (optional)

rules:
  - <rule>
  - <rule>
```

## Regelschema

Jede Regel in der `rules`-Liste hat die folgenden Felder:

```yaml
- id: "CRS-942100"              # Eindeutige String-ID (ERFORDERLICH)
  name: "SQL injection attack"  # Kurze Beschreibung (ERFORDERLICH)
  category: "sqli"              # Kategorie-Tag (ERFORDERLICH)
  severity: "critical"          # Schweregrad (ERFORDERLICH)
  paranoia: 1                   # Paranoia-Stufe 1-4 (optional, Standard: 1)
  field: "all"                  # Zu inspizierendes Anfragefeld (ERFORDERLICH)
  operator: "regex"             # Übereinstimmungsoperator (ERFORDERLICH)
  value: "(?i)select.+from"     # Muster oder Schwellenwert (ERFORDERLICH)
  action: "block"               # Aktion bei Übereinstimmung (ERFORDERLICH)
  tags:                         # String-Tags (optional)
    - "owasp-crs"
    - "sqli"
  crs_id: 942100                # Ursprüngliche numerische CRS-ID (optional)
  reference: "https://..."      # CVE- oder Dokumentationslink (optional)
```

### Erforderliche Felder

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `string` | Eindeutiger Bezeichner über alle Regeldateien. Format: `<PRÄFIX>-<KATEGORIE>-<NNN>` |
| `name` | `string` | Kurze lesbare Beschreibung (max ~120 Zeichen) |
| `category` | `string` | Kategorie-Tag für Filterung und Berichterstattung |
| `severity` | `string` | Eines von: `critical`, `high`, `medium`, `low`, `info`, `notice`, `warning`, `error`, `unknown` |
| `field` | `string` | Welcher Teil der Anfrage zu inspizieren ist (siehe Feldreferenz) |
| `operator` | `string` | Wie der Wert übereinstimmt (siehe Operatorreferenz) |
| `value` | `string` | Muster, Schwellenwert oder Wordlist-Dateiname |
| `action` | `string` | Was zu tun ist, wenn die Regel übereinstimmt (siehe Aktionsreferenz) |

### Optionale Felder

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `paranoia` | `integer` | `1` | Paranoia-Stufe 1-4 |
| `tags` | `string[]` | `[]` | Tags für Filterung und Dashboard-Anzeige |
| `crs_id` | `integer` | -- | Ursprüngliche numerische OWASP CRS-ID |
| `reference` | `string` | -- | URL zu CVE, OWASP-Artikel oder Begründung |

## Feldreferenz

Der `field`-Wert bestimmt, welcher Teil der HTTP-Anfrage inspiziert wird:

| Feld | Inspiziert |
|------|------------|
| `path` | Anfrage-URI-Pfad (ohne Query-String) |
| `query` | Query-String (alle Parameter, dekodiert) |
| `body` | Anfrage-Body (dekodiert) |
| `headers` | Alle Anfrage-Header (Name: Wert-Paare) |
| `user_agent` | Nur User-Agent-Header |
| `cookies` | Anfrage-Cookies |
| `method` | HTTP-Methode (GET, POST, PUT usw.) |
| `content_type` | Content-Type-Header |
| `content_length` | Content-Length-Wert (für numerischen Vergleich) |
| `path_length` | Länge des URI-Pfads (für numerischen Vergleich) |
| `query_arg_count` | Anzahl der Query-Parameter (für numerischen Vergleich) |
| `all` | Alle oben genannten Felder kombiniert |

## Operatorreferenz

Der `operator`-Wert bestimmt, wie der `value` gegen das inspizierte Feld übereinstimmt:

| Operator | Beschreibung | Wertformat |
|----------|-------------|-----------|
| `regex` | PCRE-kompatibler regulärer Ausdruck | Regex-Muster |
| `contains` | Feld enthält den wörtlichen String | Wörtlicher String |
| `equals` | Feld entspricht exakt dem Wert (Groß-/Kleinschreibung sensitiv) | Wörtlicher String |
| `not_in` | Feldwert ist NICHT in der Liste | Kommagetrennte Liste |
| `gt` | Feldwert (numerisch) ist größer als | Zahlen-String |
| `lt` | Feldwert (numerisch) ist kleiner als | Zahlen-String |
| `ge` | Feldwert (numerisch) ist größer als oder gleich | Zahlen-String |
| `le` | Feldwert (numerisch) ist kleiner als oder gleich | Zahlen-String |
| `detect_sqli` | SQL-Injection-Erkennung via libinjection | `"true"` oder `""` |
| `detect_xss` | XSS-Erkennung via libinjection | `"true"` oder `""` |
| `pm_from_file` | Phrasen-Matching gegen Wordlist-Datei | Dateiname in `owasp-crs/data/` |
| `pm` | Phrasen-Matching gegen Inline-Liste | Kommagetrennte Phrasen |

## Aktionsreferenz

Der `action`-Wert bestimmt, was passiert, wenn eine Regel übereinstimmt:

| Aktion | Beschreibung |
|--------|-------------|
| `block` | Anfrage mit 403 Forbidden-Antwort ablehnen |
| `log` | Anfrage erlauben, aber Übereinstimmung protokollieren (Überwachungsmodus) |
| `allow` | Anfrage explizit erlauben (überschreibt andere Regeln) |
| `deny` | Alias für `block` |
| `redirect` | Anfrage umleiten (Engine-spezifische Konfiguration) |
| `drop` | Verbindung stillschweigend trennen |

::: tip
Neue Regeln mit `action: log` beginnen, um auf Falsch-Positive zu überwachen, bevor auf `action: block` gewechselt wird.
:::

## ID-Namespace-Konvention

Regel-IDs sollten der etablierten Präfix-Konvention folgen:

| Verzeichnis | ID-Präfix | Beispiel |
|-------------|-----------|---------|
| `owasp-crs/` | `CRS-<Nummer>` | `CRS-942100` |
| `modsecurity/` | `MODSEC-<KATEGORIE>-<NNN>` | `MODSEC-IP-001` |
| `cve-patches/` | `CVE-<JAHR>-<KURZ>-<NNN>` | `CVE-2021-LOG4J-001` |
| `custom/` | `CUSTOM-<KATEGORIE>-<NNN>` | `CUSTOM-API-001` |

## Vollständiges Beispiel

```yaml
version: "1.0"
description: "Application-specific access control rules"
source: "custom"
license: "Apache-2.0"

rules:
  - id: "CUSTOM-API-001"
    name: "Block access to internal admin API"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/internal/"
    action: "block"
    tags: ["custom", "access-control"]

  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client)"
    action: "log"
    tags: ["custom", "bot", "scanner"]

  - id: "CUSTOM-RATE-001"
    name: "Block requests with excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Regelvalidierung

Regeldateien vor der Bereitstellung validieren:

```bash
# Alle Regeln validieren
python rules/tools/validate.py rules/

# Bestimmte Datei validieren
python rules/tools/validate.py rules/custom/myapp.yaml
```

Der Validierer prüft auf:
- Alle erforderlichen Felder sind vorhanden
- Keine doppelten Regel-IDs über alle Dateien
- Schweregrad- und Aktionswerte sind gültig
- Paranoia-Stufen liegen im Bereich 1-4
- Regexe kompilieren korrekt
- Numerische Operatoren werden nicht mit String-Werten verwendet

## Nächste Schritte

- [Eingebaute Regeln](./builtin-rules) -- OWASP CRS und CVE-Patch-Regeln erkunden
- [Benutzerdefinierte Regeln](./custom-rules) -- Schritt-für-Schritt eigene Regeln schreiben
- [Regel-Engine Übersicht](./index) -- Funktionsweise der Erkennungspipeline mit Regeln
