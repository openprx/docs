---
title: 配置参考
description: PRX-WAF 所有 TOML 配置项的完整参考，包括类型、默认值和详细说明。
---

# 配置参考

本页面文档化了 PRX-WAF TOML 配置文件中的每一个配置项。默认配置文件为 `configs/default.toml`。

## 代理设置（`[proxy]`）

控制反向代理监听器的设置。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `listen_addr` | `string` | `"0.0.0.0:80"` | HTTP 监听地址 |
| `listen_addr_tls` | `string` | `"0.0.0.0:443"` | HTTPS 监听地址 |
| `worker_threads` | `integer \| null` | `null`（CPU 核数） | 代理工作线程数。为 null 时使用逻辑 CPU 核数。 |

## API 设置（`[api]`）

管理 API 和管理界面的设置。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `listen_addr` | `string` | `"127.0.0.1:9527"` | 管理 API + 界面监听地址。生产环境绑定到 `127.0.0.1` 以限制访问。 |

## 存储设置（`[storage]`）

PostgreSQL 数据库连接。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `database_url` | `string` | `"postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"` | PostgreSQL 连接 URL |
| `max_connections` | `integer` | `20` | 连接池中的最大数据库连接数 |

## 缓存设置（`[cache]`）

使用 moka LRU 内存缓存的响应缓存配置。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | `boolean` | `true` | 启用响应缓存 |
| `max_size_mb` | `integer` | `256` | 最大缓存大小（MB） |
| `default_ttl_secs` | `integer` | `60` | 缓存响应的默认 TTL（秒） |
| `max_ttl_secs` | `integer` | `3600` | 最大 TTL 上限（秒）。无论上游头如何，响应不会被缓存超过此时间。 |

## HTTP/3 设置（`[http3]`）

通过 Quinn 库的 HTTP/3 QUIC 支持。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | `boolean` | `false` | 启用 HTTP/3 支持 |
| `listen_addr` | `string` | `"0.0.0.0:443"` | QUIC 监听地址（UDP） |
| `cert_pem` | `string` | -- | TLS 证书路径（PEM 格式） |
| `key_pem` | `string` | -- | TLS 私钥路径（PEM 格式） |

::: warning
HTTP/3 需要有效的 TLS 证书。`enabled = true` 时必须设置 `cert_pem` 和 `key_pem`。
:::

## 安全设置（`[security]`）

管理 API 和代理安全配置。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `admin_ip_allowlist` | `string[]` | `[]` | 允许访问管理 API 的 IP/CIDR 列表。空表示允许所有。 |
| `max_request_body_bytes` | `integer` | `10485760`（10 MB） | 最大请求体大小（字节）。超出限制的请求以 413 拒绝。 |
| `api_rate_limit_rps` | `integer` | `0` | 管理 API 的每 IP 限速（请求/秒）。`0` 表示禁用。 |
| `cors_origins` | `string[]` | `[]` | 管理 API 的 CORS 允许来源。空表示允许所有来源。 |

## 规则设置（`[rules]`）

规则引擎配置。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `dir` | `string` | `"rules/"` | 规则文件所在目录 |
| `hot_reload` | `boolean` | `true` | 启用文件系统监控以自动重载规则 |
| `reload_debounce_ms` | `integer` | `500` | 文件变更事件的防抖窗口（毫秒） |
| `enable_builtin_owasp` | `boolean` | `true` | 启用内置 OWASP CRS 规则 |
| `enable_builtin_bot` | `boolean` | `true` | 启用内置 Bot 检测规则 |
| `enable_builtin_scanner` | `boolean` | `true` | 启用内置扫描器检测规则 |

### 规则源（`[[rules.sources]]`）

配置多个规则源（本地目录或远程 URL）：

| 配置项 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `name` | `string` | 是 | 源名称（如 `"custom"`、`"owasp-crs"`） |
| `path` | `string` | 否 | 本地目录路径 |
| `url` | `string` | 否 | 远程规则获取 URL |
| `format` | `string` | 是 | 规则格式：`"yaml"`、`"json"` 或 `"modsec"` |
| `update_interval` | `integer` | 否 | 自动更新间隔（秒，仅远程源） |

```toml
[[rules.sources]]
name   = "custom"
path   = "rules/custom/"
format = "yaml"

[[rules.sources]]
name            = "owasp-crs"
url             = "https://example.com/rules/owasp.yaml"
format          = "yaml"
update_interval = 86400
```

## CrowdSec 设置（`[crowdsec]`）

CrowdSec 威胁情报集成。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | `boolean` | `false` | 启用 CrowdSec 集成 |
| `mode` | `string` | `"bouncer"` | 集成模式：`"bouncer"`、`"appsec"` 或 `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI URL |
| `api_key` | `string` | `""` | Bouncer API 密钥 |
| `update_frequency_secs` | `integer` | `10` | 决策缓存刷新间隔（秒） |
| `fallback_action` | `string` | `"allow"` | LAPI 不可达时的动作：`"allow"`、`"block"` 或 `"log"` |

## 主机配置（`[[hosts]]`）

静态主机条目（也可通过管理界面/API 管理）：

| 配置项 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `host` | `string` | 是 | 要匹配的域名 |
| `port` | `integer` | 是 | 监听端口（通常 80 或 443） |
| `remote_host` | `string` | 是 | 上游后端 IP 或主机名 |
| `remote_port` | `integer` | 是 | 上游后端端口 |
| `ssl` | `boolean` | 否 | 到上游使用 HTTPS（默认：false） |
| `guard_status` | `boolean` | 否 | 启用 WAF 防护（默认：true） |

## 集群设置（`[cluster]`）

多节点集群配置。详见[集群模式](../cluster/)。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | `boolean` | `false` | 启用集群模式 |
| `node_id` | `string` | `""`（自动） | 唯一节点标识。空时自动生成。 |
| `role` | `string` | `"auto"` | 节点角色：`"auto"`、`"main"` 或 `"worker"` |
| `listen_addr` | `string` | `"0.0.0.0:16851"` | 节点间通信的 QUIC 监听地址 |
| `seeds` | `string[]` | `[]` | 加入集群的种子节点地址 |

### 集群加密（`[cluster.crypto]`）

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ca_cert` | `string` | -- | CA 证书路径（PEM） |
| `ca_key` | `string` | -- | CA 私钥路径（仅主节点） |
| `node_cert` | `string` | -- | 节点证书路径（PEM） |
| `node_key` | `string` | -- | 节点私钥路径（PEM） |
| `auto_generate` | `boolean` | `true` | 首次启动时自动生成证书 |
| `ca_validity_days` | `integer` | `3650` | CA 证书有效期（天） |
| `node_validity_days` | `integer` | `365` | 节点证书有效期（天） |
| `renewal_before_days` | `integer` | `7` | 到期前多少天自动续签 |

### 集群同步（`[cluster.sync]`）

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `rules_interval_secs` | `integer` | `10` | 规则版本检查间隔 |
| `config_interval_secs` | `integer` | `30` | 配置同步间隔 |
| `events_batch_size` | `integer` | `100` | 达到此数量时刷新事件批次 |
| `events_flush_interval_secs` | `integer` | `5` | 即使批次未满也刷新事件 |
| `stats_interval_secs` | `integer` | `10` | 统计数据上报间隔 |
| `events_queue_size` | `integer` | `10000` | 事件队列大小（满时丢弃最旧的） |

### 集群选举（`[cluster.election]`）

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `timeout_min_ms` | `integer` | `150` | 最小选举超时（毫秒） |
| `timeout_max_ms` | `integer` | `300` | 最大选举超时（毫秒） |
| `heartbeat_interval_ms` | `integer` | `50` | 主节点到工作节点心跳间隔（毫秒） |
| `phi_suspect` | `float` | `8.0` | Phi 累积疑似阈值 |
| `phi_dead` | `float` | `12.0` | Phi 累积死亡阈值 |

### 集群健康（`[cluster.health]`）

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `check_interval_secs` | `integer` | `5` | 健康检查频率 |
| `max_missed_heartbeats` | `integer` | `3` | N 次未响应后标记为不健康 |

## 完整默认配置

参考仓库中的 [default.toml](https://github.com/openprx/prx-waf/blob/main/configs/default.toml) 文件。

## 下一步

- [配置概述](./index) —— 配置层级的工作原理
- [集群部署](../cluster/deployment) —— 集群特定配置
- [规则引擎](../rules/) —— 规则引擎详细设置
