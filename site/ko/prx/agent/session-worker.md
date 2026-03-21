---
title: Session Worker
description: 내결함성 및 리소스 격리를 위한 PRX의 프로세스 격리 세션 실행입니다.
---

# Session Worker

Session Worker는 에이전트 세션에 프로세스 수준의 격리를 제공합니다. 모든 세션을 단일 프로세스에서 실행하는 대신, PRX는 장애를 격리하고 OS 수준에서 리소스 제한을 적용하는 전용 워커 프로세스를 생성할 수 있습니다.

## 동기

프로세스 격리는 여러 이점을 제공합니다:

- **장애 격리** -- 하나의 세션에서 충돌이 발생해도 다른 세션에 영향을 미치지 않습니다
- **리소스 제한** -- cgroup 또는 OS 메커니즘을 통해 세션별 메모리 및 CPU 제한을 적용합니다
- **보안 경계** -- 다른 신뢰 수준의 세션이 별도의 주소 공간에서 실행됩니다
- **우아한 성능 저하** -- 메인 프로세스가 실패한 워커를 재시작할 수 있습니다

## 아키텍처

```
┌──────────────┐
│  Main Process │
│  (Supervisor) │
│               │
│  ┌──────────┐ │    ┌─────────────┐
│  │ Session A ├─┼───►│ Worker Proc │
│  └──────────┘ │    └─────────────┘
│  ┌──────────┐ │    ┌─────────────┐
│  │ Session B ├─┼───►│ Worker Proc │
│  └──────────┘ │    └─────────────┘
└──────────────┘
```

메인 프로세스는 슈퍼바이저로서 IPC (Unix 도메인 소켓 또는 파이프)를 통해 워커와 통신합니다.

## 통신 프로토콜

워커는 IPC 채널을 통해 길이 접두사 JSON 프로토콜을 사용하여 슈퍼바이저와 통신합니다:

1. **Spawn** -- 슈퍼바이저가 세션 설정을 워커에 전송합니다
2. **Messages** -- 사용자/에이전트 메시지의 양방향 스트리밍
3. **Heartbeat** -- 주기적 상태 확인
4. **Shutdown** -- 우아한 종료 시그널

## 설정

```toml
[agent.worker]
enabled = false
ipc_socket_dir = "/tmp/prx-workers"
heartbeat_interval_secs = 10
max_restart_attempts = 3
```

## 리소스 제한

Linux에서 실행할 때 Session Worker는 cgroup 기반 리소스 제한을 적용할 수 있습니다:

```toml
[agent.worker.limits]
memory_limit_mb = 256
cpu_shares = 512
```

## 관련 페이지

- [Agent Runtime](./runtime) -- 아키텍처 개요
- [Agent Loop](./loop) -- 핵심 실행 주기
- [보안 샌드박스](/ko/prx/security/sandbox) -- 샌드박스 백엔드
