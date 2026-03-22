---
title: Docker განასახება
description: "Fenfa-ს Docker-ისა და Docker Compose-ის მეშვეობით განასახება: კონტეინერის კონფიგურაცია, volume-ები, მრავალ-არქიტექტურიანი build-ები და health check-ები."
---

# Docker განასახება

Fenfa ერთ Docker image-ად გამოდის, რომელიც embedded frontend-ით Go ბინარულს შეიცავს. დამატებითი კონტეინერები არ სჭირდება -- უბრალოდ მდგრადი მონაცემებისთვის volume-ები mount-ი.

## სწრაფი დაწყება

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

## Docker Compose

შექმენით `docker-compose.yml`:

```yaml
version: "3.8"

services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN:-http://localhost:8000}
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  fenfa-data:
  fenfa-uploads:
```

შექმენით `.env` ფაილი compose ფაილის გვერდით:

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

სერვისის გაშვება:

```bash
docker compose up -d
```

## Volume-ები

| Mount Point | მიზანი | Backup სავალდებულოა |
|-------------|--------|-------------------|
| `/data` | SQLite მონაცემთა ბაზა | დიახ |
| `/app/uploads` | ატვირთული ბინარული ფაილები | დიახ (S3-ის გამოყენების გარდა) |
| `/app/config.json` | კონფიგურაციის ფაილი (optional) | დიახ |

::: warning მონაცემთა მდგრადობა
Volume mount-ების გარეშე კონტეინერის ხელახლა შექმნისას ყველა მონაცემი იკარგება. Production გამოყენებისთვის ყოველთვის mount-ი `/data` და `/app/uploads`.
:::

## Config ფაილის გამოყენება

Config ფაილის mount-ი სრული კონტროლისთვის:

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## Health Check

Fenfa health endpoint-ს `/healthz`-ზე ექსპოზდებს:

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

ზემოაღნიშნული Docker Compose მაგალითი health check კონფიგურაციას შეიცავს. Kubernetes ან Nomad-ის მსგავსი orchestrator-ებისთვის ამ endpoint-ს liveness და readiness probe-ებისთვის გამოიყენეთ.

## მრავალ-არქიტექტურიანი

Fenfa-ს Docker image `linux/amd64`-სა და `linux/arm64`-ს მხარს უჭერს. Docker ავტომატურად host-ისთვის სწორ არქიტექტურას გამოიყვანს.

საკუთარი მრავალ-არქიტექტურიანი image-ების build-ისთვის:

```bash
./scripts/docker-build.sh
```

ეს Docker Buildx-ს ორივე არქიტექტურისთვის image-ების შესაქმნელად გამოიყენებს.

## რესურსების მოთხოვნები

Fenfa მსუბუქია:

| რესურსი | მინიმუმი | სასურველი |
|---------|---------|----------|
| CPU | 1 core | 2 cores |
| RAM | 64 MB | 256 MB |
| Disk | 100 MB (app) | ატვირთული ფაილებზეა დამოკიდებული |

SQLite მონაცემთა ბაზასა და Go ბინარულს მინიმალური overhead-ი აქვს. რესურსების მოხმარება ძირითადად upload storage-სა და კონკურენტულ კავშირებთან ერთად იზრდება.

## ლოგები

კონტეინერის ლოგების ნახვა:

```bash
docker logs -f fenfa
```

Fenfa stdout-ზე სტრუქტურირებული ფორმატით ლოგს გამოაქვს, log aggregation ინსტრუმენტებთან თავსებადი.

## განახლება

```bash
docker compose pull
docker compose up -d
```

::: tip Zero-Downtime განახლებები
Fenfa სწრაფად (< 1 წამში) სტარტდება. near-zero-downtime განახლებებისთვის გამოიყენეთ reverse proxy health check, რომელიც ახალ კონტეინერზე ტრაფიკს ავტომატურად გადამისამართებს health check-ის გავლის შემდეგ.
:::

## შემდეგი ნაბიჯები

- [Production განასახება](./production) -- Reverse proxy, TLS და უსაფრთხოება
- [კონფიგურაციის ცნობარი](../configuration/) -- ყველა კონფიგურაციის პარამეტრი
- [პრობლემების მოგვარება](../troubleshooting/) -- გავრცელებული Docker პრობლემები
