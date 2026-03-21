---
title: Quick Start
description: Get PRX-WAF protecting your web application in 5 minutes. Start the proxy, add a backend host, verify protection, and monitor security events.
---

# Quick Start

This guide takes you from zero to a fully protected web application in under 5 minutes. By the end, PRX-WAF will be proxying traffic to your backend, blocking common attacks, and logging security events.

::: tip Prerequisites
You need Docker and Docker Compose installed. See the [Installation Guide](./installation) for other methods.
:::

## Step 1: Start PRX-WAF

Clone the repository and start all services:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

Verify that all containers are running:

```bash
docker compose ps
```

Expected output:

```
NAME         SERVICE     STATUS
prx-waf      prx-waf     running
postgres     postgres    running
```

## Step 2: Log In to the Admin UI

Open your browser and navigate to `http://localhost:9527`. Log in with the default credentials:

- **Username:** `admin`
- **Password:** `admin`

::: warning
Change the default password immediately after your first login.
:::

## Step 3: Add a Backend Host

Add your first protected host through the admin UI or via the API:

**Via Admin UI:**
1. Navigate to **Hosts** in the sidebar
2. Click **Add Host**
3. Fill in:
   - **Host:** `example.com` (the domain you want to protect)
   - **Remote Host:** `192.168.1.100` (your backend server IP)
   - **Remote Port:** `8080` (your backend server port)
   - **Guard Status:** Enabled
4. Click **Save**

**Via API:**

```bash
# Obtain a JWT token
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Add a host
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "192.168.1.100",
    "remote_port": 8080,
    "guard_status": true
  }'
```

## Step 4: Test Protection

Send a legitimate request through the proxy:

```bash
curl -H "Host: example.com" http://localhost/
```

You should receive your backend's normal response. Now test that the WAF blocks a SQL injection attempt:

```bash
curl -H "Host: example.com" "http://localhost/?id=1%20OR%201=1--"
```

Expected response: **403 Forbidden**

Test an XSS attempt:

```bash
curl -H "Host: example.com" "http://localhost/?q=<script>alert(1)</script>"
```

Expected response: **403 Forbidden**

Test a path traversal attempt:

```bash
curl -H "Host: example.com" "http://localhost/../../etc/passwd"
```

Expected response: **403 Forbidden**

## Step 5: Monitor Security Events

View blocked attacks in the admin UI:

1. Navigate to **Security Events** in the sidebar
2. You should see the blocked requests from Step 4
3. Each event shows the attack type, source IP, matched rule, and timestamp

Or query events via the API:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/security-events
```

```json
{
  "events": [
    {
      "id": 1,
      "host": "example.com",
      "source_ip": "172.18.0.1",
      "attack_type": "sqli",
      "rule_id": "CRS-942100",
      "action": "block",
      "timestamp": "2026-03-21T10:05:32Z"
    }
  ]
}
```

## Step 6: Enable Real-Time Monitoring (Optional)

Connect to the WebSocket endpoint for live security events:

```bash
# Using websocat or similar WebSocket client
websocat ws://localhost:9527/ws/events
```

Events stream in real-time as attacks are detected and blocked.

## What You Have Now

After completing these steps, your setup includes:

| Component | Status |
|-----------|--------|
| Reverse proxy | Listening on port 80/443 |
| WAF engine | 16-phase detection pipeline active |
| Built-in rules | OWASP CRS (310+ rules) enabled |
| Admin UI | Running on port 9527 |
| PostgreSQL | Storing config, rules, and events |
| Real-time monitoring | WebSocket event stream available |

## Next Steps

- [Rule Engine](../rules/) -- Understand how the YAML rule engine works
- [YAML Syntax](../rules/yaml-syntax) -- Learn the rule schema for custom rules
- [Reverse Proxy](../gateway/reverse-proxy) -- Configure load balancing and upstream routing
- [SSL/TLS](../gateway/ssl-tls) -- Enable HTTPS with automatic Let's Encrypt certificates
- [Configuration Reference](../configuration/reference) -- Fine-tune every aspect of PRX-WAF
