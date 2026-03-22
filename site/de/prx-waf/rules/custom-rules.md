---
title: Benutzerdefinierte Regeln
description: "Benutzerdefinierte Erkennungsregeln für PRX-WAF schreiben. Schritt-für-Schritt-Anleitung mit Beispielen für Zugangskontrolle, Bot-Blockierung, Ratenbegrenzung und anwendungsspezifischen Schutz."
---

# Benutzerdefinierte Regeln

PRX-WAF macht es einfach, benutzerdefinierte Erkennungsregeln zu schreiben, die auf Ihre spezifische Anwendung zugeschnitten sind. Benutzerdefinierte Regeln werden in YAML geschrieben und im Verzeichnis `rules/custom/` abgelegt.

## Erste Schritte

1. Eine neue YAML-Datei in `rules/custom/` erstellen:

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. Datei entsprechend dem [YAML-Regelschema](./yaml-syntax) bearbeiten.

3. Vor der Bereitstellung validieren:

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. Regeln werden automatisch hot-reloaded, oder manuellen Reload auslösen:

```bash
prx-waf rules reload
```

## Beispiel: Zugriff auf interne Pfade blockieren

Externen Zugriff auf interne API-Endpunkte verhindern:

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## Beispiel: Verdächtige User-Agents erkennen

Anfragen von automatisierten Tools zur Überwachung protokollieren:

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## Beispiel: Ratenbegrenzung nach Query-Parametern

Anfragen mit einer übermäßigen Anzahl von Query-Parametern blockieren (häufig bei DoS-Angriffen):

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Beispiel: Bestimmte Dateierweiterungen blockieren

Zugriff auf Backup- oder Konfigurationsdateien verhindern:

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## Beispiel: Credential Stuffing erkennen

Schnelle Login-Versuche erkennen (nützlich neben dem eingebauten Ratenbegrenzer):

```yaml
  - id: "CUSTOM-AUTH-001"
    name: "Log login endpoint access for monitoring"
    category: "access-control"
    severity: "low"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(api/)?(login|signin|authenticate|auth/token)"
    action: "log"
    tags: ["custom", "authentication", "monitoring"]
```

## Beispiel: CVE-Virtueller Patch

Einen schnellen virtuellen Patch für eine spezifische Schwachstelle erstellen:

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## Rhai-Skripte für komplexe Logik verwenden

Für Regeln, die mehr als Mustererkennung erfordern, unterstützt PRX-WAF Rhai-Skripting in Phase 12:

```rhai
// rules/custom/scripts/geo-block.rhai
// Block requests from specific countries during maintenance
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
Rhai-Skripte laufen in einer Sandbox-Umgebung. Sie können nicht auf das Dateisystem, das Netzwerk oder Systemressourcen außerhalb des Anfragekontexts zugreifen.
:::

## Best Practices

1. **Mit `action: log` beginnen** -- Vor dem Blockieren überwachen, um Falsch-Positive frühzeitig zu erkennen.

2. **Spezifische Regex-Anker verwenden** -- `^` und `$` verwenden, um Teiltreffer zu verhindern, die Falsch-Positive verursachen.

3. **Angemessene Paranoia-Stufen setzen** -- Wenn eine Regel legitimen Traffic treffen könnte, Paranoia auf 2 oder 3 setzen anstatt auf Stufe 1 zu blockieren.

4. **Nicht-erfassende Gruppen verwenden** -- `(?:...)` statt `(...)` für Klarheit und Performance.

5. **Beschreibende Tags hinzufügen** -- Tags erscheinen in der Admin-UI und helfen beim Filtern von Sicherheitsereignissen.

6. **Referenzen einbeziehen** -- Eine `reference`-URL hinzufügen, die auf den relevanten CVE, OWASP-Artikel oder die interne Dokumentation verweist.

7. **Regex testen** -- Regex-Muster vor der Bereitstellung validieren:

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **Vor der Bereitstellung validieren** -- Den Validierer immer ausführen:

```bash
python rules/tools/validate.py rules/custom/
```

## Via CLI importieren

Regeln können auch aus Dateien oder URLs mit der CLI importiert werden:

```bash
# Aus einer lokalen Datei importieren
prx-waf rules import /path/to/rules.yaml

# Aus einer URL importieren
prx-waf rules import https://example.com/rules/custom.yaml

# Eine Regeldatei validieren
prx-waf rules validate /path/to/rules.yaml
```

## ModSecurity-Regeln importieren

Vorhandene ModSecurity `.conf`-Regeln in das PRX-WAF YAML-Format konvertieren:

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
Der ModSecurity-Konverter unterstützt eine grundlegende Teilmenge von SecRule-Direktiven (ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY). Komplexe ModSecurity-Regeln mit Verkettung oder Lua-Skripten werden nicht unterstützt und müssen manuell neu geschrieben werden.
:::

## Nächste Schritte

- [YAML-Syntax](./yaml-syntax) -- Vollständige Regelschema-Referenz
- [Eingebaute Regeln](./builtin-rules) -- Vorhandene Regeln überprüfen, bevor neue geschrieben werden
- [Regel-Engine Übersicht](./index) -- Verstehen, wie Regeln in der Pipeline ausgewertet werden
