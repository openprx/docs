---
title: 故障排除
description: PRX 常见问题和解决方案，包括诊断工具和 FAQ。
---

# 故障排除

本节涵盖运行 PRX 时遇到的常见问题及其解决方法。

## 快速诊断

运行内置的 doctor 命令进行全面健康检查：

```bash
prx doctor
```

检查项：

- 配置文件有效性
- 提供商连接和认证
- 系统依赖
- 磁盘空间和权限
- 活跃守护进程状态

## 常见问题

### 守护进程无法启动

**症状**：`prx daemon` 立即退出或无法绑定端口。

**解决方案**：
- 检查是否有另一个实例在运行：`prx daemon status`
- 验证端口可用：`ss -tlnp | grep 3120`
- 查看日志：`prx daemon logs`
- 验证配置：`prx config check`

### 提供商认证失败

**症状**："Unauthorized" 或 "Invalid API key" 错误。

**解决方案**：
- 验证 API 密钥：`prx auth status`
- 重新认证：`prx auth login <provider>`
- 检查环境变量：`env | grep API_KEY`

### 高内存使用

**症状**：PRX 进程消耗过多内存。

**解决方案**：
- 减少并发会话：设置 `[agent.limits] max_concurrent_sessions`
- 启用记忆维护：`prx memory compact`
- 检查长时间运行的会话：`prx session list`

### 工具执行挂起

**症状**：Agent 在工具执行期间卡住。

**解决方案**：
- 检查沙箱配置
- 验证工具依赖已安装
- 设置超时：`[agent] session_timeout_secs = 300`
- 取消会话：`prx session cancel <id>`

## 获取帮助

- 查看[诊断](./diagnostics)页面了解详细诊断流程
- 在 GitHub 上提 issue：`https://github.com/openprx/prx/issues`
- 加入社区 Discord 获取实时帮助

## 相关页面

- [诊断](./diagnostics)
