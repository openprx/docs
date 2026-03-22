---
title: Docker 배포
description: "Docker와 Docker Compose로 Fenfa 배포. 컨테이너 설정, 볼륨, 멀티 아키텍처 빌드, 헬스 체크."
---

# Docker 배포

Fenfa는 임베디드 프론트엔드가 포함된 Go 바이너리를 담은 단일 Docker 이미지로 제공됩니다. 추가 컨테이너가 필요 없습니다 -- 영구 데이터를 위한 볼륨만 마운트하면 됩니다.

## 빠른 시작

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

`docker-compose.yml`을 생성합니다:

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

컴포즈 파일 옆에 `.env` 파일을 생성합니다:

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

서비스를 시작합니다:

```bash
docker compose up -d
```

## 볼륨

| 마운트 포인트 | 목적 | 백업 필요 여부 |
|-------------|------|--------------|
| `/data` | SQLite 데이터베이스 | 예 |
| `/app/uploads` | 업로드된 바이너리 파일 | 예 (S3 사용 시 불필요) |
| `/app/config.json` | 설정 파일 (선택 사항) | 예 |

::: warning 데이터 지속성
볼륨 마운트 없이는 컨테이너가 재생성될 때 모든 데이터가 손실됩니다. 프로덕션 사용 시에는 항상 `/data`와 `/app/uploads`를 마운트하세요.
:::

## 설정 파일 사용

완전한 제어를 위해 설정 파일을 마운트합니다:

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## 헬스 체크

Fenfa는 `/healthz`에서 헬스 엔드포인트를 제공합니다:

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

위의 Docker Compose 예제에는 헬스 체크 설정이 포함되어 있습니다. Kubernetes나 Nomad 같은 오케스트레이터의 경우 이 엔드포인트를 활성/준비 프로브로 사용하세요.

## 멀티 아키텍처

Fenfa의 Docker 이미지는 `linux/amd64`와 `linux/arm64` 모두를 지원합니다. Docker는 호스트에 맞는 아키텍처를 자동으로 가져옵니다.

직접 멀티 아키텍처 이미지를 빌드하려면:

```bash
./scripts/docker-build.sh
```

이 명령은 Docker Buildx를 사용하여 두 아키텍처 모두를 위한 이미지를 생성합니다.

## 리소스 요구 사항

Fenfa는 경량입니다:

| 리소스 | 최소 | 권장 |
|--------|------|------|
| CPU | 1 코어 | 2 코어 |
| RAM | 64 MB | 256 MB |
| 디스크 | 100 MB (앱) | 업로드된 파일에 따라 다름 |

SQLite 데이터베이스와 Go 바이너리는 최소한의 오버헤드를 가집니다. 리소스 사용량은 주로 업로드 스토리지와 동시 연결 수에 따라 달라집니다.

## 로그

컨테이너 로그 보기:

```bash
docker logs -f fenfa
```

Fenfa는 로그 집계 도구와 호환되는 구조화된 형식으로 stdout에 로그를 기록합니다.

## 업데이트

```bash
docker compose pull
docker compose up -d
```

::: tip 무중단 업데이트
Fenfa는 빠르게 시작됩니다 (< 1초). 거의 무중단 업데이트를 위해 리버스 프록시 헬스 체크를 사용하면 새 컨테이너가 헬스 체크를 통과하는 즉시 트래픽이 자동으로 라우팅됩니다.
:::

## 다음 단계

- [프로덕션 배포](./production) -- 리버스 프록시, TLS, 보안
- [설정 레퍼런스](../configuration/) -- 모든 설정 옵션
- [문제 해결](../troubleshooting/) -- 일반적인 Docker 문제
