---
title: Richtlinien-Engine
description: Deklarative Sicherheitsrichtlinien-Engine zur Steuerung des Agenten-Werkzeugzugriffs und Datenflusses in PRX.
---

# Richtlinien-Engine

Die Richtlinien-Engine ist ein deklaratives Regelsystem, das kontrolliert, welche Werkzeuge ein Agent verwenden kann, auf welche Dateien er zugreifen kann und welche Netzwerkanfragen er stellen kann. Richtlinien werden vor jedem Werkzeugaufruf evaluiert.

## Ubersicht

Richtlinien werden als Regeln mit Bedingungen und Aktionen definiert:

- **Erlauben-Regeln** -- bestimmte Operationen explizit erlauben
- **Verweigern-Regeln** -- bestimmte Operationen explizit blockieren
- **Standardaktion** -- wird angewendet, wenn keine Regel zutrifft (standardmassig Verweigern)

## Richtlinienformat

```toml
[security.policy]
default_action = "deny"

[[security.policy.rules]]
name = "allow-read-workspace"
action = "allow"
tools = ["fs_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-dirs"
action = "deny"
tools = ["fs_read", "fs_write"]
paths = ["/etc/**", "/root/**", "**/.ssh/**"]

[[security.policy.rules]]
name = "allow-http-approved-domains"
action = "allow"
tools = ["http_request"]
domains = ["api.github.com", "api.openai.com"]
```

## Regelauswertung

Regeln werden der Reihe nach ausgewertet. Die erste zutreffende Regel bestimmt die Aktion. Wenn keine Regel zutrifft, wird die Standardaktion angewendet.

## Eingebaute Richtlinien

PRX wird mit sinnvollen Standardrichtlinien ausgeliefert, die:

- Zugriff auf Systemverzeichnisse und sensible Dateien blockieren
- Explizite Genehmigung fur destruktive Operationen erfordern
- Netzwerkanfragen ratenlimitieren
- Alle Werkzeugausfuhrungen fur Audit protokollieren

## Verwandte Seiten

- [Sicherheitsubersicht](./)
- [Sandbox](./sandbox)
- [Bedrohungsmodell](./threat-model)
