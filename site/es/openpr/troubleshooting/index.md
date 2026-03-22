---
title: Resolución de Problemas
description: "Soluciones para problemas comunes de OpenPR incluyendo conexiones a la base de datos, errores de autenticación, problemas de Docker y configuración del servidor MCP."
---

# Resolución de Problemas

Esta página cubre los problemas comunes y sus soluciones al ejecutar OpenPR.

## Conexión a la Base de Datos

### La API falla al iniciar con "connection refused"

El servidor API inicia antes de que PostgreSQL esté listo.

**Solución**: El archivo Docker Compose incluye verificaciones de estado y `depends_on` con `condition: service_healthy`. Si el problema persiste, aumenta el `start_period` de PostgreSQL:

```yaml
postgres:
  healthcheck:
    start_period: 30s  # Increase from default 10s
```

### "role openpr does not exist"

El usuario de PostgreSQL no ha sido creado.

**Solución**: Verifica que `POSTGRES_USER` y `POSTGRES_PASSWORD` estén establecidos en el entorno de Docker Compose. Si ejecutas PostgreSQL manualmente:

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### Migraciones no aplicadas

Las migraciones solo se ejecutan automáticamente en el primer inicio del contenedor PostgreSQL (a través de `docker-entrypoint-initdb.d`).

**Solución**: Si la base de datos ya existe, aplica las migraciones manualmente:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# Then run each migration SQL file in order
```

O recrea el volumen:

```bash
docker-compose down -v
docker-compose up -d
```

::: warning Pérdida de Datos
`docker-compose down -v` elimina el volumen de la base de datos. Haz una copia de seguridad de tus datos primero.
:::

## Autenticación

### "Invalid token" después de reiniciar el servidor

Los tokens JWT se firman con `JWT_SECRET`. Si este valor cambia entre reinicios, todos los tokens existentes se vuelven inválidos.

**Solución**: Establece un `JWT_SECRET` fijo en `.env`:

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### El primer usuario no es administrador

El rol de administrador se asigna al primer usuario que se registra. Si ves `role: "user"` en lugar de `role: "admin"`, otra cuenta se registró primero.

**Solución**: Usa la base de datos para actualizar el rol:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### La compilación de Podman falla con error DNS

La red predeterminada de Podman no tiene acceso DNS durante las compilaciones.

**Solución**: Siempre usa `--network=host` al compilar imágenes con Podman:

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### El frontend muestra "502 Bad Gateway"

El contenedor Nginx no puede llegar al servidor API.

**Solución**: Verifica que:
1. El contenedor de la API está en ejecución: `docker-compose ps`
2. La verificación de estado de la API pasa: `docker exec openpr-api curl -f http://localhost:8080/health`
3. Ambos contenedores están en la misma red: `docker network inspect openpr_openpr-network`

### Conflictos de puertos

Otro servicio está usando el mismo puerto.

**Solución**: Cambia el mapeo de puerto externo en `docker-compose.yml`:

```yaml
api:
  ports:
    - "8082:8080"  # Changed from 8081
```

## Servidor MCP

### "tools/list returns empty"

El servidor MCP no puede conectarse a la API.

**Solución**: Verifica las variables de entorno:

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

Verifica que:
- `OPENPR_API_URL` apunta al endpoint correcto de la API
- `OPENPR_BOT_TOKEN` es un token de bot válido (comienza con `opr_`)
- `OPENPR_WORKSPACE_ID` es un UUID de espacio de trabajo válido

### El transporte stdio no funciona

El binario MCP necesita estar configurado como un comando en tu cliente de IA.

**Solución**: Asegúrate de que la ruta del binario sea correcta y las variables de entorno estén establecidas:

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

### La conexión SSE se cae

Las conexiones SSE pueden ser cerradas por servidores proxy con tiempos de espera cortos.

**Solución**: Si usas un proxy inverso, aumenta el tiempo de espera para el endpoint SSE:

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## Frontend

### Página en blanco después del despliegue

La compilación del frontend puede estar usando la URL de API incorrecta.

**Solución**: Establece `VITE_API_URL` antes de compilar:

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### El inicio de sesión funciona pero las páginas están vacías

Las solicitudes de API están fallando silenciosamente. Comprueba la consola del navegador (F12) para errores 401 o CORS.

**Solución**: Asegúrate de que la API sea accesible desde el navegador y CORS esté configurado. El frontend debe proxear las solicitudes de API a través de Nginx.

## Rendimiento

### Búsquedas lentas

La búsqueda de texto completo de PostgreSQL puede ser lenta en conjuntos de datos grandes sin índices adecuados.

**Solución**: Asegúrate de que existan índices FTS (son creados por las migraciones):

```sql
-- Check for existing indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### Uso elevado de memoria

El servidor API procesa las subidas de archivos en memoria.

**Solución**: Limita los tamaños de subida y monitoriza el directorio `uploads/`. Considera configurar una limpieza periódica para subidas antiguas.

## Obtener Ayuda

Si tu problema no está cubierto aquí:

1. Comprueba los [GitHub Issues](https://github.com/openprx/openpr/issues) para problemas conocidos.
2. Revisa los registros del servidor API y MCP para mensajes de error.
3. Abre un nuevo issue con tus registros de error, detalles del entorno y pasos para reproducir.
