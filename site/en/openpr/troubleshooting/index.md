---
title: Troubleshooting
description: Solutions for common OpenPR issues including database connections, authentication errors, Docker problems, and MCP server configuration.
---

# Troubleshooting

This page covers common issues and their solutions when running OpenPR.

## Database Connection

### API fails to start with "connection refused"

The API server starts before PostgreSQL is ready.

**Solution**: The Docker Compose file includes health checks and `depends_on` with `condition: service_healthy`. If the issue persists, increase the PostgreSQL `start_period`:

```yaml
postgres:
  healthcheck:
    start_period: 30s  # Increase from default 10s
```

### "role openpr does not exist"

The PostgreSQL user hasn't been created.

**Solution**: Check that `POSTGRES_USER` and `POSTGRES_PASSWORD` are set in the Docker Compose environment. If running PostgreSQL manually:

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### Migrations not applied

Migrations only run automatically on the first PostgreSQL container start (via `docker-entrypoint-initdb.d`).

**Solution**: If the database already exists, apply migrations manually:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# Then run each migration SQL file in order
```

Or recreate the volume:

```bash
docker-compose down -v
docker-compose up -d
```

::: warning Data Loss
`docker-compose down -v` deletes the database volume. Back up your data first.
:::

## Authentication

### "Invalid token" after server restart

JWT tokens are signed with `JWT_SECRET`. If this value changes between restarts, all existing tokens become invalid.

**Solution**: Set a fixed `JWT_SECRET` in `.env`:

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### First user is not admin

The admin role is assigned to the first user who registers. If you see `role: "user"` instead of `role: "admin"`, another account was registered first.

**Solution**: Use the database to update the role:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### Podman build fails with DNS error

Podman's default network does not have DNS access during builds.

**Solution**: Always use `--network=host` when building images with Podman:

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### Frontend shows "502 Bad Gateway"

The Nginx container cannot reach the API server.

**Solution**: Check that:
1. The API container is running: `docker-compose ps`
2. The API health check passes: `docker exec openpr-api curl -f http://localhost:8080/health`
3. Both containers are on the same network: `docker network inspect openpr_openpr-network`

### Port conflicts

Another service is using the same port.

**Solution**: Change the external port mapping in `docker-compose.yml`:

```yaml
api:
  ports:
    - "8082:8080"  # Changed from 8081
```

## MCP Server

### "tools/list returns empty"

The MCP server cannot connect to the API.

**Solution**: Verify environment variables:

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

Check that:
- `OPENPR_API_URL` points to the correct API endpoint
- `OPENPR_BOT_TOKEN` is a valid bot token (starts with `opr_`)
- `OPENPR_WORKSPACE_ID` is a valid workspace UUID

### stdio transport not working

The MCP binary needs to be configured as a command in your AI client.

**Solution**: Ensure the binary path is correct and the environment variables are set:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/absolute/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_...",
        "OPENPR_WORKSPACE_ID": "..."
      }
    }
  }
}
```

### SSE connection drops

SSE connections may be closed by proxy servers with short timeouts.

**Solution**: If using a reverse proxy, increase the timeout for the SSE endpoint:

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## Frontend

### Blank page after deployment

The frontend build may be using the wrong API URL.

**Solution**: Set `VITE_API_URL` before building:

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### Login works but pages are empty

API requests are failing silently. Check the browser console (F12) for 401 or CORS errors.

**Solution**: Ensure the API is accessible from the browser and CORS is configured. The frontend should proxy API requests through Nginx.

## Performance

### Slow searches

PostgreSQL full-text search can be slow on large datasets without proper indexes.

**Solution**: Ensure FTS indexes exist (they are created by the migrations):

```sql
-- Check for existing indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### High memory usage

The API server processes file uploads in memory.

**Solution**: Limit upload sizes and monitor the `uploads/` directory. Consider setting up periodic cleanup for old uploads.

## Getting Help

If your issue is not covered here:

1. Check the [GitHub Issues](https://github.com/openprx/openpr/issues) for known problems.
2. Review the API and MCP server logs for error messages.
3. Open a new issue with your error logs, environment details, and steps to reproduce.
