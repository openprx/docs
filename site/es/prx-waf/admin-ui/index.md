---
title: Interfaz de Administración
description: "Panel de administración Vue 3 de PRX-WAF. Autenticación JWT + TOTP, gestión de hosts, gestión de reglas, monitoreo de eventos de seguridad, panel WebSocket en tiempo real y configuración de notificaciones."
---

# Interfaz de Administración

PRX-WAF incluye un panel de administración Vue 3 + Tailwind CSS incrustado en el binario. Proporciona una interfaz gráfica para gestionar hosts, reglas, certificados, eventos de seguridad y estado del clúster.

## Acceder a la Interfaz de Administración

La interfaz de administración es servida por el servidor de API en la dirección configurada:

```
http://localhost:9527
```

Credenciales predeterminadas: `admin` / `admin`

::: warning
Cambia la contraseña predeterminada inmediatamente después del primer inicio de sesión. Habilita la autenticación de dos factores TOTP para entornos de producción.
:::

## Autenticación

La interfaz de administración admite dos mecanismos de autenticación:

| Método | Descripción |
|--------|-------------|
| Token JWT | Obtenido vía `/api/auth/login`, almacenado en localStorage del navegador |
| TOTP (Opcional) | Contraseña de un solo uso basada en tiempo para autenticación de dos factores |

### API de Inicio de Sesión

```bash
curl -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Respuesta:

```json
{
  "token": "eyJ...",
  "refresh_token": "..."
}
```

Para cuentas con TOTP habilitado, incluye el campo `totp_code`:

```json
{"username": "admin", "password": "admin", "totp_code": "123456"}
```

## Secciones del Panel

### Hosts

Gestiona los dominios protegidos y sus backends ascendentes:
- Agregar, editar y eliminar hosts
- Activar/desactivar la protección WAF por host
- Ver estadísticas de tráfico por host

### Reglas

Gestiona las reglas de detección de todas las fuentes:
- Ver reglas OWASP CRS, ModSecurity, CVE y personalizadas
- Habilitar/deshabilitar reglas individuales
- Buscar y filtrar por categoría, severidad y fuente
- Importar y exportar reglas

### Reglas de IP

Gestiona las listas de bloqueo y permitidos basadas en IP:
- Agregar direcciones IP o rangos CIDR
- Establecer acciones de permitir/bloquear
- Ver las reglas de IP activas

### Reglas de URL

Gestiona las reglas de detección basadas en URL:
- Agregar patrones de URL con soporte regex
- Establecer acciones de bloqueo/registro/permitir

### Eventos de Seguridad

Ver y analizar ataques detectados:
- Feed de eventos en tiempo real
- Filtrar por host, tipo de ataque, IP de origen y rango de tiempo
- Exportar eventos como JSON o CSV

### Estadísticas

Ver métricas de tráfico y seguridad:
- Solicitudes por segundo
- Distribución de ataques por tipo
- Hosts más atacados
- IPs de origen más frecuentes
- Distribución de códigos de respuesta

### Certificados SSL

Gestionar certificados TLS:
- Ver certificados activos y fechas de expiración
- Cargar certificados manuales
- Monitorear el estado de renovación automática de Let's Encrypt

### Plugins WASM

Gestionar plugins WebAssembly:
- Cargar nuevos plugins
- Ver plugins cargados y su estado
- Habilitar/deshabilitar plugins

### Túneles

Gestionar túneles inversos:
- Crear y eliminar túneles basados en WebSocket
- Monitorear el estado y el tráfico de los túneles

### CrowdSec

Ver el estado de la integración con CrowdSec:
- Decisiones activas de LAPI
- Resultados de inspección AppSec
- Estado de la conexión

### Notificaciones

Configurar canales de alertas:
- Correo electrónico (SMTP)
- Webhook
- Telegram

## Monitoreo en Tiempo Real

La interfaz de administración se conecta a un endpoint WebSocket (`/ws/events`) para transmisión de eventos de seguridad en vivo. Los eventos aparecen en tiempo real a medida que los ataques son detectados y bloqueados.

También puedes conectarte al WebSocket programáticamente:

```javascript
const ws = new WebSocket("ws://localhost:9527/ws/events");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Security event:", data);
};
```

## Endurecimiento de Seguridad

### Restringir el Acceso de Administración por IP

Limita el acceso a la interfaz de administración y la API a redes de confianza:

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
```

### Habilitar Limitación de Velocidad

Protege la API de administración de ataques de fuerza bruta:

```toml
[security]
api_rate_limit_rps = 100
```

### Configurar CORS

Restringe qué orígenes pueden acceder a la API de administración:

```toml
[security]
cors_origins = ["https://admin.example.com"]
```

## Pila Tecnológica

| Componente | Tecnología |
|------------|-----------|
| Frontend | Vue 3 + Tailwind CSS |
| Compilación | Vite |
| Estado | Pinia |
| Cliente HTTP | Axios |
| Gráficos | Chart.js |
| Incrustación | Archivos estáticos servidos por Axum |

El código fuente de la interfaz de administración se encuentra en `web/admin-ui/` en el repositorio.

## Próximos Pasos

- [Inicio Rápido](../getting-started/quickstart) -- Configura tu primer host protegido
- [Referencia de Configuración](../configuration/reference) -- Ajustes de seguridad de la administración
- [Referencia de CLI](../cli/) -- Gestión alternativa por línea de comandos
