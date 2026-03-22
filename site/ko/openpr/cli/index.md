---
title: CLI 레퍼런스
description: "openpr-mcp 바이너리에 내장된 OpenPR CLI 레퍼런스. 프로젝트, 작업 항목, 댓글, 레이블, 스프린트 관리 명령어 및 전역 플래그."
---

# CLI 레퍼런스

OpenPR에는 `openpr-mcp` 바이너리에 내장된 CLI(명령줄 인터페이스)가 포함되어 있습니다. MCP 서버 실행 외에도 프로젝트, 작업 항목, 댓글, 레이블, 스프린트 등을 터미널에서 직접 관리하는 명령어를 제공합니다.

## 설치

CLI는 `mcp-server` 크레이트의 일부로 제공됩니다. 빌드 후 바이너리 이름은 `openpr-mcp`입니다.

```bash
cargo build --release -p mcp-server
```

## 전역 플래그

이 플래그는 모든 명령어에 적용됩니다:

| 플래그 | 설명 | 기본값 |
|--------|------|--------|
| `--api-url <URL>` | API 서버 엔드포인트 | `http://localhost:8080` |
| `--bot-token <TOKEN>` | 인증 토큰 (`opr_` 접두사) | -- |
| `--workspace-id <UUID>` | 작업 컨텍스트 워크스페이스 | -- |
| `--format json\|table` | 출력 형식 | `table` |

환경 변수로도 설정할 수 있습니다:

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## 명령어

### serve -- MCP 서버 시작

AI 도구 통합을 위한 MCP 서버를 실행합니다.

```bash
# HTTP 전송 (기본값)
openpr-mcp serve --transport http --port 8090

# stdio 전송 (직접 통합용)
openpr-mcp serve --transport stdio
```

### projects -- 프로젝트 관리

```bash
# 워크스페이스의 모든 프로젝트 나열
openpr-mcp projects list --format table

# 특정 프로젝트 상세 조회
openpr-mcp projects get <project_id>

# 새 프로젝트 생성
openpr-mcp projects create --name "My Project" --key "MP"
```

### work-items -- 작업 항목 관리

```bash
# 필터와 함께 작업 항목 나열
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# 특정 작업 항목 조회
openpr-mcp work-items get <id>

# 작업 항목 생성
openpr-mcp work-items create --project-id <id> --title "Fix bug" --state todo
openpr-mcp work-items create --project-id <id> --title "New feature" --state backlog --priority high

# 작업 항목 업데이트
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# 텍스트로 작업 항목 검색
openpr-mcp work-items search --query "authentication"
```

### comments -- 댓글 관리

```bash
# 작업 항목의 댓글 나열
openpr-mcp comments list --work-item-id <id>

# 댓글 추가
openpr-mcp comments create --work-item-id <id> --content "Fixed in commit abc123"
```

### labels -- 레이블 관리

```bash
# 워크스페이스 수준 레이블 나열
openpr-mcp labels list --workspace

# 프로젝트 수준 레이블 나열
openpr-mcp labels list --project-id <id>
```

### sprints -- 스프린트 관리

```bash
# 프로젝트의 스프린트 나열
openpr-mcp sprints list --project-id <id>
```

### search -- 전역 검색

```bash
# 모든 엔티티에 걸쳐 검색
openpr-mcp search --query "bug"
```

### files -- 파일 첨부

```bash
# 작업 항목에 파일 업로드
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## 사용 예제

### 일반적인 워크플로우

```bash
# 자격 증명 설정
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# 프로젝트 나열
openpr-mcp projects list

# 프로젝트의 할 일 항목 보기
openpr-mcp work-items list --project-id <id> --state todo --format table

# 작업 항목 시작
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# 완료 시 댓글 추가
openpr-mcp comments create --work-item-id <item_id> --content "Completed. See PR #42."

# 완료 처리
openpr-mcp work-items update <item_id> --state done
```

### 스크립팅을 위한 JSON 출력

`--format json`을 사용하여 `jq` 또는 다른 도구로 파이프하기에 적합한 기계 판독 가능 출력을 얻습니다:

```bash
# 진행 중인 항목을 JSON으로 조회
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# 상태별 항목 수 세기
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## 참고

- [MCP 서버](../mcp-server/) -- AI 에이전트를 위한 MCP 도구 통합
- [API 레퍼런스](../api/) -- 완전한 REST API 문서
- [워크플로우 상태](../issues/workflow) -- 이슈 상태 관리 및 커스텀 워크플로우
