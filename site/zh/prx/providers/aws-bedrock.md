---
title: AWS Bedrock
description: 在 PRX 中配置 Amazon Bedrock 作为 LLM 提供商
---

# AWS Bedrock

> 通过 Amazon Bedrock 访问多种基础模型，使用 AWS IAM 认证，适合企业级部署。

## 前置条件

- 一个 AWS 账号
- 已在 Bedrock 控制台中启用所需模型
- 配置好 AWS 凭证（IAM 用户或角色）
- PRX 守护进程已运行

## 快速配置

### 1. 启用模型

1. 登录 [AWS Console](https://console.aws.amazon.com/bedrock/)
2. 进入 **Model access** 页面
3. 申请并启用所需的模型（如 Claude、Llama 等）

### 2. 配置 AWS 凭证

确保 AWS CLI 凭证已配置：

```bash
aws configure
# 或设置环境变量
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="us-east-1"
```

### 3. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "bedrock"
default_model = "anthropic.claude-sonnet-4-6-v1"
```

别名：`aws-bedrock`

### 4. 验证

```bash
prx status
```

## 可用模型

| 模型 ID | 提供商 | 上下文 | 视觉 | 工具调用 | 备注 |
|---------|--------|--------|------|----------|------|
| `anthropic.claude-sonnet-4-6-v1` | Anthropic | 200K | 是 | 是 | Claude Sonnet 4 |
| `anthropic.claude-3-5-sonnet-20241022-v2:0` | Anthropic | 200K | 是 | 是 | Claude 3.5 Sonnet |
| `anthropic.claude-3-haiku-20240307-v1:0` | Anthropic | 200K | 是 | 是 | Claude 3 Haiku |
| `amazon.titan-text-express-v1` | Amazon | 8K | 否 | 否 | Titan Text Express |
| `meta.llama3-70b-instruct-v1:0` | Meta | 8K | 否 | 是 | Llama 3 70B |

::: info
可用模型取决于所选 AWS Region 和你的模型访问权限。
:::

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | - | 设为 `"bedrock"` 或 `"aws-bedrock"` |
| `default_model` | String | - | Bedrock 模型 ID |
| `api_url` | String? | `null` | 自定义 Bedrock 端点（通常不需要） |

AWS 凭证通过标准 AWS SDK 凭证链解析：

1. 环境变量（`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`）
2. AWS 凭证文件（`~/.aws/credentials`）
3. IAM 角色（EC2 / ECS / Lambda 自动获取）

## 功能特性

- **企业级安全** — 使用 AWS IAM 认证，集成企业安全体系
- **多模型选择** — 在同一平台访问多个提供商的模型
- **私有网络** — 支持 VPC 端点，流量不经公网
- **流式输出** — 支持流式传输
- **按量计费** — 按使用量付费，无需预付费

## 限制

- 不同 Region 可用的模型不同
- 模型需要先在控制台中申请启用
- 部分模型的 API 与原生 API 有细微差异
- 计费方式和价格与直接使用模型提供商不同

## 故障排除

**AccessDeniedException**

1. 确认 IAM 用户/角色有 `bedrock:InvokeModel` 权限
2. 检查模型是否已在 Bedrock 控制台启用
3. 确认 AWS Region 正确

**模型不可用**

- 检查当前 Region 是否支持所选模型
- 部分模型需要额外申请
