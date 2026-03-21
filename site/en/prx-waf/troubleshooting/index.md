---
title: Troubleshooting
description: Solutions for common PRX-WAF issues including database connection, rule loading, false positives, cluster synchronization, SSL certificates, and performance tuning.
---

# Troubleshooting

This page covers the most common issues encountered when running PRX-WAF, along with their causes and solutions.

## Database Connection Fails

**Symptoms:** PRX-WAF fails to start with "connection refused" or "authentication failed" errors.

**Solutions:**

1. **Verify PostgreSQL is running:**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **Test connectivity:**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. **Check the connection string** in your TOML config:

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. **Run migrations** if the database exists but tables are missing:

```bash
prx-waf -c configs/default.toml migrate
```

## Rules Not Loading

**Symptoms:** PRX-WAF starts but no rules are active. Attacks are not being detected.

**Solutions:**

1. **Check rule statistics:**

```bash
prx-waf rules stats
```

If the output shows 0 rules, the rules directory may be empty or misconfigured.

2. **Verify the rules directory** path in your config:

```toml
[rules]
dir = "rules/"
```

3. **Validate rule files:**

```bash
python rules/tools/validate.py rules/
```

4. **Check for YAML syntax errors** -- a single malformed file can prevent all rules from loading:

```bash
# Validate one file at a time to find the problem
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **Ensure built-in rules are enabled:**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Hot-Reload Not Working

**Symptoms:** Rule files are modified but changes are not taking effect.

**Solutions:**

1. **Verify hot-reload is enabled:**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **Trigger a manual reload:**

```bash
prx-waf rules reload
```

3. **Send SIGHUP:**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **Check filesystem watch limits** (Linux):

```bash
cat /proc/sys/fs/inotify/max_user_watches
# If too low, increase:
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## False Positives

**Symptoms:** Legitimate requests are being blocked (403 Forbidden).

**Solutions:**

1. **Identify the blocking rule** from the security events:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

Look for the `rule_id` field in the event.

2. **Disable the specific rule:**

```bash
prx-waf rules disable CRS-942100
```

3. **Lower the paranoia level.** If you are running at paranoia 2+, try reducing to 1:

```toml
# In your rules config, only load paranoia level 1 rules
```

4. **Switch the rule to log mode** for monitoring instead of blocking:

Edit the rule file and change `action: "block"` to `action: "log"`, then reload:

```bash
prx-waf rules reload
```

5. **Add an IP allowlist** for trusted sources:

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
When deploying new rules, start with `action: log` to monitor for false positives before switching to `action: block`.
:::

## SSL Certificate Issues

**Symptoms:** HTTPS connections fail, certificate errors, or Let's Encrypt renewal fails.

**Solutions:**

1. **Check certificate status** in the admin UI under **SSL Certificates**.

2. **Verify port 80 is accessible** from the internet for ACME HTTP-01 challenges.

3. **Check the certificate paths** if using manual certificates:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **Verify the certificate matches the domain:**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## Cluster Nodes Not Connecting

**Symptoms:** Worker nodes cannot join the cluster. Status shows "disconnected" peers.

**Solutions:**

1. **Verify network connectivity** on the cluster port (default: UDP 16851):

```bash
# From worker to main
nc -zuv node-a 16851
```

2. **Check firewall rules** -- cluster communication uses UDP:

```bash
sudo ufw allow 16851/udp
```

3. **Verify certificates** -- all nodes must use certificates signed by the same CA:

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. **Check seed configuration** on worker nodes:

```toml
[cluster]
seeds = ["node-a:16851"]   # Must resolve to the main node
```

5. **Review logs** with debug verbosity:

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## High Memory Usage

**Symptoms:** PRX-WAF process consumes more memory than expected.

**Solutions:**

1. **Reduce response cache size:**

```toml
[cache]
max_size_mb = 128    # Reduce from default 256
```

2. **Reduce database connection pool:**

```toml
[storage]
max_connections = 10   # Reduce from default 20
```

3. **Reduce worker threads:**

```toml
[proxy]
worker_threads = 2    # Reduce from CPU count
```

4. **Monitor memory usage:**

```bash
ps aux | grep prx-waf
```

## CrowdSec Connection Issues

**Symptoms:** CrowdSec integration shows "disconnected" or decisions are not loading.

**Solutions:**

1. **Test LAPI connectivity:**

```bash
prx-waf crowdsec test
```

2. **Verify the API key:**

```bash
# On the CrowdSec machine
cscli bouncers list
```

3. **Check the LAPI URL:**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. **Set a safe fallback action** for when LAPI is unreachable:

```toml
[crowdsec]
fallback_action = "log"    # Don't block when LAPI is down
```

## Performance Tuning

### Slow Response Times

1. **Enable response caching:**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **Increase worker threads:**

```toml
[proxy]
worker_threads = 8
```

3. **Increase database connections:**

```toml
[storage]
max_connections = 50
```

### High CPU Usage

1. **Reduce the number of active rules.** Disable paranoia level 3-4 rules if not needed.

2. **Disable unused detection phases.** For example, if you do not use CrowdSec:

```toml
[crowdsec]
enabled = false
```

## Getting Help

If none of the above solutions resolve your issue:

1. **Check existing issues:** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. **File a new issue** with:
   - PRX-WAF version
   - Operating system and kernel version
   - Configuration file (with passwords redacted)
   - Relevant log output
   - Steps to reproduce

## Next Steps

- [Configuration Reference](../configuration/reference) -- Fine-tune all settings
- [Rule Engine](../rules/) -- Understand how rules are evaluated
- [Cluster Mode](../cluster/) -- Cluster-specific troubleshooting
