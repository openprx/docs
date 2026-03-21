---
title: Vektorsuche & Textverarbeitung
description: Embedding-basierte Vektorsuche, Text-Chunking-Strategien, Themenextraktion und Inhaltsfilterung im PRX-Gedachtnis.
---

# Vektorsuche & Textverarbeitung

PRX enthalt eine Textverarbeitungs-Pipeline, die den semantischen Gedachtnis-Abruf antreibt. Diese Pipeline handhabt Text-Chunking, Vektor-Embedding, Themenextraktion und Inhaltsfilterung -- und verwandelt rohen Gesprachstext in durchsuchbare, organisierte Gedachtnis-Eintrage.

## Architektur

Die Textverarbeitungs-Pipeline besteht aus vier Stufen, die jeweils unabhangig konfigurierbar sind:

```
Rohtext
  │
  ▼
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│ Chunker  │───►│ Embedder  │───►│  Themen-  │───►│  Filter  │
│          │    │           │    │ Extraktor │    │          │
└──────────┘    └───────────┘    └───────────┘    └──────────┘
  Text in         Jeden Chunk     Nach Thema       Entscheiden ob
  Chunks teilen   vektorisieren   klassifizieren   speichernswert
```

## Vektorsuche

Die Vektorsuche ermoglicht semantischen Ahnlichkeitsabruf -- Erinnerungen finden, die konzeptuell mit einer Abfrage zusammenhangen, auch wenn die genauen Worter unterschiedlich sind.

### Funktionsweise

1. **Indizierung** -- jeder Gedachtnis-Chunk wird in einen dichten Vektor eingebettet (z.B. 768 Dimensionen)
2. **Speicherung** -- Vektoren werden in einem Vektorindex gespeichert (sqlite-vec, pgvector oder In-Memory)
3. **Abfrage** -- die Suchabfrage wird mit demselben Modell eingebettet
4. **Abruf** -- der Index gibt die Top-K-Vektoren nach Kosinus-Ahnlichkeit zuruck
5. **Neurangierung** -- optional werden Ergebnisse mit einem Cross-Encoder fur hohere Prazision neu gerankt

### Konfiguration

```toml
[memory.vector]
enabled = true
index_type = "sqlite-vec"       # "sqlite-vec", "pgvector" oder "memory"
similarity_metric = "cosine"    # "cosine", "dot_product" oder "euclidean"
top_k = 10
similarity_threshold = 0.5
rerank = false
rerank_model = "cross-encoder/ms-marco-MiniLM-L-6-v2"
```

### Indextypen

| Indextyp | Speicherung | Persistenz | Geeignet fur |
|---------|-----------|-----------|-------------|
| `sqlite-vec` | Lokale Datei | Ja | Einzelbenutzer, lokale Bereitstellungen |
| `pgvector` | PostgreSQL | Ja | Multi-User, Produktionsbereitstellungen |
| `memory` | Im Prozess | Nein (nur Sitzung) | Tests und ephemere Sitzungen |

### Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Vektorsuche aktivieren oder deaktivieren |
| `index_type` | `String` | `"sqlite-vec"` | Vektorindex-Backend |
| `similarity_metric` | `String` | `"cosine"` | Distanzmetrik fur Ahnlichkeitsvergleich |
| `top_k` | `usize` | `10` | Anzahl der Ergebnisse pro Abfrage |
| `similarity_threshold` | `f64` | `0.5` | Minimaler Ahnlichkeitsscore (0,0--1,0) fur Ergebnis-Einbeziehung |
| `rerank` | `bool` | `false` | Cross-Encoder-Neurangierung fur verbesserte Prazision aktivieren |
| `rerank_model` | `String` | `""` | Cross-Encoder-Modellname (nur verwendet wenn `rerank = true`) |
| `ef_search` | `usize` | `64` | HNSW-Suchparameter (hoher = genauer, langsamer) |

## Text-Chunking

Vor der Einbettung muss langer Text in kleinere Chunks aufgeteilt werden. PRX bietet zwei Chunking-Strategien: token-bewusst und semantisch.

### Token-bewusstes Chunking

Token-bewusstes Chunking teilt Text an Token-Grenzen auf, um sicherzustellen, dass jeder Chunk in das Kontextfenster des Embedding-Modells passt. Es respektiert Wort- und Satzgrenzen, um Mitten-im-Wort-Schnitte zu vermeiden.

```toml
[memory.chunker]
strategy = "token"
max_tokens = 512
overlap_tokens = 64
tokenizer = "cl100k_base"     # OpenAI-kompatibler Tokenizer
```

Der Algorithmus:

1. Den Eingabetext mit dem konfigurierten Tokenizer tokenisieren
2. In Chunks von hochstens `max_tokens` Tokens aufteilen
3. Jeder Chunk uberlappt mit dem vorherigen um `overlap_tokens`, um Kontext an Grenzen zu bewahren
4. Chunk-Grenzen werden nach Moglichkeit an Satz- oder Absatzumbruche angepasst

### Semantisches Chunking

Semantisches Chunking verwendet Embedding-Ahnlichkeit, um naturliche Themengrenzen im Text zu finden. Anstatt an festen Token-Zahlen aufzuteilen, erkennt es, wo sich das Thema andert.

```toml
[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3
```

Der Algorithmus:

1. Den Text in Satze aufteilen
2. Embeddings fur jeden Satz berechnen
3. Kosinus-Ahnlichkeit zwischen aufeinanderfolgenden Satzen berechnen
4. Wenn die Ahnlichkeit unter `breakpoint_threshold` fallt, eine Chunk-Grenze einfugen
5. Kleine Chunks (unter `min_tokens`) mit benachbarten Chunks zusammenfuhren

### Chunking-Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `strategy` | `String` | `"token"` | Chunking-Strategie: `"token"` oder `"semantic"` |
| `max_tokens` | `usize` | `512` | Maximale Tokens pro Chunk |
| `overlap_tokens` | `usize` | `64` | Uberlappung zwischen aufeinanderfolgenden Chunks (nur Token-Strategie) |
| `tokenizer` | `String` | `"cl100k_base"` | Tokenizer-Name fur Token-Zahlung |
| `min_tokens` | `usize` | `64` | Minimale Tokens pro Chunk (nur semantische Strategie) |
| `breakpoint_threshold` | `f64` | `0.3` | Ahnlichkeitsabfall-Schwellenwert fur Themengrenzen (nur semantische Strategie) |

### Strategie wahlen

| Kriterium | Token-bewusst | Semantisch |
|-----------|-------------|----------|
| Geschwindigkeit | Schnell (keine Embedding-Aufrufe beim Chunking) | Langsamer (erfordert Pro-Satz-Embedding) |
| Qualitat | Gut fur einheitliche Inhalte | Besser fur Multi-Themen-Dokumente |
| Vorhersagbarkeit | Konsistente Chunk-Grossen | Variable Chunk-Grossen |
| Anwendungsfall | Chat-Protokolle, kurze Nachrichten | Lange Dokumente, Besprechungsnotizen |

## Themenextraktion

PRX extrahiert automatisch Themen aus Gedachtnis-Eintragen, um sie in Kategorien zu organisieren. Themen verbessern den Abruf durch gefiltertes Suchen innerhalb bestimmter Domanen.

### Funktionsweise

1. Nach dem Chunking wird jeder Chunk auf Themen-Schlusselworter und semantischen Inhalt analysiert
2. Der Themen-Extraktor weist ein oder mehrere Themenbezeichnungen aus einer konfigurierbaren Taxonomie zu
3. Themen werden zusammen mit dem Gedachtnis-Eintrag als Metadaten gespeichert
4. Beim Abruf konnen Abfragen optional nach Thema filtern, um Ergebnisse einzugrenzen

### Konfiguration

```toml
[memory.topics]
enabled = true
max_topics_per_entry = 3
taxonomy = "auto"               # "auto", "fixed" oder "hybrid"
custom_topics = []              # nur verwendet wenn taxonomy = "fixed" oder "hybrid"
min_confidence = 0.6
```

### Taxonomie-Modi

| Modus | Beschreibung |
|-------|-------------|
| `auto` | Themen werden dynamisch aus dem Inhalt generiert. Neue Themen werden nach Bedarf erstellt. |
| `fixed` | Nur Themen aus `custom_topics` werden zugewiesen. Inhalt, der keinem Thema entspricht, bleibt unkategorisiert. |
| `hybrid` | Bevorzugt `custom_topics`, erstellt aber neue Themen, wenn der Inhalt keinem bestehenden Label entspricht. |

### Themen-Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Themenextraktion aktivieren oder deaktivieren |
| `max_topics_per_entry` | `usize` | `3` | Maximale Themenbezeichnungen pro Gedachtnis-Eintrag |
| `taxonomy` | `String` | `"auto"` | Taxonomie-Modus: `"auto"`, `"fixed"` oder `"hybrid"` |
| `custom_topics` | `[String]` | `[]` | Benutzerdefinierte Themenbezeichnungen fur Fixed/Hybrid-Taxonomien |
| `min_confidence` | `f64` | `0.6` | Minimaler Konfidenz-Score (0,0--1,0) zur Zuweisung eines Themas |

## Inhaltsfilterung

Nicht jede Nachricht ist es wert, im Langzeitgedachtnis gespeichert zu werden. Der Inhaltsfilter wendet Autosave-Heuristiken an, um zu entscheiden, welcher Inhalt persistiert und welcher verworfen werden soll.

### Autosave-Heuristiken

Der Filter bewertet jeden Kandidaten-Gedachtnis-Eintrag anhand mehrerer Kriterien:

| Heuristik | Beschreibung | Gewicht |
|-----------|-------------|--------|
| **Informationsdichte** | Verhaltnis einzigartiger Tokens zu Gesamt-Tokens. Niedrigdichter Text (z.B. "ok", "danke") wird herausgefiltert | Hoch |
| **Neuartigkeit** | Ahnlichkeit zu bestehenden Erinnerungen. Inhalt, der dem bereits Gespeicherten zu ahnlich ist, wird ubersprungen | Hoch |
| **Relevanz** | Semantische Ahnlichkeit zu den bekannten Interessen und aktiven Themen des Benutzers | Mittel |
| **Umsetzbarkeit** | Vorhandensein von Aktionspunkten, Entscheidungen oder Zusagen (z.B. "Ich werde...", "lass uns...") | Mittel |
| **Aktualitats-Bias** | Aktueller Kontext wird fur Kurzzeit-Relevanz hoher gewichtet | Niedrig |

Ein zusammengesetzter Score wird als gewichtete Summe berechnet. Eintrage, die unter dem `autosave_threshold` liegen, werden nicht persistiert.

### Konfiguration

```toml
[memory.filter]
enabled = true
autosave_threshold = 0.4
novelty_threshold = 0.85        # Uberspringen wenn >85% ahnlich zu bestehender Erinnerung
min_length = 20                 # Eintrage kurzer als 20 Zeichen uberspringen
max_length = 10000              # Eintrage langer als 10.000 Zeichen kurzen
exclude_patterns = [
    "^(ok|thanks|got it|sure)$",
    "^\\s*$",
]
```

### Filter-Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Inhaltsfilterung aktivieren oder deaktivieren |
| `autosave_threshold` | `f64` | `0.4` | Minimaler zusammengesetzter Score (0,0--1,0) zur Persistierung einer Erinnerung |
| `novelty_threshold` | `f64` | `0.85` | Maximale Ahnlichkeit zu bestehenden Erinnerungen vor Deduplizierung |
| `min_length` | `usize` | `20` | Minimale Zeichenlange fur einen Gedachtnis-Eintrag |
| `max_length` | `usize` | `10000` | Maximale Zeichenlange (langere Eintrage werden gekurzt) |
| `exclude_patterns` | `[String]` | `[]` | Regex-Muster fur Inhalt, der niemals gespeichert werden soll |

## Vollstandiges Pipeline-Beispiel

Eine vollstandige Konfiguration, die alle vier Stufen kombiniert:

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768

[memory.vector]
enabled = true
index_type = "sqlite-vec"
top_k = 10
similarity_threshold = 0.5

[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3

[memory.topics]
enabled = true
taxonomy = "hybrid"
custom_topics = ["coding", "architecture", "debugging", "planning"]

[memory.filter]
enabled = true
autosave_threshold = 0.4
novelty_threshold = 0.85
```

## Verwandte Seiten

- [Gedachtnissystem-Ubersicht](./)
- [Embeddings-Backend](./embeddings) -- Embedding-Anbieter-Konfiguration
- [SQLite-Backend](./sqlite) -- lokale Speicherung fur sqlite-vec-Index
- [PostgreSQL-Backend](./postgres) -- Speicherung fur pgvector-Index
- [Gedachtnis-Hygiene](./hygiene) -- Komprimierungs- und Bereinigungsstrategien
