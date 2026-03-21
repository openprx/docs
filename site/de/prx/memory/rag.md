---
title: Retrieval-Augmented Generation (RAG)
description: Wie PRX Embeddings und Gedachtnissuche nutzt, um relevanten Kontext in LLM-Prompts vor der Generierung einzufugen.
---

# Retrieval-Augmented Generation (RAG)

PRX implementiert Retrieval-Augmented Generation (RAG), um LLM-Antworten mit relevantem Kontext aus dem Gedachtnis und den Wissensquellen des Agenten zu verbessern. Anstatt sich ausschliesslich auf das parametrische Wissen des LLM zu verlassen, ruft RAG relevante Dokumente ab und fugt sie in den Prompt ein -- reduziert Halluzinationen und verankert Antworten in faktischen, aktuellen Informationen.

## Ubersicht

Die RAG-Pipeline lauft vor jedem LLM-Aufruf in der Agentenschleife:

```
Benutzernachricht
    │
    ▼
┌──────────────────────────┐
│  1. Abfrageformulierung   │  Suchbegriffe aus der
│                           │  Benutzernachricht + Gesprachskontext extrahieren
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  2. Embedding-Generierung │  Abfrage in einen Vektor umwandeln
│                           │  mit dem konfigurierten Embedding-Anbieter
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  3. Gedachtnissuche       │  Uber Gedachtnis-Backends suchen:
│                           │  Vektor-Ahnlichkeit + Volltext
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  4. Relevanzfilterung     │  Ergebnisse bewerten und uber dem
│                           │  Relevanzschwellenwert filtern
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  5. Kontext-Einfugung     │  Ergebnisse formatieren und in den
│                           │  System-Prompt / Kontextfenster einfugen
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  6. LLM-Generierung       │  Modell generiert Antwort mit
│                           │  vollstandigem Kontext verfugbar
└──────────────────────────┘
```

## Konfiguration

RAG in `config.toml` aktivieren:

```toml
[memory]
backend = "embeddings"  # RAG erfordert das Embeddings-Backend

[memory.embeddings]
# Embedding-Anbieter: "openai" | "ollama" | "local"
provider = "openai"
model = "text-embedding-3-small"
dimensions = 1536

# Vektorspeicher-Backend
vector_store = "sqlite"  # "sqlite" | "postgres" | "qdrant"

[rag]
enabled = true

# Maximale Anzahl abgerufener Chunks, die in den Kontext eingefugt werden.
max_results = 10

# Minimaler Relevanzscore (0,0 bis 1,0), damit ein Chunk einbezogen wird.
relevance_threshold = 0.3

# Maximale Token-Anzahl fur RAG-Kontext.
# Verhindert Kontextfenster-Uberlauf.
max_context_tokens = 4000

# Strategie zur Auswahl der einzubeziehenden Chunks, wenn
# max_context_tokens uberschritten wurde.
# "top_k" -- hochste Relevanzscores zuerst
# "mmr" -- maximale marginale Relevanz (Vielfalt + Relevanz)
selection_strategy = "top_k"
```

### Embedding-Anbieter

PRX unterstutzt mehrere Embedding-Anbieter:

| Anbieter | Modell | Dimensionen | Hinweise |
|----------|--------|-----------|---------|
| OpenAI | text-embedding-3-small | 1536 | Bestes Qualitat/Kosten-Verhaltnis |
| OpenAI | text-embedding-3-large | 3072 | Hochste Qualitat |
| Ollama | nomic-embed-text | 768 | Lokal, keine API-Kosten |
| Ollama | mxbai-embed-large | 1024 | Lokal, hohere Qualitat |
| Local | fastembed | 384 | Integriert, kein Netzwerk |

Embedding-Anbieter konfigurieren:

```toml
# OpenAI-Embeddings
[memory.embeddings]
provider = "openai"
model = "text-embedding-3-small"
api_key = "${OPENAI_API_KEY}"

# Ollama-Embeddings (lokal)
[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
endpoint = "http://localhost:11434"

# Eingebaute lokale Embeddings (kein externer Dienst)
[memory.embeddings]
provider = "local"
model = "fastembed"
```

## Chunking-Strategien

Bevor Dokumente eingebettet und durchsucht werden konnen, mussen sie in Chunks aufgeteilt werden. PRX unterstutzt mehrere Chunking-Strategien:

| Strategie | Beschreibung | Geeignet fur |
|-----------|-------------|-------------|
| `fixed_size` | An festen Token-Zahlen mit Uberlappung aufteilen | Einheitliche Dokumente |
| `sentence` | An Satzgrenzen aufteilen | Prosa und naturlicher Text |
| `paragraph` | An Absatzgrenzen aufteilen | Strukturierte Dokumente |
| `semantic` | An Themengrenzen mittels Embeddings aufteilen | Lange, vielfaltige Dokumente |
| `recursive` | Hierarchische Aufteilung (Uberschrift > Absatz > Satz) | Markdown/Code |

```toml
[rag.chunking]
strategy = "recursive"

# Ziel-Chunk-Grosse in Tokens.
chunk_size = 512

# Uberlappung zwischen benachbarten Chunks (verhindert Kontextverlust an Grenzen).
chunk_overlap = 64

# Fur rekursive Strategie: Trennzeichen in Prioritatsreihenfolge.
separators = ["\n## ", "\n### ", "\n\n", "\n", ". "]
```

## Abruf-Pipeline

### Schritte 1-3: Abfrage, Einbettung, Suche

Das RAG-Modul extrahiert eine Suchabfrage aus der neuesten Nachricht des Benutzers (optional uber LLM mit `query_reformulation = true` umformuliert), wandelt sie mit dem Embedding-Anbieter in einen Vektor um und durchsucht alle Gedachtnis-Backends gleichzeitig -- Vektor-Ahnlichkeit (Kosinus) und Volltextsuche (FTS5/pg_trgm). Ergebnisse werden zusammengefuhrt und dedupliziert.

### Schritt 4: Relevanzfilterung

Jedes Ergebnis erhalt einen Relevanzscore zwischen 0,0 und 1,0. Ergebnisse unter `relevance_threshold` werden verworfen. Die Bewertung berucksichtigt:

- Vektor-Kosinus-Ahnlichkeit (primares Signal)
- Volltext-Treffer-Score (Boost-Faktor)
- Aktualitat (neuere Erinnerungen erhalten einen leichten Boost)
- Quellenprioritat (Kern-Erinnerungen werden hoher als Gesprache gerankt)

### Schritt 5: Kontext-Einfugung

Gefilterte Ergebnisse werden mit strukturierten XML-Tags (`<context><memory source="..." relevance="...">`) formatiert und in den LLM-Prompt eingefugt. Der gesamte eingefugte Kontext ist auf `max_context_tokens` begrenzt, um Kontextfenster-Uberlauf zu verhindern.

## Auswahlstrategien

### Top-K

Die Standardstrategie. Wahlt die K hochstbewerteten Chunks, die in `max_context_tokens` passen. Einfach und vorhersagbar, kann aber redundante Ergebnisse liefern, wenn mehrere Chunks dasselbe Thema abdecken.

### Maximale Marginale Relevanz (MMR)

MMR balanciert Relevanz mit Vielfalt. Es wahlt iterativ Chunks, die sowohl relevant fur die Abfrage als auch verschieden von bereits ausgewahlten Chunks sind:

```toml
[rag]
selection_strategy = "mmr"

# Lambda steuert den Relevanz-Vielfalt-Kompromiss.
# 1,0 = reine Relevanz (wie top_k)
# 0,0 = reine Vielfalt
mmr_lambda = 0.7
```

MMR wird empfohlen, wenn die Wissensbasis uberlappende oder redundante Informationen enthalt.

## Dokumente indizieren

### Automatische Indizierung

Uber das `memory_store`-Werkzeug gespeicherte Erinnerungen werden automatisch eingebettet und indiziert. Keine zusatzliche Konfiguration ist erforderlich.

### Manuelle Dokumenten-Aufnahme

Fur Massen-Dokumentenaufnahme verwenden Sie die CLI:

```bash
# Eine einzelne Datei oder ein Verzeichnis indizieren
prx rag index /path/to/document.md
prx rag index /path/to/docs/ --recursive

# Alle Dokumente neu indizieren (Embeddings neu erstellen)
prx rag reindex
```

Unterstutzte Formate: Markdown (`.md`), Klartext (`.txt`), PDF (`.pdf`), HTML (`.html`) und Quellcode (`.rs`, `.py`, `.js`).

## Leistungstuning

| Parameter | Empfehlung |
|-----------|-----------|
| `chunk_size` | 256-512 Tokens fur Q&A, 512-1024 fur Zusammenfassung |
| `chunk_overlap` | 10-20% der chunk_size |
| `max_results` | 5-15 fur die meisten Anwendungsfalle |
| `relevance_threshold` | 0,3-0,5 (nach Qualitat abstimmen) |

## Sicherheitshinweise

- RAG-Kontext wird in den LLM-Prompt eingefugt. Stellen Sie sicher, dass gespeicherte Dokumente keine sensiblen Daten enthalten, es sei denn, der Agent ist zum Zugriff autorisiert.
- Wenn `memory.acl_enabled = true`, respektiert RAG Zugriffskontrolllisten. Nur Erinnerungen, auf die der aktuelle Prinzipal zugreifen kann, werden abgerufen.
- Embedding-API-Aufrufe ubertragen Dokumenteninhalte an den Embedding-Anbieter. Fur sensible Daten verwenden Sie einen lokalen Embedding-Anbieter (`ollama` oder `local`).

## Verwandte Seiten

- [Gedachtnissystem](/de/prx/memory/)
- [Embeddings](/de/prx/memory/embeddings)
- [Vektorsuche](/de/prx/memory/vector-search)
- [SQLite-Backend](/de/prx/memory/sqlite)
- [PostgreSQL-Backend](/de/prx/memory/postgres)
