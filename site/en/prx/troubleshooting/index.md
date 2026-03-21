---
title: Troubleshooting
description: Common issues and solutions for PRX, including diagnostics tools and FAQ.
---

# Troubleshooting

This section covers common issues encountered when running PRX and how to resolve them.

## Quick Diagnostics

Run the built-in doctor command for a comprehensive health check:

```bash
prx doctor
```

This checks:

- Configuration file validity
- Provider connectivity and authentication
- System dependencies
- Disk space and permissions
- Active daemon status

## Common Issues

### Daemon won't start

**Symptoms**: `prx daemon` exits immediately or fails to bind.

**Solutions**:
- Check if another instance is running: `prx daemon status`
- Verify the port is available: `ss -tlnp | grep 3120`
- Check logs: `prx daemon logs`
- Validate config: `prx config check`

### Provider authentication fails

**Symptoms**: "Unauthorized" or "Invalid API key" errors.

**Solutions**:
- Verify your API key: `prx auth status`
- Re-authenticate: `prx auth login <provider>`
- Check environment variables: `env | grep API_KEY`

### High memory usage

**Symptoms**: PRX process consuming excessive memory.

**Solutions**:
- Reduce concurrent sessions: set `[agent.limits] max_concurrent_sessions`
- Enable memory hygiene: `prx memory compact`
- Check for long-running sessions: `prx session list`

### Tool execution hangs

**Symptoms**: Agent appears stuck during tool execution.

**Solutions**:
- Check sandbox configuration
- Verify tool dependencies are installed
- Set a timeout: `[agent] session_timeout_secs = 300`
- Cancel the session: `prx session cancel <id>`

## Getting Help

- Check the [Diagnostics](./diagnostics) page for detailed diagnostic procedures
- Open an issue on GitHub: `https://github.com/openprx/prx/issues`
- Join the community Discord for real-time help

## Related Pages

- [Diagnostics](./diagnostics)
