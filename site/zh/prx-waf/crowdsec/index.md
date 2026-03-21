---
title: CrowdSec 集成
description: PRX-WAF CrowdSec 集成，实现协作式威胁情报共享。Bouncer 模式内存决策缓存、AppSec 模式实时 HTTP 分析、日志推送器回馈社区情报。
---

# CrowdSec 集成

PRX-WAF 与 [CrowdSec](https://www.crowdsec.net/) 深度集成，将协作式社区威胁情报直接引入 WAF 检测流水线。不再仅仅依赖本地规则和启发式分析，PRX-WAF 能够借助 CrowdSec 网络 -- 数千台机器实时共享攻击信号 -- 拦截已知恶意 IP、检测应用层攻击，并将自身发现的安全事件回馈社区。

集成提供 **三种模式**，可独立使用也可组合启用：

| 模式 | 用途 | 延迟 | 流水线阶段 |
|------|------|------|------------|
| **Bouncer** | 基于 LAPI 缓存决策拦截恶意 IP | 微秒级（内存查找） | 阶段 16a |
| **AppSec** | 通过 CrowdSec AppSec 分析完整 HTTP 请求 | 毫秒级（HTTP 调用） | 阶段 16b |
| **日志推送** | 将 WAF 安全事件上报至 LAPI | 异步（批量发送） | 后台任务 |

## 工作原理

### Bouncer 模式

Bouncer 模式维护一个与 CrowdSec 本地 API (LAPI) 同步的**内存决策缓存**。当请求到达检测流水线的阶段 16a 时，PRX-WAF 对缓存执行 O(1) 查找：

```
请求 IP ──> DashMap（精确 IP 匹配）──> 命中？──> 执行决策（封禁/验证码/限速）
                  │
                  └──> 未命中 ──> RwLock<Vec>（CIDR 范围扫描）──> 命中？──> 执行决策
                                       │
                                       └──> 未命中 ──> 放行（进入下一阶段）
```

缓存通过可配置的时间间隔（默认每 10 秒）轮询 LAPI 的 `/v1/decisions` 端点进行刷新。这种设计确保 IP 查找永远不会因网络 I/O 而阻塞 -- 同步操作在后台任务中完成。

**数据结构：**

- **DashMap** 存储精确 IP 地址 -- 无锁并发哈希表，O(1) 查找
- **RwLock\<Vec\>** 存储 CIDR 范围 -- 缓存未命中时顺序扫描，通常数量较少

**场景过滤**允许根据场景名称选择性地包含或排除决策：

```toml
# 仅对 SSH 暴力破解和 HTTP 扫描场景生效
scenarios_containing = ["ssh-bf", "http-scan"]

# 忽略以下场景的决策
scenarios_not_containing = ["manual"]
```

### AppSec 模式

AppSec 模式将完整的 HTTP 请求详情发送到 CrowdSec AppSec 组件进行实时分析。与仅检查 IP 的 Bouncer 模式不同，AppSec 会检查请求头、请求体、URI 和方法，以检测 SQL 注入、XSS 和路径遍历等应用层攻击。

```
请求 ──> 阶段 16b ──> POST http://appsec:7422/
                       请求体: { method, uri, headers, body }
                       ──> CrowdSec AppSec 引擎
                       ──> 响应: 放行 / 拦截（附带详情）
```

AppSec 检查是**异步**的 -- PRX-WAF 发送请求时设有可配置的超时（默认 500ms）。若 AppSec 端点不可达或超时，`fallback_action` 决定是放行、拦截还是仅记录日志。

### 日志推送器

日志推送器将 WAF 安全事件上报到 CrowdSec LAPI，为社区威胁情报网络做出贡献。事件采用批量缓冲，定期刷新，以最小化 LAPI 负载。

**批量参数：**

| 参数 | 值 | 说明 |
|------|-----|------|
| 批量大小 | 50 条事件 | 缓冲区达到 50 条时触发刷新 |
| 刷新间隔 | 30 秒 | 即使缓冲区未满也定时刷新 |
| 认证方式 | 机器 JWT | 使用 `pusher_login` / `pusher_password` 进行机器认证 |
| 关闭处理 | 最终刷新 | 进程退出前刷新所有缓冲事件 |

推送器使用机器凭据（与 Bouncer API 密钥分开）向 LAPI 认证，并将事件发送到 `/v1/alerts` 端点。

## 配置

在 TOML 配置文件中添加 `[crowdsec]` 部分：

```toml
[crowdsec]
# 总开关
enabled = true

# 集成模式: "bouncer"、"appsec" 或 "both"
mode = "both"

# --- Bouncer 设置 ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = 使用 LAPI 提供的持续时间
fallback_action = "allow"    # "allow" | "block" | "log"

# 场景过滤（可选）
scenarios_containing = []
scenarios_not_containing = []

# --- AppSec 设置 ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- 日志推送器设置 ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### 配置参考

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| `enabled` | `boolean` | `false` | 启用 CrowdSec 集成 |
| `mode` | `string` | `"bouncer"` | 集成模式：`"bouncer"`、`"appsec"` 或 `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI 基础 URL |
| `api_key` | `string` | `""` | Bouncer API 密钥（通过 `cscli bouncers add` 获取） |
| `update_frequency_secs` | `integer` | `10` | 从 LAPI 刷新决策缓存的间隔（秒） |
| `cache_ttl_secs` | `integer` | `0` | 覆盖决策 TTL。`0` 表示使用 LAPI 提供的持续时间。 |
| `fallback_action` | `string` | `"allow"` | LAPI 或 AppSec 不可达时的动作：`"allow"`、`"block"` 或 `"log"` |
| `scenarios_containing` | `string[]` | `[]` | 仅缓存场景名包含指定子串的决策。为空表示全部。 |
| `scenarios_not_containing` | `string[]` | `[]` | 排除场景名包含指定子串的决策。 |
| `appsec_endpoint` | `string` | -- | CrowdSec AppSec 端点 URL |
| `appsec_key` | `string` | -- | AppSec API 密钥 |
| `appsec_timeout_ms` | `integer` | `500` | AppSec HTTP 请求超时（毫秒） |
| `pusher_login` | `string` | -- | LAPI 机器认证登录名（日志推送器） |
| `pusher_password` | `string` | -- | LAPI 机器认证密码（日志推送器） |

## 安装配置指南

### 前置条件

1. 一个运行中的 CrowdSec 实例，LAPI 可从 PRX-WAF 主机访问
2. Bouncer API 密钥（用于 Bouncer 模式）
3. CrowdSec AppSec 组件（用于 AppSec 模式，可选）
4. 机器凭据（用于日志推送器，可选）

### 第一步：安装 CrowdSec

如果尚未安装 CrowdSec：

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# 验证 LAPI 是否运行
sudo cscli metrics
```

### 第二步：注册 Bouncer

```bash
# 为 PRX-WAF 创建 Bouncer API 密钥
sudo cscli bouncers add prx-waf-bouncer

# 输出:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# 请复制此密钥 -- 仅显示一次。
```

### 第三步：配置 PRX-WAF

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### 第四步：验证连通性

```bash
# 使用 CLI
prx-waf crowdsec test

# 或通过 API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### 第五步（可选）：启用 AppSec

如果你运行了 CrowdSec AppSec 组件：

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### 第六步（可选）：启用日志推送

将 WAF 事件回馈 CrowdSec：

```bash
# 在 CrowdSec LAPI 上注册机器
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### 交互式设置

使用 CLI 向导可获得引导式的配置体验：

```bash
prx-waf crowdsec setup
```

向导将依次引导完成 LAPI URL 配置、API 密钥输入、模式选择和连通性测试。

## 流水线集成

CrowdSec 检查在 16 阶段 WAF 检测流水线的**阶段 16** 执行 -- 即代理请求到上游后端之前的最后一个阶段。这一位置经过深思熟虑：

1. **低成本检查优先。** IP 黑白名单（阶段 1-4）、限速（阶段 5）和模式匹配（阶段 8-13）在 CrowdSec 之前执行，无需外部查找即可过滤掉明显的攻击。
2. **Bouncer 先于 AppSec。** 阶段 16a（Bouncer）以微秒级延迟同步执行。只有当 IP 不在决策缓存中时，才会执行阶段 16b（AppSec），后者需要一次 HTTP 往返。
3. **非阻塞架构。** 决策缓存在后台任务中刷新。AppSec 调用使用带超时的异步 HTTP。两种模式都不会阻塞主代理线程池。

```
阶段 1-15（本地检查）
    │
    └──> 阶段 16a：Bouncer（DashMap/CIDR 查找，约 1-5 微秒）
              │
              ├── 命中决策 ──> 封禁/验证码/限速
              │
              └── 无决策 ──> 阶段 16b：AppSec（HTTP POST，约 1-50 毫秒）
                                  │
                                  ├── 拦截 ──> 403 Forbidden
                                  │
                                  └── 放行 ──> 代理至上游
```

## REST API

所有 CrowdSec API 端点需要认证（来自管理 API 的 JWT Bearer 令牌）。

### 状态查询

```http
GET /api/crowdsec/status
```

返回当前集成状态，包括连接状态、缓存统计和配置摘要。

**响应：**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_connected": true,
  "appsec_connected": true,
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "last_refresh": "2026-03-21T10:15:30Z",
    "refresh_interval_secs": 10
  },
  "pusher": {
    "authenticated": true,
    "events_sent": 4521,
    "buffer_size": 12
  }
}
```

### 决策列表

```http
GET /api/crowdsec/decisions
```

返回所有缓存的决策，包含类型、作用域、值和过期时间。

**响应：**

```json
{
  "decisions": [
    {
      "id": 12345,
      "type": "ban",
      "scope": "ip",
      "value": "192.168.1.100",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "duration": "4h",
      "expires_at": "2026-03-21T14:00:00Z"
    },
    {
      "id": 12346,
      "type": "ban",
      "scope": "range",
      "value": "10.0.0.0/24",
      "scenario": "crowdsecurity/ssh-bf",
      "duration": "24h",
      "expires_at": "2026-03-22T10:00:00Z"
    }
  ],
  "total": 1336
}
```

### 删除决策

```http
DELETE /api/crowdsec/decisions/:id
```

从本地缓存和 LAPI 中移除一条决策。适用于解除误报的拦截。

**示例：**

```bash
curl -X DELETE http://localhost:9527/api/crowdsec/decisions/12345 \
  -H "Authorization: Bearer <token>"
```

### 连通性测试

```http
POST /api/crowdsec/test
```

测试到 LAPI（以及 AppSec 端点，如已配置）的连通性。返回连接状态和延迟。

**响应：**

```json
{
  "lapi": {
    "reachable": true,
    "latency_ms": 3,
    "version": "1.6.4"
  },
  "appsec": {
    "reachable": true,
    "latency_ms": 12
  }
}
```

### 获取配置

```http
GET /api/crowdsec/config
```

返回当前 CrowdSec 配置（敏感字段如 `api_key` 会被脱敏）。

### 更新配置

```http
PUT /api/crowdsec/config
Content-Type: application/json
```

在运行时更新 CrowdSec 配置。修改立即生效，无需重启。

**请求体：**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_url": "http://127.0.0.1:8080",
  "api_key": "new-api-key",
  "update_frequency_secs": 15,
  "fallback_action": "log"
}
```

### 缓存统计

```http
GET /api/crowdsec/stats
```

返回详细的缓存统计信息，包括命中/未命中率和决策类型分布。

**响应：**

```json
{
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "total_lookups": 582910,
    "cache_hits": 3891,
    "cache_misses": 579019,
    "hit_rate_percent": 0.67
  },
  "decisions_by_type": {
    "ban": 1102,
    "captcha": 145,
    "throttle": 89
  },
  "decisions_by_scenario": {
    "crowdsecurity/http-bf-wordpress_bf": 423,
    "crowdsecurity/ssh-bf": 312,
    "crowdsecurity/http-bad-user-agent": 198
  }
}
```

### 最近事件

```http
GET /api/crowdsec/events
```

返回 CrowdSec 决策触发的最近安全事件。

**响应：**

```json
{
  "events": [
    {
      "timestamp": "2026-03-21T10:14:22Z",
      "source_ip": "192.168.1.100",
      "action": "ban",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "request_uri": "/wp-login.php",
      "method": "POST"
    }
  ],
  "total": 892
}
```

## CLI 命令

### 状态

```bash
prx-waf crowdsec status
```

显示集成状态、LAPI 连接状态、缓存大小和推送器统计信息。

**输出示例：**

```
CrowdSec 集成状态
============================
  启用:          true
  模式:          both
  LAPI URL:      http://127.0.0.1:8080
  LAPI 已连接:   true
  缓存:
    精确 IP:     1,247
    CIDR 范围:   89
    上次刷新:    2 秒前
  AppSec:
    端点:        http://127.0.0.1:7422
    已连接:      true
  推送器:
    已认证:      true
    已发送事件:   4,521
    缓冲区:      12 条待发送
```

### 决策列表

```bash
prx-waf crowdsec decisions
```

以表格形式打印本地缓存中的所有活跃决策。

### 连通性测试

```bash
prx-waf crowdsec test
```

对 LAPI 和 AppSec 端点执行连通性检查，报告延迟和版本信息。

### 设置向导

```bash
prx-waf crowdsec setup
```

交互式向导，依次引导完成：

1. LAPI URL 和 API 密钥配置
2. 模式选择（bouncer / appsec / both）
3. AppSec 端点配置（如适用）
4. 日志推送器凭据设置（可选）
5. 连通性验证
6. 将配置写入 TOML 文件

## 管理界面

Vue 3 管理后台包含三个 CrowdSec 管理视图：

### CrowdSec 设置

**CrowdSecSettings** 视图（`设置 > CrowdSec`）提供完整的参数配置表单：

- 启用/禁用开关
- 模式选择器（bouncer / appsec / both）
- LAPI URL 和 API 密钥字段
- 缓存刷新间隔滑块
- 回退动作选择器
- AppSec 端点配置
- 日志推送器凭据
- 连通性测试按钮（实时反馈）

### CrowdSec 决策

**CrowdSecDecisions** 视图（`安全 > CrowdSec 决策`）以可排序、可过滤的表格展示所有缓存决策：

- 决策类型标签（封禁、验证码、限速）
- IP/范围及地理位置查询
- 场景名称及文档链接
- 过期倒计时
- 一键删除解除封禁

### CrowdSec 统计

**CrowdSecStats** 视图（`仪表板 > CrowdSec`）展示运营指标：

- 缓存命中/未命中率图表（时间序列）
- 决策类型分布（饼图）
- 热门封禁场景（柱状图）
- 推送器事件吞吐量
- LAPI 延迟直方图

## 部署模式

### 仅 Bouncer（推荐入门方案）

最简单的部署方式。PRX-WAF 从 CrowdSec LAPI 拉取决策并拦截已知恶意 IP：

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "allow"
```

适用场景：大多数部署，开销极低，无需额外 CrowdSec 组件。

### 完整集成（Bouncer + AppSec + 推送器）

双向威胁情报的最大防护方案：

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "log"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
pusher_login = "prx-waf-machine"
pusher_password = "secure-password"
```

适用场景：需要 IP 信誉和应用层检测，并希望回馈社区情报的生产环境。

### 远程 LAPI 高可用

当 CrowdSec LAPI 运行在专用服务器上时：

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "https://crowdsec.internal:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 5
fallback_action = "allow"  # LAPI 不可达时不拦截流量
cache_ttl_secs = 300       # 即使 LAPI 中断也保留决策 5 分钟
```

适用场景：多服务器部署，CrowdSec LAPI 集中管理。

### 严格安全模式（故障即拦截）

面向高安全环境，威胁情报不可用时选择拦截流量：

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
fallback_action = "block"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 200     # 短超时，快速失败
```

::: warning
将 `fallback_action` 设为 `"block"` 意味着当 LAPI 或 AppSec 端点不可达时，所有流量都将被拦截。仅在能保证 CrowdSec 高可用的环境中使用此配置。
:::

## 场景过滤

CrowdSec 场景代表特定的攻击模式（例如 `crowdsecurity/ssh-bf` 表示 SSH 暴力破解，`crowdsecurity/http-bad-user-agent` 表示恶意 User-Agent）。你可以过滤 PRX-WAF 响应哪些场景：

### 仅包含特定场景

```toml
[crowdsec]
# 仅拦截被标记为 HTTP 相关攻击的 IP
scenarios_containing = ["http-"]
```

当你的 WAF 仅处理 HTTP 流量，不希望 SSH 或 SMTP 暴力破解的决策充斥缓存时，此配置非常有用。

### 排除特定场景

```toml
[crowdsec]
# 响应所有决策，但排除手动添加的
scenarios_not_containing = ["manual"]
```

### 组合过滤

```toml
[crowdsec]
# 仅 HTTP 场景，但排除 DDoS（由上游处理）
scenarios_containing = ["http-"]
scenarios_not_containing = ["http-ddos"]
```

## 故障排除

### LAPI 连接被拒绝

```
CrowdSec LAPI unreachable: connection refused at http://127.0.0.1:8080
```

**原因：** CrowdSec LAPI 未运行或监听在其他地址。

**解决：**
```bash
# 检查 CrowdSec 状态
sudo systemctl status crowdsec

# 确认 LAPI 正在监听
sudo ss -tlnp | grep 8080

# 查看 CrowdSec 日志
sudo journalctl -u crowdsec -f
```

### API 密钥无效

```
CrowdSec LAPI returned 403: invalid API key
```

**原因：** Bouncer API 密钥错误或已被撤销。

**解决：**
```bash
# 列出现有 Bouncer
sudo cscli bouncers list

# 创建新的 Bouncer 密钥
sudo cscli bouncers add prx-waf-bouncer
```

### AppSec 超时

```
CrowdSec AppSec timeout after 500ms
```

**原因：** AppSec 端点响应慢或过载。

**解决：**
- 增大 `appsec_timeout_ms`（例如设为 1000）
- 检查 AppSec 的资源使用情况
- 如果 AppSec 不是关键需求，可考虑切换为 `mode = "bouncer"`

### 决策缓存为空

如果 `prx-waf crowdsec decisions` 显示无条目：

1. 确认 LAPI 中有决策：`sudo cscli decisions list`
2. 检查场景过滤 -- `scenarios_containing` 过滤条件可能过于严格
3. 确认 Bouncer 密钥具有读取权限

### 日志推送器认证失败

```
CrowdSec pusher: machine authentication failed
```

**原因：** 机器凭据无效。

**解决：**
```bash
# 确认机器存在
sudo cscli machines list

# 重新注册机器
sudo cscli machines add prx-waf-pusher --password "new-password" --force
```

然后相应更新配置中的 `pusher_login` 和 `pusher_password`。

## 下一步

- [配置参考](../configuration/reference) -- 完整的 TOML 配置参考
- [CLI 参考](../cli/) -- 所有 CLI 命令，包括 CrowdSec 子命令
- [规则引擎](../rules/) -- CrowdSec 在检测流水线中的位置
- [管理界面](../admin-ui/) -- 通过管理后台管理 CrowdSec
