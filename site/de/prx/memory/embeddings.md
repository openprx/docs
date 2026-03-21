---
title: Embeddings-Gedachtnis-Backend
description: Vektorbasiertes semantisches Gedachtnis mit Embeddings fur RAG-Abruf.
---

# Embeddings-Gedachtnis-Backend

Das Embeddings-Backend speichert Erinnerungen als Vektor-Embeddings und ermoglicht semantische Ahnlichkeitssuche. Dies ist der leistungsstarkste Abrufmechanismus, der es Agenten ermoglicht, kontextuell relevante Erinnerungen zu finden, auch wenn exakte Schlusselworter nicht ubereinstimmen.

## Ubersicht

Das Embeddings-Backend:

- Wandelt Gedachtnis-Text in dichte Vektorreprasentationen um
- Speichert Vektoren in einer lokalen oder entfernten Vektordatenbank
- Ruft Erinnerungen uber Kosinus-Ahnlichkeit zur aktuellen Abfrage ab
- Unterstutzt mehrere Embedding-Anbieter (Ollama, OpenAI usw.)

## Funktionsweise

1. Wenn eine Erinnerung gespeichert wird, wird ihr Text an ein Embedding-Modell gesendet
2. Der resultierende Vektor wird zusammen mit dem Originaltext gespeichert
3. Beim Abruf wird der aktuelle Kontext eingebettet und mit gespeicherten Vektoren verglichen
4. Die Top-K ahnlichsten Erinnerungen werden zuruckgegeben

## Konfiguration

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
top_k = 10
similarity_threshold = 0.5

[memory.embeddings.store]
type = "sqlite-vec"  # oder "pgvector"
path = "~/.local/share/openprx/embeddings.db"
```

## Unterstutzte Embedding-Anbieter

| Anbieter | Modell | Dimensionen |
|----------|--------|-----------|
| Ollama | nomic-embed-text | 768 |
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |

## Verwandte Seiten

- [Gedachtnissystem-Ubersicht](./)
- [SQLite-Backend](./sqlite)
- [Gedachtnis-Hygiene](./hygiene)
