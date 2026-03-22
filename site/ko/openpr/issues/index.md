---
title: 이슈 및 추적
description: "OpenPR 이슈는 핵심 작업 단위입니다. 상태, 우선순위, 담당자, 레이블, 댓글로 작업, 버그, 기능을 추적합니다."
---

# 이슈 및 추적

이슈(작업 항목이라고도 함)는 OpenPR의 핵심 작업 단위입니다. 프로젝트 내에서 작업, 버그, 기능 또는 추적 가능한 모든 작업을 나타냅니다.

## 이슈 필드

| 필드 | 유형 | 필수 | 설명 |
|------|------|------|------|
| 제목 | string | 예 | 작업에 대한 간단한 설명 |
| 설명 | markdown | 아니오 | 서식이 있는 상세 설명 |
| 상태 | enum | 예 | 워크플로우 상태 ([워크플로우](./workflow) 참조) |
| 우선순위 | enum | 아니오 | `low`, `medium`, `high`, `urgent` |
| 담당자 | user | 아니오 | 이슈를 담당하는 팀 멤버 |
| 레이블 | list | 아니오 | 분류 태그 ([레이블](./labels) 참조) |
| 스프린트 | sprint | 아니오 | 이슈가 속하는 스프린트 사이클 |
| 마감일 | datetime | 아니오 | 목표 완료 날짜 |
| 첨부 파일 | files | 아니오 | 첨부된 파일 (이미지, 문서, 로그) |

## 이슈 식별자

각 이슈는 프로젝트 키와 순차 번호로 구성된 사람이 읽을 수 있는 식별자를 가집니다:

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

워크스페이스의 모든 프로젝트에서 식별자로 이슈를 조회할 수 있습니다.

## 이슈 생성

### 웹 UI를 통해

1. 프로젝트로 이동합니다.
2. **새 이슈**를 클릭합니다.
3. 제목, 설명, 선택적 필드를 입력합니다.
4. **생성**을 클릭합니다.

### REST API를 통해

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement user settings page",
    "description": "Add a settings page where users can update their profile.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### MCP를 통해

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Implement user settings page",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## 댓글

이슈는 마크다운 서식과 파일 첨부가 있는 스레드 댓글을 지원합니다:

```bash
# 댓글 추가
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Fixed in commit abc123. Ready for review."}'
```

댓글은 MCP 도구를 통해서도 사용할 수 있습니다: `comments.create`, `comments.list`, `comments.delete`.

## 활동 피드

이슈에 대한 모든 변경 사항이 활동 피드에 기록됩니다:

- 상태 변경
- 담당자 변경
- 레이블 추가/제거
- 댓글
- 우선순위 업데이트

활동 피드는 각 이슈에 대한 완전한 감사 추적을 제공합니다.

## 파일 첨부

이슈와 댓글은 이미지, 문서, 로그, 아카이브 등의 파일 첨부를 지원합니다. API를 통해 업로드합니다:

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

또는 MCP를 통해:

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<base64_encoded_content>"
    }
  }
}
```

지원되는 파일 유형: 이미지(PNG, JPG, GIF, WebP), 문서(PDF, TXT), 데이터(JSON, CSV, XML), 아카이브(ZIP, GZ), 로그.

## 검색

OpenPR은 PostgreSQL FTS를 사용하여 모든 이슈, 댓글, 제안에서 전문 검색을 제공합니다:

```bash
# API를 통해 검색
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# MCP를 통해 검색
# work_items.search: 프로젝트 내에서 검색
# search.all: 모든 프로젝트에 걸친 전역 검색
```

## MCP 도구

| 도구 | 파라미터 | 설명 |
|------|---------|------|
| `work_items.list` | `project_id` | 프로젝트의 이슈 나열 |
| `work_items.get` | `work_item_id` | UUID로 이슈 조회 |
| `work_items.get_by_identifier` | `identifier` | 사람이 읽을 수 있는 ID로 조회 (예: `API-42`) |
| `work_items.create` | `project_id`, `title` | 이슈 생성 |
| `work_items.update` | `work_item_id` | 모든 필드 업데이트 |
| `work_items.delete` | `work_item_id` | 이슈 삭제 |
| `work_items.search` | `query` | 전문 검색 |
| `comments.create` | `work_item_id`, `content` | 댓글 추가 |
| `comments.list` | `work_item_id` | 댓글 나열 |
| `comments.delete` | `comment_id` | 댓글 삭제 |
| `files.upload` | `filename`, `content_base64` | 파일 업로드 |

## 다음 단계

- [워크플로우 상태](./workflow) -- 이슈 생명주기 이해
- [스프린트 계획](./sprints) -- 이슈를 스프린트 사이클로 구성
- [레이블](./labels) -- 레이블로 이슈 분류
