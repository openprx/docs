---
title: Docker 배포
description: "Docker Compose 또는 Podman으로 OpenPR 배포. 서비스 설정, 네트워킹, 볼륨, 헬스 체크 포함."
---

# Docker 배포

OpenPR은 단일 명령어로 모든 필요한 서비스를 실행하는 `docker-compose.yml`을 제공합니다.

## 빠른 시작

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

## 서비스 아키텍처

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

## 서비스

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

`migrations/` 디렉토리의 마이그레이션은 PostgreSQL `docker-entrypoint-initdb.d` 메커니즘을 통해 첫 번째 시작 시 자동으로 실행됩니다.

### API 서버

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

### 워커

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

워커는 노출된 포트가 없습니다 -- 백그라운드 작업 처리를 위해 PostgreSQL에 직접 연결합니다.

### MCP 서버

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

### 프론트엔드

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

## 볼륨

| 볼륨 | 목적 |
|------|------|
| `pgdata` | PostgreSQL 데이터 영속성 |
| `./uploads` | 파일 업로드 저장소 |
| `./migrations` | 데이터베이스 마이그레이션 스크립트 |

## 헬스 체크

모든 서비스에 헬스 체크가 포함되어 있습니다:

| 서비스 | 확인 방법 | 간격 |
|--------|----------|------|
| PostgreSQL | `pg_isready` | 5초 |
| API | `curl /health` | 10초 |
| MCP Server | `curl /health` | 10초 |
| Frontend | `wget /health` | 30초 |

## 일반적인 작업

```bash
# 로그 보기
docker-compose logs -f api
docker-compose logs -f mcp-server

# 서비스 재시작
docker-compose restart api

# 재빌드 후 재시작
docker-compose up -d --build api

# 모든 서비스 중지
docker-compose down

# 중지 및 볼륨 제거 (경고: 데이터베이스 삭제됨)
docker-compose down -v

# 데이터베이스 연결
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

Podman 사용자의 경우 주요 차이점은 다음과 같습니다:

1. DNS 접근을 위해 `--network=host`로 빌드:
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. 프론트엔드 Nginx는 `127.0.0.11`(Docker 기본값) 대신 `10.89.0.1`(Podman 기본값)을 DNS 리졸버로 사용합니다.

3. `docker-compose` 대신 `sudo podman-compose`를 사용합니다.

## 다음 단계

- [프로덕션 배포](./production) -- Caddy 리버스 프록시, HTTPS, 보안
- [설정](../configuration/) -- 환경 변수 레퍼런스
- [문제 해결](../troubleshooting/) -- 일반적인 Docker 문제
