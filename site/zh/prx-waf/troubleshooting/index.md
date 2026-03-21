---
title: 故障排除
description: PRX-WAF 常见问题的解决方案，包括数据库连接、规则加载、误报、集群同步、SSL 证书和性能调优。
---

# 故障排除

本页面涵盖运行 PRX-WAF 时最常遇到的问题及其原因和解决方案。

## 数据库连接失败

**症状：** PRX-WAF 启动失败，报 "connection refused" 或 "authentication failed" 错误。

**解决方案：**

1. **验证 PostgreSQL 是否在运行：**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **测试连接：**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. **检查 TOML 配置中的连接字符串：**

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. **运行迁移**（如果数据库存在但表缺失）：

```bash
prx-waf -c configs/default.toml migrate
```

## 规则未加载

**症状：** PRX-WAF 启动但没有活跃规则，攻击未被检测。

**解决方案：**

1. **检查规则统计：**

```bash
prx-waf rules stats
```

如果输出显示 0 条规则，规则目录可能为空或配置不正确。

2. **验证配置中的规则目录路径：**

```toml
[rules]
dir = "rules/"
```

3. **验证规则文件：**

```bash
python rules/tools/validate.py rules/
```

4. **检查 YAML 语法错误** —— 一个格式错误的文件可能阻止所有规则加载：

```bash
# 逐个文件验证以找到问题
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **确保内置规则已启用：**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## 热重载不工作

**症状：** 修改了规则文件但变更未生效。

**解决方案：**

1. **验证热重载已启用：**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **手动触发重载：**

```bash
prx-waf rules reload
```

3. **发送 SIGHUP：**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **检查文件系统监控限制**（Linux）：

```bash
cat /proc/sys/fs/inotify/max_user_watches
# 如果太低，增加：
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 误报

**症状：** 合法请求被拦截（403 Forbidden）。

**解决方案：**

1. **从安全事件中识别拦截规则：**

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

查看事件中的 `rule_id` 字段。

2. **禁用特定规则：**

```bash
prx-waf rules disable CRS-942100
```

3. **降低偏执级别。** 如果运行在偏执级别 2+，尝试降到 1。

4. **将规则切换为记录模式**以便监控而非拦截：

编辑规则文件，将 `action: "block"` 改为 `action: "log"`，然后重载：

```bash
prx-waf rules reload
```

5. **为可信来源添加 IP 白名单：**

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
部署新规则时，先使用 `action: log` 监控误报，再切换为 `action: block`。
:::

## SSL 证书问题

**症状：** HTTPS 连接失败、证书错误或 Let's Encrypt 续签失败。

**解决方案：**

1. **在管理界面的 SSL 证书中检查证书状态。**

2. **验证端口 80 从互联网可达**（ACME HTTP-01 挑战需要）。

3. **检查证书路径**（手动证书时）：

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **验证证书是否匹配域名：**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## 集群节点无法连接

**症状：** 工作节点无法加入集群。状态显示 "disconnected" 的对等节点。

**解决方案：**

1. **验证集群端口的网络连通性**（默认：UDP 16851）：

```bash
# 从工作节点到主节点
nc -zuv node-a 16851
```

2. **检查防火墙规则** —— 集群通信使用 UDP：

```bash
sudo ufw allow 16851/udp
```

3. **验证证书** —— 所有节点必须使用同一 CA 签署的证书：

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. **检查工作节点的种子配置：**

```toml
[cluster]
seeds = ["node-a:16851"]   # 必须能解析到主节点
```

5. **使用 debug 级别查看日志：**

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## 内存占用过高

**症状：** PRX-WAF 进程消耗的内存超出预期。

**解决方案：**

1. **减小响应缓存大小：**

```toml
[cache]
max_size_mb = 128    # 从默认的 256 减小
```

2. **减少数据库连接池：**

```toml
[storage]
max_connections = 10   # 从默认的 20 减少
```

3. **减少工作线程：**

```toml
[proxy]
worker_threads = 2    # 从 CPU 核数减少
```

## CrowdSec 连接问题

**症状：** CrowdSec 集成显示 "disconnected" 或决策未加载。

**解决方案：**

1. **测试 LAPI 连接：**

```bash
prx-waf crowdsec test
```

2. **验证 API 密钥：**

```bash
# 在 CrowdSec 机器上
cscli bouncers list
```

3. **检查 LAPI URL：**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. **设置安全的回退动作**（LAPI 不可达时）：

```toml
[crowdsec]
fallback_action = "log"    # LAPI 不可用时不拦截
```

## 性能调优

### 响应时间慢

1. **启用响应缓存：**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **增加工作线程：**

```toml
[proxy]
worker_threads = 8
```

3. **增加数据库连接：**

```toml
[storage]
max_connections = 50
```

### CPU 使用率高

1. **减少活跃规则数量。** 如果不需要，禁用偏执级别 3-4 的规则。

2. **禁用未使用的检测阶段。** 例如，如果不使用 CrowdSec：

```toml
[crowdsec]
enabled = false
```

## 获取帮助

如果以上方案都未能解决你的问题：

1. **查看现有 Issue：** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. **提交新 Issue**，请包含：
   - PRX-WAF 版本
   - 操作系统和内核版本
   - 配置文件（密码已脱敏）
   - 相关日志输出
   - 复现步骤

## 下一步

- [配置参考](../configuration/reference) —— 精细调优所有设置
- [规则引擎](../rules/) —— 了解规则如何被评估
- [集群模式](../cluster/) —— 集群特定故障排除
