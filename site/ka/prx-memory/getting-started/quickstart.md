---
title: სწრაფი დაწყება
description: PRX-Memory 5 წუთში -- stdio ან HTTP ტრანსპორტით გაშვება, პირველი მეხსიერების შენახვა და სემანტიკური ძიებით გამოძახება.
---

# სწრაფი დაწყება

ეს სახელმძღვანელო გდის PRX-Memory-ის build-ს, daemon-ის გაშვებასა და პირველი შენახვისა და გამოძახების ოპერაციების შესრულებაში.

## 1. Daemon-ის Build-ი

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. სერვერის გაშვება

### ვარიანტი A: stdio ტრანსპორტი

MCP კლიენტთან პირდაპირი ინტეგრაციისთვის:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### ვარიანტი B: HTTP ტრანსპორტი

ქსელის წვდომისთვის ჯანმრთელობის შემოწმებებითა და მეტრიკებით:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

სერვერის გაშვების გადამოწმება:

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. MCP კლიენტის კონფიგურაცია

დაამატეთ PRX-Memory MCP კლიენტის კონფიგურაციაში. მაგალითად, Claude Code-ში ან Codex-ში:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
შეცვალეთ `/path/to/prx-memory` რეალური გზით, სადაც საცავი clone-გაქვთ.
:::

## 4. მეხსიერების შენახვა

გაგზავნეთ `memory_store` ინსტრუმენტის გამოძახება MCP კლიენტის მეშვეობით ან პირდაპირ JSON-RPC-ით:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always use parameterized queries for SQL to prevent injection attacks",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. მეხსიერებების გამოძახება

შესაბამისი მეხსიერებების მოძიება `memory_recall`-ის გამოყენებით:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL security best practices",
      "scope": "global",
      "limit": 5
    }
  }
}
```

სისტემა აბრუნებს მეხსიერებებს შესაბამისობის რანჟირებით ლექსიკური შეწყობის, მნიშვნელობის შეფასებისა და სიახლის კომბინაციის გამოყენებით.

## 6. სემანტიკური ძიების ჩართვა (სურვილისამებრ)

ვექტორ-ზე დაფუძნებული სემანტიკური გამოძახებისთვის კონფიგურირეთ embedding პროვაიდერი:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

embedding-ების ჩართვისას, გამოძახების შეკითხვები ვექტორული მსგავსებასაც იყენებს ლექსიკური შეწყობის გარდა, მოძიების ხარისხს მნიშვნელოვნად აუმჯობესებს ბუნებრივი ენის შეკითხვებისთვის.

## 7. Reranking-ის ჩართვა (სურვილისამებრ)

დაამატეთ reranker-ი მოძიების სიზუსტის გასაუმჯობესებლად:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## ხელმისაწვდომი MCP ინსტრუმენტები

| ინსტრუმენტი | აღწერა |
|------------|--------|
| `memory_store` | ახალი მეხსიერების ჩანაწერის შენახვა |
| `memory_recall` | მეხსიერებების გამოძახება შეკითხვით |
| `memory_update` | არსებული მეხსიერების განახლება |
| `memory_forget` | მეხსიერების ჩანაწერის წაშლა |
| `memory_export` | ყველა მეხსიერების ექსპორტი |
| `memory_import` | მეხსიერებების იმპორტი ექსპორტიდან |
| `memory_migrate` | შენახვის ფორმატის მიგრაცია |
| `memory_reembed` | მეხსიერებების ახლად embedding-ი ახალი მოდელით |
| `memory_compact` | შენახვის კომპაქტიზება და ოპტიმიზება |
| `memory_evolve` | მეხსიერების evolution holdout ვალიდაციით |
| `memory_skill_manifest` | ხელმისაწვდომი skill-ების აღმოჩენა |

## შემდეგი ნაბიჯები

- [Embedding ძრავა](../embedding/) -- Embedding პროვაიდერები და batch დამუშავება
- [Reranking](../reranking/) -- მეორე-საფეხურიანი reranking-ის კონფიგურაცია
- [შენახვის backend-ები](../storage/) -- JSON-სა და SQLite შენახვის შორის არჩევანი
- [კონფიგურაციის ცნობარი](../configuration/) -- ყველა გარემოს ცვლადი
