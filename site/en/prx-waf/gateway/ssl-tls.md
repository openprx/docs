---
title: SSL/TLS Configuration
description: Configure HTTPS in PRX-WAF with automatic Let's Encrypt certificates, manual certificate management, HTTP/3 QUIC support, and TLS best practices.
---

# SSL/TLS Configuration

PRX-WAF supports automatic TLS certificate management via Let's Encrypt (ACME v2), manual certificate configuration, and HTTP/3 via QUIC. This page covers all HTTPS-related configuration.

## Automatic Certificates (Let's Encrypt)

PRX-WAF uses the `instant-acme` library to obtain and renew TLS certificates automatically from Let's Encrypt. When a host is configured with SSL enabled, PRX-WAF will:

1. Respond to ACME HTTP-01 challenges on port 80
2. Obtain a certificate from Let's Encrypt
3. Store the certificate in the database
4. Auto-renew before expiration

::: tip
For automatic certificates to work, port 80 must be reachable from the internet for ACME HTTP-01 challenge validation.
:::

## Manual Certificates

For environments where automatic ACME is not suitable, configure certificates manually:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

You can also upload certificates via the admin UI:

1. Navigate to **SSL Certificates** in the sidebar
2. Click **Upload Certificate**
3. Provide the certificate chain (PEM) and private key (PEM)
4. Associate the certificate with a host

Or via the API:

```bash
curl -X POST http://localhost:9527/api/certificates \
  -H "Authorization: Bearer $TOKEN" \
  -F "cert=@/path/to/cert.pem" \
  -F "key=@/path/to/key.pem" \
  -F "host=example.com"
```

## TLS Listener

PRX-WAF listens for HTTPS traffic on the configured TLS address:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"      # HTTP
listen_addr_tls = "0.0.0.0:443"     # HTTPS
```

## HTTP/3 (QUIC)

PRX-WAF supports HTTP/3 via the Quinn QUIC library. Enable it in the configuration:

```toml
[http3]
enabled     = true
listen_addr = "0.0.0.0:443"
cert_pem    = "/etc/prx-waf/tls/cert.pem"
key_pem     = "/etc/prx-waf/tls/key.pem"
```

::: warning
HTTP/3 requires a valid TLS certificate. The cert and key paths must be provided when HTTP/3 is enabled. Automatic Let's Encrypt certificates are also supported for HTTP/3.
:::

HTTP/3 runs over UDP on the same port as HTTPS (443). Clients that support QUIC will automatically upgrade, while others fall back to HTTP/2 or HTTP/1.1 over TCP.

## HTTPS Redirect

To redirect all HTTP traffic to HTTPS, configure your hosts with both port 80 (HTTP) and port 443 (HTTPS). PRX-WAF will automatically redirect HTTP requests to their HTTPS equivalents when SSL is configured for a host.

## Certificate Storage

All certificates (automatic and manual) are stored in the PostgreSQL database. The `certificates` table (migration `0003`) holds:

- Certificate chain (PEM)
- Private key (encrypted with AES-256-GCM)
- Domain name
- Expiration date
- ACME account information (for auto-renewal)

::: info
Private keys are encrypted at rest using AES-256-GCM. The encryption key is derived from the configuration. Never store unencrypted private keys in the database.
:::

## Docker with HTTPS

When running in Docker, map port 443 for TLS traffic:

```yaml
# docker-compose.yml
services:
  prx-waf:
    ports:
      - "80:80"
      - "443:443"
      - "9527:9527"
```

For HTTP/3, also map the UDP port:

```yaml
    ports:
      - "80:80"
      - "443:443/tcp"
      - "443:443/udp"  # HTTP/3 QUIC
      - "9527:9527"
```

## Best Practices

1. **Always use HTTPS in production.** HTTP should only serve ACME challenges and redirect to HTTPS.

2. **Enable HTTP/3** for clients that support it. QUIC provides faster connection establishment and better performance on lossy networks.

3. **Use automatic certificates** when possible. Let's Encrypt certificates are free, trusted by all browsers, and auto-renewed by PRX-WAF.

4. **Restrict admin API access.** The admin API should only be accessible from trusted networks:

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12"]
```

## Next Steps

- [Reverse Proxy](./reverse-proxy) -- Backend routing and host configuration
- [Gateway Overview](./index) -- Response caching and tunnels
- [Cluster Mode](../cluster/) -- Multi-node TLS with mTLS certificates
