---
title: PostgreSQL-Gedachtnis-Backend
description: Remote-Datenbank-Gedachtnisspeicherung mit PostgreSQL fur Multi-User-Server-Bereitstellungen.
---

# PostgreSQL-Gedachtnis-Backend

Das PostgreSQL-Backend speichert Erinnerungen in einer Remote-PostgreSQL-Datenbank und ermoglicht gemeinsames Gedachtnis uber mehrere Benutzer und Agenteninstanzen hinweg. Dies ist das empfohlene Backend fur Server-Bereitstellungen.

## Ubersicht

Das PostgreSQL-Backend bietet:

- Gemeinsames Gedachtnis uber mehrere PRX-Instanzen
- Volltextsuche uber `tsvector` und `pg_trgm`
- Sicherheit auf Zeilenebene fur Multi-Tenant-Isolation
- Horizontale Skalierbarkeit fur grosse Bereitstellungen

## Konfiguration

```toml
[memory]
backend = "postgres"

[memory.postgres]
url = "postgresql://prx:password@localhost:5432/prx_memory"
max_connections = 5
schema = "memory"
```

## Multi-User-Isolation

Wenn mehrere Benutzer ein PostgreSQL-Gedachtnis-Backend teilen, sind die Erinnerungen jedes Benutzers nach Benutzer-ID isoliert. Das Backend verwendet parametrisierte Abfragen fur alle Operationen, um SQL-Injection zu verhindern.

## Migration

Das PostgreSQL-Backend enthalt automatische Schema-Migrationen, die beim Start ausgefuhrt werden. Keine manuellen Migrationsschritte sind erforderlich.

## Verwandte Seiten

- [Gedachtnissystem-Ubersicht](./)
- [SQLite-Backend](./sqlite) -- fur lokale Bereitstellungen
- [Gedachtnis-Hygiene](./hygiene)
