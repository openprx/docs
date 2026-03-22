---
title: Reranking მოდელები
description: "PRX-Memory-ის მხარდაჭერილი reranking მოდელები: Jina, Cohere და Pinecone პროვაიდერები."
---

# Reranking მოდელები

PRX-Memory მხარს უჭერს მრავალ reranking პროვაიდერს `prx-memory-rerank` crate-ის მეშვეობით. ყოველი პროვაიდერი ერთსა და იმავე adapter trait-ს ახორციელებს, უშუალო გადართვის საშუალებით.

## Jina AI

Jina გთავაზობს cross-encoder reranking მოდელებს მრავალენოვანი მხარდაჭერით.

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| მოდელი | შენიშვნა |
|--------|----------|
| `jina-reranker-v2-base-multilingual` | მრავალენოვანი cross-encoder |
| `jina-reranker-v1-base-en` | ინგლისურისთვის ოპტიმიზებული |

::: info
Jina reranking შეიძლება გამოიყენოს იგივე API გასაღები, როგორც Jina embedding. ერთხელ დააყენეთ `JINA_API_KEY` ორივეს დასაფარავად.
:::

## Cohere

Cohere გთავაზობს მაღალ-ხარისხიან reranking-ს მათი Rerank API-ს მეშვეობით.

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| მოდელი | შენიშვნა |
|--------|----------|
| `rerank-v3.5` | უახლესი მოდელი, საუკეთესო ხარისხი |
| `rerank-english-v3.0` | ინგლისურისთვის ოპტიმიზებული |
| `rerank-multilingual-v3.0` | მრავალენოვანი მხარდაჭერა |

## Pinecone

Pinecone გთავაზობს reranking-ს მათი inference API-ის ნაწილად.

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

სპეციალური Pinecone-თავსებადი endpoint-ებისთვის:

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## Reranker-ის არჩევა

| პრიორიტეტი | სასურველი პროვაიდერი | მოდელი |
|-----------|---------------------|-------|
| საუკეთესო ხარისხი | Cohere | `rerank-v3.5` |
| მრავალენოვანი | Jina | `jina-reranker-v2-base-multilingual` |
| Pinecone-სთან ინტეგრირებული | Pinecone | `bge-reranker-v2-m3` |
| Reranking არ სჭირდება | -- | `PRX_RERANK_PROVIDER=none` |

## Embedding-ისა და Reranking-ის კომბინირება

გავრცელებული მაღალ-ხარისხიანი კონფიგურაცია Jina embedding-ს Cohere reranking-სთან წყვილად:

```bash
# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

ეს კონფიგურაცია Jina-ს სწრაფ მრავალენოვან embedding-ებს იყენებს ფართო მოძიებისთვის და Cohere-ის მაღალ-სიზუსტიანი reranker-ს საბოლოო დახარისხებისთვის.

## შემდეგი ნაბიჯები

- [Embedding მოდელები](../embedding/models) -- პირველი-საფეხურიანი embedding-ის მოდელის პარამეტრები
- [კონფიგურაციის ცნობარი](../configuration/) -- ყველა გარემოს ცვლადი
