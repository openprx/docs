---
title: Shell-Ausfuhrung
description: Das Shell-Werkzeug fuhrt Befehle in Sandbox-Umgebungen mit konfigurierbaren Isolation-Backends, Umgebungsbereinigung, Timeout-Durchsetzung und Ausgabelimits aus.
---

# Shell-Ausfuhrung

Das `shell`-Werkzeug ist eines der drei Kern-Werkzeuge in PRX, verfugbar in sowohl `default_tools()`- als auch `all_tools()`-Registries. Es bietet OS-Level-Befehlsausfuhrung innerhalb einer konfigurierbaren Sandbox und stellt sicher, dass vom Agenten initiierte Befehle unter strikter Isolation, Zeitlimits und Ausgabebeschrankungen laufen.

Wenn das LLM entscheidet, dass es einen Shell-Befehl ausfuhren muss -- ein Paket installieren, Code kompilieren, Systemzustand abfragen oder ein Skript ausfuhren -- ruft es das `shell`-Werkzeug mit dem Befehlsstring auf. PRX umschliesst die Ausfuhrung im konfigurierten Sandbox-Backend, erzwingt ein 60-Sekunden-Standard-Timeout, begrenzt die Ausgabe auf 1 MB und entfernt sensible Umgebungsvariablen, bevor der Kindprozess gestartet wird.

Das Shell-Werkzeug ist typischerweise das machtigste und am starksten eingeschrankte Werkzeug im PRX-Arsenal. Es ist das primare Ziel der Sicherheitsrichtlinien-Engine, und die meisten Bereitstellungen markieren es als `supervised`, um vor der Ausfuhrung eine menschliche Genehmigung zu erfordern.

## Konfiguration

Das Shell-Werkzeug selbst hat keinen eigenen Konfigurationsabschnitt. Sein Verhalten wird uber die Sicherheits-Sandbox und Ressourcenlimits gesteuert:

```toml
[security.sandbox]
enabled = true
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# Benutzerdefinierte Firejail-Argumente (wenn backend = "firejail")
firejail_args = ["--net=none", "--noroot"]

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]

[security.resources]
max_memory_mb = 512
max_cpu_time_seconds = 60
max_subprocesses = 10
memory_monitoring = true
```

Um das Shell-Werkzeug als uberwacht zu markieren (erfordert Genehmigung pro Aufruf):

```toml
[security.tool_policy.tools]
shell = "supervised"
```

## Sandbox-Backends

PRX unterstutzt funf Sandbox-Backends. Wenn `backend = "auto"`, pruft PRX verfugbare Backends in der folgenden Prioritatsreihenfolge und wahlt das erste gefundene:

| Backend | Plattform | Isolationsgrad | Overhead | Hinweise |
|---------|-----------|----------------|----------|----------|
| **Landlock** | Linux (5.13+) | Dateisystem-LSM | Minimal | Kernel-nativ, keine zusatzlichen Abhangigkeiten. Beschrankt Dateisystempfade auf Kernel-Ebene. |
| **Firejail** | Linux | Voll (Netzwerk, Dateisystem, PID) | Niedrig | User-Space-Sandbox. Unterstutzt `--net=none` fur Netzwerk-Isolation, PID-Namespace, Seccomp-Filterung. |
| **Bubblewrap** | Linux, macOS | Namespace-basiert | Niedrig | Verwendet User-Namespaces. Konfigurierbare beschreibbare/nur-lesbare Pfadlisten. |
| **Docker** | Alle | Vollstandiger Container | Hoch | Fuhrt Befehle in einem Wegwerf-Container aus. Maximale Isolation, aber hochste Latenz. |
| **None** | Alle | Nur Anwendungsschicht | Keine | Keine OS-Level-Isolation. PRX erzwingt immer noch Timeout und Ausgabelimits, aber der Prozess hat vollen OS-Zugriff. |

### Landlock

Landlock ist ein Linux Security Module, verfugbar ab Kernel 5.13+. Es beschrankt den Dateisystemzugriff auf Kernel-Ebene, ohne Root-Privilegien zu erfordern. PRX verwendet Landlock, um einzuschranken, auf welche Pfade der Shell-Befehl lesen und schreiben kann.

### Firejail

Firejail bietet umfassendes Sandboxing uber Linux-Namespaces und Seccomp. Benutzerdefinierte Argumente konnen uber `firejail_args` ubergeben werden:

```toml
[security.sandbox]
backend = "firejail"
firejail_args = ["--net=none", "--noroot", "--nosound", "--no3d"]
```

### Bubblewrap

Bubblewrap (`bwrap`) verwendet User-Namespaces, um minimale Sandbox-Umgebungen zu erstellen. Es ist leichter als Firejail und funktioniert auf einigen macOS-Konfigurationen:

```toml
[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp", "/home/user/workspace"]
readonly_paths = ["/usr", "/lib", "/bin"]
```

### Docker

Docker bietet vollstandige Container-Isolation. Jeder Befehl lauft in einem frischen Container basierend auf dem konfigurierten Image:

```toml
[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"
```

## Verwendung

Das Shell-Werkzeug wird vom LLM wahrend agentischer Schleifen aufgerufen. In Agentenkonversationen generiert das LLM einen Werkzeugaufruf wie:

```json
{
  "name": "shell",
  "arguments": {
    "command": "ls -la /home/user/project"
  }
}
```

Von der CLI aus konnen Sie Shell-Werkzeugaufrufe in der Agentenausgabe beobachten. Der Werkzeugaufruf zeigt den ausgefuhrten Befehl und das verwendete Sandbox-Backend.

### Ausfuhrungsfluss

1. Das LLM generiert einen `shell`-Werkzeugaufruf mit einem `command`-Argument
2. Die Sicherheitsrichtlinien-Engine pruft, ob der Aufruf erlaubt, verweigert oder Uberwachung erfordert
3. Wenn uberwacht, fordert PRX den Benutzer zur Genehmigung auf, bevor fortgefahren wird
4. Das Sandbox-Backend umschliesst den Befehl mit der entsprechenden Isolationsschicht
5. Umgebungsvariablen werden bereinigt (siehe unten)
6. Der Befehl wird mit einem 60-Sekunden-Timeout ausgefuhrt
7. stdout und stderr werden erfasst, bei Bedarf auf 1 MB gekurzt
8. Das Ergebnis wird als `ToolResult` mit Erfolgs-/Fehlerstatus an das LLM zuruckgegeben

## Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `command` | `string` | Ja | -- | Der auszufuhrende Shell-Befehl. Wird an `/bin/sh -c` (oder aquivalent) ubergeben. |

Das Werkzeug gibt ein `ToolResult` zuruck mit:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | `bool` | `true`, wenn der Befehl mit Code 0 beendet wurde |
| `output` | `string` | Kombinierte stdout und stderr, auf 1 MB gekurzt |
| `error` | `string?` | Fehlermeldung, wenn der Befehl fehlschlug oder das Timeout uberschritt |

## Umgebungsbereinigung

Das Shell-Werkzeug ubergibt nur eine strikte Whitelist von Umgebungsvariablen an Kindprozesse. Dies verhindert versehentliche Leckage von API-Schlusseln, Tokens und Geheimnissen, die in der Daemon-Umgebung vorhanden sein konnen.

**Erlaubte Umgebungsvariablen:**

| Variable | Zweck |
|----------|-------|
| `PATH` | Suchpfad fur ausfuhrbare Dateien |
| `HOME` | Benutzer-Home-Verzeichnis |
| `TERM` | Terminaltyp |
| `LANG` | Sprach-Locale |
| `LC_ALL` | Locale-Uberschreibung |
| `LC_CTYPE` | Zeichentyp-Locale |
| `USER` | Aktueller Benutzername |
| `SHELL` | Standard-Shell-Pfad |
| `TMPDIR` | Temporares Verzeichnis |

Alle anderen Variablen -- einschliesslich `API_KEY`, `AWS_SECRET_ACCESS_KEY`, `GITHUB_TOKEN`, `OPENAI_API_KEY` und alle benutzerdefinierten Variablen -- werden aus der Kindprozess-Umgebung entfernt. Dies ist eine fest codierte Sicherheitsgrenze, die nicht uber die Konfiguration uberschrieben werden kann.

## Ressourcenlimits

| Limit | Standard | Konfigurierbar | Beschreibung |
|-------|----------|---------------|-------------|
| Timeout | 60 Sekunden | `security.resources.max_cpu_time_seconds` | Maximale Wanduhrzeit pro Befehl |
| Ausgabegrosse | 1 MB | -- | Maximale kombinierte stdout + stderr |
| Speicher | 512 MB | `security.resources.max_memory_mb` | Maximaler Speicherverbrauch pro Befehl |
| Unterprozesse | 10 | `security.resources.max_subprocesses` | Maximale gestartete Kindprozesse |

Wenn ein Befehl den Timeout uberschreitet, sendet PRX SIGTERM gefolgt von SIGKILL nach einer Gnadenfrist. Das Werkzeugergebnis meldet den Timeout als Fehler.

Wenn die Ausgabe 1 MB uberschreitet, wird sie gekurzt und ein Hinweis wird angehangt, der die Kurzung anzeigt.

## Sicherheit

- **Sandbox-Isolation**: Befehle laufen innerhalb des konfigurierten Sandbox-Backends und beschranken Dateisystem-, Netzwerk- und Prozesszugriff
- **Umgebungsbereinigung**: Nur 9 Whitelist-Umgebungsvariablen werden an Kindprozesse ubergeben
- **Richtlinien-Engine**: Jeder Shell-Aufruf durchlauft die Sicherheitsrichtlinien-Engine vor der Ausfuhrung
- **Audit-Protokollierung**: Alle Shell-Befehle und ihre Ergebnisse werden im Audit-Protokoll aufgezeichnet, wenn `security.audit.enabled = true`
- **Uberwachter Modus**: Das Shell-Werkzeug kann in der Werkzeugrichtlinie als `supervised` markiert werden, was eine explizite Benutzergenehmigung vor jeder Ausfuhrung erfordert
- **Ressourcenlimits**: Harte Limits fur Timeout, Speicher, Ausgabegrosse und Unterprozessanzahl verhindern Ressourcenerschopfung

### Bedrohungsminderung

Das Shell-Werkzeug ist der primare Vektor fur Prompt-Injection-Angriffe. Wenn ein Angreifer das Reasoning des LLM beeinflussen kann (zum Beispiel durch bosartigen Dokumenteninhalt), wurde er das Shell-Werkzeug verwenden, um Befehle auszufuhren. PRX mindert dies durch:

1. **Sandbox-Einschrankung** -- selbst wenn ein bosartiger Befehl ausgefuhrt wird, lauft er mit eingeschranktem Dateisystem- und Netzwerkzugriff
2. **Umgebungsentfernung** -- API-Schlussel und Geheimnisse sind fur den Kindprozess nicht verfugbar
3. **Uberwachungsmodus** -- ein Mensch im Loop kann jeden Befehl vor der Ausfuhrung uberprufen
4. **Audit-Trail** -- alle Befehle werden fur forensische Uberprufung protokolliert

## Verwandte Seiten

- [Sicherheits-Sandbox](/de/prx/security/sandbox) -- detaillierte Sandbox-Backend-Dokumentation
- [Richtlinien-Engine](/de/prx/security/policy-engine) -- Werkzeug-Zugriffskontrollregeln
- [Konfigurationsreferenz](/de/prx/config/reference) -- `security.sandbox`- und `security.resources`-Felder
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle 46+ Werkzeuge und Registry-System
