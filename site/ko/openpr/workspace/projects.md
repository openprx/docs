---
title: 프로젝트 관리
description: "프로젝트는 워크스페이스 내에서 이슈, 스프린트, 레이블을 구성합니다. OpenPR에서 프로젝트를 생성하고 관리하는 방법을 알아봅니다."
---

# 프로젝트 관리

**프로젝트**는 워크스페이스 내에 있으며 이슈, 스프린트, 레이블, 거버넌스 제안의 컨테이너 역할을 합니다. 각 프로젝트는 이슈 식별자에 접두사가 붙는 고유한 **키**(예: `API`, `FRONT`, `OPS`)를 가집니다.

## 프로젝트 생성

워크스페이스로 이동하여 **새 프로젝트**를 클릭합니다:

| 필드 | 필수 | 설명 | 예시 |
|------|------|------|------|
| 이름 | 예 | 표시 이름 | "Backend API" |
| 키 | 예 | 이슈용 2-5자 접두사 | "API" |
| 설명 | 아니오 | 프로젝트 요약 | "REST API and business logic" |

키는 워크스페이스 내에서 고유해야 하며 이슈 식별자를 결정합니다: `API-1`, `API-2` 등.

## 프로젝트 대시보드

각 프로젝트는 다음을 제공합니다:

- **보드** -- 드래그 앤 드롭 열이 있는 칸반 뷰 (Backlog, To Do, In Progress, Done).
- **이슈** -- 필터링, 정렬, 전문 검색이 있는 목록 뷰.
- **스프린트** -- 스프린트 계획 및 사이클 관리. [스프린트](../issues/sprints) 참조.
- **레이블** -- 분류를 위한 프로젝트 범위 레이블. [레이블](../issues/labels) 참조.
- **설정** -- 프로젝트 이름, 키, 설명, 멤버 설정.

## 이슈 수

프로젝트 개요에서 상태별 이슈 수를 표시합니다:

| 상태 | 설명 |
|------|------|
| Backlog | 아이디어 및 미래 작업 |
| To Do | 현재 사이클에 계획된 작업 |
| In Progress | 현재 진행 중인 작업 |
| Done | 완료된 작업 |

## API 레퍼런스

```bash
# 워크스페이스의 프로젝트 나열
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# 프로젝트 생성
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Backend API", "key": "API"}'

# 이슈 수와 함께 프로젝트 조회
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## MCP 도구

| 도구 | 파라미터 | 설명 |
|------|---------|------|
| `projects.list` | -- | 워크스페이스의 모든 프로젝트 나열 |
| `projects.get` | `project_id` | 이슈 수와 함께 프로젝트 상세 조회 |
| `projects.create` | `key`, `name` | 새 프로젝트 생성 |
| `projects.update` | `project_id` | 이름 또는 설명 업데이트 |
| `projects.delete` | `project_id` | 프로젝트 삭제 |

## 다음 단계

- [이슈](../issues/) -- 프로젝트 내에서 이슈 생성 및 관리
- [멤버](./members) -- 워크스페이스 역할을 통해 프로젝트 접근 관리
