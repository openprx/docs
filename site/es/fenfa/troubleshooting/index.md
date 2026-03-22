---
title: Resolución de Problemas
description: "Problemas comunes y soluciones al ejecutar Fenfa, incluyendo fallos de instalación iOS, errores de subida y problemas con Docker."
---

# Resolución de Problemas

Esta página cubre los problemas más comunes encontrados al ejecutar Fenfa y sus soluciones.

## Instalación iOS

### "No se Puede Instalar" / La Instalación Falla

**Síntomas:** Tocar el botón de instalación en iOS muestra "No se puede instalar" o no ocurre nada.

**Causas y Soluciones:**

1. **HTTPS no configurado.** iOS requiere HTTPS con un certificado TLS válido para la instalación OTA. Los certificados autofirmados no funcionan.
   - **Solución:** Configura un proxy inverso con un certificado TLS válido. Ver [Despliegue en Producción](../deployment/production).
   - **Para pruebas:** Usa `ngrok` para crear un túnel HTTPS: `ngrok http 8000`

2. **primary_domain incorrecto.** El manifest plist contiene URLs de descarga basadas en `primary_domain`. Si esto es incorrecto, iOS no puede obtener el IPA.
   - **Solución:** Establece `FENFA_PRIMARY_DOMAIN` a la URL HTTPS exacta que los usuarios acceden (ej. `https://dist.example.com`).

3. **Problemas de certificado.** El certificado TLS debe cubrir el dominio y ser de confianza para iOS.
   - **Solución:** Usa Let's Encrypt para obtener certificados gratuitos y de confianza.

4. **Firma del IPA expirada.** El perfil de aprovisionamiento o el certificado de firma pueden haber expirado.
   - **Solución:** Re-firma el IPA con un certificado válido y vuelve a subirlo.

### La Vinculación UDID No Funciona

**Síntomas:** El perfil mobileconfig se instala pero el dispositivo no queda registrado.

**Causas y Soluciones:**

1. **URL de callback inaccesible.** La URL de callback UDID debe ser accesible desde el dispositivo.
   - **Solución:** Asegúrate de que `primary_domain` sea correcto y accesible desde la red del dispositivo.

2. **Nonce expirado.** Los nonces de perfil expiran después de un timeout.
   - **Solución:** Vuelve a descargar el perfil mobileconfig e inténtalo de nuevo.

## Problemas de Subida

### La Subida Falla con 401

**Síntoma:** `{"ok": false, "error": {"code": "UNAUTHORIZED", ...}}`

**Solución:** Comprueba que el encabezado `X-Auth-Token` contenga un token válido. Los endpoints de subida aceptan tanto tokens de subida como de administrador.

```bash
# Verify your token works
curl -H "X-Auth-Token: YOUR_TOKEN" http://localhost:8000/admin/api/products
```

### La Subida Falla con 413 (Entidad de Solicitud Demasiado Grande)

**Síntoma:** Las subidas de archivos grandes fallan con un error 413.

**Solución:** Esto es típicamente un límite del proxy inverso, no de Fenfa en sí. Aumenta el límite:

**Nginx:**
```nginx
client_max_body_size 2G;
```

**Caddy:**
Caddy no tiene límite de tamaño de cuerpo predeterminado, pero si has configurado uno:
```
dist.example.com {
    request_body {
        max_size 2GB
    }
    reverse_proxy localhost:8000
}
```

### La Subida Inteligente No Detecta Metadatos

**Síntoma:** La versión y el número de build están vacíos después de la subida inteligente.

**Solución:** La detección automática de subida inteligente solo funciona para archivos IPA y APK. Para formatos de escritorio (DMG, EXE, DEB, etc.), proporciona `version` y `build` explícitamente en la solicitud de subida.

## Problemas con Docker

### El Contenedor Inicia pero el Panel de Administración Está Vacío

**Síntoma:** El panel de administración carga pero no muestra datos o muestra una página en blanco.

**Solución:** Comprueba que el contenedor esté ejecutándose y el mapeo de puertos sea correcto:

```bash
docker ps
docker logs fenfa
```

### Los Datos se Pierden Después de Reiniciar el Contenedor

**Síntoma:** Todos los productos, variantes y versiones desaparecen después de reiniciar el contenedor.

**Solución:** Monta volúmenes persistentes:

```bash
docker run -d --name fenfa -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Permiso Denegado en Volúmenes Montados

**Síntoma:** Fenfa no puede escribir en `/data` o `/app/uploads`.

**Solución:** Asegúrate de que los directorios del host existan y tengan los permisos correctos:

```bash
mkdir -p data uploads
chmod 777 data uploads  # Or set appropriate UID/GID
```

## Problemas de Base de Datos

### Error "database is locked"

**Síntoma:** SQLite devuelve "database is locked" bajo alta concurrencia.

**Solución:** SQLite maneja bien las lecturas concurrentes pero serializa las escrituras. Este error ocurre típicamente bajo una carga de escritura muy alta. Soluciones:
- Asegúrate de que solo una instancia de Fenfa escriba en el mismo archivo de base de datos.
- Si ejecutas múltiples instancias, usa almacenamiento S3 y una base de datos compartida (o cambia a un backend de base de datos diferente en una versión futura).

### Base de Datos Corrupta

**Síntoma:** Fenfa falla al iniciar con errores de SQLite.

**Solución:** Restaura desde la copia de seguridad:

```bash
# Stop Fenfa
docker stop fenfa

# Restore backup
cp /backups/fenfa-latest.db /path/to/data/fenfa.db

# Restart
docker start fenfa
```

::: tip Prevención
Configura copias de seguridad automáticas diarias. Ver [Despliegue en Producción](../deployment/production) para un script de copia de seguridad.
:::

## Problemas de Red

### El Manifest iOS Devuelve URLs Incorrectas

**Síntoma:** El manifest plist de iOS contiene `http://localhost:8000` en lugar del dominio público.

**Solución:** Establece `FENFA_PRIMARY_DOMAIN` a tu URL HTTPS pública:

```bash
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

### Las Descargas Son Lentas o Se Agotan

**Síntoma:** Las descargas de archivos grandes son lentas o fallan.

**Posibles soluciones:**
- Aumenta el timeout del proxy inverso: `proxy_read_timeout 600s;` (Nginx)
- Deshabilita el buffering de solicitudes: `proxy_request_buffering off;` (Nginx)
- Considera usar almacenamiento compatible con S3 con un CDN para archivos grandes

## Obtener Ayuda

Si tu problema no está cubierto aquí:

1. Comprueba los [Issues de GitHub](https://github.com/openprx/fenfa/issues) para problemas conocidos.
2. Revisa los logs del contenedor: `docker logs fenfa`
3. Abre un nuevo issue con:
   - Versión de Fenfa (`docker inspect fenfa | grep Image`)
   - Salida de logs relevante
   - Pasos para reproducir el problema
