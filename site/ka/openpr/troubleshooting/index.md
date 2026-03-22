---
title: პრობლემების მოგვარება
description: OpenPR-ის გავრცელებული პრობლემების გადაწყვეტა მონაცემ-ბაზ-კავშირების, ავთ-შეცდომების, Docker-პრობლემებისა და MCP სერვ-კონფ-ის ჩათვლით.
---

# პრობლემების მოგვარება

ეს გვერდი OpenPR-ის მუშაობისას გავრცელებულ პრობლემებს და მათ გადაწყვეტებს მოიცავს.

## მონაცემ-ბაზ-კავშირი

### API "connection refused"-ით ვერ იწყება

API სერვერი PostgreSQL-ის მზადყოფნამდე ადრე იწყება.

**გადაწყვეტა**: Docker Compose-ფაილი `depends_on`-ს `condition: service_healthy`-ით და ჯანმრთ-შემ-ებს შეიცავს. პრობლ-გახ-ისას PostgreSQL-ის `start_period`-ის გაზრდა:

```yaml
postgres:
  healthcheck:
    start_period: 30s  # Increase from default 10s
```

### "role openpr does not exist"

PostgreSQL-მომხ ვერ შეიქმნა.

**გადაწყვეტა**: Docker Compose-გარ-ში `POSTGRES_USER`-ისა და `POSTGRES_PASSWORD`-ის შ-ს-ს გ. PostgreSQL-ის ხ-გ-ის შ:

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### მიგრაციები არ სრულდება

მ-ები PostgreSQL-კონტ-პ-სტ-ზე ავტ-სრ (`docker-entrypoint-initdb.d`-ის გავ).

**გადაწყვეტა**: მ-ბ-უკ-არ-ხ-ისას ხ-მ-ების გ:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# Then run each migration SQL file in order
```

ან ვოლ-ახ-შ:

```bash
docker-compose down -v
docker-compose up -d
```

::: warning მონ-დაკ
`docker-compose down -v` მ-ბ-ვოლ-წ. ჯ-მ-ების backup.
:::

## ავთენტიფიკაცია

### "Invalid token" სერვ-restart-ის შ

JWT-ტ-ები `JWT_SECRET`-ით ხელ-დება. restart-ებ-შ ამ მ-შ-ისას ყველა ხ-ტ-ი ბ.

**გადაწყვეტა**: `.env`-ში ფ-`JWT_SECRET`-ის დ:

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### პირველი მომხ admin-ი არ არის

admin-ის-როლი პ-დარ-მომხ-ს ენ. `role: "user"`-ის ნ `role: "admin"`-ის ნ-ლ სხვა ანგ-ი პ-ად დ.

**გადაწყვეტა**: მ-ბ-ის გამ-ი-ს გ:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### Podman build DNS-შ-ით ვ-ხ

Podman-ის ნ-ქ build-ებ-ს DNS-წვ-ს არ აქვს.

**გადაწყვეტა**: Podman-ის სურ-ბ-ისას ყოვ `--network=host`-ის გ:

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### Frontend "502 Bad Gateway"-ს გ

Nginx-კ-ი API სერვ-ს ვ-მ.

**გადაწყვეტა**: შ-მ:
1. API-კ-ი მ: `docker-compose ps`
2. API-ჯ-შ-გ: `docker exec openpr-api curl -f http://localhost:8080/health`
3. ორი კ-ი ერ-ქ-ია: `docker network inspect openpr_openpr-network`

### პ-კ

სხვა სერვ-ი ერ-პ-ს იყ.

**გადაწყვეტა**: `docker-compose.yml`-ში გ-პ-მ-ის შ:

```yaml
api:
  ports:
    - "8082:8080"  # Changed from 8081
```

## MCP სერვერი

### "tools/list returns empty"

MCP-სერვ API-ს ვ-მ.

**გადაწყვეტა**: გ-ცვლ-გ:

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

შ:
- `OPENPR_API_URL` სწ-API-endpoint-ს მ
- `OPENPR_BOT_TOKEN` ვ-ბ-ტ-ია (`opr_`-ით)
- `OPENPR_WORKSPACE_ID` ვ-სამ-სივ-UUID-ია

### stdio-ს-ე ვ-მ

MCP-ბ-ი AI-კლ-ში ბ-ად კ-ს.

**გადაწყვეტა**: ბ-გ-სწ-ია და გ-ცვლ-დ:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/absolute/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_...",
        "OPENPR_WORKSPACE_ID": "..."
      }
    }
  }
}
```

### SSE-კ-ი ვ

SSE-კ-ებს მ-timeout-ის მ-proxy-სერვ-ი ხ.

**გადაწყვეტა**: reverse-proxy-ის გ-ისას SSE-endpoint-ის timeout-ის გ:

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## Frontend

### განასახ-შ ცარ-გვ

Frontend-ბ-ი ტ-ს შ-API-URL-ს იყ.

**გადაწყვეტა**: build-მ `VITE_API_URL`-ის დ:

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### შ-მ-ხ-სრ ც-ია

API-მ-ები ჩ-ვ. ბრ-კ (F12) 401 ან CORS-შ-ების შ.

**გადაწყვეტა**: API ბ-ს-ხ-ია და CORS-კ-ია. frontend Nginx-ის გ-API-მ-ების proxy-ს.

## შესრულება

### ნ-ძ-ები

PostgreSQL-სრ-ტ-ძ-ი დ-მ-ბ-ების გ-ბ-ც-ი შ.

**გადაწყვეტა**: FTS-ინ-ექ-ის (მ-ებ-ის მ-შ) შ:

```sql
-- Check for existing indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### მ-მ-მ-გ-

API-სერვ-ი ფ-ატ-ებს მ-ში ამ.

**გადაწყვეტა**: ატ-ზ-შ-ება და `uploads/` დ-ის მ. ძვ-ატ-ების პ-გ-ის გ.

## დახმ-მ-

issue-ი აქ ვ-მ-ისას:

1. ც-პრ-ს [GitHub Issues](https://github.com/openprx/openpr/issues)-ში შ.
2. API-ისა და MCP-სერვ-ლოგ-ების შ-მ.
3. ახ-issue-ის გ-ი-ს, გ-ლ, გ-და გ-ნ.
