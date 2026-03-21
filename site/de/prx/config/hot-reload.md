---
title: Hot-Reload
description: Wie PRX Konfigurationsänderungen ohne Neustart anwendet -- was per Hot-Reload aktualisiert werden kann, was einen Neustart erfordert, und wie der Dateibeobachter funktioniert.
---

# Hot-Reload

PRX unterstützt das Hot-Reloading der meisten Konfigurationsänderungen. Wenn Sie `config.toml` (oder ein Fragment in `config.d/`) bearbeiten, werden die Änderungen innerhalb von Sekunden erkannt und angewendet -- kein Neustart erforderlich.

## Funktionsweise

PRX verwendet einen dreischichtigen Mechanismus für Live-Konfigurationsaktualisierungen:

1. **Dateibeobachter** -- Ein `notify`-Dateisystem-Beobachter überwacht das Konfigurationsverzeichnis (sowohl `config.toml` als auch den gesamten `config.d/`-Baum) auf Schreibereignisse.

2. **Entprellen** -- Ereignisse werden mit einem 1-Sekunden-Fenster entprellt, um schnelle aufeinanderfolgende Schreibvorgänge zusammenzufassen (z.B. von Editoren, die schreiben und dann umbenennen).

3. **Atomarer Tausch** -- Bei Erkennung einer Änderung:
   - Berechnet PRX einen SHA-256-Fingerabdruck der neuen Konfiguration
   - Vergleicht ihn mit dem letzten bekannten Fingerabdruck (überspringt bei Gleichheit)
   - Parst das neue TOML in ein `Config`-Struct
   - Bei Erfolg: veröffentlicht die neue Konfiguration atomar über `ArcSwap` (ohne Sperre)
   - Bei Fehlschlag: behält die vorherige Konfiguration bei und protokolliert eine Warnung

Der Typ `SharedConfig` (`Arc<ArcSwap<Config>>`) stellt sicher, dass alle Komponenten, die die Konfiguration lesen, einen konsistenten Snapshot ohne Konkurrenz erhalten. Leser rufen `.load_full()` auf, um einen `Arc<Config>`-Snapshot zu erhalten, der gültig bleibt, auch wenn die Konfiguration während der Verwendung getauscht wird.

## Was per Hot-Reload aktualisiert wird

Die folgenden Änderungen werden sofort wirksam (innerhalb von ~1 Sekunde):

| Kategorie | Beispiele |
|-----------|----------|
| **Anbietereinstellungen** | `default_provider`, `default_model`, `default_temperature`, `api_key`, `api_url` |
| **Kanaleinstellungen** | Telegram `allowed_users`, Discord `mention_only`, Slack `channel_id` usw. |
| **Gedächtniseinstellungen** | `backend`, `auto_save`, `embedding_provider`, Aufbewahrungszeiträume |
| **Router-Einstellungen** | `enabled`, Gewichte (`alpha`/`beta`/`gamma`/`delta`/`epsilon`), Automix-Schwellenwerte |
| **Sicherheitseinstellungen** | Sandbox-Backend, Ressourcenlimits, Audit-Konfiguration |
| **Autonomieeinstellungen** | Bereichsregeln, Autonomiestufen |
| **MCP-Einstellungen** | Serverdefinitionen, Zeitlimits, Werkzeug-Allowlists |
| **Websucheeinstellungen** | `enabled`, `provider`, `max_results` |
| **Browsereinstellungen** | `enabled`, `allowed_domains` |
| **Xin-Einstellungen** | `enabled`, `interval_minutes`, Aufgabenlimits |
| **Kosteneinstellungen** | `daily_limit_usd`, `monthly_limit_usd`, Preise |
| **Zuverlässigkeitseinstellungen** | `max_retries`, `fallback_providers` |
| **Beobachtbarkeitseinstellungen** | `backend`, OTLP-Endpunkt |
| **Proxy-Einstellungen** | Proxy-URLs, No-Proxy-Listen, Bereich |

## Was einen Neustart erfordert

Eine kleine Anzahl von Einstellungen wird beim Start gebunden und kann zur Laufzeit nicht geändert werden:

| Einstellung | Grund |
|-------------|-------|
| `[gateway] host` | TCP-Listener wird einmalig beim Start gebunden |
| `[gateway] port` | TCP-Listener wird einmalig beim Start gebunden |
| `[tunnel]`-Einstellungen | Tunnel-Verbindungen werden beim Start aufgebaut |
| Kanal-Bot-Token | Bot-Verbindungen (Telegram Long-Poll, Discord Gateway, Slack Socket) werden einmalig initialisiert |

Für diese Einstellungen müssen Sie den PRX-Daemon neu starten:

```bash
# Bei Ausführung als systemd-Dienst
sudo systemctl restart openprx

# Bei Ausführung im Vordergrund
# Mit Ctrl+C stoppen, dann erneut starten
prx
```

## CLI-Neuladebefehl

Sie können manuell ein Neuladen der Konfiguration auslösen, ohne die Datei zu bearbeiten:

```bash
prx config reload
```

Dies entspricht dem Erkennen einer Änderung durch den Dateibeobachter. Es liest die Konfigurationsdateien erneut ein, parst sie und tauscht die aktive Konfiguration atomar aus. Dies ist nützlich, wenn:

- Sie die Datei geändert haben, aber der Beobachter das Ereignis verpasst hat (selten)
- Sie ein Neuladen nach der Aktualisierung von Umgebungsvariablen erzwingen möchten
- Sie Konfigurationsänderungen skripten

## Fehlerbehandlung

Wenn die neue Konfigurationsdatei Fehler enthält:

- **TOML-Syntaxfehler** -- Der Parser lehnt die Datei ab. Die vorherige Konfiguration wird beibehalten. Eine Warnung mit den Parse-Fehlerdetails wird protokolliert.
- **Ungültige Feldwerte** -- Die Validierung erkennt Probleme wie `confidence_threshold > 1.0` oder leere `premium_model_id` bei aktiviertem Automix. Die vorherige Konfiguration wird beibehalten.
- **Fehlende Datei** -- Wenn `config.toml` gelöscht wird, protokolliert der Beobachter einen Fehler, aber die In-Memory-Konfiguration funktioniert weiter.

In allen Fehlerfällen arbeitet PRX mit der letzten bekannten guten Konfiguration weiter. Es gehen keine Daten verloren und es tritt keine Dienstunterbrechung auf.

## Neuladen überwachen

Der `HotReloadManager` pflegt einen monotonen `reload_version`-Zähler, der bei jedem erfolgreichen Neuladen inkrementiert wird. Sie können die aktuelle Version über den Gateway-Statusendpunkt prüfen:

```bash
curl http://localhost:16830/api/status
```

Die Antwort enthält die aktuelle Neulade-Zählung, damit Sie überprüfen können, ob Ihre Änderungen angewendet wurden.

## Neuladen aufgeteilter Dateien

Bei Verwendung aufgeteilter Konfigurationsdateien (`config.d/*.toml`) überwacht der Beobachter das gesamte `config.d/`-Verzeichnis rekursiv. Eine Änderung an einem beliebigen `.toml`-Fragment löst ein vollständiges Zusammenführen und Neuladen der gesamten Konfiguration aus. Das bedeutet:

- Bearbeitung von `config.d/channels.toml` lädt die gesamte Konfiguration neu (nicht nur Kanäle)
- Hinzufügen oder Entfernen einer Fragmentdatei löst ein Neuladen aus
- Die Zusammenführungsreihenfolge ist alphabetisch nach Dateiname, wobei Fragmente Vorrang vor `config.toml` haben
