---
title: DingTalk
description: Conectar PRX a DingTalk (Alibaba) a traves de Stream Mode
---

# DingTalk

> Conecta PRX a DingTalk usando la API WebSocket de Stream Mode para mensajeria de bot en tiempo real en la plataforma de trabajo de Alibaba.

## Requisitos previos

- Una organizacion de DingTalk (empresa o equipo)
- Una aplicacion de bot creada en la [Consola de Desarrollador de DingTalk](https://open-dev.dingtalk.com/)
- Client ID (AppKey) y Client Secret (AppSecret) de la consola de desarrollador

## Configuracion rapida

### 1. Crear un bot de DingTalk

1. Ve a la [DingTalk Open Platform](https://open-dev.dingtalk.com/) e inicia sesion
2. Crea una nueva "Enterprise Internal Application" (o "H5 Micro Application")
3. Agrega la capacidad "Robot" a tu aplicacion
4. Bajo "Credentials", copia el **Client ID** (AppKey) y **Client Secret** (AppSecret)
5. Habilita "Stream Mode" bajo la configuracion del bot

### 2. Configurar

```toml
[channels_config.dingtalk]
client_id = "dingxxxxxxxxxxxxxxxxxx"
client_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["manager1234"]
```

### 3. Verificar

```bash
prx channel doctor dingtalk
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `client_id` | `String` | *requerido* | Client ID (AppKey) de la consola de desarrollador de DingTalk |
| `client_secret` | `String` | *requerido* | Client Secret (AppSecret) de la consola de desarrollador |
| `allowed_users` | `[String]` | `[]` | IDs de personal de DingTalk permitidos. Vacio = denegar todos. `"*"` = permitir todos |

## Caracteristicas

- **WebSocket Stream Mode** -- conexion WebSocket persistente al gateway de DingTalk para entrega de mensajes en tiempo real
- **No se requiere URL publica** -- Stream Mode establece una conexion saliente, no se necesita configuracion de webhook entrante
- **Chats privados y grupales** -- maneja tanto conversaciones 1:1 como mensajes de chat grupal
- **Webhooks de sesion** -- responde via URLs de webhook de sesion por mensaje proporcionadas por DingTalk
- **Registro automatico de gateway** -- se registra con el gateway de DingTalk para obtener un endpoint WebSocket y ticket
- **Deteccion de tipo de conversacion** -- distingue entre chats privados y conversaciones grupales

## Limitaciones

- Stream Mode requiere una conexion WebSocket saliente estable a los servidores de DingTalk
- Las respuestas usan webhooks de sesion por mensaje, que pueden expirar si no se usan con prontitud
- El bot debe ser agregado a un chat grupal por un administrador antes de poder recibir mensajes de grupo
- Las APIs de DingTalk estan documentadas principalmente en chino; el soporte internacional es limitado
- La aprobacion del administrador empresarial puede ser necesaria para desplegar aplicaciones internas

## Solucion de problemas

### El bot no se conecta a DingTalk
- Verifica que `client_id` y `client_secret` son correctos
- Asegurate de que "Stream Mode" esta habilitado en la consola de desarrollador de DingTalk bajo los ajustes del bot
- Verifica que las conexiones salientes a los servidores de DingTalk no estan bloqueadas por un firewall

### Los mensajes se reciben pero las respuestas fallan
- Los webhooks de sesion son por mensaje y pueden expirar; asegurate de que las respuestas se envian con prontitud
- Verifica que el bot tiene los permisos API necesarios en la consola de desarrollador

### Los mensajes de grupo no se reciben
- El bot debe ser agregado explicitamente al grupo por un administrador
- Verifica que el ID de personal del remitente esta en `allowed_users`, o establece `allowed_users = ["*"]`
