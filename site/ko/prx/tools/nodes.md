---
title: 원격 노드
description: 여러 머신에 걸친 분산 에이전트 실행을 위해 원격 PRX 노드를 관리하고 통신합니다.
---

# 원격 노드

`nodes` 도구는 PRX 에이전트가 분산 배포에서 원격 PRX 인스턴스와 상호작용할 수 있게 합니다. 노드는 다른 머신에서 실행되는 별도의 PRX 데몬으로, 다른 하드웨어 기능, 네트워크 접근 또는 도구 설정을 가질 수 있으며, 컨트롤러 인스턴스와 페어링되어 있습니다.

`nodes` 도구를 통해 에이전트는 사용 가능한 노드를 검색하고, 상태를 확인하고, 전문 기능(예: GPU 접근)을 가진 노드로 작업을 라우팅하고, 결과를 검색할 수 있습니다. 이를 통해 워크로드 분산, 환경 특수화, 에이전트 작업의 지리적 분산이 가능합니다.

`nodes` 도구는 `all_tools()` 레지스트리에 등록되며 항상 사용할 수 있습니다. 실제 기능은 노드 설정과 원격 피어가 페어링되었는지 여부에 따라 달라집니다.

## 설정

### 컨트롤러 모드

컨트롤러는 노드 간 작업을 조율하는 기본 PRX 인스턴스입니다:

```toml
[node]
mode = "controller"
node_id = "primary"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"          # "static" | "mdns"
peers = [
  "192.168.1.101:3121",   # GPU 호스트
  "192.168.1.102:3121",   # 스테이징 환경
]
```

### 노드 모드

노드는 컨트롤러로부터 위임된 작업을 수락하는 PRX 인스턴스입니다:

```toml
[node]
mode = "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.101:3121"
controller = "192.168.1.100:3121"
```

### 검색 방법

| 방법 | 설명 | 사용 사례 |
|------|------|----------|
| `static` | 설정에 명시적 피어 주소 목록 | 알려진, 안정적인 인프라 |
| `mdns` | 로컬 네트워크에서 멀티캐스트 DNS를 통한 자동 검색 | 동적 환경, 개발 |

```toml
# mDNS 검색
[node.discovery]
method = "mdns"
service_name = "_prx._tcp.local."
```

## 사용법

### 사용 가능한 노드 나열

페어링된 모든 원격 노드를 상태와 함께 검색하고 나열:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "list"
  }
}
```

**예시 응답:**

```
Nodes:
  1. gpu-host-01 (192.168.1.101:3121) - ONLINE
     Capabilities: gpu, cuda, python
     Load: 23%

  2. staging-01 (192.168.1.102:3121) - ONLINE
     Capabilities: docker, network-access
     Load: 5%
```

### 노드 상태 확인

특정 노드의 상태와 기능 쿼리:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "health",
    "node_id": "gpu-host-01"
  }
}
```

### 노드에 작업 전송

실행을 위해 특정 원격 노드로 작업 라우팅:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "send",
    "node_id": "gpu-host-01",
    "task": "Run the ML inference pipeline on the uploaded dataset."
  }
}
```

### 노드 결과 검색

이전에 전송한 작업의 결과 가져오기:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "result",
    "task_id": "task_xyz789"
  }
}
```

## 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | `string` | 예 | -- | 노드 액션: `"list"`, `"health"`, `"send"`, `"result"`, `"capabilities"` |
| `node_id` | `string` | 조건부 | -- | 대상 노드 식별자 (`"health"`, `"send"`에 필수) |
| `task` | `string` | 조건부 | -- | 작업 설명 (`"send"`에 필수) |
| `task_id` | `string` | 조건부 | -- | 작업 식별자 (`"result"`에 필수) |

**반환:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `bool` | 작업이 완료되면 `true` |
| `output` | `string` | 작업 결과 (노드 목록, 상태, 작업 결과 등) |
| `error` | `string?` | 작업 실패 시 오류 메시지 (노드 접근 불가, 작업 없음 등) |

## 아키텍처

PRX 노드 시스템은 컨트롤러-노드 토폴로지를 사용합니다:

```
┌──────────────────┐         ┌──────────────────┐
│   컨트롤러       │         │   노드 A         │
│   (기본 PRX)     │◄──────► │   (gpu-host-01)  │
│                  │  mTLS   │   GPU, CUDA      │
│   에이전트 루프  │         │   로컬 도구      │
│   ├── nodes 도구 │         └──────────────────┘
│   └── delegate   │
│                  │         ┌──────────────────┐
│                  │◄──────► │   노드 B         │
│                  │  mTLS   │   (staging-01)   │
│                  │         │   Docker, Net    │
└──────────────────┘         └──────────────────┘
```

### 통신 프로토콜

노드는 상호 TLS (mTLS) 인증을 사용하는 TCP 상의 커스텀 프로토콜로 통신합니다:

1. **페어링**: 노드가 챌린지-응답 핸드셰이크를 통해 컨트롤러와 페어링됨 ([노드 페어링](/ko/prx/nodes/pairing) 참조)
2. **하트비트**: 페어링된 노드가 상태와 기능을 보고하는 주기적 하트비트 전송
3. **작업 디스패치**: 컨트롤러가 직렬화된 컨텍스트와 함께 노드에 작업 전송
4. **결과 반환**: 노드가 구조화된 출력과 함께 작업 결과 반환

### 기능 알림

각 노드는 컨트롤러가 지능적 작업 라우팅에 사용하는 기능을 알립니다:

- **하드웨어**: `gpu`, `cuda`, `tpu`, `high-memory`
- **소프트웨어**: `docker`, `python`, `rust`, `nodejs`
- **네트워크**: `network-access`, `vpn-connected`, `internal-network`
- **도구**: 노드에서 사용 가능한 PRX 도구 목록

## 일반 패턴

### GPU 가속 작업

GPU 장착 노드로 ML 및 컴퓨팅 집약적 작업 라우팅:

```
에이전트: 사용자가 이미지 분류를 실행하고 싶어함.
  1. [nodes] action="list" → CUDA가 있는 gpu-host-01 발견
  2. [nodes] action="send", node_id="gpu-host-01", task="Run image classification on /data/images/"
  3. [완료 대기]
  4. [nodes] action="result", task_id="task_abc123"
```

### 환경 격리

특정 환경이 필요한 작업에 노드 사용:

```
에이전트: 스테이징 환경에서 배포 스크립트를 테스트해야 함.
  1. [nodes] action="send", node_id="staging-01", task="Run deploy.sh and verify all services start"
  2. [nodes] action="result", task_id="task_def456"
```

### 부하 분산

병렬 실행을 위해 여러 노드에 작업 분산:

```
에이전트: 3개 데이터셋을 동시에 처리.
  1. [nodes] action="send", node_id="node-a", task="Process dataset-1.csv"
  2. [nodes] action="send", node_id="node-b", task="Process dataset-2.csv"
  3. [nodes] action="send", node_id="node-c", task="Process dataset-3.csv"
  4. [세 곳 모두에서 결과 수집]
```

## 보안

### 상호 TLS 인증

모든 노드 통신은 mTLS를 사용합니다. TLS 핸드셰이크 중 컨트롤러와 노드 모두 유효한 인증서를 제시해야 합니다. 인증서는 페어링 과정에서 교환됩니다.

### 페어링 요구사항

노드는 작업을 교환하기 전에 페어링 핸드셰이크를 완료해야 합니다. 페어링되지 않은 노드는 연결 수준에서 거부됩니다. 페어링 프로토콜은 [노드 페어링](/ko/prx/nodes/pairing)을 참조하세요.

### 작업 격리

원격 노드에 전송된 작업은 노드의 보안 정책 내에서 실행됩니다. 노드의 샌드박스 설정, 도구 제한, 리소스 제한이 컨트롤러의 설정과 독립적으로 적용됩니다.

### 네트워크 보안

- 노드 통신 포트는 알려진 컨트롤러/노드 주소만 허용하도록 방화벽을 설정해야 함
- mDNS 검색은 로컬 네트워크 세그먼트로 제한됨
- 프로덕션 배포에는 정적 피어 목록을 권장

### 정책 엔진

`nodes` 도구는 보안 정책의 적용을 받습니다:

```toml
[security.tool_policy.tools]
nodes = "supervised"       # 원격 노드에 작업 전송 전 승인 필요
```

## 관련 페이지

- [원격 노드](/ko/prx/nodes/) -- 노드 시스템 아키텍처
- [노드 페어링](/ko/prx/nodes/pairing) -- 페어링 프로토콜 및 인증서 교환
- [통신 프로토콜](/ko/prx/nodes/protocol) -- 와이어 프로토콜 상세
- [보안 페어링](/ko/prx/security/pairing) -- 디바이스 페어링 보안 모델
- [세션 및 에이전트](/ko/prx/tools/sessions) -- 로컬 멀티 에이전트 실행의 대안
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
