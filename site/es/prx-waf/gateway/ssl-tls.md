---
title: Configuración SSL/TLS
description: "Configura HTTPS en PRX-WAF con certificados automáticos de Let's Encrypt, gestión manual de certificados, soporte HTTP/3 QUIC y mejores prácticas TLS."
---

# Configuración SSL/TLS

PRX-WAF admite gestión automática de certificados TLS vía Let's Encrypt (ACME v2), configuración manual de certificados y HTTP/3 vía QUIC. Esta página cubre toda la configuración relacionada con HTTPS.

## Certificados Automáticos (Let's Encrypt)

PRX-WAF usa la biblioteca `instant-acme` para obtener y renovar certificados TLS automáticamente desde Let's Encrypt. Cuando un host está configurado con SSL habilitado, PRX-WAF:

1. Responde a los desafíos ACME HTTP-01 en el puerto 80
2. Obtiene un certificado de Let's Encrypt
3. Almacena el certificado en la base de datos
4. Renueva automáticamente antes de la expiración

::: tip
Para que los certificados automáticos funcionen, el puerto 80 debe ser accesible desde internet para la validación del desafío ACME HTTP-01.
:::

## Certificados Manuales

Para entornos donde ACME automático no es adecuado, configura los certificados manualmente:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

También puedes cargar certificados vía la interfaz de administración:

1. Navega a **Certificados SSL** en la barra lateral
2. Haz clic en **Cargar Certificado**
3. Proporciona la cadena de certificados (PEM) y la clave privada (PEM)
4. Asocia el certificado con un host

O vía la API:

```bash
curl -X POST http://localhost:9527/api/certificates \
  -H "Authorization: Bearer $TOKEN" \
  -F "cert=@/path/to/cert.pem" \
  -F "key=@/path/to/key.pem" \
  -F "host=example.com"
```

## Listener TLS

PRX-WAF escucha tráfico HTTPS en la dirección TLS configurada:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"      # HTTP
listen_addr_tls = "0.0.0.0:443"     # HTTPS
```

## HTTP/3 (QUIC)

PRX-WAF admite HTTP/3 vía la biblioteca Quinn QUIC. Habilítalo en la configuración:

```toml
[http3]
enabled     = true
listen_addr = "0.0.0.0:443"
cert_pem    = "/etc/prx-waf/tls/cert.pem"
key_pem     = "/etc/prx-waf/tls/key.pem"
```

::: warning
HTTP/3 requiere un certificado TLS válido. Las rutas de cert y key deben proporcionarse cuando HTTP/3 está habilitado. Los certificados automáticos de Let's Encrypt también son compatibles con HTTP/3.
:::

HTTP/3 se ejecuta sobre UDP en el mismo puerto que HTTPS (443). Los clientes que admiten QUIC se actualizarán automáticamente, mientras que otros recurrirán a HTTP/2 o HTTP/1.1 sobre TCP.

## Redirección HTTPS

Para redirigir todo el tráfico HTTP a HTTPS, configura tus hosts con el puerto 80 (HTTP) y el puerto 443 (HTTPS). PRX-WAF redirigirá automáticamente las solicitudes HTTP a sus equivalentes HTTPS cuando SSL está configurado para un host.

## Almacenamiento de Certificados

Todos los certificados (automáticos y manuales) se almacenan en la base de datos PostgreSQL. La tabla `certificates` (migración `0003`) contiene:

- Cadena de certificados (PEM)
- Clave privada (cifrada con AES-256-GCM)
- Nombre de dominio
- Fecha de expiración
- Información de cuenta ACME (para renovación automática)

::: info
Las claves privadas se cifran en reposo usando AES-256-GCM. La clave de cifrado se deriva de la configuración. Nunca almacenes claves privadas sin cifrar en la base de datos.
:::

## Docker con HTTPS

Al ejecutar en Docker, mapea el puerto 443 para el tráfico TLS:

```yaml
# docker-compose.yml
services:
  prx-waf:
    ports:
      - "80:80"
      - "443:443"
      - "9527:9527"
```

Para HTTP/3, también mapea el puerto UDP:

```yaml
    ports:
      - "80:80"
      - "443:443/tcp"
      - "443:443/udp"  # HTTP/3 QUIC
      - "9527:9527"
```

## Mejores Prácticas

1. **Siempre usa HTTPS en producción.** HTTP solo debe servir desafíos ACME y redirigir a HTTPS.

2. **Habilita HTTP/3** para clientes que lo admiten. QUIC proporciona un establecimiento de conexión más rápido y mejor rendimiento en redes con pérdidas.

3. **Usa certificados automáticos** cuando sea posible. Los certificados de Let's Encrypt son gratuitos, de confianza para todos los navegadores y son renovados automáticamente por PRX-WAF.

4. **Restringe el acceso a la API de administración.** La API de administración solo debe ser accesible desde redes de confianza:

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12"]
```

## Próximos Pasos

- [Proxy Inverso](./reverse-proxy) -- Enrutamiento de backend y configuración de hosts
- [Descripción General del Gateway](./index) -- Caché de respuestas y túneles
- [Modo Clúster](../cluster/) -- TLS multi-nodo con certificados mTLS
