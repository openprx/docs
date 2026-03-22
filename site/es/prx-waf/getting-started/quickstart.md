---
title: Inicio Rápido
description: "Protege tu aplicación web con PRX-WAF en 5 minutos. Inicia el proxy, agrega un host backend, verifica la protección y monitorea eventos de seguridad."
---

# Inicio Rápido

Esta guía te lleva de cero a una aplicación web completamente protegida en menos de 5 minutos. Al final, PRX-WAF estará enviando tráfico a tu backend, bloqueando ataques comunes y registrando eventos de seguridad.

::: tip Requisitos Previos
Necesitas Docker y Docker Compose instalados. Consulta la [Guía de Instalación](./installation) para otros métodos.
:::

## Paso 1: Iniciar PRX-WAF

Clona el repositorio e inicia todos los servicios:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

Verifica que todos los contenedores estén en ejecución:

```bash
docker compose ps
```

Salida esperada:

```
NAME         SERVICE     STATUS
prx-waf      prx-waf     running
postgres     postgres    running
```

## Paso 2: Iniciar Sesión en la Interfaz de Administración

Abre tu navegador y navega a `http://localhost:9527`. Inicia sesión con las credenciales predeterminadas:

- **Usuario:** `admin`
- **Contraseña:** `admin`

::: warning
Cambia la contraseña predeterminada inmediatamente después de tu primer inicio de sesión.
:::

## Paso 3: Agregar un Host Backend

Agrega tu primer host protegido a través de la interfaz de administración o vía la API:

**Vía Interfaz de Administración:**
1. Navega a **Hosts** en la barra lateral
2. Haz clic en **Agregar Host**
3. Completa:
   - **Host:** `example.com` (el dominio que deseas proteger)
   - **Host Remoto:** `192.168.1.100` (la IP de tu servidor backend)
   - **Puerto Remoto:** `8080` (el puerto de tu servidor backend)
   - **Estado de Guardia:** Habilitado
4. Haz clic en **Guardar**

**Vía API:**

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

## Paso 4: Probar la Protección

Envía una solicitud legítima a través del proxy:

```bash
curl -H "Host: example.com" http://localhost/
```

Deberías recibir la respuesta normal de tu backend. Ahora prueba que el WAF bloquee un intento de inyección SQL:

```bash
curl -H "Host: example.com" "http://localhost/?id=1%20OR%201=1--"
```

Respuesta esperada: **403 Forbidden**

Prueba un intento de XSS:

```bash
curl -H "Host: example.com" "http://localhost/?q=<script>alert(1)</script>"
```

Respuesta esperada: **403 Forbidden**

Prueba un intento de path traversal:

```bash
curl -H "Host: example.com" "http://localhost/../../etc/passwd"
```

Respuesta esperada: **403 Forbidden**

## Paso 5: Monitorear Eventos de Seguridad

Visualiza los ataques bloqueados en la interfaz de administración:

1. Navega a **Eventos de Seguridad** en la barra lateral
2. Deberías ver las solicitudes bloqueadas del Paso 4
3. Cada evento muestra el tipo de ataque, la IP de origen, la regla coincidente y la marca de tiempo

O consulta los eventos vía la API:

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

## Paso 6: Habilitar el Monitoreo en Tiempo Real (Opcional)

Conéctate al endpoint WebSocket para eventos de seguridad en vivo:

```bash
# Using websocat or similar WebSocket client
websocat ws://localhost:9527/ws/events
```

Los eventos se transmiten en tiempo real a medida que los ataques son detectados y bloqueados.

## Qué Tienes Ahora

Después de completar estos pasos, tu configuración incluye:

| Componente | Estado |
|------------|--------|
| Proxy inverso | Escuchando en el puerto 80/443 |
| Motor WAF | Pipeline de detección de 16 fases activo |
| Reglas integradas | OWASP CRS (310+ reglas) habilitadas |
| Interfaz de administración | Ejecutándose en el puerto 9527 |
| PostgreSQL | Almacenando configuración, reglas y eventos |
| Monitoreo en tiempo real | Flujo de eventos WebSocket disponible |

## Próximos Pasos

- [Motor de Reglas](../rules/) -- Comprende cómo funciona el motor de reglas YAML
- [Sintaxis YAML](../rules/yaml-syntax) -- Aprende el esquema de reglas para reglas personalizadas
- [Proxy Inverso](../gateway/reverse-proxy) -- Configura el balanceo de carga y el enrutamiento ascendente
- [SSL/TLS](../gateway/ssl-tls) -- Habilita HTTPS con certificados Let's Encrypt automáticos
- [Referencia de Configuración](../configuration/reference) -- Ajusta cada aspecto de PRX-WAF
