---
title: Git-Operationen
description: Versionskontroll-Werkzeug mit Unterstutzung fur Status, Diff, Commit, Push, Pull, Log und Branch-Operationen auf Workspace-Repositories.
---

# Git-Operationen

Das `git_operations`-Werkzeug bietet PRX-Agenten Versionskontrollfahigkeiten uber eine einheitliche Schnittstelle. Anstatt den Agenten zu zwingen, `git`-Befehle uber das Shell-Werkzeug aufzurufen (das Sandbox-Beschrankungen unterliegt), bietet `git_operations` eine strukturierte, sichere API fur die haufigsten Git-Workflows: Status prufen, Diffs anzeigen, Commits erstellen, Pushen, Pullen, Verlauf anzeigen und Branches verwalten.

Das Werkzeug arbeitet auf dem Workspace-Repository, das typischerweise das Projektverzeichnis ist, in dem der Agent arbeitet. Es ist in der `all_tools()`-Registry registriert und immer verfugbar, wenn der Agent mit dem vollstandigen Werkzeugsatz lauft.

Durch die Bereitstellung von Git als erstklassiges Werkzeug statt als Shell-Befehl kann PRX feingranulare Sicherheitsrichtlinien anwenden, Argumente validieren und strukturierte Ausgaben erzeugen, die das LLM zuverlassig parsen kann.

## Konfiguration

Das `git_operations`-Werkzeug hat keinen eigenen Konfigurationsabschnitt. Sein Verhalten wird durch den Workspace-Pfad und die Sicherheitsrichtlinie gesteuert:

```toml
# Werkzeugrichtlinie fur Git-Operationen
[security.tool_policy.tools]
git_operations = "allow"    # "allow" | "deny" | "supervised"
```

Das Workspace-Repository wird durch das aktuelle Arbeitsverzeichnis der Agenten-Sitzung bestimmt. Wenn der Agent innerhalb eines Git-Repositorys gestartet wird, wird dieses Repository verwendet. Andernfalls gibt das Werkzeug einen Fehler zuruck, der anzeigt, dass kein Repository gefunden wurde.

## Verwendung

Das `git_operations`-Werkzeug akzeptiert einen `operation`-Parameter, der die durchzufuhrende Git-Aktion angibt:

### status

Den aktuellen Repository-Status prufen (gestagete, nicht gestagete, nicht verfolgte Dateien):

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "status"
  }
}
```

Gibt strukturierte Ausgabe zuruck mit:
- Aktuellem Branch-Namen
- Zum Commit vorgemerkten Dateien
- Geanderten aber nicht vorgemerkten Dateien
- Nicht verfolgten Dateien
- Upstream-Tracking-Status

### diff

Anderungen im Arbeitsbaum oder zwischen Commits anzeigen:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["--staged"]
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["HEAD~3..HEAD"]
  }
}
```

### commit

Einen Commit mit einer Nachricht erstellen:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "fix: resolve race condition in session cleanup"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "feat: add web search provider selection",
    "args": ["--all"]
  }
}
```

### push

Commits zum Remote-Repository pushen:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push",
    "args": ["origin", "feature/web-search"]
  }
}
```

### pull

Anderungen vom Remote-Repository pullen:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "pull"
  }
}
```

### log

Commit-Verlauf anzeigen:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "log",
    "args": ["--oneline", "-20"]
  }
}
```

### branch

Branches auflisten, erstellen oder wechseln:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch",
    "args": ["feature/new-tool"]
  }
}
```

## Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `operation` | `string` | Ja | -- | Git-Operation: `"status"`, `"diff"`, `"commit"`, `"push"`, `"pull"`, `"log"`, `"branch"` |
| `message` | `string` | Bedingt | -- | Commit-Nachricht (erforderlich fur `"commit"`-Operation) |
| `args` | `array` | Nein | `[]` | Zusatzliche Argumente, die an den Git-Befehl ubergeben werden |

**Ruckgabe:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | `bool` | `true`, wenn die Git-Operation erfolgreich abgeschlossen wurde |
| `output` | `string` | Git-Befehlsausgabe (Statustext, Diff-Inhalt, Log-Eintrage usw.) |
| `error` | `string?` | Fehlermeldung, wenn die Operation fehlschlug |

## Haufige Workflows

### Feature-Branch-Workflow

Ein typischer agentengesteuerter Feature-Branch-Workflow:

```
1. [git_operations] operation="branch", args=["feature/add-search"]
2. [file_write] neue Dateien schreiben
3. [git_operations] operation="status"  -- Anderungen verifizieren
4. [git_operations] operation="diff"    -- Anderungen uberprufen
5. [git_operations] operation="commit", message="feat: add search functionality", args=["--all"]
6. [git_operations] operation="push", args=["-u", "origin", "feature/add-search"]
```

### Code-Review-Vorbereitung

Anderungen vor dem Commit inspizieren:

```
1. [git_operations] operation="status"
2. [git_operations] operation="diff", args=["--staged"]
3. [git_operations] operation="log", args=["--oneline", "-5"]
4. Agent uberpruft den Diff und schlagt Verbesserungen vor
```

### Konfliktlosung

Merge-Konflikte prufen und losen:

```
1. [git_operations] operation="pull"
2. Bei Konflikten: [git_operations] operation="status"
3. [file_read] konfliktbehaftete Dateien lesen
4. [file_write] Konflikte losen
5. [git_operations] operation="commit", message="merge: resolve conflicts in config.toml"
```

## Sicherheit

### Vergleich mit Shell

Die Verwendung von `git_operations` anstelle von `git` uber das `shell`-Werkzeug bietet mehrere Sicherheitsvorteile:

- **Argumentvalidierung**: Parameter werden vor der Ausfuhrung validiert, was Injektionsangriffe verhindert
- **Strukturierte Ausgabe**: Ergebnisse werden geparst und in einem vorhersehbaren Format zuruckgegeben
- **Keine Shell-Expansion**: Argumente werden direkt an Git ubergeben, ohne Shell-Interpretation
- **Feingranulare Richtlinie**: `git_operations` kann erlaubt werden, wahrend `shell` verweigert oder uberwacht wird

### Schutz vor destruktiven Operationen

Das Werkzeug enthalt Sicherheitsvorkehrungen gegen haufige destruktive Operationen:

- **Force Push**: `--force`- und `--force-with-lease`-Argumente werden mit Warnungen protokolliert
- **Branch-Loschung**: `-D`-Operationen (erzwungene Loschung) werden im Audit-Protokoll markiert
- **Reset-Operationen**: Harte Resets werden nicht direkt uber das Werkzeug bereitgestellt

Fur maximale Sicherheit markieren Sie `git_operations` als uberwacht:

```toml
[security.tool_policy.tools]
git_operations = "supervised"
```

### Anmeldedaten-Behandlung

Das `git_operations`-Werkzeug verwendet den Anmeldedatenspeicher des Systems (Credential-Helper, SSH-Schlussel usw.). Es exponiert oder protokolliert keine Anmeldedaten. Remote-Operationen (Push, Pull) verlassen sich auf die vorkonfigurierten Git-Anmeldedaten auf dem Host.

### Audit-Protokollierung

Alle Git-Operationen werden im Audit-Protokoll aufgezeichnet, wenn aktiviert:

- Operationstyp (Status, Commit, Push usw.)
- Argumente
- Erfolgs-/Fehlerstatus
- Commit-SHA (fur Commit-Operationen)

## Verwandte Seiten

- [Shell-Ausfuhrung](/de/prx/tools/shell) -- Alternative fur fortgeschrittene Git-Befehle
- [Dateioperationen](/de/prx/tools/file-operations) -- Dateien im Repository lesen/schreiben
- [Sitzungen & Agenten](/de/prx/tools/sessions) -- Git-Aufgaben an spezialisierte Agenten delegieren
- [Richtlinien-Engine](/de/prx/security/policy-engine) -- Zugriffskontrolle fur Git-Operationen
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
