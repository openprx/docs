---
title: 설정 레퍼런스
description: "Fenfa의 완전한 설정 레퍼런스. 설정 파일 옵션, 환경 변수, 스토리지 설정, Apple Developer API 자격 증명."
---

# 설정 레퍼런스

Fenfa는 `config.json` 파일, 환경 변수 또는 관리 패널 (스토리지 및 Apple API와 같은 런타임 설정용)을 통해 설정할 수 있습니다.

## 설정 우선순위

1. **환경 변수** -- 최고 우선순위, 모든 것을 재정의
2. **config.json 파일** -- 시작 시 로드됨
3. **기본값** -- 아무것도 지정되지 않을 때 사용됨

## 설정 파일

작업 디렉토리에 `config.json`을 생성합니다 (또는 Docker에서 마운트):

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "Your Company Name",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## 서버 설정

| 키 | 타입 | 기본값 | 설명 |
|----|------|--------|------|
| `server.port` | string | `"8000"` | HTTP 수신 포트 |
| `server.primary_domain` | string | `"http://localhost:8000"` | 매니페스트, 콜백, 다운로드 링크에 사용되는 공개 URL |
| `server.secondary_domains` | string[] | `[]` | 추가 도메인 (CDN, 대체 액세스) |
| `server.organization` | string | `"Fenfa Distribution"` | iOS 모바일 설정 프로파일에 표시되는 조직 이름 |
| `server.bundle_id_prefix` | string | `""` | 생성된 프로파일의 번들 ID 접두사 |
| `server.data_dir` | string | `"data"` | SQLite 데이터베이스 디렉토리 |
| `server.db_path` | string | `"data/fenfa.db"` | 명시적 데이터베이스 파일 경로 |
| `server.dev_proxy_front` | string | `""` | 공개 페이지용 Vite 개발 서버 URL (개발 전용) |
| `server.dev_proxy_admin` | string | `""` | 관리 패널용 Vite 개발 서버 URL (개발 전용) |

::: warning 기본 도메인
`primary_domain` 설정은 iOS OTA 배포에 중요합니다. 최종 사용자가 접근하는 HTTPS URL이어야 합니다. iOS 매니페스트 파일은 IPA 파일 다운로드 링크에 이 URL을 사용하고 UDID 콜백은 이 도메인으로 리디렉션됩니다.
:::

## 인증

| 키 | 타입 | 기본값 | 설명 |
|----|------|--------|------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | 업로드 API를 위한 토큰 |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | 관리 API를 위한 토큰 (업로드 권한 포함) |

::: danger 기본 토큰 변경
기본 토큰 (`dev-upload-token` 및 `dev-admin-token`)은 개발 전용입니다. 프로덕션에 배포하기 전에 항상 변경하세요.
:::

각 범위에 대해 여러 토큰이 지원되므로 다른 CI/CD 파이프라인이나 팀원에게 다른 토큰을 발급하고 개별적으로 취소할 수 있습니다.

## 환경 변수

환경 변수로 모든 설정 값을 재정의합니다:

| 변수 | 설정 동등 | 설명 |
|------|---------|------|
| `FENFA_PORT` | `server.port` | HTTP 수신 포트 |
| `FENFA_DATA_DIR` | `server.data_dir` | 데이터베이스 디렉토리 |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | 공개 도메인 URL |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | 관리 토큰 (첫 번째 토큰을 대체) |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | 업로드 토큰 (첫 번째 토큰을 대체) |

예제:

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## 스토리지 설정

### 로컬 스토리지 (기본값)

파일은 작업 디렉토리를 기준으로 `uploads/{product_id}/{variant_id}/{release_id}/filename.ext`에 저장됩니다. 추가 설정이 필요 없습니다.

### S3 호환 스토리지

관리 패널의 **설정 > 스토리지** 아래에서 S3 스토리지를 설정하거나 API를 통해 설정합니다:

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

지원되는 프로바이더:
- **Cloudflare R2** -- 이그레스 비용 없음, S3 호환
- **AWS S3** -- 표준 S3
- **MinIO** -- 셀프호스팅 S3 호환 스토리지
- 모든 S3 호환 프로바이더

::: tip 업로드 도메인
기본 도메인에 파일 크기에 대한 CDN 제한이 있는 경우 대용량 파일 업로드에 대한 CDN 제한을 우회하는 별도의 도메인으로 `upload_domain`을 설정합니다.
:::

## Apple Developer API

자동 기기 등록을 위한 Apple Developer API 자격 증명을 설정합니다. 관리 패널의 **설정 > Apple Developer API** 아래에서 설정하거나 API를 통해 설정합니다:

| 필드 | 설명 |
|------|------|
| `apple_key_id` | App Store Connect의 API 키 ID |
| `apple_issuer_id` | 발급자 ID (UUID 형식) |
| `apple_private_key` | PEM 형식 개인 키 내용 |
| `apple_team_id` | Apple Developer 팀 ID |

설정 지침은 [iOS 배포](../distribution/ios)를 참조하세요.

## 데이터베이스

Fenfa는 GORM을 통해 SQLite를 사용합니다. 데이터베이스 파일은 설정된 `db_path`에 자동으로 생성됩니다. 마이그레이션은 시작 시 자동으로 실행됩니다.

::: info 백업
Fenfa를 백업하려면 SQLite 데이터베이스 파일과 `uploads/` 디렉토리를 복사합니다. S3 스토리지의 경우 데이터베이스 파일만 로컬 백업이 필요합니다.
:::

## 개발 설정

핫 리로드가 있는 로컬 개발을 위해:

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

`dev_proxy_front` 또는 `dev_proxy_admin`이 설정되면 Fenfa는 내장된 프론트엔드를 제공하는 대신 Vite 개발 서버로 요청을 프록시합니다. 이를 통해 개발 중에 핫 모듈 교체가 가능합니다.

## 다음 단계

- [Docker 배포](../deployment/docker) -- Docker 설정 및 볼륨
- [프로덕션 배포](../deployment/production) -- 리버스 프록시 및 보안 강화
- [API 개요](../api/) -- API 인증 세부 사항
