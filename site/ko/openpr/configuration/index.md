---
title: 설정 레퍼런스
description: "API, 워커, MCP 서버, 프론트엔드, 데이터베이스에 대한 모든 OpenPR 환경 변수 및 설정 옵션의 완전한 레퍼런스."
---

# 설정 레퍼런스

OpenPR은 환경 변수를 통해 설정됩니다. 모든 서비스는 Docker Compose 사용 시 동일한 `.env` 파일에서 읽거나, 직접 실행 시 개별 환경 변수에서 읽습니다.

## API 서버

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `APP_NAME` | `api` | 로깅용 애플리케이션 식별자 |
| `BIND_ADDR` | `0.0.0.0:8080` | API가 수신 대기할 주소 및 포트 |
| `DATABASE_URL` | -- | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | `change-me-in-production` | JWT 토큰 서명용 비밀 키 |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30일) | 액세스 토큰 수명 (초) |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7일) | 갱신 토큰 수명 (초) |
| `RUST_LOG` | `info` | 로그 레벨 (trace, debug, info, warn, error) |
| `UPLOAD_DIR` | `/app/uploads` | 파일 업로드 디렉토리 |

::: danger 보안
프로덕션에서 `JWT_SECRET`을 반드시 강력한 무작위 값으로 변경하세요. 최소 32자의 무작위 데이터를 사용하세요:
```bash
openssl rand -hex 32
```
:::

## 데이터베이스

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DATABASE_URL` | -- | 완전한 PostgreSQL 연결 문자열 |
| `POSTGRES_DB` | `openpr` | 데이터베이스 이름 |
| `POSTGRES_USER` | `openpr` | 데이터베이스 사용자 |
| `POSTGRES_PASSWORD` | `openpr` | 데이터베이스 비밀번호 |

연결 문자열 형식:

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
Docker Compose 사용 시 데이터베이스 서비스 이름은 `postgres`이므로 연결 문자열은 다음과 같습니다:
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## 워커

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `APP_NAME` | `worker` | 애플리케이션 식별자 |
| `DATABASE_URL` | -- | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | -- | API 서버 값과 일치해야 함 |
| `RUST_LOG` | `info` | 로그 레벨 |

워커는 `job_queue` 및 `scheduled_jobs` 테이블에서 백그라운드 작업을 처리합니다.

## MCP 서버

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `APP_NAME` | `mcp-server` | 애플리케이션 식별자 |
| `OPENPR_API_URL` | -- | API 서버 URL (해당하는 경우 프록시 포함) |
| `OPENPR_BOT_TOKEN` | -- | `opr_` 접두사가 있는 봇 토큰 |
| `OPENPR_WORKSPACE_ID` | -- | 기본 워크스페이스 UUID |
| `DATABASE_URL` | -- | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | -- | API 서버 값과 일치해야 함 |
| `DEFAULT_AUTHOR_ID` | -- | MCP 작업의 대체 작성자 UUID |
| `RUST_LOG` | `info` | 로그 레벨 |

### MCP 전송 옵션

MCP 서버 바이너리는 커맨드라인 인수를 받습니다:

```bash
# HTTP 모드 (기본값)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# stdio 모드 (Claude Desktop, Codex용)
mcp-server --transport stdio

# 서브커맨드 형식
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## 프론트엔드

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_URL` | `http://localhost:8080` | 프론트엔드가 연결할 API 서버 URL |

::: tip 리버스 프록시
리버스 프록시(Caddy/Nginx)를 사용하는 프로덕션에서 `VITE_API_URL`은 API 서버로 라우팅하는 프록시 URL을 가리켜야 합니다.
:::

## Docker Compose 포트

| 서비스 | 내부 포트 | 외부 포트 | 목적 |
|--------|----------|----------|------|
| PostgreSQL | 5432 | 5432 | 데이터베이스 |
| API | 8080 | 8081 | REST API |
| Worker | -- | -- | 백그라운드 작업 (포트 없음) |
| MCP Server | 8090 | 8090 | MCP 도구 |
| Frontend | 80 | 3000 | 웹 UI |

## .env 파일 예제

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# API Server
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

## 로그 레벨

OpenPR은 구조화된 로깅을 위해 `tracing` 크레이트를 사용합니다. `RUST_LOG`를 설정하여 상세도를 제어합니다:

| 레벨 | 설명 |
|------|------|
| `error` | 오류만 |
| `warn` | 오류 및 경고 |
| `info` | 일반 운영 메시지 (기본값) |
| `debug` | 상세 디버깅 정보 |
| `trace` | 매우 자세함, 모든 내부 작업 포함 |

모듈별 필터링이 지원됩니다:

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## 다음 단계

- [Docker 배포](../deployment/docker) -- Docker Compose 설정
- [프로덕션 배포](../deployment/production) -- Caddy, 보안, 스케일링
- [설치](../getting-started/installation) -- 시작하기
