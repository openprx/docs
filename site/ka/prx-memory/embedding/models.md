---
title: მხარდაჭერილი Embedding მოდელები
description: "PRX-Memory-ის მხარდაჭერილი embedding მოდელები: OpenAI-თავსებადი, Jina და Gemini პროვაიდერები კონფიგურაციის დეტალებით."
---

# მხარდაჭერილი Embedding მოდელები

PRX-Memory მხარს უჭერს სამ embedding პროვაიდერის ოჯახს. ყოველი პროვაიდერი `prx-memory-embed` crate-ის ერთიანი adapter ინტერფეისის მეშვეობით ერთვება.

## OpenAI-თავსებადი

ნებისმიერი API, რომელიც OpenAI embedding endpoint-ის ფორმატს მიჰყვება (`/v1/embeddings`), შეიძლება გამოყენებულ იქნეს. ეს მოიცავს OpenAI-ს, Azure OpenAI-ს და ლოკალური inference სერვერებს.

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_openai_key
PRX_EMBED_MODEL=text-embedding-3-small
PRX_EMBED_BASE_URL=https://api.openai.com  # optional
```

| მოდელი | განზომილებები | შენიშვნა |
|--------|--------------|----------|
| `text-embedding-3-small` | 1536 | ხარისხისა და ღირებულების კარგი ბალანსი |
| `text-embedding-3-large` | 3072 | უმაღლეს ხარისხი, უფრო ძვირი |
| `text-embedding-ada-002` | 1536 | მოძველებული მოდელი |

::: tip ლოკალური Inference
კონფიდენციალობის მგრძნობიარე განასახებებისთვის მიუთითეთ `PRX_EMBED_BASE_URL` ლოკალური inference სერვერისთვის, რომელიც ღია წყაროს embedding მოდელს გაუშვებს (მაგ., Ollama, vLLM ან text-embeddings-inference-ის მეშვეობით).
:::

## Jina AI

Jina უზრუნველყოფს მაღალ-ხარისხიანი მრავალენოვანი embedding მოდელებს, მოძიების ამოცანებისთვის ოპტიმიზებული.

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| მოდელი | განზომილებები | შენიშვნა |
|--------|--------------|----------|
| `jina-embeddings-v3` | 1024 | უახლესი მრავალენოვანი მოდელი |
| `jina-embeddings-v2-base-en` | 768 | ინგლისურისთვის ოპტიმიზებული |
| `jina-embeddings-v2-base-code` | 768 | კოდისთვის ოპტიმიზებული |

::: info სარეზერვო გასაღები
`PRX_EMBED_API_KEY`-ის დაუყენებლობისას სისტემა `JINA_API_KEY`-ს ამოწმებს სარეზერვოდ.
:::

## Google Gemini

Gemini embedding მოდელები Google AI API-ის მეშვეობით ხელმისაწვდომია.

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| მოდელი | განზომილებები | შენიშვნა |
|--------|--------------|----------|
| `text-embedding-004` | 768 | მიმდინარე სასურველი მოდელი |
| `embedding-001` | 768 | მოძველებული მოდელი |

::: info სარეზერვო გასაღები
`PRX_EMBED_API_KEY`-ის დაუყენებლობისას სისტემა `GEMINI_API_KEY`-ს ამოწმებს სარეზერვოდ.
:::

## მოდელის არჩევა

| პრიორიტეტი | სასურველი მოდელი | პროვაიდერი |
|-----------|-----------------|-----------|
| საუკეთესო ხარისხი | `text-embedding-3-large` | OpenAI-თავსებადი |
| კოდისთვის საუკეთესო | `jina-embeddings-v2-base-code` | Jina |
| მრავალენოვანი | `jina-embeddings-v3` | Jina |
| კონფიდენციალობა / ლოკალური | ნებისმიერი ლოკალური მოდელი `openai-compatible`-ის მეშვეობით | Self-hosted |
| ეკონომიური | `text-embedding-3-small` | OpenAI-თავსებადი |

## მოდელების გადართვა

Embedding მოდელების გადართვისას, არსებული ვექტორები ახალი მოდელის ვექტორულ სივრცესთან შეუთავსებელი ხდება. გამოიყენეთ `memory_reembed` ინსტრუმენტი ყველა შენახული მეხსიერების ახლად embedding-ისთვის ახალი მოდელით:

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
ახლად embedding-ი API გამოძახებებს საჭიროებს ყოველი შენახული მეხსიერებისთვის. დიდი მონაცემთა ბაზებისთვის ამ შეიძლება მნიშვნელოვანი დრო და API ხარჯები მოჰყვეს. გეგმეთ ახლად embedding-ი დაბალი გამოყენების პერიოდებში.
:::

## შემდეგი ნაბიჯები

- [Batch დამუშავება](./batch-processing) -- ეფექტური bulk embedding
- [Reranking მოდელები](../reranking/models) -- მეორე-საფეხურიანი reranking-ის მოდელის პარამეტრები
- [კონფიგურაციის ცნობარი](../configuration/) -- ყველა გარემოს ცვლადი
