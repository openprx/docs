---
title: 설치
description: "Docker, Docker Compose 또는 Go와 Node.js로 소스에서 빌드하여 Fenfa 설치."
---

# 설치

Fenfa는 Docker (권장)와 소스에서 빌드하는 두 가지 설치 방법을 지원합니다.

::: tip 권장사항
**Docker**는 시작하는 가장 빠른 방법입니다. 단일 명령으로 빌드 도구 없이 완전히 작동하는 Fenfa 인스턴스를 제공합니다.
:::

## 사전 요구사항

| 요구사항 | 최소 버전 | 비고 |
|---------|---------|------|
| Docker | 20.10+ | 또는 Podman 3.0+ |
| Go (소스 빌드만) | 1.25+ | Docker에는 불필요 |
| Node.js (소스 빌드만) | 20+ | 프론트엔드 빌드용 |
| 디스크 공간 | 100 MB | 업로드된 빌드 스토리지 추가 |

## 방법 1: Docker (권장)

공식 이미지를 풀하고 실행합니다:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  fenfa/fenfa:latest
```

`http://localhost:8000/admin`을 방문하고 기본 토큰 `dev-admin-token`으로 로그인합니다.

::: warning 보안
기본 토큰은 개발 전용입니다. Fenfa를 인터넷에 노출하기 전에 안전한 토큰을 설정하려면 [프로덕션 배포](../deployment/production)를 참조하세요.
:::

### 영구 스토리지 사용

데이터베이스와 업로드된 파일을 위한 볼륨을 마운트합니다:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### 사용자 정의 설정 사용

모든 설정에 대한 전체 제어를 위해 `config.json` 파일을 마운트합니다:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -v ./config.json:/app/config.json:ro \
  fenfa/fenfa:latest
```

모든 사용 가능한 옵션은 [설정 레퍼런스](../configuration/)를 참조하세요.

### 환경 변수

설정 파일 없이 설정 값을 재정의합니다:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -e FENFA_ADMIN_TOKEN=your-secret-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-secret-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://dist.example.com \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `FENFA_PORT` | HTTP 포트 | `8000` |
| `FENFA_DATA_DIR` | 데이터베이스 디렉토리 | `data` |
| `FENFA_PRIMARY_DOMAIN` | 공개 도메인 URL | `http://localhost:8000` |
| `FENFA_ADMIN_TOKEN` | 관리 토큰 | `dev-admin-token` |
| `FENFA_UPLOAD_TOKEN` | 업로드 토큰 | `dev-upload-token` |

## 방법 2: Docker Compose

`docker-compose.yml`을 생성합니다:

```yaml
version: "3.8"
services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: your-secret-admin-token
      FENFA_UPLOAD_TOKEN: your-secret-upload-token
      FENFA_PRIMARY_DOMAIN: https://dist.example.com
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
```

서비스를 시작합니다:

```bash
docker compose up -d
```

## 방법 3: 소스에서 빌드

저장소를 클론합니다:

```bash
git clone https://github.com/openprx/fenfa.git
cd fenfa
```

### Make 사용

Makefile이 전체 빌드를 자동화합니다:

```bash
make build   # 프론트엔드 + 백엔드 빌드
make run     # 서버 시작
```

### 수동 빌드

먼저 프론트엔드 애플리케이션을 빌드한 다음 Go 백엔드를 빌드합니다:

```bash
# 공개 다운로드 페이지 빌드
cd web/front && npm ci && npm run build && cd ../..

# 관리 패널 빌드
cd web/admin && npm ci && npm run build && cd ../..

# Go 바이너리 빌드
go build -o fenfa ./cmd/server
```

프론트엔드는 `internal/web/dist/`에 컴파일되고 `go:embed`를 통해 Go 바이너리에 내장됩니다. 결과 `fenfa` 바이너리는 완전히 독립적입니다.

### 바이너리 실행

```bash
./fenfa
```

Fenfa는 기본적으로 포트 8000에서 시작됩니다. SQLite 데이터베이스는 `data/` 디렉토리에 자동으로 생성됩니다.

## 설치 확인

브라우저에서 `http://localhost:8000/admin`을 열고 관리 토큰으로 로그인합니다. 관리 대시보드가 표시되어야 합니다.

헬스 엔드포인트를 확인합니다:

```bash
curl http://localhost:8000/healthz
```

예상 응답:

```json
{"ok": true}
```

## 다음 단계

- [빠른 시작](./quickstart) -- 5분 안에 첫 번째 빌드 업로드
- [설정 레퍼런스](../configuration/) -- 모든 설정 옵션
- [Docker 배포](../deployment/docker) -- Docker Compose 및 멀티 아키텍처 빌드
