---
title: 인증
description: "OpenPR은 사용자 인증에 JWT 토큰을, AI/MCP 접근에 봇 토큰을 사용합니다. 등록, 로그인, 토큰 갱신, 봇 토큰에 대해 알아봅니다."
---

# 인증

OpenPR은 사용자 인증에 **JWT(JSON Web Tokens)**를, AI 어시스턴트 및 MCP 서버 접근에 **봇 토큰**을 사용합니다.

## 사용자 인증 (JWT)

### 등록

새 계정 생성:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

응답:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip 첫 번째 사용자
첫 번째 등록된 사용자가 자동으로 `admin` 역할을 받습니다. 이후의 모든 사용자는 기본적으로 `user`입니다.
:::

### 로그인

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

응답에는 `access_token`, `refresh_token`, `role`이 있는 사용자 정보가 포함됩니다.

### 액세스 토큰 사용

모든 인증된 요청의 `Authorization` 헤더에 액세스 토큰을 포함합니다:

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### 토큰 갱신

액세스 토큰이 만료되면 갱신 토큰을 사용하여 새 쌍을 얻습니다:

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### 현재 사용자 조회

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

`role`(admin/user)을 포함하는 현재 사용자의 프로필을 반환합니다.

## 토큰 설정

JWT 토큰 수명은 환경 변수를 통해 설정됩니다:

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `JWT_SECRET` | `change-me-in-production` | 토큰 서명 비밀 키 |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30일) | 액세스 토큰 수명 |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7일) | 갱신 토큰 수명 |

::: danger 프로덕션 보안
프로덕션에서 `JWT_SECRET`을 반드시 강력한 무작위 값으로 설정하세요. 기본값은 안전하지 않습니다.
:::

## 봇 토큰 인증

봇 토큰은 AI 어시스턴트와 자동화 도구를 위한 인증을 제공합니다. 워크스페이스 범위를 가지며 `opr_` 접두사를 사용합니다.

### 봇 토큰 생성

봇 토큰은 워크스페이스 설정 UI 또는 API를 통해 관리됩니다:

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude Assistant"}'
```

### 봇 토큰 사용

봇 토큰은 JWT 토큰과 동일한 방식으로 사용됩니다:

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### 봇 토큰 속성

| 속성 | 설명 |
|------|------|
| 접두사 | `opr_` |
| 범위 | 하나의 워크스페이스 |
| 엔티티 유형 | `bot_mcp` 사용자 엔티티 생성 |
| 권한 | 워크스페이스 멤버와 동일 |
| 감사 추적 | 모든 행동이 봇 사용자 하에 로깅됨 |

## 인증 엔드포인트 요약

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/auth/register` | POST | 계정 생성 |
| `/api/auth/login` | POST | 로그인 및 토큰 받기 |
| `/api/auth/refresh` | POST | 토큰 쌍 갱신 |
| `/api/auth/me` | GET | 현재 사용자 정보 조회 |

## 다음 단계

- [엔드포인트 레퍼런스](./endpoints) -- 완전한 API 문서
- [MCP 서버](../mcp-server/) -- MCP와 함께 봇 토큰 사용
- [멤버 및 권한](../workspace/members) -- 역할 기반 접근
