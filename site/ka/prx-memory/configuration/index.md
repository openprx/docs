---
title: კონფიგურაციის ცნობარი
description: PRX-Memory-ის ყველა გარემოს ცვლადის სრული ცნობარი ტრანსპორტის, შენახვის, embedding-ის, reranking-ის, მმართველობისა და observability-ის მოიცვამდე.
---

# კონფიგურაციის ცნობარი

PRX-Memory მთლიანად გარემოს ცვლადებით კონფიგურდება. ეს გვერდი ყველა ცვლადს კატეგორიის მიხედვით დოკუმენტირებს.

## ტრანსპორტი

| ცვლადი | მნიშვნელობები | ნაგულისხმევი | აღწერა |
|--------|--------------|--------------|--------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`, `http` | `stdio` | სერვერის ტრანსპორტის რეჟიმი |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | HTTP სერვერის bind მისამართი |

## შენახვა

| ცვლადი | მნიშვნელობები | ნაგულისხმევი | აღწერა |
|--------|--------------|--------------|--------|
| `PRX_MEMORY_BACKEND` | `json`, `sqlite`, `lancedb` | `json` | შენახვის backend |
| `PRX_MEMORY_DB` | ფაილის/დირექტორიის გზა | -- | მონაცემთა ბაზის ფაილის ან დირექტორიის გზა |

## Embedding

| ცვლადი | მნიშვნელობები | ნაგულისხმევი | აღწერა |
|--------|--------------|--------------|--------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`, `jina`, `gemini` | -- | Embedding პროვაიდერი |
| `PRX_EMBED_API_KEY` | API გასაღების სტრიქონი | -- | Embedding პროვაიდერის API გასაღები |
| `PRX_EMBED_MODEL` | მოდელის სახელი | პროვაიდერ-სპეციფიკური | Embedding მოდელის სახელი |
| `PRX_EMBED_BASE_URL` | URL | პროვაიდერ-სპეციფიკური | სპეციფიკური API endpoint-ის URL |

### პროვაიდერის სარეზერვო გასაღებები

`PRX_EMBED_API_KEY`-ის დაუყენებლობის შემთხვევაში სისტემა ამ პროვაიდერ-სპეციფიკური გასაღებებს ამოწმებს:

| პროვაიდერი | სარეზერვო გასაღები |
|-----------|-------------------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## Reranking

| ცვლადი | მნიშვნელობები | ნაგულისხმევი | აღწერა |
|--------|--------------|--------------|--------|
| `PRX_RERANK_PROVIDER` | `jina`, `cohere`, `pinecone`, `pinecone-compatible`, `none` | `none` | Rerank პროვაიდერი |
| `PRX_RERANK_API_KEY` | API გასაღების სტრიქონი | -- | Rerank პროვაიდერის API გასაღები |
| `PRX_RERANK_MODEL` | მოდელის სახელი | პროვაიდერ-სპეციფიკური | Rerank მოდელის სახელი |
| `PRX_RERANK_ENDPOINT` | URL | პროვაიდერ-სპეციფიკური | სპეციფიკური rerank endpoint |
| `PRX_RERANK_API_VERSION` | ვერსიის სტრიქონი | -- | API ვერსია (მხოლოდ pinecone-compatible) |

### პროვაიდერის სარეზერვო გასაღებები

`PRX_RERANK_API_KEY`-ის დაუყენებლობის შემთხვევაში სისტემა ამ პროვაიდერ-სპეციფიკური გასაღებებს ამოწმებს:

| პროვაიდერი | სარეზერვო გასაღები |
|-----------|-------------------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## სტანდარტიზაცია

| ცვლადი | მნიშვნელობები | ნაგულისხმევი | აღწერა |
|--------|--------------|--------------|--------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`, `governed` | `zero-config` | სტანდარტიზაციის პროფილი |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | tag-ის სტრიქონი | `prx-memory` | ნაგულისხმევი პროექტის tag |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | tag-ის სტრიქონი | `mcp` | ნაგულისხმევი ინსტრუმენტის tag |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | tag-ის სტრიქონი | `general` | ნაგულისხმევი დომენის tag |

## Streaming სესიები

| ცვლადი | მნიშვნელობები | ნაგულისხმევი | აღწერა |
|--------|--------------|--------------|--------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | მილიწამები | `300000` | Stream სესიის სიცოცხლის ხანგრძლივობა |

## Observability

### კარდინალობის კონტროლები

| ცვლადი | ნაგულისხმევი | აღწერა |
|--------|--------------|--------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | მეტრიკებში განსხვავებული scope label-ების მაქს. |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | მეტრიკებში განსხვავებული კატეგორია label-ების მაქს. |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | განსხვავებული rerank პროვაიდერის label-ების მაქს. |

### Alert-ის ზღვრები

| ცვლადი | ნაგულისხმევი | აღწერა |
|--------|--------------|--------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | ინსტრუმენტის შეცდომის თანაფარდობის გაფრთხილების ზღვარი |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | ინსტრუმენტის შეცდომის თანაფარდობის კრიტიკული ზღვარი |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | დისტანციური გაფრთხილების თანაფარდობის გაფრთხილების ზღვარი |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | დისტანციური გაფრთხილების თანაფარდობის კრიტიკული ზღვარი |

## მაგალითი: მინიმალური კონფიგურაცია

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## მაგალითი: სრული საწარმოო კონფიგურაცია

```bash
# Transport
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Storage
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Governance
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Sessions
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Observability
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## შემდეგი ნაბიჯები

- [ინსტალაცია](../getting-started/installation) -- PRX-Memory-ის build-ი და ინსტალაცია
- [MCP ინტეგრაცია](../mcp/) -- MCP კლიენტის კონფიგურაცია
- [პრობლემების მოგვარება](../troubleshooting/) -- გავრცელებული კონფიგურაციის პრობლემები
