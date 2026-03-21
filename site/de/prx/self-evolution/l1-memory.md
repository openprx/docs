---
title: "L1: Gedachtnis-Evolution"
description: Schicht-1-Selbstevolution in PRX fur Gedachtnis-Komprimierung und Themen-Clustering.
---

# L1: Gedachtnis-Evolution

Schicht 1 ist die haufigste und risikoarmste Selbstevolutions-Schicht. Sie operiert auf dem Gedachtnissystem des Agenten und komprimiert automatisch redundante Eintrage und clustert verwandte Erinnerungen nach Themen.

## Ubersicht

L1-Evolution lauft nach jeder Sitzung (oder nach einem konfigurierbaren Zeitplan) und fuhrt Folgendes durch:

- **Komprimierung** -- mehrere verwandte Gedachtnis-Eintrage zu kompakten Zusammenfassungen zusammenfuhren
- **Themen-Clustering** -- Erinnerungen nach semantischer Ahnlichkeit gruppieren
- **Relevanz-Bewertung** -- Gedachtnis-Gewichte basierend auf der Zugriffshaufigkeit anpassen
- **Bereinigung** -- Erinnerungen entfernen, die veraltet oder widerspruchlich geworden sind

## Funktionsweise

1. Nach Beendigung einer Sitzung analysiert L1 die neu gespeicherten Erinnerungen
2. Es identifiziert Cluster verwandter Eintrage mittels Embedding-Ahnlichkeit
3. Cluster, die einen Grossenschwellenwert uberschreiten, werden zu Zusammenfassungen komprimiert
4. Gedachtnis-Relevanz-Scores werden basierend auf der Abrufhaufigkeit aktualisiert

## Konfiguration

```toml
[self_evolution.l1]
enabled = true
schedule = "after_session"  # oder "hourly", "daily"
compaction_threshold = 10
cluster_similarity = 0.8
min_access_count = 2
```

## Verwandte Seiten

- [Selbstevolutions-Ubersicht](./)
- [Gedachtnis-Hygiene](/de/prx/memory/hygiene)
- [L2: Prompt-Optimierung](./l2-prompt)
