---
title: Ollama
description: Ollama-ს კონფიგურაცია PRX-ში ლოკალური და თვითჰოსტინგული LLM ინფერენსისთვის
---

# Ollama

> Run LLMs locally or on self-hosted infrastructure with Ollama. Supports vision, native tool calling, reasoning models, and optional cloud routing via Ollama Cloud.

## წინაპირობები

- [Ollama](https://ollama.com/) installed and running locally, **or**
- A remote Ollama instance with network access

## სწრაფი დაყენება

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start the server
ollama serve
```

### 2. Pull a Model

```bash
ollama pull qwen3
```

### 3. კონფიგურაცია

```toml
[default]
provider = "ollama"
model = "qwen3"
```

No API key is required for local usage.

### 4. შემოწმება

```bash
prx doctor models
```

## Available Models

Any model available through Ollama can be used. Popular choices include:

| Model | Parameters | Vision | Tool Use | Notes |
|-------|-----------|--------|----------|-------|
| `qwen3` | 8B | No | Yes | Excellent multilingual coding model |
| `qwen2.5-coder` | 7B | No | Yes | Specialized for code |
| `llama3.1` | 8B/70B/405B | No | Yes | Meta's open model family |
| `mistral-nemo` | 12B | No | Yes | Efficient reasoning |
| `deepseek-r1` | 7B/14B/32B | No | Yes | Reasoning model |
| `llava` | 7B/13B | Yes | No | Vision + language |
| `gemma2` | 9B/27B | No | Yes | Google's open model |
| `codellama` | 7B/13B/34B | No | No | Code-specialized Llama |

Run `ollama list` to see your installed models.

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `api_key` | string | optional | API key for remote/cloud Ollama instances |
| `api_url` | string | `http://localhost:11434` | Ollama server base URL |
| `model` | string | required | Model name (e.g., `qwen3`, `llama3.1:70b`) |
| `reasoning` | bool | optional | Enable `think` mode for reasoning models |

## ფუნქციები

### Zero Configuration for Local Use

When running Ollama locally, no API key or special configuration is needed. PRX automatically connects to `http://localhost:11434`.

### Native Tool Calling

PRX uses Ollama's native `/api/chat` tool-calling support. Tool definitions are sent in the request body and structured `tool_calls` are returned by compatible models (qwen2.5, llama3.1, mistral-nemo, etc.).

PRX also handles quirky model behaviors:
- **Nested tool calls**: `{"name": "tool_call", "arguments": {"name": "shell", ...}}` are automatically unwrapped
- **Prefixed names**: `tool.shell` is normalized to `shell`
- **Tool result mapping**: Tool call IDs are tracked and mapped to `tool_name` fields in follow-up tool result messages

### Vision Support

Vision-capable models (e.g., LLaVA) receive images via Ollama's native `images` field. PRX automatically extracts base64 image data from `[IMAGE:...]` markers and sends them as separate image entries.

### Reasoning Mode

For reasoning models (QwQ, DeepSeek-R1, etc.), enable the `think` parameter:

```toml
[providers.ollama]
reasoning = true
```

This sends `"think": true` in the request, enabling the model's internal reasoning process. If the model returns only a `thinking` field with empty content, PRX provides a graceful fallback message.

### Remote and Cloud Instances

To connect to a remote Ollama server:

```toml
[providers.ollama]
api_url = "https://my-ollama-server.example.com:11434"
api_key = "${OLLAMA_API_KEY}"
```

Authentication is only sent for non-local endpoints (when the host is not `localhost`, `127.0.0.1`, or `::1`).

### Cloud Routing

Append `:cloud` to a model name to force routing through a remote Ollama instance:

```bash
prx chat --model "qwen3:cloud"
```

Cloud routing requires:
- A non-local `api_url`
- An `api_key` configured

### Extended Timeout

Ollama requests use a 300-second timeout (compared to 120 seconds for cloud providers), accounting for the potentially slower inference on local hardware.

## პრობლემების მოგვარება

### "Is Ollama running?"

The most common error. Solutions:
- Start the server: `ollama serve`
- Check if the port is accessible: `curl http://localhost:11434`
- If using a custom port, update `api_url` in your config

### Model not found

Pull the model first:
```bash
ollama pull qwen3
```

### Empty responses

Some reasoning models may return only `thinking` content without a final response. This usually means the model stopped prematurely. Try:
- Sending the request again
- Using a different model
- Disabling reasoning mode if the model does not support it well

### Tool calls not working

Not all Ollama models support tool calling. Models known to work well:
- `qwen2.5` / `qwen3`
- `llama3.1`
- `mistral-nemo`
- `command-r`

### Cloud routing errors

- "requested cloud routing, but Ollama endpoint is local": Set `api_url` to a remote server
- "requested cloud routing, but no API key is configured": Set `api_key` or `OLLAMA_API_KEY`
