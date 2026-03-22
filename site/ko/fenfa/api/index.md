---
title: API 개요
description: "Fenfa REST API 레퍼런스. 토큰 기반 인증, JSON 응답, 빌드 업로드, 제품 관리, 분석 쿼리를 위한 엔드포인트."
---

# API 개요

Fenfa는 빌드 업로드, 제품 관리, 분석 쿼리를 위한 REST API를 노출합니다. CI/CD 업로드부터 관리 패널 작업까지 모든 프로그래밍 방식 상호 작용은 이 API를 통해 이루어집니다.

## 기본 URL

모든 API 엔드포인트는 Fenfa 서버 URL을 기준으로 합니다:

```
https://your-domain.com
```

## 인증

보호된 엔드포인트는 `X-Auth-Token` 헤더가 필요합니다. Fenfa는 두 가지 토큰 범위를 사용합니다:

| 범위 | 가능한 작업 | 헤더 |
|------|----------|------|
| `upload` | 빌드 업로드 | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | 전체 관리 액세스 (업로드 포함) | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

토큰은 `config.json` 또는 환경 변수를 통해 설정됩니다. [설정](../configuration/)을 참조하세요.

::: warning
유효한 토큰 없이 보호된 엔드포인트에 요청하면 `401 Unauthorized` 응답을 받습니다.
:::

## 응답 형식

모든 JSON 응답은 통합된 구조를 따릅니다:

**성공:**

```json
{
  "ok": true,
  "data": { ... }
}
```

**오류:**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### 오류 코드

| 코드 | HTTP 상태 | 설명 |
|------|---------|------|
| `BAD_REQUEST` | 400 | 잘못된 요청 파라미터 |
| `UNAUTHORIZED` | 401 | 인증 토큰 누락 또는 잘못됨 |
| `FORBIDDEN` | 403 | 토큰에 필요한 범위 없음 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

## 엔드포인트 요약

### 공개 엔드포인트 (인증 불필요)

| 방법 | 경로 | 설명 |
|------|------|------|
| GET | `/products/:slug` | 제품 다운로드 페이지 (HTML) |
| GET | `/d/:releaseID` | 직접 파일 다운로드 |
| GET | `/ios/:releaseID/manifest.plist` | iOS OTA 매니페스트 |
| GET | `/udid/profile.mobileconfig?variant=:id` | UDID 바인딩 프로파일 |
| POST | `/udid/callback` | UDID 콜백 (iOS에서) |
| GET | `/udid/status?variant=:id` | UDID 바인딩 상태 |
| GET | `/healthz` | 헬스 체크 |

### 업로드 엔드포인트 (업로드 토큰)

| 방법 | 경로 | 설명 |
|------|------|------|
| POST | `/upload` | 빌드 파일 업로드 |

### 관리 엔드포인트 (관리 토큰)

| 방법 | 경로 | 설명 |
|------|------|------|
| POST | `/admin/api/smart-upload` | 자동 감지가 있는 스마트 업로드 |
| GET | `/admin/api/products` | 제품 목록 조회 |
| POST | `/admin/api/products` | 제품 생성 |
| GET | `/admin/api/products/:id` | 변형이 있는 제품 가져오기 |
| PUT | `/admin/api/products/:id` | 제품 업데이트 |
| DELETE | `/admin/api/products/:id` | 제품 삭제 |
| POST | `/admin/api/products/:id/variants` | 변형 생성 |
| PUT | `/admin/api/variants/:id` | 변형 업데이트 |
| DELETE | `/admin/api/variants/:id` | 변형 삭제 |
| GET | `/admin/api/variants/:id/stats` | 변형 통계 |
| DELETE | `/admin/api/releases/:id` | 릴리스 삭제 |
| PUT | `/admin/api/apps/:id/publish` | 앱 게시 |
| PUT | `/admin/api/apps/:id/unpublish` | 앱 게시 취소 |
| GET | `/admin/api/events` | 이벤트 쿼리 |
| GET | `/admin/api/ios_devices` | iOS 기기 목록 조회 |
| POST | `/admin/api/devices/:id/register-apple` | Apple에 기기 등록 |
| POST | `/admin/api/devices/register-apple` | 기기 일괄 등록 |
| GET | `/admin/api/settings` | 설정 가져오기 |
| PUT | `/admin/api/settings` | 설정 업데이트 |
| GET | `/admin/api/upload-config` | 업로드 설정 가져오기 |
| GET | `/admin/api/apple/status` | Apple API 상태 |
| GET | `/admin/api/apple/devices` | Apple 등록된 기기 |

### 내보내기 엔드포인트 (관리 토큰)

| 방법 | 경로 | 설명 |
|------|------|------|
| GET | `/admin/exports/releases.csv` | 릴리스 내보내기 |
| GET | `/admin/exports/events.csv` | 이벤트 내보내기 |
| GET | `/admin/exports/ios_devices.csv` | iOS 기기 내보내기 |

## ID 형식

모든 리소스 ID는 접두사 + 임의 문자열 형식을 사용합니다:

| 접두사 | 리소스 |
|--------|--------|
| `prd_` | 제품 |
| `var_` | 변형 |
| `rel_` | 릴리스 |
| `app_` | 앱 (레거시) |

## 상세 레퍼런스

- [업로드 API](./upload) -- 필드 레퍼런스와 예제가 있는 업로드 엔드포인트
- [관리 API](./admin) -- 전체 관리 엔드포인트 문서
