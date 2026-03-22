---
title: Docker-განასახება
description: OpenPR-ის Docker Compose-ით ან Podman-ით განასახება. სერვის-კონფ, ქსელი, ვოლიუმები და ჯანმრთელ-შემოწმებები.
---

# Docker-განასახება

OpenPR `docker-compose.yml`-ს გვაძლევს, რომელიც ყველა საჭირო სერვისს ერთი ბრძანებით ამოქმედებს.

## სწრაფი დაწყება

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

## სერვის-არქიტექტურა

```mermaid
graph LR
    subgraph Docker["Docker Network (openpr-network)"]
        PG["PostgreSQL<br/>:5432"]
        API["API Server<br/>:8080"]
        WORKER["Worker"]
        MCP["MCP Server<br/>:8090"]
        FE["Frontend<br/>:80"]
    end

    PG --> API
    PG --> WORKER
    API --> MCP
    API --> FE

    USER["Users<br/>Browser"] -->|":3000"| FE
    AIBOT["AI Assistants"] -->|":8090"| MCP
```

## სერვისები

### PostgreSQL

```yaml
postgres:
  image: postgres:16
  container_name: openpr-postgres
  environment:
    POSTGRES_DB: openpr
    POSTGRES_USER: openpr
    POSTGRES_PASSWORD: openpr
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./migrations:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U openpr -d openpr"]
    interval: 5s
    timeout: 3s
    retries: 20
```

`migrations/` დირექტორიის მიგრაციები PostgreSQL-ის `docker-entrypoint-initdb.d` მექანიზმის გავლით პირველ სტარტზე ავტომატურად სრულდება.

### API სერვერი

```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: api
  container_name: openpr-api
  environment:
    BIND_ADDR: 0.0.0.0:8080
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
    JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    UPLOAD_DIR: /app/uploads
  ports:
    - "8081:8080"
  volumes:
    - ./uploads:/app/uploads
  depends_on:
    postgres:
      condition: service_healthy
```

### Worker

```yaml
worker:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: worker
  container_name: openpr-worker
  environment:
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
  depends_on:
    postgres:
      condition: service_healthy
```

Worker-ს გამოქვეყნებული პორტები არ აქვს -- ის ფონ-სამუშაოების დასამუშავებლად პირდაპირ PostgreSQL-ს უკავშირდება.

### MCP სერვერი

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  container_name: openpr-mcp-server
  environment:
    OPENPR_API_URL: http://api:8080
    OPENPR_BOT_TOKEN: opr_your_token
    OPENPR_WORKSPACE_ID: your-workspace-uuid
  command: ["./mcp-server", "serve", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
  ports:
    - "8090:8090"
  depends_on:
    api:
      condition: service_healthy
```

### Frontend

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: openpr-frontend
  ports:
    - "3000:80"
  depends_on:
    api:
      condition: service_healthy
```

## ვოლიუმები

| ვოლიუმი | მიზანი |
|--------|---------|
| `pgdata` | PostgreSQL-მონაცემ-შენარჩ |
| `./uploads` | ფაილ-ატვირთვ-საცავი |
| `./migrations` | მონაცემ-ბაზ-მიგრ-სკრიპტები |

## ჯანმრთელ-შემოწმებები

ყველა სერვისი ჯანმრთელ-შემოწმებებს შეიცავს:

| სერვისი | შემოწმება | ინტ |
|---------|-------|----------|
| PostgreSQL | `pg_isready` | 5 წ |
| API | `curl /health` | 10 წ |
| MCP სერვ | `curl /health` | 10 წ |
| Frontend | `wget /health` | 30 წ |

## გავრცელებული ოპერაციები

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f mcp-server

# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build api

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Connect to database
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

Podman-მომხმარებლებისთვის ძირითადი განსხვავებები:

1. DNS-წვდომისთვის `--network=host`-ით build:
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. Frontend-ის Nginx DNS-სამარ `10.89.0.1`-ს იყენებს (Podman-ის ნაგ), `127.0.0.11`-ის ნაცვლად (Docker-ის ნაგ).

3. `docker-compose`-ის ნაცვლად `sudo podman-compose`.

## შემდეგი ნაბიჯები

- [წარმოებ-განასახება](./production) -- Caddy-reverse proxy, HTTPS და უსაფრთხოება
- [კონფიგურაცია](../configuration/) -- გარემო-ცვლად-ცნობარი
- [პრობლემ-მოგვარება](../troubleshooting/) -- გავრცელებული Docker-პრობლემები
