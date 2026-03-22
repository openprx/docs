---
title: 스프린트 관리
description: "OpenPR 스프린트로 시간 제한 반복에서 작업을 계획하고 추적합니다. 스프린트 생성, 이슈 할당, 진행 모니터링."
---

# 스프린트 관리

스프린트는 작업을 구성하고 추적하기 위한 시간 제한 반복입니다. 각 스프린트는 프로젝트에 속하며 시작 날짜, 종료 날짜, 할당된 이슈 세트를 가집니다.

## 스프린트 생성

### 웹 UI를 통해

1. 프로젝트로 이동합니다.
2. **스프린트** 섹션으로 이동합니다.
3. **새 스프린트**를 클릭합니다.
4. 스프린트 이름, 시작 날짜, 종료 날짜를 입력합니다.

### API를 통해

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sprint 1",
    "start_date": "2026-03-24",
    "end_date": "2026-04-07"
  }'
```

### MCP를 통해

```json
{
  "method": "tools/call",
  "params": {
    "name": "sprints.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "name": "Sprint 1",
      "start_date": "2026-03-24",
      "end_date": "2026-04-07"
    }
  }
}
```

## 스프린트 필드

| 필드 | 유형 | 필수 | 설명 |
|------|------|------|------|
| 이름 | string | 예 | 스프린트 이름 (예: "Sprint 1", "Q1 Week 3") |
| 시작 날짜 | date | 아니오 | 스프린트 시작 날짜 |
| 종료 날짜 | date | 아니오 | 스프린트 종료 날짜 |
| 상태 | enum | 자동 | 활성, 완료, 또는 계획됨 |

## 스프린트에 이슈 할당

이슈의 `sprint_id`를 업데이트하여 스프린트에 이슈를 할당합니다:

```bash
curl -X PATCH http://localhost:8080/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sprint_id": "<sprint_uuid>"}'
```

또는 웹 UI에서 이슈를 스프린트 섹션으로 드래그하거나 이슈 상세 패널을 사용합니다.

## 스프린트 계획 워크플로우

일반적인 스프린트 계획 워크플로우:

1. **스프린트 생성** -- 시작 및 종료 날짜 포함.
2. **백로그 검토** -- 포함할 이슈 식별.
3. **이슈 이동** -- Backlog/To Do에서 스프린트로 이동.
4. **우선순위 설정** -- 스프린트 이슈의 우선순위 및 담당자 지정.
5. **스프린트 시작** -- 팀이 작업 시작.
6. **진행 추적** -- 보드 및 스프린트 뷰에서 모니터링.
7. **스프린트 완료** -- 완료/남은 항목 검토.

## MCP 도구

| 도구 | 파라미터 | 설명 |
|------|---------|------|
| `sprints.list` | `project_id` | 프로젝트의 스프린트 나열 |
| `sprints.create` | `project_id`, `name` | 선택적 날짜와 함께 스프린트 생성 |
| `sprints.update` | `sprint_id` | 이름, 날짜, 상태 업데이트 |
| `sprints.delete` | `sprint_id` | 스프린트 삭제 |

## 다음 단계

- [워크플로우 상태](./workflow) -- 이슈 상태 전환 이해
- [레이블](./labels) -- 스프린트 이슈 분류
- [이슈 개요](./index) -- 완전한 이슈 필드 레퍼런스
