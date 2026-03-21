---
title: Markdown-Gedachtnis-Backend
description: Dateibasierte Gedachtnisspeicherung mit Markdown-Dateien, ideal fur Versionskontrolle und Einzelbenutzer-Setups.
---

# Markdown-Gedachtnis-Backend

Das Markdown-Backend speichert Erinnerungen als strukturierte Markdown-Dateien auf der Festplatte. Dies ist das einfachste Backend und funktioniert gut fur Einzelbenutzer-CLI-Setups, bei denen Erinnerungen menschenlesbar und versionskontrollierbar sein sollen.

## Ubersicht

Erinnerungen werden als Markdown-Dateien in einem konfigurierbaren Verzeichnis organisiert. Jeder Gedachtnis-Eintrag ist ein Abschnitt innerhalb einer Datei, gruppiert nach Thema oder Datum. Das Format ist sowohl maschinenlesbar als auch menschenlesbar.

## Dateistruktur

```
~/.local/share/openprx/memory/
  ├── facts.md          # Extrahierte Schlusselfakten
  ├── preferences.md    # Benutzerpraferenzen
  ├── projects/
  │   ├── project-a.md  # Projektspezifische Erinnerungen
  │   └── project-b.md
  └── archive/
      └── 2026-02.md    # Archivierte altere Erinnerungen
```

## Konfiguration

```toml
[memory]
backend = "markdown"

[memory.markdown]
directory = "~/.local/share/openprx/memory"
max_file_size_kb = 512
auto_archive_days = 30
```

## Suche

Das Markdown-Backend verwendet einfaches Volltext-Grep fur den Abruf. Obwohl nicht so ausgefeilt wie die semantische Suche, ist es schnell und erfordert keine zusatzlichen Abhangigkeiten.

## Einschrankungen

- Keine semantische Ahnlichkeitssuche
- Linearer Scan fur den Abruf (langsamer mit grossen Gedachtnisspeichern)
- Gleichzeitiger Schreibzugriff ist ohne Dateisperrung nicht sicher

## Verwandte Seiten

- [Gedachtnissystem-Ubersicht](./)
- [SQLite-Backend](./sqlite) -- fur strukturiertere Speicherung
- [Gedachtnis-Hygiene](./hygiene)
