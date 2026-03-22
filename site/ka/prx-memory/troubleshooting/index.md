---
title: პრობლემების მოგვარება
description: "PRX-Memory-ის გავრცელებული პრობლემები და გადაწყვეტები კონფიგურაციის, embedding-ის, reranking-ის, შენახვისა და MCP ინტეგრაციისთვის."
---

# პრობლემების მოგვარება

ეს გვერდი PRX-Memory-ის გაშვებისას გავრცელებულ პრობლემებს, მათ მიზეზებს და გადაწყვეტებს მოიცავს.

## კონფიგურაციის პრობლემები

### "PRX_EMBED_API_KEY is not configured"

**მიზეზი:** დისტანციური სემანტიკური გამოძახება მოითხოვდა, მაგრამ embedding API გასაღები არ დაყენებულა.

**გადაწყვეტა:** დააყენეთ embedding პროვაიდერი და API გასაღები:

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

ან გამოიყენეთ პროვაიდერ-სპეციფიკური სარეზერვო გასაღები:

```bash
JINA_API_KEY=your_api_key
```

::: tip
სემანტიკური ძიება არ დაგჭირდებათ, PRX-Memory მუშაობს embedding-ის კონფიგურაციის გარეშე, მხოლოდ ლექსიკური შეწყობის გამოყენებით.
:::

### "Unsupported rerank provider"

**მიზეზი:** `PRX_RERANK_PROVIDER` ცვლადი შეიცავს აღიარებულ მნიშვნელობას.

**გადაწყვეტა:** გამოიყენეთ მხარდაჭერილი მნიშვნელობებიდან ერთ-ერთი:

```bash
PRX_RERANK_PROVIDER=jina        # or cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**მიზეზი:** `PRX_EMBED_PROVIDER` ცვლადი შეიცავს აღიარებულ მნიშვნელობას.

**გადაწყვეტა:** გამოიყენეთ მხარდაჭერილი მნიშვნელობებიდან ერთ-ერთი:

```bash
PRX_EMBED_PROVIDER=openai-compatible  # or jina, gemini
```

## სესიის პრობლემები

### "session_expired"

**მიზეზი:** HTTP streaming სესიამ TTL-ს გასცდა განახლების გარეშე.

**გადაწყვეტა:** განაახლეთ სესია ვადის გასვლამდე ან გაზარდეთ TTL:

```bash
# Renew the session
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Or increase the TTL (default: 300000ms = 5 minutes)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## შენახვის პრობლემები

### მონაცემთა ბაზის ფაილი ვერ მოიძებნა

**მიზეზი:** `PRX_MEMORY_DB`-ში მითითებული გზა არ არსებობს ან ჩაწერა არ შეიძლება.

**გადაწყვეტა:** დარწმუნდით, რომ დირექტორია არსებობს და გზა სწორია:

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
გამოიყენეთ აბსოლუტური გზები სამუშაო დირექტორიის ცვლილებებთან დაკავშირებული პრობლემების თავიდან ასაცილებლად.
:::

### დიდი JSON მონაცემთა ბაზა ნელა იტვირთება

**მიზეზი:** JSON backend-ი გაშვებისას მთელ ფაილს მეხსიერებაში ტვირთავს. 10,000-ზე მეტი ჩანაწერის მქონე მონაცემთა ბაზებისთვის ეს ნელი შეიძლება იყოს.

**გადაწყვეტა:** გადაიყვანეთ SQLite backend-ზე:

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

გამოიყენეთ `memory_migrate` ინსტრუმენტი არსებული მონაცემების გადასატანად.

## Observability-ის პრობლემები

### მეტრიკების კარდინალობის overflow alert

**მიზეზი:** recall scope-ში, კატეგორიაში ან rerank პროვაიდერის განზომილებებში ზედმეტ განსხვავებული label-ის მნიშვნელობები.

**გადაწყვეტა:** გაზარდეთ კარდინალობის ლიმიტები ან ნორმალიზეთ შეყვანის მონაცემები:

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

ლიმიტების გადამეტებისას ახალი label-ების მნიშვნელობები ჩუმად ჩამოყრება და `prx_memory_metrics_label_overflow_total`-ში ითვლება.

### Alert-ის ზღვრები ძალიან მგრძნობიარეა

**მიზეზი:** ნაგულისხმევი alert-ის ზღვრებმა შეიძლება ყალბ-დადებითები გამოიწვიოს საწყის განასახებაში.

**გადაწყვეტა:** მოარგეთ ზღვრები მოსალოდნელი შეცდომის კოეფიციენტებს:

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## Build-ის პრობლემები

### LanceDB ფუნქცია ხელმისაწვდომი არ არის

**მიზეზი:** `lancedb-backend` ფუნქცია compile-ის დროს ჩართული არ ყოფილა.

**გადაწყვეტა:** ახლიდან build-ი ფუნქციის ნიშნით:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### კომპილაციის შეცდომები Linux-ზე

**მიზეზი:** native კოდის build-ისთვის სისტემის დეპენდენციები დაკარგულია.

**გადაწყვეტა:** დააინსტალირეთ build-ის დეპენდენციები:

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## ჯანმრთელობის შემოწმება

გამოიყენეთ HTTP ჯანმრთელობის endpoint-ი სერვერის სწორი მუშაობის გადასამოწმებლად:

```bash
curl -sS http://127.0.0.1:8787/health
```

ოპერაციული სტატუსისთვის მეტრიკები შეამოწმეთ:

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## ვალიდაციის ბრძანებები

გაუშვით სრული ვალიდაციის ნაკრები ინსტალაციის გადასამოწმებლად:

```bash
# Multi-client validation
./scripts/run_multi_client_validation.sh

# Soak test (60 seconds, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## დახმარების მიღება

- **საცავი:** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **Issues:** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **დოკუმენტაცია:** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
