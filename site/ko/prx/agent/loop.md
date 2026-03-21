---
title: Agent Loop
description: PRX의 핵심 에이전트 루프로, 도구 디스패치, 스트리밍, 메모리 리콜, 컨텍스트 압축을 다룹니다.
---

# Agent Loop

에이전트 루프는 모든 PRX 에이전트 세션을 구동하는 중앙 실행 주기입니다. 각 반복은 LLM 응답을 처리하고, 도구 호출을 디스패치하며, 메모리를 관리하고, 계속할지 최종 답변을 반환할지 결정합니다.

## 루프 생명주기

```
User Message
    │
    ▼
┌─────────────┐
│ Build Context│──── Memory Recall
└──────┬──────┘
       ▼
┌─────────────┐
│ LLM Inference│──── Streaming Response
└──────┬──────┘
       ▼
┌─────────────┐
│ Parse Output │──── Tool Calls / Text
└──────┬──────┘
       ▼
   Tool Calls?
   ├── Yes ──→ Execute Tools ──→ Loop Again
   └── No  ──→ Return Response
```

## 도구 디스패치

LLM 응답에 도구 호출이 포함된 경우 루프는:

1. 각 도구 호출을 보안 정책에 대해 검증합니다
2. 승인된 호출을 실행합니다 (잠재적으로 병렬)
3. 결과를 수집하여 LLM에 다시 제공합니다
4. 다음 추론 단계를 위해 루프를 계속합니다

## 스트리밍

PRX는 LLM 응답을 토큰 단위로 클라이언트에 스트리밍하면서 동시에 도구 호출 감지를 위해 버퍼링합니다. 스트리밍 파이프라인은 다음을 지원합니다:

- CLI 또는 WebSocket 클라이언트로의 실시간 토큰 전달
- 클라이언트가 느릴 때 백프레셔 처리
- Ctrl+C 또는 API 시그널을 통한 우아한 취소

## 메모리 리콜

각 LLM 호출 전에 루프는 메모리 시스템에서 관련 컨텍스트를 검색합니다:

- 최근 대화 턴 (슬라이딩 윈도우)
- 임베딩 저장소의 시맨틱 검색 결과
- 고정된 팩트 및 사용자 선호도

## 컨텍스트 압축

대화가 모델의 컨텍스트 윈도우를 초과하면 루프가 압축을 트리거합니다:

1. 이전 턴을 압축된 표현으로 요약합니다
2. 여전히 참조되는 도구 호출 결과를 보존합니다
3. 시스템 프롬프트와 고정된 메모리를 그대로 유지합니다

## 설정

```toml
[agent.loop]
max_iterations = 50
parallel_tool_calls = true
compaction_threshold_tokens = 80000
compaction_strategy = "summarize"  # or "truncate"
```

## 관련 페이지

- [Agent Runtime](./runtime) -- 아키텍처 개요
- [Sub-agents](./subagents) -- 자식 에이전트 생성
- [메모리 시스템](/ko/prx/memory/) -- 메모리 백엔드 및 리콜
