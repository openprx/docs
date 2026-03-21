---
title: Quick Start
description: Get PRX running in 5 minutes. Install, configure an LLM provider, start the daemon, and chat.
---

# Quick Start

This guide gets you from zero to a running PRX agent in under 5 minutes.

## Step 1: Install PRX

Install the latest release:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

Verify the installation:

```bash
prx --version
```

::: tip
See the [Installation Guide](./installation) for alternative methods (Cargo, source build, Docker).
:::

## Step 2: Run the Onboarding Wizard

The onboarding wizard configures your LLM provider, API key, and initial settings interactively:

```bash
prx onboard
```

The wizard walks you through:

1. **Selecting a provider** -- Anthropic, OpenAI, Ollama, OpenRouter, and more
2. **Entering your API key** -- stored securely in the config file
3. **Choosing a default model** -- the wizard fetches available models from your provider
4. **Setting a memory backend** -- Markdown (default), SQLite, or PostgreSQL

After the wizard completes, your configuration is saved to `~/.config/openprx/openprx.toml`.

::: info Quick Setup
If you already know your provider and model, skip the interactive wizard:

```bash
prx onboard --provider anthropic --api-key sk-ant-... --model claude-sonnet-4-20250514
```

See [Onboarding Wizard](./onboarding) for all options.
:::

## Step 3: Start the Daemon

Start the PRX daemon in the background. The daemon manages the agent runtime, gateway API, and all configured channels:

```bash
prx daemon
```

By default, the daemon listens on `127.0.0.1:3120`. You can customize the host and port:

```bash
prx daemon --host 0.0.0.0 --port 8080
```

::: tip Running as a Service
For production deployments, install PRX as a system service so it starts automatically on boot:

```bash
prx service install
```

This creates a systemd unit (Linux) or launchd plist (macOS). See [prx service](../cli/service) for details.
:::

## Step 4: Chat with PRX

Open an interactive chat session directly in your terminal:

```bash
prx chat
```

This connects to the running daemon and opens a REPL where you can talk to your configured LLM. Type your message and press Enter:

```
You: What can you help me with?
PRX: I can help you with a wide range of tasks...
```

You can also specify a provider and model for a single session:

```bash
prx chat --provider ollama --model llama3.2
```

Press `Ctrl+C` or type `/quit` to exit the chat.

## Step 5: Connect a Channel

PRX supports 19 messaging channels. To connect one, add its configuration to your `~/.config/openprx/openprx.toml` file.

For example, to connect a Telegram bot:

```toml
[channels.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["your_telegram_username"]
```

Then restart the daemon to pick up the new channel:

```bash
prx daemon
```

Or use the channel management command:

```bash
prx channel add telegram
```

See the [Channels Overview](../channels/) for the full list of supported platforms and their configuration.

## Step 6: Check Status

View the current state of your PRX instance:

```bash
prx status
```

This displays:

- **Version** and binary path
- **Workspace** directory
- **Config** file location
- **Provider** and model in use
- **Active channels** and their connection status
- **Memory backend** and statistics
- **Uptime** and resource usage

Example output:

```
PRX Status

Version:     0.3.0
Workspace:   /home/user/.local/share/openprx
Config:      /home/user/.config/openprx/openprx.toml
Provider:    anthropic (claude-sonnet-4-20250514)
Memory:      markdown (/home/user/.local/share/openprx/memory)
Channels:    telegram (connected), cli (active)
Gateway:     http://127.0.0.1:3120
Uptime:      2h 15m
```

## What Next?

Now that PRX is running, explore the rest of the documentation:

| Topic | Description |
|-------|-------------|
| [Onboarding Wizard](./onboarding) | Deep-dive into all onboarding options |
| [Channels](../channels/) | Connect Telegram, Discord, Slack, and 16 more |
| [Providers](../providers/) | Configure and switch between LLM providers |
| [Tools](../tools/) | Explore 46+ built-in tools |
| [Self-Evolution](../self-evolution/) | Learn about the L1/L2/L3 evolution system |
| [Configuration](../config/) | Full config reference with all options |
| [CLI Reference](../cli/) | Complete command reference |
