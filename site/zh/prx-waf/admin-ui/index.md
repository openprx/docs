---
title: 管理界面
description: PRX-WAF Vue 3 管理仪表板。JWT + TOTP 认证、主机管理、规则管理、安全事件监控、实时 WebSocket 仪表板和通知配置。
---

# 管理界面

PRX-WAF 包含一个嵌入在二进制中的 Vue 3 + Tailwind CSS 管理仪表板，提供图形化界面用于管理主机、规则、证书、安全事件和集群状态。

## 访问管理界面

管理界面由 API 服务器在配置的地址上提供服务：

```
http://localhost:9527
```

默认凭据：`admin` / `admin`

::: warning
首次登录后请立即修改默认密码。生产环境建议启用 TOTP 两步验证。
:::

## 认证

管理界面支持两种认证机制：

| 方式 | 说明 |
|------|------|
| JWT 令牌 | 通过 `/api/auth/login` 获取，存储在浏览器 localStorage 中 |
| TOTP（可选） | 基于时间的一次性密码，用于两步验证 |

### 登录 API

```bash
curl -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

响应：

```json
{
  "token": "eyJ...",
  "refresh_token": "..."
}
```

对于启用了 TOTP 的账户，需包含 `totp_code` 字段：

```json
{"username": "admin", "password": "admin", "totp_code": "123456"}
```

## 仪表板功能

### 主机管理

管理受保护的域名及其上游后端：
- 添加、编辑和删除主机
- 按主机切换 WAF 防护
- 查看每个主机的流量统计

### 规则管理

管理所有来源的检测规则：
- 查看 OWASP CRS、ModSecurity、CVE 和自定义规则
- 启用/禁用单条规则
- 按类别、严重级别和来源搜索过滤
- 导入和导出规则

### IP 规则

管理基于 IP 的黑白名单：
- 添加 IP 地址或 CIDR 范围
- 设置放行/拦截动作
- 查看当前活跃的 IP 规则

### URL 规则

管理基于 URL 的检测规则：
- 添加支持正则的 URL 模式
- 设置拦截/记录/放行动作

### 安全事件

查看和分析检测到的攻击：
- 实时事件流
- 按主机、攻击类型、来源 IP 和时间范围过滤
- 导出事件为 JSON 或 CSV

### 统计数据

查看流量和安全指标：
- 每秒请求数
- 按类型的攻击分布
- 被攻击最多的主机
- 来源 IP 排行
- 响应码分布

### SSL 证书

管理 TLS 证书：
- 查看活跃证书和过期日期
- 上传手动证书
- 监控 Let's Encrypt 自动续签状态

### WASM 插件

管理 WebAssembly 插件：
- 上传新插件
- 查看已加载插件及其状态
- 启用/禁用插件

### 隧道

管理反向隧道：
- 创建和删除基于 WebSocket 的隧道
- 监控隧道状态和流量

### CrowdSec

查看 CrowdSec 集成状态：
- 来自 LAPI 的活跃决策
- AppSec 检查结果
- 连接状态

### 通知

配置告警渠道：
- 邮件（SMTP）
- Webhook
- Telegram

## 实时监控

管理界面通过 WebSocket 端点（`/ws/events`）连接实时安全事件流。攻击被检测和拦截时，事件会实时显示。

也可以通过编程方式连接 WebSocket：

```javascript
const ws = new WebSocket("ws://localhost:9527/ws/events");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("安全事件:", data);
};
```

## 安全加固

### 按 IP 限制管理访问

限制管理界面和 API 访问到可信网络：

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
```

### 启用限速

保护管理 API 免受暴力攻击：

```toml
[security]
api_rate_limit_rps = 100
```

### 配置 CORS

限制哪些来源可以访问管理 API：

```toml
[security]
cors_origins = ["https://admin.example.com"]
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | Vue 3 + Tailwind CSS |
| 构建 | Vite |
| 状态管理 | Pinia |
| HTTP 客户端 | Axios |
| 图表 | Chart.js |
| 嵌入方式 | Axum 提供的静态文件服务 |

管理界面源代码位于仓库的 `web/admin-ui/` 目录。

## 下一步

- [快速开始](../getting-started/quickstart) —— 设置第一个受保护的主机
- [配置参考](../configuration/reference) —— 管理安全设置
- [CLI 参考](../cli/) —— 命令行替代管理方式
