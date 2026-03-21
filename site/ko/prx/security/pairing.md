---
title: 디바이스 페어링
description: PRX 에이전트 인증을 위한 디바이스 페어링 및 신원 확인입니다.
---

# 디바이스 페어링

PRX는 에이전트 인스턴스를 인증하고 노드 간 신뢰를 확립하기 위해 디바이스 페어링 모델을 사용합니다. 페어링은 인가된 디바이스만 에이전트에 연결하고 제어할 수 있도록 합니다.

## 개요

페어링 프로세스:

1. 고유한 디바이스 신원 생성 (Ed25519 키 쌍)
2. 컨트롤러와 에이전트 간 공개키 교환
3. 챌린지-응답 프로토콜을 통한 신원 확인
4. 암호화된 통신 채널 수립

## 페어링 흐름

```
Controller                    Agent
    │                           │
    │──── Pairing Request ─────►│
    │                           │
    │◄─── Challenge ───────────│
    │                           │
    │──── Signed Response ─────►│
    │                           │
    │◄─── Pairing Confirmed ───│
```

## 설정

```toml
[security.pairing]
require_pairing = true
max_paired_devices = 5
challenge_timeout_secs = 30
```

## 페어링된 디바이스 관리

```bash
prx pair list          # 페어링된 디바이스 목록
prx pair add           # 페어링 흐름 시작
prx pair remove <id>   # 페어링된 디바이스 제거
prx pair revoke-all    # 모든 페어링 해제
```

## 관련 페이지

- [보안 개요](./)
- [노드](/ko/prx/nodes/)
- [시크릿 관리](./secrets)
