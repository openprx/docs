---
title: 설치
description: "Docker Compose, Podman, 또는 Rust와 Node.js로 소스 빌드를 사용하여 OpenPR을 설치합니다."
---

# 설치

OpenPR은 세 가지 설치 방법을 지원합니다. Docker Compose가 완전히 작동하는 인스턴스를 가장 빠르게 실행하는 방법입니다.

::: tip 권장
**Docker Compose**는 단일 명령으로 모든 서비스(API, 프론트엔드, 워커, MCP 서버, PostgreSQL)를 시작합니다. Rust 툴체인이나 Node.js가 필요하지 않습니다.
:::

## 전제 조건

| 요구 사항 | 최소 | 비고 |
|----------|------|------|
| Docker | 20.10+ | 또는 podman-compose가 있는 Podman 3.0+ |
| Docker Compose | 2.0+ | Docker Desktop에 포함 |
| Rust (소스 빌드) | 1.75.0 | Docker 설치에는 필요 없음 |
| Node.js (소스 빌드) | 20+ | SvelteKit 프론트엔드 빌드용 |
| PostgreSQL (소스 빌드) | 15+ | Docker 방법에 PostgreSQL 포함 |
| 디스크 공간 | 500 MB | 이미지 + 데이터베이스 |
| RAM | 1 GB | 프로덕션에는 2 GB+ 권장 |

## 방법 1: Docker Compose (권장)

리포지토리를 클론하고 모든 서비스를 시작합니다:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

5개의 서비스를 시작합니다:

| 서비스 | 컨테이너 | 포트 | 설명 |
|--------|---------|------|------|
| PostgreSQL | `openpr-postgres` | 5432 | 자동 마이그레이션이 있는 데이터베이스 |
| API | `openpr-api` | 8081 (8080으로 매핑) | REST API 서버 |
| 워커 | `openpr-worker` | -- | 백그라운드 작업 처리기 |
| MCP 서버 | `openpr-mcp-server` | 8090 | MCP 도구 서버 |
| 프론트엔드 | `openpr-frontend` | 3000 | SvelteKit 웹 UI |

모든 서비스가 실행 중인지 확인합니다:

```bash
docker-compose ps
```

::: warning 첫 번째 사용자
등록하는 첫 번째 사용자가 자동으로 **admin**이 됩니다. URL을 다른 사람과 공유하기 전에 admin 계정을 등록하세요.
:::

### 환경 변수

배포를 커스터마이징하려면 `.env`를 편집합니다:

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (프로덕션에서 변경!)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

::: danger 보안
프로덕션에 배포하기 전에 `JWT_SECRET`과 데이터베이스 비밀번호를 반드시 변경하세요. 강력한 무작위 값을 사용하세요.
:::

## 방법 2: Podman

OpenPR은 Docker 대안으로 Podman과 함께 작동합니다. 주요 차이점은 Podman이 DNS 확인을 위해 빌드 시 `--network=host`가 필요하다는 것입니다:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# 네트워크 접근으로 이미지 빌드
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# 서비스 시작
sudo podman-compose up -d
```

::: tip Podman DNS
프론트엔드 Nginx 컨테이너는 `127.0.0.11`(Docker 기본값) 대신 `10.89.0.1`(Podman의 기본 네트워크 DNS)을 DNS 리졸버로 사용합니다. 이는 포함된 Nginx 설정에 이미 구성되어 있습니다.
:::

## 방법 3: 소스에서 빌드

### 백엔드

```bash
# 전제 조건: Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# 설정
cp .env.example .env
# PostgreSQL 연결 문자열로 .env 편집

# 모든 바이너리 빌드
cargo build --release -p api -p worker -p mcp-server
```

바이너리 위치:
- `target/release/api` -- REST API 서버
- `target/release/worker` -- 백그라운드 워커
- `target/release/mcp-server` -- MCP 도구 서버

### 프론트엔드

```bash
cd frontend
npm install    # 또는: bun install
npm run build  # 또는: bun run build
```

빌드 출력은 `frontend/build/`에 있습니다. Nginx나 다른 정적 파일 서버로 제공합니다.

### 데이터베이스 설정

데이터베이스를 생성하고 마이그레이션을 실행합니다:

```bash
# 데이터베이스 생성
createdb -U postgres openpr

# 마이그레이션은 첫 API 시작 시 자동으로 실행됨
# 또는 수동으로 적용:
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... 나머지 마이그레이션을 순서대로 적용
```

### 서비스 시작

```bash
# 터미널 1: API 서버
./target/release/api

# 터미널 2: 워커
./target/release/worker

# 터미널 3: MCP 서버
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## 설치 확인

모든 서비스가 실행 중이면 각 엔드포인트를 확인합니다:

```bash
# API 상태 확인
curl http://localhost:8080/health

# MCP 서버 상태
curl http://localhost:8090/health

# 프론트엔드
curl -s http://localhost:3000 | head -5
```

브라우저에서 http://localhost:3000을 열어 웹 UI에 접근합니다.

## 제거

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v는 볼륨(데이터베이스 데이터)을 제거
docker rmi $(docker images 'openpr*' -q)
```

### 소스 빌드

```bash
# 실행 중인 서비스 중지 (각 터미널에서 Ctrl+C)
# 바이너리 제거
rm -f target/release/api target/release/worker target/release/mcp-server

# 데이터베이스 삭제 (선택 사항)
dropdb -U postgres openpr
```

## 다음 단계

- [빠른 시작](./quickstart) -- 5분 안에 첫 번째 워크스페이스와 프로젝트 생성
- [Docker 배포](../deployment/docker) -- 프로덕션 Docker 설정
- [프로덕션 배포](../deployment/production) -- Caddy, PostgreSQL, 보안 강화
