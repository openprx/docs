---
title: Lucid.so-Gedachtnis-Backend
description: Cloud-basierte KI-gestutzte Gedachtnisschicht uber den externen Lucid.so-Dienst.
---

# Lucid.so-Gedachtnis-Backend

Das Lucid-Backend verbindet PRX mit [Lucid.so](https://lucid.so), einem KI-gestutzten Gedachtnisdienst, der verwaltete Speicherung, semantische Suche und automatische Gedachtnis-Organisation bietet. Es dient als Alternative zu den lokalen SQLite- und PostgreSQL-Backends fur Teams, die eine gehostete Losung bevorzugen.

## Ubersicht

Lucid.so ist eine cloud-gehostete Gedachtnisplattform fur KI-Agenten. Sie handhabt:

- Persistente Gedachtnisspeicherung mit automatischer Deduplizierung
- Semantische Suche unterstutzt durch gehostete Embedding-Modelle
- Automatisches Themen-Clustering und Gedachtnis-Organisation
- Sitzungsubergreifende Gedachtnisfreigabe uber mehrere Agenteninstanzen
- Gedachtnis-Lebenszyklusverwaltung mit konfigurierbaren Aufbewahrungsrichtlinien

Im Gegensatz zu den lokalen Backends (SQLite, PostgreSQL) erfordert Lucid keine Datenbankverwaltung. Erinnerungen werden in Lucids Infrastruktur gespeichert und uber ihre REST-API abgerufen.

## Wann Lucid verwenden

| Szenario | Empfohlenes Backend |
|----------|-------------------|
| Einzelbenutzer-lokaler Agent | SQLite |
| Multi-User-On-Premise-Bereitstellung | PostgreSQL |
| Cloud-first-Team, minimaler Ops-Aufwand | **Lucid** |
| Geratelubergreifende Gedachtnisfreigabe | **Lucid** |
| Air-Gap- oder Offline-Umgebungen | SQLite oder PostgreSQL |
| Volle Kontrolle uber Datenresidenz | SQLite oder PostgreSQL |

## Voraussetzungen

- Ein Lucid.so-Konto (Registrierung unter [lucid.so](https://lucid.so))
- Ein API-Schlussel vom Lucid-Dashboard
- Eine Workspace-ID (wird automatisch bei der ersten Nutzung erstellt oder geben Sie eine bestehende an)

## Schnelleinrichtung

### 1. API-Anmeldedaten erhalten

1. Melden Sie sich beim [Lucid Dashboard](https://app.lucid.so) an
2. Navigieren Sie zu "Settings" dann "API Keys"
3. Erstellen Sie einen neuen API-Schlussel mit "Memory Read/Write"-Berechtigungen
4. Kopieren Sie den API-Schlussel und Ihre Workspace-ID

### 2. Konfigurieren

```toml
[memory]
backend = "lucid"

[memory.lucid]
api_key = "luc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
workspace_id = "ws_abc123"
```

### 3. Verifizieren

```bash
prx doctor memory
```

Dies testet die Konnektivitat zur Lucid-API und verifiziert, dass der API-Schlussel die erforderlichen Berechtigungen hat.

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_key` | `String` | *erforderlich* | Lucid.so-API-Schlussel mit Memory-Read/Write-Berechtigungen |
| `workspace_id` | `String` | *automatisch erstellt* | Workspace-ID fur Gedachtnis-Isolation. Weglassen fur automatische Erstellung bei erster Nutzung |
| `base_url` | `String` | `"https://api.lucid.so/v1"` | Lucid-API-Basis-URL. Uberschreiben fur selbstgehostete oder regionale Endpunkte |
| `timeout_secs` | `u64` | `30` | HTTP-Anfrage-Timeout in Sekunden |
| `max_retries` | `u32` | `3` | Maximale Wiederholungsversuche fur vorubergehende Fehler |
| `retry_backoff_ms` | `u64` | `500` | Initiale Backoff-Verzogerung zwischen Wiederholungen (exponentiell) |
| `batch_size` | `usize` | `50` | Anzahl der Erinnerungen pro Batch-Schreibanfrage |
| `top_k` | `usize` | `10` | Standardanzahl der zuruckzugebenden Ergebnisse fur Abrufabfragen |
| `similarity_threshold` | `f64` | `0.5` | Minimaler Ahnlichkeitsscore (0,0--1,0) fur Abrufergebnisse |
| `auto_topics` | `bool` | `true` | Lucids automatisches Themen-Clustering aktivieren |
| `retention_days` | `u64` | `0` | Erinnerungen automatisch loschen, die alter als N Tage sind. 0 = dauerhaft behalten |

## Funktionsweise

### Gedachtnis-Speicherung

Wenn der Agent eine Erinnerung speichert, sendet PRX diese an die Lucid-API:

1. Der Gedachtnis-Text und die Metadaten werden als POST-Anfrage an `/memories` gesendet
2. Lucid bettet den Text mit seinem gehosteten Embedding-Modell ein
3. Die Erinnerung wird sowohl fur Schlusselwort- als auch semantische Suche indiziert
4. Wenn `auto_topics` aktiviert ist, weist Lucid automatisch Themenbezeichnungen zu

### Gedachtnis-Abruf

Wenn der Agent Kontext benotigt, fragt PRX Lucid ab:

1. Der aktuelle Gesprachskontext wird als Abrufabfrage gesendet
2. Lucid fuhrt eine hybride Suche durch (semantische Ahnlichkeit + Schlusselwortabgleich)
3. Ergebnisse werden nach Relevanz gerankt und nach `similarity_threshold` gefiltert
4. Die Top-K-Ergebnisse werden mit ihrem Text, Metadaten und Relevanzscores zuruckgegeben

### Gedachtnis-Organisation

Lucid bietet serverseitige Gedachtnisverwaltung:

- **Deduplizierung** -- nahezu doppelte Erinnerungen werden automatisch zusammengefuhrt
- **Themen-Clustering** -- Erinnerungen werden ohne manuelle Kategorisierung in Themen gruppiert
- **Komprimierung** -- alte oder wenig relevante Erinnerungen konnen zusammengefasst und konsolidiert werden
- **Aufbewahrung** -- abgelaufene Erinnerungen werden gemass `retention_days` geloscht

## Vergleich mit lokalen Backends

| Funktion | SQLite | PostgreSQL | Lucid |
|----------|--------|-----------|-------|
| Einrichtungskomplexitat | Keine | Moderat | Minimal (API-Schlussel) |
| Datenresidenz | Lokal | Selbstgehostet | Cloud (Lucid-Server) |
| Semantische Suche | Uber Embeddings-Add-on | Uber pgvector-Add-on | Eingebaut |
| Auto-Deduplizierung | Nein | Nein | Ja |
| Auto-Themen-Clustering | Nein | Nein | Ja |
| Geratelubergreifende Freigabe | Nein | Ja (Netzwerk) | Ja (Cloud) |
| Offline-Betrieb | Ja | Ja | Nein |
| Kosten | Kostenlos | Kostenlos (selbstgehostet) | Kostenloses Kontingent + kostenpflichtige Plane |
| Skalierbarkeit | ~100K Erinnerungen | Millionen | Millionen (verwaltet) |

## Umgebungsvariablen

Fur CI/CD- oder containerisierte Bereitstellungen konnen Anmeldedaten uber Umgebungsvariablen gesetzt werden:

```bash
export PRX_MEMORY_LUCID_API_KEY="luc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export PRX_MEMORY_LUCID_WORKSPACE_ID="ws_abc123"
```

Umgebungsvariablen haben Vorrang vor Konfigurationsdatei-Werten.

## Fehlerbehandlung

Das Lucid-Backend behandelt vorubergehende Fehler elegant:

- **Netzwerkausfalle** -- werden bis zu `max_retries`-mal mit exponentiellem Backoff wiederholt
- **Ratenlimitierung** -- 429-Antworten losen automatisches Backoff uber den `Retry-After`-Header aus
- **Authentifizierungsfehler** -- werden als Fehler protokolliert; der Agent arbeitet ohne Gedachtnis weiter, anstatt abzusturzen
- **Timeout** -- Anfragen, die `timeout_secs` uberschreiten, werden abgebrochen und wiederholt

Wenn Lucid nicht erreichbar ist, degradiert PRX elegant: Der Agent arbeitet ohne Gedachtnis-Abruf, bis die Konnektivitat wiederhergestellt ist. Keine Erinnerungen gehen verloren -- ausstehende Schreibvorgange werden in die Warteschlange gestellt und geleert, wenn die Verbindung wiederhergestellt wird.

## Einschrankungen

- Erfordert Internetverbindung; nicht geeignet fur Air-Gap-Umgebungen
- Gedachtnisdaten werden auf Lucids Infrastruktur gespeichert; uberprufen Sie deren Datenverarbeitungsvereinbarung fur Compliance
- Das kostenlose Kontingent hat Speicher- und Abfragelimits (aktuelle Details auf Lucids Preisseite)
- Die Latenz ist hoher als bei lokalen Backends aufgrund von Netzwerk-Roundtrips (typischerweise 50--200ms pro Abfrage)
- Selbstgehostete Lucid-Bereitstellungen erfordern eine separate Lizenz

## Fehlerbehebung

### "Authentication failed"-Fehler

- Uberprufen Sie, ob der API-Schlussel korrekt ist und nicht im Lucid-Dashboard widerrufen wurde
- Stellen Sie sicher, dass der API-Schlussel "Memory Read/Write"-Berechtigungen hat
- Uberprufen Sie, ob die `base_url` auf den korrekten Lucid-Endpunkt zeigt

### Gedachtnis-Abruf gibt keine Ergebnisse zuruck

- Uberprufen Sie, ob Erinnerungen gespeichert wurden, indem Sie das Lucid-Dashboard prufen
- Senken Sie den `similarity_threshold` (z.B. auf `0.3`), um zu sehen, ob Ergebnisse gefiltert werden
- Uberprufen Sie, ob die `workspace_id` mit dem Workspace ubereinstimmt, in dem Erinnerungen gespeichert wurden

### Hohe Latenz bei Abrufabfragen

- Reduzieren Sie `top_k`, um weniger Ergebnisse pro Abfrage zuruckzugeben
- Uberprufen Sie Ihre Netzwerklatenz zum Lucid-API-Endpunkt
- Erwagen Sie die Verwendung einer regionalen `base_url`, wenn Lucid Endpunkte naher an Ihrer Bereitstellung anbietet

### Erinnerungen bleiben nicht uber Sitzungen erhalten

- Bestatigen Sie, dass `backend = "lucid"` im `[memory]`-Abschnitt gesetzt ist
- Uberprufen Sie, ob die `workspace_id` uber alle Agenteninstanzen konsistent ist
- Prufen Sie PRX-Protokolle auf Schreibfehler, die auf fehlgeschlagene Persistierung hindeuten konnen

## Verwandte Seiten

- [Gedachtnissystem-Ubersicht](./)
- [SQLite-Backend](./sqlite) -- lokale Einzeldatei-Alternative
- [PostgreSQL-Backend](./postgres) -- selbstgehostete Multi-User-Alternative
- [Embeddings-Backend](./embeddings) -- lokales vektorbasiertes semantisches Gedachtnis
- [Gedachtnis-Hygiene](./hygiene) -- Komprimierungs- und Bereinigungsstrategien
