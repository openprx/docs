---
title: Unterstützte Embedding-Modelle
description: "Von PRX-Memory unterstützte Embedding-Modelle, einschließlich OpenAI-kompatibel, Jina und Gemini-Provider mit Konfigurationsdetails."
---

# Unterstützte Embedding-Modelle

PRX-Memory unterstützt drei Embedding-Provider-Familien. Jeder Provider verbindet sich über die einheitliche Adapter-Schnittstelle des `prx-memory-embed`-Crates.

## OpenAI-kompatibel

Jede API, die das OpenAI-Embedding-Endpunktformat (`/v1/embeddings`) folgt, kann verwendet werden. Dies umfasst OpenAI selbst, Azure OpenAI und lokale Inferenzserver.

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_openai_key
PRX_EMBED_MODEL=text-embedding-3-small
PRX_EMBED_BASE_URL=https://api.openai.com  # optional
```

| Modell | Dimensionen | Hinweise |
|--------|-------------|---------|
| `text-embedding-3-small` | 1536 | Gute Balance zwischen Qualität und Kosten |
| `text-embedding-3-large` | 3072 | Höchste Qualität, höhere Kosten |
| `text-embedding-ada-002` | 1536 | Legacy-Modell |

::: tip Lokale Inferenz
Für datenschutzsensitive Bereitstellungen `PRX_EMBED_BASE_URL` auf einen lokalen Inferenzserver zeigen lassen, der ein Open-Source-Embedding-Modell ausführt (z.B. via Ollama, vLLM oder text-embeddings-inference).
:::

## Jina AI

Jina bietet hochwertige mehrsprachige Embedding-Modelle, optimiert für Retrieval-Aufgaben.

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| Modell | Dimensionen | Hinweise |
|--------|-------------|---------|
| `jina-embeddings-v3` | 1024 | Neuestes mehrsprachiges Modell |
| `jina-embeddings-v2-base-en` | 768 | Englisch-optimiert |
| `jina-embeddings-v2-base-code` | 768 | Code-optimiert |

::: info Fallback-Schlüssel
Wenn `PRX_EMBED_API_KEY` nicht gesetzt ist, prüft das System `JINA_API_KEY` als Fallback.
:::

## Google Gemini

Gemini-Embedding-Modelle sind über die Google-AI-API verfügbar.

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| Modell | Dimensionen | Hinweise |
|--------|-------------|---------|
| `text-embedding-004` | 768 | Aktuell empfohlenes Modell |
| `embedding-001` | 768 | Legacy-Modell |

::: info Fallback-Schlüssel
Wenn `PRX_EMBED_API_KEY` nicht gesetzt ist, prüft das System `GEMINI_API_KEY` als Fallback.
:::

## Modell auswählen

| Priorität | Empfohlenes Modell | Provider |
|-----------|-------------------|---------|
| Beste Qualität | `text-embedding-3-large` | OpenAI-kompatibel |
| Beste für Code | `jina-embeddings-v2-base-code` | Jina |
| Mehrsprachig | `jina-embeddings-v3` | Jina |
| Datenschutz / lokal | Beliebiges lokales Modell via `openai-compatible` | Self-hosted |
| Kosteneffektiv | `text-embedding-3-small` | OpenAI-kompatibel |

## Modelle wechseln

Beim Wechsel von Embedding-Modellen werden vorhandene Vektoren mit dem Vektorraum des neuen Modells inkompatibel. Das `memory_reembed`-Tool verwenden, um alle gespeicherten Erinnerungen mit dem neuen Modell neu einzubetten:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_reembed",
    "arguments": {}
  }
}
```

::: warning
Neu-Embedding erfordert API-Aufrufe für jeden gespeicherten Speichereintrag. Bei großen Datenbanken kann dies erhebliche Zeit in Anspruch nehmen und API-Kosten verursachen. Neu-Embedding in Zeiten geringer Nutzung planen.
:::

## Nächste Schritte

- [Stapelverarbeitung](./batch-processing) -- Effizientes Massen-Embedding
- [Reranking-Modelle](../reranking/models) -- Optionen für zweistufige Reranking-Modelle
- [Konfigurationsreferenz](../configuration/) -- Alle Umgebungsvariablen
