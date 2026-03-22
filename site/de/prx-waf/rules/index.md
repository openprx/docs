---
title: Regel-Engine Übersicht
description: "Funktionsweise der PRX-WAF Regel-Engine. YAML-basierte deklarative Regeln, mehrere Regelquellen, Paranoia-Stufen, Hot-Reload und die 16-Phasen-Erkennungspipeline."
---

# Regel-Engine

PRX-WAF verwendet eine deklarative, YAML-basierte Regel-Engine, um Web-Angriffe zu erkennen und zu blockieren. Regeln beschreiben, was zu inspizieren ist, wie zu übereinstimmen ist und welche Aktion zu ergreifen ist. Die Engine evaluiert jede eingehende Anfrage gegen alle aktivierten Regeln über 16 sequenzielle Erkennungsphasen.

## Funktionsweise von Regeln

Jede Regel besteht aus vier Schlüsselkomponenten:

1. **Feld** -- Welcher Teil der Anfrage zu inspizieren ist (Pfad, Query, Body, Header usw.)
2. **Operator** -- Wie der Wert übereinstimmt (regex, contains, detect_sqli usw.)
3. **Wert** -- Das Muster oder der Schwellenwert, gegen den übereinstimmt wird
4. **Aktion** -- Was zu tun ist, wenn die Regel übereinstimmt (block, log, allow)

```yaml
- id: "CUSTOM-001"
  name: "Block admin path from external IPs"
  category: "access-control"
  severity: "high"
  field: "path"
  operator: "regex"
  value: "(?i)^/admin"
  action: "block"
```

## Regelquellen

PRX-WAF wird mit 398 Regeln in vier Kategorien ausgeliefert:

| Quelle | Dateien | Regeln | Beschreibung |
|--------|---------|--------|-------------|
| OWASP CRS | 21 | 310 | OWASP ModSecurity Core Rule Set v4 (nach YAML konvertiert) |
| ModSecurity | 4 | 46 | Community-Regeln für IP-Reputation, DoS, Datenleck |
| CVE-Patches | 7 | 39 | Zielgerichtete virtuelle Patches für Log4Shell, Spring4Shell, MOVEit usw. |
| Benutzerdefiniert | 1 | 3 | Beispielvorlagen für anwendungsspezifische Regeln |

Zusätzlich enthält PRX-WAF 10+ in die Binärdatei kompilierte Erkennungsprüfer:

- SQL-Injection (libinjection + Regex)
- Cross-Site-Scripting (libinjection + Regex)
- Remote Code Execution / Befehlsinjektion
- Lokale/Remote File Inclusion
- Server-Side Request Forgery (SSRF)
- Pfad-/Verzeichnis-Traversal
- Scanner-Erkennung (Nmap, Nikto usw.)
- Bot-Erkennung (bösartige Bots, KI-Crawler, Headless Browser)
- Protokollverletzungserkennung
- Sensible Worterkennung (Aho-Corasick Multi-Muster-Matching)

## Regelformate

PRX-WAF unterstützt drei Regeldatei-Formate:

| Format | Erweiterung | Beschreibung |
|--------|-------------|-------------|
| YAML | `.yaml`, `.yml` | Natives PRX-WAF-Format (empfohlen) |
| ModSecurity | `.conf` | SecRule-Direktiven (grundlegende Teilmenge: ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY) |
| JSON | `.json` | JSON-Array von Regelobjekten |

Vollständige Schemareferenz finden Sie unter [YAML-Syntax](./yaml-syntax).

## Paranoia-Stufen

Jede Regel deklariert eine Paranoia-Stufe (1-4), die steuert, wie aggressiv sie übereinstimmt. Höhere Stufen erfassen mehr Angriffe, erhöhen aber das Risiko für Falsch-Positive.

| Stufe | Name | Beschreibung | Falsch-Positiv-Risiko |
|-------|------|-------------|----------------------|
| 1 | Standard | Hochvertrauenswürdige Regeln, produktionssicher | Sehr niedrig |
| 2 | Empfohlen | Breitere Abdeckung, geringes FP-Risiko | Niedrig |
| 3 | Aggressiv | Umfangreiche Heuristiken, erfordert Abstimmung | Moderat |
| 4 | Maximum | Alles, einschließlich spekulativer Muster | Hoch |

::: tip
Mit Paranoia-Stufe 1 in der Produktion beginnen. Protokolle überwachen, Ausschlüsse abstimmen, dann schrittweise höhere Stufen aktivieren.
:::

## Hot-Reload

PRX-WAF überwacht das `rules/`-Verzeichnis auf Dateiänderungen und lädt Regeln automatisch neu, wenn eine Datei erstellt, geändert oder gelöscht wird. Änderungen werden innerhalb des konfigurierten Entprell-Fensters (Standard: 500ms) wirksam.

Manuellen Reload auslösen:

```bash
# Via CLI
prx-waf rules reload

# Via SIGHUP (nur Unix)
kill -HUP $(pgrep prx-waf)
```

Regel-Reloads sind atomar -- das alte Regelset bedient weiterhin Traffic, bis das neue Set vollständig kompiliert und bereit ist.

## Verzeichnis-Layout

```
rules/
├── owasp-crs/          # OWASP CRS v4 (21 Dateien, 310 Regeln)
│   ├── sqli.yaml       # SQL-Injection (CRS 942xxx)
│   ├── xss.yaml        # Cross-Site-Scripting (CRS 941xxx)
│   ├── rce.yaml        # Remote Code Execution (CRS 932xxx)
│   └── ...
├── modsecurity/        # ModSecurity Community-Regeln
├── cve-patches/        # CVE virtuelle Patches (Log4Shell, Spring4Shell usw.)
├── custom/             # Ihre anwendungsspezifischen Regeln
└── tools/              # Regelvalidierungs- und Synchronisierungs-Dienstprogramme
```

## Nächste Schritte

- [YAML-Syntax](./yaml-syntax) -- Vollständige Regelschema-Referenz
- [Eingebaute Regeln](./builtin-rules) -- Detaillierte Abdeckung von OWASP CRS und CVE-Patches
- [Benutzerdefinierte Regeln](./custom-rules) -- Eigene Erkennungsregeln schreiben
