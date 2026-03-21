---
title: prx skills
description: Manage installable skills that extend PRX agent capabilities.
---

# prx skills

Manage skills -- modular capability packages that extend what the PRX agent can do. Skills bundle prompts, tool configurations, and WASM plugins into installable units.

## Usage

```bash
prx skills <SUBCOMMAND> [OPTIONS]
```

## Subcommands

### `prx skills list`

List installed skills and available skills from the registry.

```bash
prx skills list [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--installed` | | `false` | Show only installed skills |
| `--available` | | `false` | Show only available (not yet installed) skills |
| `--json` | `-j` | `false` | Output as JSON |

**Example output:**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

Install a skill from the registry or a local path.

```bash
prx skills install <NAME|PATH> [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--version` | `-v` | latest | Specific version to install |
| `--force` | `-f` | `false` | Reinstall even if already installed |

```bash
# Install from registry
prx skills install code-review

# Install a specific version
prx skills install web-research --version 1.0.2

# Install from local path
prx skills install ./my-custom-skill/

# Force reinstall
prx skills install code-review --force
```

### `prx skills remove`

Uninstall a skill.

```bash
prx skills remove <NAME> [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--force` | `-f` | `false` | Skip confirmation prompt |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## Skill Structure

A skill package contains:

```
my-skill/
  skill.toml          # Skill metadata and configuration
  system_prompt.md    # Additional system prompt instructions
  tools.toml          # Tool definitions and permissions
  plugin.wasm         # Optional WASM plugin binary
```

The `skill.toml` manifest:

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## Skill Directory

Installed skills are stored in:

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## Related

- [Plugins Overview](/en/prx/plugins/) -- WASM plugin system
- [Tools Overview](/en/prx/tools/) -- built-in tools
- [Developer Guide](/en/prx/plugins/developer-guide) -- building custom plugins
