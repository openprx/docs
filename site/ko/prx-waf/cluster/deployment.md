---
title: 클러스터 배포
description: "인증서 생성, 노드 설정, 상태 검증을 포함한 PRX-WAF 멀티 노드 클러스터를 배포하는 단계별 가이드."
---

# 클러스터 배포

이 가이드는 5단계로 3노드 PRX-WAF 클러스터를 설정하는 방법을 안내합니다.

## 전제 조건

- 3개 서버 (예: `node-a`, `node-b`, `node-c`)
- UDP 포트 16851이 모든 노드 간에 열려 있음
- PostgreSQL이 메인 노드에서 실행 중

## 1단계: mTLS 인증서 생성

모든 노드는 동일한 CA로 서명된 인증서를 사용해야 합니다:

```bash
# 클러스터 CA 생성
openssl genrsa -out cluster-ca.key 4096
openssl req -x509 -new -nodes -key cluster-ca.key \
  -sha256 -days 3650 -out cluster-ca.pem \
  -subj "/CN=PRX-WAF Cluster CA"

# 각 노드에 대한 인증서 생성
for NODE in node-a node-b node-c; do
  openssl genrsa -out ${NODE}.key 4096
  openssl req -new -key ${NODE}.key \
    -out ${NODE}.csr \
    -subj "/CN=${NODE}"
  openssl x509 -req -in ${NODE}.csr \
    -CA cluster-ca.pem -CAkey cluster-ca.key \
    -CAcreateserial -out ${NODE}.pem \
    -days 365 -sha256
done
```

## 2단계: 인증서 배포

각 노드에 CA 인증서와 해당 노드의 인증서/키를 복사합니다:

```bash
# node-a로
scp cluster-ca.pem node-a.pem node-a.key node-a:/etc/prx-waf/cluster/

# node-b로
scp cluster-ca.pem node-b.pem node-b.key node-b:/etc/prx-waf/cluster/

# node-c로
scp cluster-ca.pem node-c.pem node-c.key node-c:/etc/prx-waf/cluster/
```

## 3단계: 메인 노드 설정 (node-a)

```toml
[proxy]
listen = "0.0.0.0:8080"

[api]
listen = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"

[cluster]
enabled = true
node_id = "node-a"
listen = "0.0.0.0:16851"
cert_pem = "/etc/prx-waf/cluster/node-a.pem"
key_pem  = "/etc/prx-waf/cluster/node-a.key"
ca_pem   = "/etc/prx-waf/cluster/cluster-ca.pem"
```

## 4단계: 워커 노드 설정 (node-b, node-c)

node-b의 예 (node-c도 동일, `node_id`만 변경):

```toml
[proxy]
listen = "0.0.0.0:8080"

[cluster]
enabled = true
node_id = "node-b"
listen = "0.0.0.0:16851"
seeds = ["node-a:16851"]    # 메인 노드 주소
cert_pem = "/etc/prx-waf/cluster/node-b.pem"
key_pem  = "/etc/prx-waf/cluster/node-b.key"
ca_pem   = "/etc/prx-waf/cluster/cluster-ca.pem"
```

::: tip
워커 노드는 자체 PostgreSQL 데이터베이스가 필요 없습니다. 메인 노드에서 상태를 동기화합니다.
:::

## 5단계: 클러스터 시작

```bash
# 메인 노드 먼저 시작
# node-a에서:
prx-waf -c /etc/prx-waf/config.toml migrate
prx-waf -c /etc/prx-waf/config.toml seed-admin
prx-waf -c /etc/prx-waf/config.toml run

# 그 다음 워커 노드 시작
# node-b에서:
prx-waf -c /etc/prx-waf/config.toml run

# node-c에서:
prx-waf -c /etc/prx-waf/config.toml run
```

## 클러스터 상태 검증

```bash
# 클러스터 상태 확인
curl -H "Authorization: Bearer $TOKEN" \
  http://node-a:9527/api/cluster/status
```

모든 노드가 `"status": "connected"`로 표시되어야 합니다.

## 로드 밸런서 설정

3개의 WAF 노드 앞에 로드 밸런서를 배치합니다:

```nginx
upstream prx_waf {
    server node-a:8080;
    server node-b:8080;
    server node-c:8080;
}

server {
    listen 80;
    location / {
        proxy_pass http://prx_waf;
    }
}
```

## 다음 단계

- [클러스터 개요](./index) — 아키텍처 및 리더 선출
- [문제 해결](../troubleshooting/) — 클러스터 연결 문제 해결
- [설정 레퍼런스](../configuration/reference) — 클러스터 설정 옵션
