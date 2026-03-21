---
title: DNS 代理
description: 运行本地 DNS 代理，将广告拦截过滤、IOC 域名源和自定义黑名单整合到一个解析器中，并提供完整的查询日志。
---

# DNS 代理

`sd dns-proxy` 命令启动一个本地 DNS 代理服务器，在将查询转发到上游解析器之前，通过三个引擎进行拦截过滤：

1. **广告拦截引擎** -- 根据过滤列表拦截广告、追踪器和恶意域名
2. **IOC 域名源** -- 根据威胁情报的失陷指标拦截域名
3. **自定义 DNS 黑名单** -- 根据用户自定义列表拦截域名

匹配任何过滤规则的查询将返回 `0.0.0.0`（NXDOMAIN）。其他所有查询将转发到配置的上游 DNS 服务器。每个查询及其解析状态都会记录到 JSONL 文件中。

## 快速开始

```bash
# 使用默认配置启动 DNS 代理（监听 127.0.0.1:53，上游 8.8.8.8:53）
sudo sd dns-proxy
```

::: tip
代理默认监听 53 端口，需要 root 权限。如需非特权测试，可使用高位端口，如 `--listen 127.0.0.1:5353`。
:::

## 命令选项

```bash
sd dns-proxy [OPTIONS]
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `--listen` | `127.0.0.1:53` | 监听地址和端口 |
| `--upstream` | `8.8.8.8:53` | 上游 DNS 服务器，用于转发未被拦截的查询 |
| `--log-path` | `/tmp/prx-sd-dns.log` | JSONL 查询日志文件路径 |

## 使用示例

### 基本用法

使用默认地址启动代理，以 Google DNS 作为上游：

```bash
sudo sd dns-proxy
```

输出：

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### 自定义监听地址和上游

使用 Cloudflare DNS 作为上游并监听自定义端口：

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### 自定义日志路径

将查询日志写入指定位置：

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### 与广告拦截结合使用

DNS 代理会自动从 `~/.prx-sd/adblock/` 加载广告拦截过滤列表。为获得最佳覆盖范围：

```bash
# 步骤 1：启用并同步广告拦截列表
sudo sd adblock enable
sd adblock sync

# 步骤 2：启动 DNS 代理（自动加载广告拦截规则）
sudo sd dns-proxy
```

代理读取与 `sd adblock` 相同的缓存过滤列表。通过 `sd adblock add` 添加的任何列表在重启代理后自动生效。

## 配置系统使用代理

### Linux (systemd-resolved)

编辑 `/etc/systemd/resolved.conf`：

```ini
[Resolve]
DNS=127.0.0.1
```

然后重启：

```bash
sudo systemctl restart systemd-resolved
```

### Linux (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

恢复默认设置：

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
将所有 DNS 流量重定向到本地代理意味着，如果代理停止运行，DNS 解析将会失败，直到你恢复原始设置或重启代理。
:::

## 日志格式

DNS 代理将 JSONL（每行一个 JSON 对象）写入配置的日志路径。每条记录包含：

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| 字段 | 说明 |
|------|------|
| `timestamp` | 查询的 ISO 8601 时间戳 |
| `query` | 查询的域名 |
| `type` | DNS 记录类型（A、AAAA、CNAME 等） |
| `action` | `blocked`（已拦截）或 `forwarded`（已转发） |
| `filter` | 匹配的过滤器：`adblock`、`ioc`、`blocklist` 或 `null` |
| `upstream_ms` | 到上游 DNS 的往返时间（被拦截时为 null） |

## 架构

```
Client DNS Query (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> blocked? --> respond 0.0.0.0
  |  2. IOC domains  |---> blocked? --> respond 0.0.0.0
  |  3. DNS blocklist |---> blocked? --> respond 0.0.0.0
  |                  |
  |  Not blocked:    |
  |  Forward to      |---> upstream DNS (e.g. 8.8.8.8)
  |  upstream         |<--- response
  |                  |
  |  Log to JSONL    |
  +------------------+
        |
        v
  Client receives response
```

## 作为服务运行

要将 DNS 代理作为持久化 systemd 服务运行：

```bash
# 创建 systemd 单元文件
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
如需完全托管的后台运行体验，可以考虑使用 `sd daemon`，它集成了实时文件监控、自动签名更新，并可扩展包含 DNS 代理功能。
:::

## 后续步骤

- 配置[广告拦截过滤列表](./adblock)以获得全面的域名拦截
- 设置[实时监控](../realtime/)以在 DNS 过滤之外提供文件系统防护
- 查阅[配置参考](../configuration/reference)了解代理相关设置
