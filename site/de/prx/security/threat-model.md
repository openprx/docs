---
title: Bedrohungsmodell
description: PRX-Bedrohungsmodell fur feindliche Eingaben, Prompt-Injection, Werkzeugmissbrauch und Datenexfiltration.
---

# Bedrohungsmodell

Diese Seite dokumentiert das PRX-Bedrohungsmodell -- die Menge der berucksichtigten Bedrohungen, unsere Sicherheitsannahmen und die vorhandenen Gegenmassnahmen.

## Bedrohungskategorien

### 1. Prompt-Injection

**Bedrohung**: Feindliche Inhalte in Benutzereingaben oder abgerufenen Daten manipulieren den Agenten dazu, unbeabsichtigte Aktionen auszufuhren.

**Gegenmassnahmen**:
- Werkzeugaufruf-Genehmigungs-Workflow
- Richtlinien-Engine beschrankt verfugbare Aktionen
- Eingabebereinigung fur bekannte Injektionsmuster

### 2. Werkzeugmissbrauch

**Bedrohung**: Der Agent verwendet Werkzeuge auf unbeabsichtigte Weise (z.B. Lesen sensibler Dateien, unautorisierte Netzwerkanfragen).

**Gegenmassnahmen**:
- Sandbox-Isolation fur Werkzeugausfuhrung
- Richtlinien-Engine mit standardmassigem Verweigern
- Pro-Werkzeug-Ratenlimitierung
- Audit-Protokollierung aller Werkzeugaufrufe

### 3. Datenexfiltration

**Bedrohung**: Sensible Daten aus dem lokalen System werden uber LLM-Kontext oder Werkzeugaufrufe an externe Dienste gesendet.

**Gegenmassnahmen**:
- Netzwerk-Allowlisting in der Sandbox
- Inhaltsfilterung fur sensible Muster (API-Schlussel, Passworter)
- Richtlinienregeln zur Beschrankung des Datenflusses

### 4. Lieferkette

**Bedrohung**: Bosartige Plugins oder Abhangigkeiten kompromittieren den Agenten.

**Gegenmassnahmen**:
- WASM-Sandbox fur Plugins
- Plugin-Berechtigungsmanifeste
- Abhangigkeitsprufung (cargo audit)

## Sicherheitsannahmen

- Das Host-Betriebssystem ist vertrauenswurdig
- LLM-Anbieter gehen sicher mit API-Schlusseln um
- Der Benutzer ist verantwortlich fur die Uberprufung von Agentenaktionen, wenn eine Genehmigung erforderlich ist

## Schwachstellen melden

Wenn Sie eine Sicherheitslucke entdecken, melden Sie diese bitte an `security@openprx.dev`.

## Verwandte Seiten

- [Sicherheitsubersicht](./)
- [Richtlinien-Engine](./policy-engine)
- [Sandbox](./sandbox)
