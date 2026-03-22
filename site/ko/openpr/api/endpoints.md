---
title: API 엔드포인트 레퍼런스
description: "인증, 프로젝트, 이슈, 거버넌스, AI, 관리 작업을 포함한 모든 OpenPR REST API 엔드포인트의 완전한 레퍼런스."
---

# API 엔드포인트 레퍼런스

이 페이지는 모든 OpenPR REST API 엔드포인트의 완전한 레퍼런스를 제공합니다. 별도로 명시되지 않는 한 모든 엔드포인트는 인증이 필요합니다.

## 인증

| 메서드 | 엔드포인트 | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/auth/register` | 새 계정 생성 | 없음 |
| POST | `/api/auth/login` | 로그인 및 토큰 받기 | 없음 |
| POST | `/api/auth/refresh` | 액세스 토큰 갱신 | 없음 |
| GET | `/api/auth/me` | 현재 사용자 정보 조회 | 예 |

## 워크스페이스

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/workspaces` | 사용자의 워크스페이스 나열 |
| POST | `/api/workspaces` | 워크스페이스 생성 |
| GET | `/api/workspaces/:id` | 워크스페이스 상세 조회 |
| PUT | `/api/workspaces/:id` | 워크스페이스 업데이트 |
| DELETE | `/api/workspaces/:id` | 워크스페이스 삭제 (소유자만) |

## 워크스페이스 멤버

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/workspaces/:id/members` | 멤버 나열 |
| POST | `/api/workspaces/:id/members` | 멤버 추가 |
| PUT | `/api/workspaces/:id/members/:user_id` | 멤버 역할 업데이트 |
| DELETE | `/api/workspaces/:id/members/:user_id` | 멤버 제거 |

## 봇 토큰

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/workspaces/:id/bots` | 봇 토큰 나열 |
| POST | `/api/workspaces/:id/bots` | 봇 토큰 생성 |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | 봇 토큰 삭제 |

## 프로젝트

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/workspaces/:ws_id/projects` | 프로젝트 나열 |
| POST | `/api/workspaces/:ws_id/projects` | 프로젝트 생성 |
| GET | `/api/workspaces/:ws_id/projects/:id` | 수와 함께 프로젝트 조회 |
| PUT | `/api/workspaces/:ws_id/projects/:id` | 프로젝트 업데이트 |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | 프로젝트 삭제 |

## 이슈 (작업 항목)

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/projects/:id/issues` | 이슈 나열 (페이지네이션, 필터) |
| POST | `/api/projects/:id/issues` | 이슈 생성 |
| GET | `/api/issues/:id` | UUID로 이슈 조회 |
| PATCH | `/api/issues/:id` | 이슈 필드 업데이트 |
| DELETE | `/api/issues/:id` | 이슈 삭제 |

### 이슈 필드 (생성/업데이트)

```json
{
  "title": "string (생성 시 필수)",
  "description": "string (markdown)",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "ISO 8601 datetime"
}
```

## 보드

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/projects/:id/board` | 칸반 보드 상태 조회 |

## 댓글

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/issues/:id/comments` | 이슈의 댓글 나열 |
| POST | `/api/issues/:id/comments` | 댓글 생성 |
| DELETE | `/api/comments/:id` | 댓글 삭제 |

## 레이블

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/labels` | 모든 워크스페이스 레이블 나열 |
| POST | `/api/labels` | 레이블 생성 |
| PUT | `/api/labels/:id` | 레이블 업데이트 |
| DELETE | `/api/labels/:id` | 레이블 삭제 |
| POST | `/api/issues/:id/labels` | 이슈에 레이블 추가 |
| DELETE | `/api/issues/:id/labels/:label_id` | 이슈에서 레이블 제거 |

## 스프린트

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/projects/:id/sprints` | 스프린트 나열 |
| POST | `/api/projects/:id/sprints` | 스프린트 생성 |
| PUT | `/api/sprints/:id` | 스프린트 업데이트 |
| DELETE | `/api/sprints/:id` | 스프린트 삭제 |

## 제안

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/proposals` | 제안 나열 |
| POST | `/api/proposals` | 제안 생성 |
| GET | `/api/proposals/:id` | 제안 상세 조회 |
| POST | `/api/proposals/:id/vote` | 투표 행사 |
| POST | `/api/proposals/:id/submit` | 투표를 위해 제출 |
| POST | `/api/proposals/:id/archive` | 제안 보관 |

## 거버넌스

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/governance/config` | 거버넌스 설정 조회 |
| PUT | `/api/governance/config` | 거버넌스 설정 업데이트 |
| GET | `/api/governance/audit-logs` | 거버넌스 감사 로그 나열 |

## 결정

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/decisions` | 결정 나열 |
| GET | `/api/decisions/:id` | 결정 상세 조회 |

## 신뢰 점수

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/trust-scores` | 신뢰 점수 나열 |
| GET | `/api/trust-scores/:user_id` | 사용자 신뢰 점수 조회 |
| GET | `/api/trust-scores/:user_id/history` | 점수 이력 조회 |
| POST | `/api/trust-scores/:user_id/appeals` | 이의 신청 제출 |

## 거부권

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/veto` | 거부권 이벤트 나열 |
| POST | `/api/veto` | 거부권 생성 |
| POST | `/api/veto/:id/escalate` | 거부권 에스컬레이션 |

## AI 에이전트

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/projects/:id/ai-agents` | AI 에이전트 나열 |
| POST | `/api/projects/:id/ai-agents` | AI 에이전트 등록 |
| GET | `/api/projects/:id/ai-agents/:agent_id` | 에이전트 상세 조회 |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | 에이전트 업데이트 |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | 에이전트 제거 |

## AI 작업

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/projects/:id/ai-tasks` | AI 작업 나열 |
| POST | `/api/projects/:id/ai-tasks` | AI 작업 생성 |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | 작업 상태 업데이트 |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | 작업 콜백 |

## 파일 업로드

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| POST | `/api/v1/upload` | 파일 업로드 (multipart/form-data) |

지원 유형: 이미지(PNG, JPG, GIF, WebP), 문서(PDF, TXT), 데이터(JSON, CSV, XML), 아카이브(ZIP, GZ), 로그.

## 웹훅

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/workspaces/:id/webhooks` | 웹훅 나열 |
| POST | `/api/workspaces/:id/webhooks` | 웹훅 생성 |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | 웹훅 업데이트 |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | 웹훅 삭제 |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | 전달 로그 |

## 검색

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/search?q=<query>` | 모든 엔티티에 걸쳐 전문 검색 |

## Admin

| 메서드 | 엔드포인트 | 설명 |
|--------|----------|------|
| GET | `/api/admin/users` | 모든 사용자 나열 (admin만) |
| PUT | `/api/admin/users/:id` | 사용자 업데이트 (admin만) |

## 상태 확인

| 메서드 | 엔드포인트 | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/health` | 상태 확인 | 없음 |

## 다음 단계

- [인증](./authentication) -- 토큰 관리 및 봇 토큰
- [API 개요](./index) -- 응답 형식 및 규칙
- [MCP 서버](../mcp-server/) -- AI 친화적 인터페이스
