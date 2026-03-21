---
title: 노드 페어링
description: 안전한 분산 실행을 위해 PRX 노드를 컨트롤러와 페어링하는 방법입니다.
---

# 노드 페어링

노드가 컨트롤러로부터 작업을 수신하려면 먼저 페어링되어야 합니다. 페어링은 암호화 신원 확인을 통해 상호 신뢰를 확립합니다.

## 페어링 프로세스

1. 노드를 페어링 모드로 시작합니다: `prx node pair`
2. 노드가 페어링 코드 (6자리 PIN)를 표시합니다
3. 컨트롤러에서 페어링을 시작합니다: `prx pair add --address <node-ip>:3121`
4. 프롬프트가 나타나면 페어링 코드를 입력합니다
5. 양쪽이 Ed25519 공개키를 교환하고 검증합니다

## 설정

```toml
[node.pairing]
auto_accept = false
pairing_timeout_secs = 120
max_paired_controllers = 3
```

## 노드 관리

```bash
# 컨트롤러에서
prx node list              # 페어링된 노드 목록
prx node status <node-id>  # 노드 상태 확인
prx node unpair <node-id>  # 노드 페어링 해제

# 노드에서
prx node pair              # 페어링 모드 진입
prx node info              # 노드 신원 정보 표시
```

## 관련 페이지

- [노드 개요](./)
- [통신 프로토콜](./protocol)
- [디바이스 페어링](/ko/prx/security/pairing)
