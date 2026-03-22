---
title: 레이블
description: "OpenPR에서 색상 코드가 있는 레이블로 이슈를 구성하고 분류합니다. 레이블은 워크스페이스 전체 또는 프로젝트 범위일 수 있습니다."
---

# 레이블

레이블은 이슈를 분류하고 필터링하는 유연한 방법을 제공합니다. 각 레이블에는 이름, 색상, 선택적 설명이 있습니다.

## 레이블 생성

### 웹 UI를 통해

1. 프로젝트 또는 워크스페이스 설정으로 이동합니다.
2. **레이블**로 이동합니다.
3. **새 레이블**을 클릭합니다.
4. 이름(예: "bug", "feature", "documentation")을 입력합니다.
5. 색상을 선택합니다 (16진수 형식, 예: 빨간색에 `#ef4444`).
6. **생성**을 클릭합니다.

### API를 통해

```bash
curl -X POST http://localhost:8080/api/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "bug",
    "color": "#ef4444",
    "description": "Something is not working"
  }'
```

### MCP를 통해

```json
{
  "method": "tools/call",
  "params": {
    "name": "labels.create",
    "arguments": {
      "name": "bug",
      "color": "#ef4444"
    }
  }
}
```

## 일반적인 레이블 구성

### 유형별

| 레이블 | 색상 | 설명 |
|--------|------|------|
| `bug` | `#ef4444` (빨간색) | 무언가가 고장남 |
| `feature` | `#3b82f6` (파란색) | 새 기능 요청 |
| `enhancement` | `#8b5cf6` (보라색) | 기존 기능 개선 |
| `documentation` | `#06b6d4` (청록색) | 문서 업데이트 |
| `refactor` | `#f59e0b` (황색) | 코드 리팩토링 |

### 우선순위별

| 레이블 | 색상 | 설명 |
|--------|------|------|
| `P0-critical` | `#dc2626` (빨간색) | 프로덕션 중단 |
| `P1-high` | `#ea580c` (주황색) | 주요 기능 고장 |
| `P2-medium` | `#eab308` (노란색) | 비중요 이슈 |
| `P3-low` | `#22c55e` (녹색) | 있으면 좋음 |

## 이슈에 레이블 추가

### 웹 UI를 통해

이슈를 열고 **레이블** 필드를 클릭하여 레이블을 추가하거나 제거합니다.

### API를 통해

```bash
# 이슈에 레이블 추가
curl -X POST http://localhost:8080/api/issues/<issue_id>/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label_id": "<label_uuid>"}'
```

### MCP를 통해

| 도구 | 파라미터 | 설명 |
|------|---------|------|
| `work_items.add_label` | `work_item_id`, `label_id` | 레이블 하나 추가 |
| `work_items.add_labels` | `work_item_id`, `label_ids` | 여러 레이블 추가 |
| `work_items.remove_label` | `work_item_id`, `label_id` | 레이블 제거 |
| `work_items.list_labels` | `work_item_id` | 이슈의 레이블 나열 |

## 레이블 관리 MCP 도구

| 도구 | 파라미터 | 설명 |
|------|---------|------|
| `labels.list` | -- | 모든 워크스페이스 레이블 나열 |
| `labels.list_by_project` | `project_id` | 프로젝트의 레이블 나열 |
| `labels.create` | `name`, `color` | 레이블 생성 |
| `labels.update` | `label_id` | 이름, 색상, 설명 업데이트 |
| `labels.delete` | `label_id` | 레이블 삭제 |

## 다음 단계

- [이슈 개요](./index) -- 완전한 이슈 필드 레퍼런스
- [워크플로우 상태](./workflow) -- 이슈 생명주기 관리
- [스프린트 계획](./sprints) -- 레이블이 있는 이슈를 스프린트로 구성
