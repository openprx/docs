---
title: MCP 서버
description: "OpenPR에는 HTTP, stdio, SSE 전송을 통해 34개의 도구를 갖춘 내장 MCP 서버가 포함되어 있습니다. Claude, Codex, Cursor 같은 AI 어시스턴트를 프로젝트 관리와 통합합니다."
---

# MCP 서버

OpenPR에는 AI 어시스턴트가 프로젝트, 이슈, 스프린트, 레이블, 댓글, 제안, 파일을 관리하기 위한 34개의 도구를 노출하는 내장 **MCP(Model Context Protocol) 서버**가 포함되어 있습니다. 서버는 세 가지 전송 프로토콜을 동시에 지원합니다.

## 전송 프로토콜

| 프로토콜 | 사용 사례 | 엔드포인트 |
|---------|---------|----------|
| **HTTP** | 웹 통합, OpenClaw 플러그인 | `POST /mcp/rpc` |
| **stdio** | Claude Desktop, Codex, 로컬 CLI | stdin/stdout JSON-RPC |
| **SSE** | 스트리밍 클라이언트, 실시간 UI | `GET /sse` + `POST /messages` |

::: tip 멀티 프로토콜
HTTP 모드에서는 단일 포트에서 세 가지 프로토콜 모두 사용 가능합니다: `/mcp/rpc`(HTTP), `/sse` + `/messages`(SSE), `/health`(상태 확인).
:::

## 설정

### 환경 변수

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `OPENPR_API_URL` | 예 | API 서버 기본 URL | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | 예 | `opr_` 접두사가 있는 봇 토큰 | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | 예 | 기본 워크스페이스 UUID | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex (stdio)

MCP 클라이언트 설정에 추가합니다:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

### HTTP 모드

```bash
# MCP 서버 시작
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# 확인
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 도구 레퍼런스 (34개 도구)

### 프로젝트 (5개)

| 도구 | 필수 파라미터 | 설명 |
|------|------------|------|
| `projects.list` | -- | 워크스페이스의 모든 프로젝트 나열 |
| `projects.get` | `project_id` | 이슈 수와 함께 프로젝트 상세 조회 |
| `projects.create` | `key`, `name` | 프로젝트 생성 |
| `projects.update` | `project_id` | 이름/설명 업데이트 |
| `projects.delete` | `project_id` | 프로젝트 삭제 |

### 작업 항목 / 이슈 (11개)

| 도구 | 필수 파라미터 | 설명 |
|------|------------|------|
| `work_items.list` | `project_id` | 프로젝트의 이슈 나열 |
| `work_items.get` | `work_item_id` | UUID로 이슈 조회 |
| `work_items.get_by_identifier` | `identifier` | 사람이 읽을 수 있는 ID로 조회 (예: `API-42`) |
| `work_items.create` | `project_id`, `title` | 이슈 생성 (선택적 state, priority, description, assignee_id, due_at, attachments) |
| `work_items.update` | `work_item_id` | 모든 필드 업데이트 |
| `work_items.delete` | `work_item_id` | 이슈 삭제 |
| `work_items.search` | `query` | 모든 프로젝트에 걸쳐 전문 검색 |
| `work_items.add_label` | `work_item_id`, `label_id` | 레이블 하나 추가 |
| `work_items.add_labels` | `work_item_id`, `label_ids` | 여러 레이블 추가 |
| `work_items.remove_label` | `work_item_id`, `label_id` | 레이블 제거 |
| `work_items.list_labels` | `work_item_id` | 이슈의 레이블 나열 |

### 댓글 (3개)

| 도구 | 필수 파라미터 | 설명 |
|------|------------|------|
| `comments.create` | `work_item_id`, `content` | 선택적 첨부와 함께 댓글 생성 |
| `comments.list` | `work_item_id` | 이슈의 댓글 나열 |
| `comments.delete` | `comment_id` | 댓글 삭제 |

### 파일 (1개)

| 도구 | 필수 파라미터 | 설명 |
|------|------------|------|
| `files.upload` | `filename`, `content_base64` | 파일 업로드 (base64), URL과 파일명 반환 |

### 레이블 (5개)

| 도구 | 필수 파라미터 | 설명 |
|------|------------|------|
| `labels.list` | -- | 모든 워크스페이스 레이블 나열 |
| `labels.list_by_project` | `project_id` | 프로젝트의 레이블 나열 |
| `labels.create` | `name`, `color` | 레이블 생성 (color: 16진수, 예: `#2563eb`) |
| `labels.update` | `label_id` | 이름/색상/설명 업데이트 |
| `labels.delete` | `label_id` | 레이블 삭제 |

### 스프린트 (4개)

| 도구 | 필수 파라미터 | 설명 |
|------|------------|------|
| `sprints.list` | `project_id` | 프로젝트의 스프린트 나열 |
| `sprints.create` | `project_id`, `name` | 선택적 start_date, end_date와 함께 스프린트 생성 |
| `sprints.update` | `sprint_id` | 이름/날짜/상태 업데이트 |
| `sprints.delete` | `sprint_id` | 스프린트 삭제 |

### 제안 (3개)

| 도구 | 필수 파라미터 | 설명 |
|------|------------|------|
| `proposals.list` | `project_id` | 선택적 상태 필터와 함께 제안 나열 |
| `proposals.get` | `proposal_id` | 제안 상세 조회 |
| `proposals.create` | `project_id`, `title`, `description` | 거버넌스 제안 생성 |

### 멤버 및 검색 (2개)

| 도구 | 필수 파라미터 | 설명 |
|------|------------|------|
| `members.list` | -- | 워크스페이스 멤버 및 역할 나열 |
| `search.all` | `query` | 프로젝트, 이슈, 댓글에 걸쳐 전역 검색 |

## 봇 토큰 인증

MCP 서버는 **봇 토큰**(접두사 `opr_`)을 통해 인증합니다. **워크스페이스 설정** > **봇 토큰**에서 봇 토큰을 생성합니다.

## 다음 단계

- [API 개요](../api/) -- REST API 레퍼런스
- [멤버 및 권한](../workspace/members) -- 봇 토큰 관리
- [설정](../configuration/) -- 모든 환경 변수
