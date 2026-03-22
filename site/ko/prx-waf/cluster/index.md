---
title: 클러스터 모드
description: "노드 역할, mTLS가 포함된 QUIC 통신, 리더 선출, 상태 모니터링을 포함한 PRX-WAF 클러스터 아키텍처 개요."
---

# 클러스터 모드

PRX-WAF는 QUIC 기반 노드 간 통신과 mTLS를 사용하는 내장 클러스터링을 지원합니다. 클러스터 모드를 사용하면 여러 노드에서 규칙 설정, 결정, 보안 이벤트를 공유할 수 있습니다.

## 클러스터 아키텍처

```
+------------------+      QUIC/mTLS      +------------------+
|   메인 노드      |<------------------->|   워커 노드 1    |
|  (리더 선출)     |                     |                  |
|                  |<------------------->|   워커 노드 2    |
+------------------+      QUIC/mTLS      +------------------+
         |
    [PostgreSQL]
```

### 노드 역할

| 역할 | 설명 |
|------|------|
| **메인** | 리더 선출에 참여, PostgreSQL 접근, API 서비스 제공 |
| **워커** | 메인 노드에 연결, 규칙 및 결정 동기화, 트래픽 처리 |

## QUIC 기반 통신

노드 간 통신은 다음을 사용합니다:
- **전송 프로토콜**: QUIC (UDP) — 낮은 지연 시간, 내장 암호화
- **인증**: 상호 TLS (mTLS) — 모든 노드는 동일한 CA로 서명된 인증서 필요
- **기본 포트**: UDP 16851

## 리더 선출

리더 선출은 Raft 합의를 통해 처리됩니다:

- **리더**: 규칙 업데이트, 결정 배포, 관리 API 요청 조율
- **팔로워**: 리더의 상태 복제, 트래픽 처리
- **선거**: 현재 리더가 실패하면 자동으로 새 리더 선출

## 상태 모니터링

```bash
# 클러스터 상태 확인
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/cluster/status
```

응답 예시:

```json
{
  "role": "leader",
  "peers": [
    {"id": "node-b", "addr": "10.0.0.2:16851", "status": "connected"},
    {"id": "node-c", "addr": "10.0.0.3:16851", "status": "connected"}
  ],
  "rules_version": 42,
  "last_sync": "2026-03-20T14:30:00Z"
}
```

## 클러스터 설정

### 메인 노드

```toml
[cluster]
enabled = true
node_id = "node-a"
listen = "0.0.0.0:16851"
cert_pem = "cluster/node-a.pem"
key_pem  = "cluster/node-a-key.pem"
ca_pem   = "cluster/ca.pem"
```

### 워커 노드

```toml
[cluster]
enabled = true
node_id = "node-b"
listen = "0.0.0.0:16851"
seeds = ["node-a:16851"]    # 메인 노드에 연결
cert_pem = "cluster/node-b.pem"
key_pem  = "cluster/node-b-key.pem"
ca_pem   = "cluster/ca.pem"
```

## 동기화된 상태

클러스터 노드 간에 동기화되는 데이터:

- **규칙 설정** — 규칙 활성화/비활성화 상태
- **CrowdSec 결정** — 차단/캡차 결정
- **IP 규칙** — 동적으로 추가된 허용/차단 목록
- **속도 제한 카운터** — 분산 속도 제한
- **보안 이벤트** — 이벤트 집계 (분석용)

## 다음 단계

- [클러스터 배포](./deployment) — 단계별 클러스터 설정 가이드
- [설정 레퍼런스](../configuration/reference) — 클러스터 설정 옵션
- [문제 해결](../troubleshooting/) — 클러스터 연결 문제 해결
