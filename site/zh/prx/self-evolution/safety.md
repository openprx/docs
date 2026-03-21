---
title: 进化安全
description: PRX 自进化的回滚保护、完整性检查和安全机制。
---

# 进化安全

安全是自进化系统的首要优先级。每个变更都包含回滚能力、前/后完整性检查和自动回归检测，以防止有害修改。

## 安全机制

### 回滚保护

每个进化变更在应用前创建快照。如果检测到问题，系统可以立即恢复到之前的状态：

- **自动回滚** -- 变更后完整性检查失败时触发
- **手动回滚** -- 通过 CLI 提供人工发起的回滚
- **基于时间的回滚** -- 如果在回滚窗口内未被显式确认，变更自动恢复

### 完整性检查

每次变更前后，系统验证：

- 核心功能仍然正常（冒烟测试）
- 安全不变量得到维护（例如，不削弱安全策略）
- 性能指标保持在可接受范围内
- 无循环依赖或冲突规则

### 回归检测

变更应用后，系统在可配置的期间内监控关键指标：

- 任务完成率
- 错误率
- 平均响应质量
- 用户满意度信号

如果任何指标退化超过阈值，变更将自动回滚。

## 配置

```toml
[self_evolution.safety]
rollback_enabled = true
rollback_window_hours = 168  # 7 天
sanity_check_timeout_secs = 30
regression_monitoring_hours = 24
max_regression_threshold = 0.1  # 10% 退化触发回滚
```

## CLI 命令

```bash
prx evolution status          # 查看活跃的进化状态
prx evolution rollback        # 回滚最后一次变更
prx evolution history         # 查看进化历史
prx evolution approve <id>    # 批准待处理的提案
```

## 相关页面

- [自进化概览](./)
- [进化流水线](./pipeline)
- [安全策略引擎](/zh/prx/security/policy-engine)
