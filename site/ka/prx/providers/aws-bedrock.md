---
title: AWS Bedrock
description: AWS Bedrock-ის კონფიგურაცია PRX-ში LLM პროვაიდერად
---

# AWS Bedrock

> Access foundation models (Claude, Titan, Llama, Mistral, and more) through AWS Bedrock's Converse API with SigV4 authentication, native tool calling, and prompt caching.

## წინაპირობები

- An AWS account with Bedrock model access enabled
- AWS credentials (Access Key ID + Secret Access Key) with `bedrock:InvokeModel` permissions

## სწრაფი დაყენება

### 1. Enable Model Access

1. Open the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to **Model access** in the left sidebar
3. Request access to the models you want to use (e.g., Anthropic Claude, Meta Llama)

### 2. Configure AWS Credentials

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # optional, defaults to us-east-1
```

### 3. Configure PRX

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. შემოწმება

```bash
prx doctor models
```

## Available Models

Model IDs follow the Bedrock format `<provider>.<model>-<version>`:

| Model ID | Provider | Context | Vision | Tool Use | Notes |
|----------|----------|---------|--------|----------|-------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | Yes | Yes | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | Yes | Yes | Latest Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | Yes | Yes | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | Yes | Yes | Fast Claude model |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | No | Yes | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | No | Yes | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | No | No | Amazon Titan |

Check [AWS Bedrock documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) for the full list of available models in your region.

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `model` | string | required | Bedrock model ID (e.g., `anthropic.claude-sonnet-4-6`) |

Authentication is handled entirely through AWS environment variables:

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Yes | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret access key |
| `AWS_SESSION_TOKEN` | No | Temporary session token (for assumed roles) |
| `AWS_REGION` | No | AWS region (default: `us-east-1`) |
| `AWS_DEFAULT_REGION` | No | Fallback region if `AWS_REGION` is not set |

## ფუნქციები

### Zero-Dependency SigV4 Signing

PRX implements AWS SigV4 request signing using only `hmac` and `sha2` crates, with no dependency on the AWS SDK. This keeps the binary small and avoids SDK version conflicts. The signing includes:

- HMAC-SHA256 key derivation chain
- Canonical request construction with sorted headers
- `x-amz-security-token` support for temporary credentials

### Converse API

PRX uses Bedrock's Converse API (not the legacy InvokeModel API), which provides:
- A unified message format across all model providers
- Structured tool calling with `toolUse` and `toolResult` blocks
- System prompt support
- Consistent response format

### Native Tool Calling

Tools are sent using Bedrock's native `toolConfig` format with `toolSpec` definitions including `name`, `description`, and `inputSchema`. Tool results are wrapped as `toolResult` content blocks within `user` messages.

### Prompt Caching

PRX applies Bedrock's prompt caching heuristics (using the same thresholds as the Anthropic provider):
- System prompts > 3 KB receive a `cachePoint` block
- Conversations with > 4 non-system messages have the last message annotated with a `cachePoint`

### URL Encoding for Model IDs

Bedrock model IDs containing colons (e.g., `v1:0`) require special handling. PRX:
- Sends raw colons in the HTTP URL (as reqwest does)
- Encodes colons as `%3A` in the canonical URI for SigV4 signing
- This dual approach ensures both HTTP routing and signature verification succeed

## Provider Aliases

The following names resolve to the Bedrock provider:

- `bedrock`
- `aws-bedrock`

## პრობლემების მოგვარება

### "AWS Bedrock credentials not set"

Ensure both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set as environment variables. PRX does not read from `~/.aws/credentials` or `~/.aws/config`.

### 403 AccessDeniedException

Common causes:
- The IAM user/role does not have `bedrock:InvokeModel` permission
- You have not requested access to the model in the Bedrock console
- The model is not available in your configured region

### SignatureDoesNotMatch

This usually indicates clock skew. Ensure your system clock is synchronized:
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```

### Model not available in region

Not all models are available in all regions. Check the [Bedrock model availability matrix](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) and adjust `AWS_REGION` accordingly.

### Using temporary credentials (STS)

If you are using AWS STS (assumed roles, SSO), set all three variables:
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

The session token is automatically included in the SigV4 signature as the `x-amz-security-token` header.
