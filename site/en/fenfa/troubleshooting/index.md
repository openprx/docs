---
title: Troubleshooting
description: Common issues and solutions when running Fenfa, including iOS installation failures, upload errors, and Docker problems.
---

# Troubleshooting

This page covers common issues encountered when running Fenfa and their solutions.

## iOS Installation

### "Unable to Install" / Installation Fails

**Symptoms:** Tapping the install button on iOS shows "Unable to Install" or nothing happens.

**Causes and Solutions:**

1. **HTTPS not configured.** iOS requires HTTPS with a valid TLS certificate for OTA installation. Self-signed certificates do not work.
   - **Fix:** Set up a reverse proxy with a valid TLS certificate. See [Production Deployment](../deployment/production).
   - **For testing:** Use `ngrok` to create an HTTPS tunnel: `ngrok http 8000`

2. **Wrong primary_domain.** The manifest plist contains download URLs based on `primary_domain`. If this is wrong, iOS cannot fetch the IPA.
   - **Fix:** Set `FENFA_PRIMARY_DOMAIN` to the exact HTTPS URL users access (e.g., `https://dist.example.com`).

3. **Certificate issues.** The TLS certificate must cover the domain and be trusted by iOS.
   - **Fix:** Use Let's Encrypt for free, trusted certificates.

4. **IPA signing expired.** The provisioning profile or signing certificate may have expired.
   - **Fix:** Re-sign the IPA with a valid certificate and re-upload.

### UDID Binding Not Working

**Symptoms:** The mobileconfig profile installs but the device is not registered.

**Causes and Solutions:**

1. **Callback URL unreachable.** The UDID callback URL must be reachable from the device.
   - **Fix:** Ensure `primary_domain` is correct and accessible from the device's network.

2. **Nonce expired.** Profile nonces expire after a timeout.
   - **Fix:** Re-download the mobileconfig profile and try again.

## Upload Issues

### Upload Fails with 401

**Symptom:** `{"ok": false, "error": {"code": "UNAUTHORIZED", ...}}`

**Fix:** Check that the `X-Auth-Token` header contains a valid token. Upload endpoints accept both upload and admin tokens.

```bash
# Verify your token works
curl -H "X-Auth-Token: YOUR_TOKEN" http://localhost:8000/admin/api/products
```

### Upload Fails with 413 (Request Entity Too Large)

**Symptom:** Large file uploads fail with a 413 error.

**Fix:** This is typically a reverse proxy limit, not Fenfa itself. Increase the limit:

**Nginx:**
```nginx
client_max_body_size 2G;
```

**Caddy:**
Caddy has no default body size limit, but if you've set one:
```
dist.example.com {
    request_body {
        max_size 2GB
    }
    reverse_proxy localhost:8000
}
```

### Smart Upload Doesn't Detect Metadata

**Symptom:** Version and build number are empty after smart upload.

**Fix:** Smart upload auto-detection only works for IPA and APK files. For desktop formats (DMG, EXE, DEB, etc.), provide `version` and `build` explicitly in the upload request.

## Docker Issues

### Container Starts but Admin Panel is Empty

**Symptom:** The admin panel loads but shows no data or a blank page.

**Fix:** Check that the container is running and the port mapping is correct:

```bash
docker ps
docker logs fenfa
```

### Data Lost After Container Restart

**Symptom:** All products, variants, and releases disappear after restarting the container.

**Fix:** Mount persistent volumes:

```bash
docker run -d --name fenfa -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Permission Denied on Mounted Volumes

**Symptom:** Fenfa fails to write to `/data` or `/app/uploads`.

**Fix:** Ensure the host directories exist and have correct permissions:

```bash
mkdir -p data uploads
chmod 777 data uploads  # Or set appropriate UID/GID
```

## Database Issues

### "database is locked" Error

**Symptom:** SQLite returns "database is locked" under high concurrency.

**Fix:** SQLite handles concurrent reads well but serializes writes. This error typically occurs under very high write load. Solutions:
- Ensure only one Fenfa instance writes to the same database file.
- If running multiple instances, use S3 storage and a shared database (or switch to a different database backend in a future release).

### Corrupted Database

**Symptom:** Fenfa fails to start with SQLite errors.

**Fix:** Restore from backup:

```bash
# Stop Fenfa
docker stop fenfa

# Restore backup
cp /backups/fenfa-latest.db /path/to/data/fenfa.db

# Restart
docker start fenfa
```

::: tip Prevention
Set up automated daily backups. See [Production Deployment](../deployment/production) for a backup script.
:::

## Network Issues

### iOS Manifest Returns Wrong URLs

**Symptom:** iOS manifest plist contains `http://localhost:8000` instead of the public domain.

**Fix:** Set `FENFA_PRIMARY_DOMAIN` to your public HTTPS URL:

```bash
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

### Downloads Slow or Timing Out

**Symptom:** Large file downloads are slow or fail.

**Possible fixes:**
- Increase reverse proxy timeout: `proxy_read_timeout 600s;` (Nginx)
- Disable request buffering: `proxy_request_buffering off;` (Nginx)
- Consider using S3-compatible storage with a CDN for large files

## Getting Help

If your issue is not covered here:

1. Check the [GitHub Issues](https://github.com/openprx/fenfa/issues) for known problems.
2. Review the container logs: `docker logs fenfa`
3. Open a new issue with:
   - Fenfa version (`docker inspect fenfa | grep Image`)
   - Relevant log output
   - Steps to reproduce the issue
