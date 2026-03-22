---
title: REST API 개요
description: "OpenPR은 워크스페이스, 프로젝트, 이슈, 거버넌스 등을 관리하는 포괄적인 REST API를 제공합니다. Rust와 Axum으로 구축되었습니다."
---

# REST API 개요

OpenPR은 모든 플랫폼 기능에 프로그래밍적 접근을 위해 **Rust**와 **Axum**으로 구축된 RESTful API를 제공합니다. API는 JSON 요청/응답 형식과 JWT 기반 인증을 지원합니다.

## 기본 URL

```
http://localhost:8080/api
```

리버스 프록시(Caddy/Nginx) 뒤의 프로덕션 배포에서 API는 일반적으로 프론트엔드 URL을 통해 프록시됩니다.

## 응답 형식

모든 API 응답은 일관된 JSON 구조를 따릅니다:

### 성공

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 오류

```json
{
  "code": 400,
  "message": "Detailed error description"
}
```

일반적인 오류 코드:

| 코드 | 의미 |
|------|------|
| 400 | 잘못된 요청 (유효성 검사 오류) |
| 401 | 미인증 (없거나 잘못된 토큰) |
| 403 | 금지됨 (불충분한 권한) |
| 404 | 찾을 수 없음 |
| 500 | 내부 서버 오류 |

## API 카테고리

| 카테고리 | 기본 경로 | 설명 |
|---------|----------|------|
| [인증](./authentication) | `/api/auth/*` | 등록, 로그인, 토큰 갱신 |
| 프로젝트 | `/api/workspaces/*/projects/*` | CRUD, 멤버, 설정 |
| 이슈 | `/api/projects/*/issues/*` | CRUD, 할당, 레이블, 댓글 |
| 보드 | `/api/projects/*/board` | 칸반 보드 상태 |
| 스프린트 | `/api/projects/*/sprints/*` | 스프린트 CRUD 및 계획 |
| 레이블 | `/api/labels/*` | 레이블 CRUD |
| 검색 | `/api/search` | 전문 검색 |
| 제안 | `/api/proposals/*` | 생성, 투표, 제출, 보관 |
| 거버넌스 | `/api/governance/*` | 설정, 감사 로그 |
| 결정 | `/api/decisions/*` | 결정 기록 |
| 신뢰 점수 | `/api/trust-scores/*` | 점수, 이력, 이의 신청 |
| 거부권 | `/api/veto/*` | 거부권, 에스컬레이션 |
| AI 에이전트 | `/api/projects/*/ai-agents/*` | 에이전트 관리 |
| AI 작업 | `/api/projects/*/ai-tasks/*` | 작업 할당 |
| 봇 토큰 | `/api/workspaces/*/bots` | 봇 토큰 CRUD |
| 파일 업로드 | `/api/v1/upload` | 멀티파트 파일 업로드 |
| 웹훅 | `/api/workspaces/*/webhooks/*` | 웹훅 CRUD |
| Admin | `/api/admin/*` | 시스템 관리 |

완전한 API 레퍼런스는 [엔드포인트 레퍼런스](./endpoints)를 참조하세요.

## 콘텐츠 유형

`multipart/form-data`를 사용하는 파일 업로드를 제외한 모든 POST/PUT/PATCH 요청은 `Content-Type: application/json`을 사용해야 합니다.

## 페이지네이션

목록 엔드포인트는 페이지네이션을 지원합니다:

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## 전문 검색

검색 엔드포인트는 이슈, 댓글, 제안에 걸쳐 PostgreSQL 전문 검색을 사용합니다:

```bash
curl "http://localhost:8080/api/search?q=authentication+bug" \
  -H "Authorization: Bearer <token>"
```

## 상태 확인

API 서버는 인증이 필요 없는 상태 확인 엔드포인트를 제공합니다:

```bash
curl http://localhost:8080/health
```

## 다음 단계

- [인증](./authentication) -- JWT 인증 및 봇 토큰
- [엔드포인트 레퍼런스](./endpoints) -- 완전한 엔드포인트 문서
- [MCP 서버](../mcp-server/) -- 34개 도구를 갖춘 AI 친화적 인터페이스
