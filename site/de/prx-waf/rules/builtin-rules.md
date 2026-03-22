---
title: Eingebaute Regeln
description: "PRX-WAF wird mit 398 YAML-Regeln ausgeliefert, die OWASP CRS, ModSecurity Community-Regeln und gezielte CVE-virtuelle Patches abdecken. Vollständiger Bestand und Kategorieübersicht."
---

# Eingebaute Regeln

PRX-WAF wird mit 398 vorgefertigten Regeln in drei Kategorien ausgeliefert, plus 10+ in die Binärdatei kompilierte Erkennungsprüfer. Zusammen bieten sie umfassende Abdeckung der OWASP Top 10 und bekannter CVE-Exploits.

## OWASP Core Rule Set (310 Regeln)

Die OWASP CRS-Regeln werden aus dem [OWASP ModSecurity Core Rule Set v4](https://github.com/coreruleset/coreruleset) in das native YAML-Format von PRX-WAF konvertiert. Sie decken die häufigsten Web-Angriffsvektoren ab:

| Datei | CRS-IDs | Regeln | Kategorie |
|-------|---------|--------|-----------|
| `sqli.yaml` | 942xxx | ~87 | SQL-Injection |
| `xss.yaml` | 941xxx | ~41 | Cross-Site-Scripting |
| `rce.yaml` | 932xxx | ~30 | Remote Code Execution |
| `lfi.yaml` | 930xxx | ~20 | Local File Inclusion |
| `rfi.yaml` | 931xxx | ~12 | Remote File Inclusion |
| `php-injection.yaml` | 933xxx | ~18 | PHP-Injection |
| `java-injection.yaml` | 944xxx | ~15 | Java / Expression Language Injection |
| `generic-attack.yaml` | 934xxx | ~12 | Node.js, SSI, HTTP-Splitting |
| `scanner-detection.yaml` | 913xxx | ~10 | Sicherheitsscanner UA-Erkennung |
| `protocol-enforcement.yaml` | 920xxx | ~15 | HTTP-Protokoll-Compliance |
| `protocol-attack.yaml` | 921xxx | ~10 | Request-Smuggling, CRLF-Injection |
| `multipart-attack.yaml` | 922xxx | ~8 | Multipart-Bypass |
| `method-enforcement.yaml` | 911xxx | ~5 | HTTP-Methoden-Allowlist |
| `session-fixation.yaml` | 943xxx | ~6 | Session Fixation |
| `web-shells.yaml` | 955xxx | ~8 | Web-Shell-Erkennung |
| `response-*.yaml` | 950-956xxx | ~13 | Antwortinspektion |

### Wordlist-Datendateien

Die OWASP CRS-Regeln verwenden Phrasen-Matching (`pm_from_file`) gegen 20+ Wordlist-Dateien, die in `rules/owasp-crs/data/` gespeichert sind:

- `scanners-user-agents.data` -- Bekannte Scanner-User-Agent-Strings
- `lfi-os-files.data` -- Sensible OS-Dateipfade
- `sql-errors.data` -- Datenbankfehlermeldungsmuster
- Und mehr

## ModSecurity Community-Regeln (46 Regeln)

Handgefertigte Regeln für Bedrohungskategorien, die vom OWASP CRS nicht vollständig abgedeckt werden:

| Datei | Regeln | Kategorie |
|-------|--------|-----------|
| `ip-reputation.yaml` | ~15 | Bot/Scanner/Proxy-IP-Erkennung |
| `dos-protection.yaml` | ~12 | DoS und abnormale Anfragemuster |
| `data-leakage.yaml` | ~10 | PII- und Anmeldedaten-Leck-Erkennung |
| `response-checks.yaml` | ~9 | Antwortkörper-Inspektion |

## CVE-Virtuelle Patches (39 Regeln)

Gezielte Erkennungsregeln für hochkarätige CVEs. Diese fungieren als virtuelle Patches und blockieren Exploit-Versuche, bevor sie anfällige Anwendungen erreichen:

| Datei | CVE(s) | Beschreibung |
|-------|--------|-------------|
| `2021-log4shell.yaml` | CVE-2021-44228, CVE-2021-45046 | Apache Log4j RCE via JNDI-Lookup |
| `2022-spring4shell.yaml` | CVE-2022-22965, CVE-2022-22963 | Spring Framework RCE |
| `2022-text4shell.yaml` | CVE-2022-42889 | Apache Commons Text RCE |
| `2023-moveit.yaml` | CVE-2023-34362, CVE-2023-36934 | MOVEit Transfer SQL-Injection |
| `2024-xz-backdoor.yaml` | CVE-2024-3094 | XZ Utils Backdoor-Erkennung |
| `2024-recent.yaml` | Verschiedene | Hochkarätige CVEs 2024 |
| `2025-recent.yaml` | Verschiedene | Hochkarätige CVEs 2025 |

::: tip
CVE-Patch-Regeln sind standardmäßig auf Paranoia-Stufe 1 gesetzt, was bedeutet, dass sie in allen Konfigurationen aktiv sind. Sie haben sehr niedrige Falsch-Positiv-Raten, da sie auf spezifische Exploit-Payloads abzielen.
:::

## Eingebaute Erkennungsprüfer

Zusätzlich zu den YAML-Regeln enthält PRX-WAF in die Binärdatei kompilierte Erkennungsprüfer. Diese laufen in dedizierten Phasen der Erkennungspipeline:

| Phase | Prüfer | Beschreibung |
|-------|--------|-------------|
| 1-4 | IP-Allowlist/Blocklist | CIDR-basierte IP-Filterung |
| 5 | CC/DDoS-Ratenbegrenzer | Gleitfenster-Ratenbegrenzung pro IP |
| 6 | Scanner-Erkennung | Sicherheitsscanner-Fingerprints (Nmap, Nikto usw.) |
| 7 | Bot-Erkennung | Bösartige Bots, KI-Crawler, Headless Browser |
| 8 | SQL-Injection | libinjection + Regex-Muster |
| 9 | XSS | libinjection + Regex-Muster |
| 10 | RCE / Befehlsinjektion | OS-Befehlsinjektionsmuster |
| 11 | Verzeichnis-Traversal | Pfad-Traversal-Erkennung (`../`) |
| 14 | Sensible Daten | Aho-Corasick Multi-Muster PII/Anmeldedaten-Erkennung |
| 15 | Anti-Hotlinking | Referer-basierte Validierung pro Host |
| 16 | CrowdSec | Bouncer-Entscheidungen + AppSec-Inspektion |

## Regeln aktualisieren

Regeln können mit den enthaltenen Tools aus Upstream-Quellen synchronisiert werden:

```bash
# Auf Updates prüfen
python rules/tools/sync.py --check

# OWASP CRS auf ein bestimmtes Release synchronisieren
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/ --tag v4.10.0

# Auf neueste Version synchronisieren
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/

# Nach dem Update Hot-Reload auslösen
prx-waf rules reload
```

## Regelstatistiken

Aktuelle Regelstatistiken via CLI anzeigen:

```bash
prx-waf rules stats
```

Beispielausgabe:

```
Rule Statistics
===============
  OWASP CRS:    310 rules (21 files)
  ModSecurity:   46 rules (4 files)
  CVE Patches:   39 rules (7 files)
  Custom:         3 rules (1 file)
  ─────────────────────────
  Total:        398 rules (33 files)

  Enabled:      395
  Disabled:       3
  Paranoia 1:   280
  Paranoia 2:    78
  Paranoia 3:    30
  Paranoia 4:    10
```

## Nächste Schritte

- [Benutzerdefinierte Regeln](./custom-rules) -- Eigene Regeln schreiben
- [YAML-Syntax](./yaml-syntax) -- Vollständige Regelschema-Referenz
- [Regel-Engine Übersicht](./index) -- Wie die Pipeline Regeln auswertet
