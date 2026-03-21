---
title: 快速开始
description: 5 分钟内让 PRX-WAF 保护你的 Web 应用。启动代理、添加后端主机、验证防护效果、监控安全事件。
---

# 快速开始

本指南将带你在 5 分钟内从零开始，完成 Web 应用的完整防护部署。完成后，PRX-WAF 将代理流量到你的后端，拦截常见攻击，并记录安全事件。

::: tip 前置要求
你需要安装 Docker 和 Docker Compose。其他安装方式请参阅[安装指南](./installation)。
:::

## 第 1 步：启动 PRX-WAF

克隆仓库并启动所有服务：

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

验证容器是否正常运行：

```bash
docker compose ps
```

预期输出：

```
NAME         SERVICE     STATUS
prx-waf      prx-waf     running
postgres     postgres    running
```

## 第 2 步：登录管理界面

打开浏览器，访问 `http://localhost:9527`。使用默认凭据登录：

- **用户名：** `admin`
- **密码：** `admin`

::: warning
首次登录后请立即修改默认密码。
:::

## 第 3 步：添加后端主机

通过管理界面或 API 添加第一个受保护的主机：

**通过管理界面：**
1. 在侧边栏中点击 **主机**
2. 点击 **添加主机**
3. 填写信息：
   - **域名：** `example.com`（你要保护的域名）
   - **上游地址：** `192.168.1.100`（你的后端服务器 IP）
   - **上游端口：** `8080`（你的后端服务器端口）
   - **启用防护：** 开启
4. 点击 **保存**

**通过 API：**

```bash
# 获取 JWT 令牌
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# 添加主机
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "192.168.1.100",
    "remote_port": 8080,
    "guard_status": true
  }'
```

## 第 4 步：测试防护效果

发送正常请求通过代理：

```bash
curl -H "Host: example.com" http://localhost/
```

你应该收到后端的正常响应。现在测试 WAF 是否拦截 SQL 注入攻击：

```bash
curl -H "Host: example.com" "http://localhost/?id=1%20OR%201=1--"
```

预期响应：**403 Forbidden**

测试 XSS 攻击：

```bash
curl -H "Host: example.com" "http://localhost/?q=<script>alert(1)</script>"
```

预期响应：**403 Forbidden**

测试路径遍历攻击：

```bash
curl -H "Host: example.com" "http://localhost/../../etc/passwd"
```

预期响应：**403 Forbidden**

## 第 5 步：监控安全事件

在管理界面中查看被拦截的攻击：

1. 在侧边栏中点击 **安全事件**
2. 你应该能看到第 4 步中被拦截的请求
3. 每个事件显示攻击类型、来源 IP、匹配规则和时间戳

或通过 API 查询事件：

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/security-events
```

```json
{
  "events": [
    {
      "id": 1,
      "host": "example.com",
      "source_ip": "172.18.0.1",
      "attack_type": "sqli",
      "rule_id": "CRS-942100",
      "action": "block",
      "timestamp": "2026-03-21T10:05:32Z"
    }
  ]
}
```

## 第 6 步：启用实时监控（可选）

连接 WebSocket 端点获取实时安全事件流：

```bash
# 使用 websocat 或其他 WebSocket 客户端
websocat ws://localhost:9527/ws/events
```

攻击被检测和拦截时，事件会实时推送。

## 当前部署状态

完成以上步骤后，你的环境包括：

| 组件 | 状态 |
|------|------|
| 反向代理 | 监听端口 80/443 |
| WAF 引擎 | 16 阶段检测流水线已激活 |
| 内置规则 | OWASP CRS（310+ 条规则）已启用 |
| 管理界面 | 运行在端口 9527 |
| PostgreSQL | 存储配置、规则和事件 |
| 实时监控 | WebSocket 事件流可用 |

## 下一步

- [规则引擎](../rules/) —— 了解 YAML 规则引擎的工作原理
- [YAML 语法](../rules/yaml-syntax) —— 学习规则模式以编写自定义规则
- [反向代理](../gateway/reverse-proxy) —— 配置负载均衡和上游路由
- [SSL/TLS](../gateway/ssl-tls) —— 启用 HTTPS 和 Let's Encrypt 自动证书
- [配置参考](../configuration/reference) —— 精细调优 PRX-WAF 的各项设置
