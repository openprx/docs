---
title: 빠른 시작
description: "OpenPR을 실행하고 5분 안에 첫 번째 워크스페이스, 프로젝트, 이슈를 생성합니다."
---

# 빠른 시작

이 가이드는 OpenPR을 설정하고 첫 번째 워크스페이스, 프로젝트, 이슈를 생성하는 방법을 안내합니다. [설치](./installation)를 이미 완료했다고 가정합니다.

## 1단계: OpenPR 시작

아직 시작하지 않았다면 서비스를 시작합니다:

```bash
cd openpr
docker-compose up -d
```

모든 서비스가 정상적인지 기다립니다:

```bash
docker-compose ps
```

## 2단계: Admin 계정 등록

브라우저에서 http://localhost:3000을 엽니다. **등록**을 클릭하고 계정을 만듭니다.

::: tip 첫 번째 사용자가 Admin
첫 번째 등록된 사용자가 자동으로 **admin** 역할을 받습니다. 이 사용자는 모든 워크스페이스, 프로젝트, 시스템 설정을 관리할 수 있습니다.
:::

## 3단계: 워크스페이스 생성

로그인 후 첫 번째 워크스페이스를 만듭니다:

1. 대시보드에서 **워크스페이스 생성**을 클릭합니다.
2. 이름(예: "My Team")과 슬러그(예: "my-team")를 입력합니다.
3. **생성**을 클릭합니다.

워크스페이스는 모든 프로젝트와 멤버의 최상위 컨테이너입니다.

## 4단계: 프로젝트 생성

워크스페이스 안에서:

1. **새 프로젝트**를 클릭합니다.
2. 이름(예: "Backend API")과 프로젝트 키(예: "API")를 입력합니다. 키는 이슈 식별자의 접두사로 사용됩니다(예: API-1, API-2).
3. **생성**을 클릭합니다.

## 5단계: 이슈 생성

프로젝트로 이동하여 이슈를 만듭니다:

1. **새 이슈**를 클릭합니다.
2. 제목과 설명을 입력합니다.
3. 상태를 설정합니다 (backlog, todo, in_progress 또는 done).
4. 선택적으로 우선순위(low, medium, high, urgent), 담당자, 레이블을 설정합니다.
5. **생성**을 클릭합니다.

이슈는 API나 MCP 서버를 통해서도 생성할 수 있습니다:

```bash
# REST API를 통해 이슈 생성
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Set up CI pipeline",
    "state": "todo",
    "priority": "high"
  }'
```

## 6단계: 칸반 보드 설정

프로젝트의 **보드** 뷰로 이동합니다. 이슈는 상태별로 열에 정리됩니다:

| 열 | 상태 | 설명 |
|----|------|------|
| Backlog | `backlog` | 아이디어 및 미래 작업 |
| To Do | `todo` | 현재 사이클에 계획된 작업 |
| In Progress | `in_progress` | 현재 진행 중인 작업 |
| Done | `done` | 완료된 작업 |

이슈를 열 사이에 드래그 앤 드롭하여 상태를 업데이트합니다.

## 7단계: 팀 멤버 초대

**워크스페이스 설정** > **멤버**로 이동합니다:

1. **멤버 초대**를 클릭합니다.
2. 이메일 주소를 입력합니다.
3. 역할을 선택합니다: **Owner**, **Admin**, 또는 **Member**.

| 역할 | 권한 |
|------|------|
| Owner | 전체 접근, 워크스페이스 삭제 가능 |
| Admin | 프로젝트, 멤버, 설정 관리 |
| Member | 이슈, 댓글 생성 및 관리 |

## 8단계: AI 어시스턴트 연결 (선택 사항)

AI 어시스턴트가 프로젝트를 관리할 수 있도록 MCP 서버를 설정합니다:

1. **워크스페이스 설정** > **봇 토큰**으로 이동합니다.
2. 새 봇 토큰을 생성합니다. `opr_` 접두사가 붙습니다.
3. 토큰으로 AI 어시스턴트를 설정합니다.

Claude Desktop 설정 예시:

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

이제 AI 어시스턴트는 34개의 MCP 도구를 통해 프로젝트 나열, 이슈 생성, 스프린트 관리 등을 할 수 있습니다.

## 다음 단계

- [워크스페이스 관리](../workspace/) -- 워크스페이스 구성 및 멤버 역할 알아보기
- [이슈 및 워크플로우](../issues/) -- 이슈 추적 및 상태 관리 심층 이해
- [스프린트 계획](../issues/sprints) -- 스프린트 사이클 설정
- [거버넌스 센터](../governance/) -- 제안, 투표, 신뢰 점수 활성화
- [API 레퍼런스](../api/) -- 외부 도구와 통합
- [MCP 서버](../mcp-server/) -- AI 어시스턴트를 위한 완전한 MCP 도구 레퍼런스
