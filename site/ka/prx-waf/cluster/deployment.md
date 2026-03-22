---
title: Cluster-ის განასახება
description: "PRX-WAF-ის მრავალ-კვანძი cluster-ის განასახების ნაბიჯ-ნაბიჯ სახელმძღვანელო. სერთიფიკატ-გენერება, კვანძ-კონფიგურაცია, Docker Compose და გადამოწმება."
---

# Cluster-ის განასახება

ეს სახელმძღვანელო სამ-კვანძი PRX-WAF cluster-ის ერთი main კვანძითა და ორი worker კვანძით განასახებაში გგვიყვანს.

## წინაპირობები

- სამი სერვერი (ან Docker ჰოსტი) UDP პორტ `16851`-ის ქსელ-კავშირით
- PostgreSQL 16+ ყველა კვანძიდან ხელმისაწვდომი (გაზიარებული ან რეპლიცირებული)
- ყოველ კვანძზე ინსტალირებული PRX-WAF ბინარა (ან ხელმისაწვდომი Docker სურათები)

## ნაბიჯი 1: Cluster-ის სერთიფიკატების გენერება

CA-ისა და კვანძ-სერთიფიკატების cert-init კონტეინერის ან OpenSSL-ის ხელით გამოყენებით გენერება.

**Docker Compose-ის გამოყენებით (რეკომენდებული):**

საცავი შეიცავს `docker-compose.cluster.yml` ფაილს, რომელიც სერთიფიკატ-გენერებას ამუშავებს:

```bash
# Generate certificates
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

ეს გაზიარებულ ვოლუმში სერთიფიკატებს ქმნის:

```
cluster_certs/
├── cluster-ca.pem      # CA certificate
├── cluster-ca.key      # CA private key (main node only)
├── node-a.pem          # Main node certificate
├── node-a.key          # Main node private key
├── node-b.pem          # Worker node B certificate
├── node-b.key          # Worker node B private key
├── node-c.pem          # Worker node C certificate
└── node-c.key          # Worker node C private key
```

**`auto_generate`-ის გამოყენებით:**

ალტერნატიულად main კვანძზე `auto_generate = true`-ის დაყენება. Worker კვანძები join-ის პროცესში სერთიფიკატებს იღებს:

```toml
[cluster.crypto]
auto_generate = true
```

## ნაბიჯი 2: Main კვანძის კონფიგურაცია

`configs/cluster-node-a.toml`-ის შექმნა:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-a"
role        = "main"
listen_addr = "0.0.0.0:16851"
seeds       = []                # Main has no seeds

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
ca_key    = "/certs/cluster-ca.key"   # Main holds the CA key
node_cert = "/certs/node-a.pem"
node_key  = "/certs/node-a.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5
stats_interval_secs        = 10
events_queue_size          = 10000

[cluster.election]
timeout_min_ms        = 150
timeout_max_ms        = 300
heartbeat_interval_ms = 50

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## ნაბიჯი 3: Worker კვანძების კონფიგურაცია

`configs/cluster-node-b.toml`-ის შექმნა (node-c-სთვის ანალოგიურად):

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-b"
role        = "worker"
listen_addr = "0.0.0.0:16851"
seeds       = ["node-a:16851"]    # Points to the main node

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
node_cert = "/certs/node-b.pem"
node_key  = "/certs/node-b.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## ნაბიჯი 4: Cluster-ის გაშვება

**Docker Compose-ით:**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**ხელით:**

კვანძები თანმიმდევრობით დაიწყე: პირველ მონაცემთა ბაზა, შემდეგ main, შემდეგ worker-ები:

```bash
# On each node
prx-waf -c /etc/prx-waf/config.toml run
```

## ნაბიჯი 5: Cluster-ის გადამოწმება

ნებისმიერი კვანძიდან cluster-ის სტატუსის შემოწმება:

```bash
# Via the admin UI — navigate to the Cluster dashboard

# Via the API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

მოსალოდნელი პასუხი:

```json
{
  "cluster_enabled": true,
  "node_id": "node-a",
  "role": "main",
  "peers": [
    {"node_id": "node-b", "role": "worker", "status": "healthy"},
    {"node_id": "node-c", "role": "worker", "status": "healthy"}
  ],
  "sync": {
    "last_rule_sync": "2026-03-21T10:00:00Z",
    "last_config_sync": "2026-03-21T10:00:00Z"
  }
}
```

## დატვირთვ-განაწილებელ-ინტეგრაცია

გარე დატვირთვ-განაწილებლის (მაგ. HAProxy, Nginx ან cloud LB) cluster-ის წინ განლაგება კლიენტ-ტრაფიკის ყველა კვანძზე განსანაწილებლად:

```
                    ┌──── node-a (main)   :80/:443
Client → LB ───────┼──── node-b (worker) :80/:443
                    └──── node-c (worker) :80/:443
```

ყოველი კვანძი დამოუკიდებლად ამუშავებს ტრაფიკს WAF-ის პაიფლაინის გავლით. main კვანძიც ტრაფიკ-დამუშავების კვანძია -- კოორდინაციის მოვალეობებამდე შეზღუდული არ არის.

::: tip
დატვირთვ-განაწილებლის health check-ებისთვის `/health` endpoint-ის გამოყენება:
```
GET http://node-a/health → 200 OK
```
:::

## Cluster-ის გაზრდა

ახალი worker კვანძის დასამატებლად:

1. ახალი კვანძისთვის სერთიფიკატის გენერება (ან `auto_generate`-ის გამოყენება)
2. ახალი კვანძის `seeds = ["node-a:16851"]`-ით კონფიგურაცია
3. კვანძის გაშვება -- ის ავტომატურად cluster-ს შეუერთდება და სინქრონიზდება

კვანძის ამოსაღებად უბრალოდ შეაჩერე. Cluster-ის health შემოწმება გასვლას ამოიცნობს და სინქრონიზაციიდან გამოიმეტებს.

## შემდეგი ნაბიჯები

- [Cluster-ის რეჟიმის მიმოხილვა](./index) -- არქიტექტურა და სინქრონიზაციის დეტალები
- [კონფიგურაციის ცნობარი](../configuration/reference) -- ყველა cluster კონფ-გასაღები
- [პრობლემების მოგვარება](../troubleshooting/) -- გავრცელებული cluster-განასახების პრობლემები
