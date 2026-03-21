---
title: Backend de memoria Lucid.so
description: Capa de memoria basada en la nube potenciada por IA usando el servicio externo Lucid.so.
---

# Backend de memoria Lucid.so

El backend Lucid conecta PRX a [Lucid.so](https://lucid.so), un servicio de memoria potenciado por IA que proporciona almacenamiento gestionado, busqueda semantica y organizacion automatica de memoria. Sirve como alternativa a los backends locales SQLite y PostgreSQL para equipos que prefieren una solucion alojada.

## Vision general

Lucid.so es una plataforma de memoria alojada en la nube disenada para agentes de IA. Maneja:

- Almacenamiento persistente de memoria con deduplicacion automatica
- Busqueda semantica potenciada por modelos de embeddings alojados
- Agrupacion automatica por temas y organizacion de memoria
- Comparticion de memoria entre sesiones a traves de multiples instancias de agente
- Gestion del ciclo de vida de memoria con politicas de retencion configurables

A diferencia de los backends locales (SQLite, PostgreSQL), Lucid no requiere gestion de base de datos. Las memorias se almacenan en la infraestructura de Lucid y se acceden via su API REST.

## Cuando usar Lucid

| Escenario | Backend recomendado |
|-----------|-------------------|
| Agente local de usuario unico | SQLite |
| Despliegue on-premise multi-usuario | PostgreSQL |
| Equipo cloud-first, minima carga operativa | **Lucid** |
| Comparticion de memoria entre dispositivos | **Lucid** |
| Entornos aislados o sin conexion | SQLite o PostgreSQL |
| Control total sobre la residencia de datos | SQLite o PostgreSQL |

## Requisitos previos

- Una cuenta de Lucid.so (registrarse en [lucid.so](https://lucid.so))
- Una clave API del panel de Lucid
- Un ID de espacio de trabajo (creado automaticamente en el primer uso, o especificar uno existente)

## Configuracion rapida

### 1. Obtener credenciales de API

1. Inicia sesion en el [Panel de Lucid](https://app.lucid.so)
2. Navega a "Settings" y luego "API Keys"
3. Crea una nueva clave API con permisos de "Memory Read/Write"
4. Copia la clave API y tu ID de espacio de trabajo

### 2. Configurar

```toml
[memory]
backend = "lucid"

[memory.lucid]
api_key = "luc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
workspace_id = "ws_abc123"
```

### 3. Verificar

```bash
prx doctor memory
```

Esto prueba la conectividad con la API de Lucid y verifica que la clave API tiene los permisos requeridos.

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | `String` | *requerido* | Clave API de Lucid.so con permisos de lectura/escritura de memoria |
| `workspace_id` | `String` | *auto-creado* | ID de espacio de trabajo para aislamiento de memoria. Omitir para auto-crear en el primer uso |
| `base_url` | `String` | `"https://api.lucid.so/v1"` | URL base de la API de Lucid. Sobreescribir para endpoints auto-alojados o regionales |
| `timeout_secs` | `u64` | `30` | Tiempo limite de solicitud HTTP en segundos |
| `max_retries` | `u32` | `3` | Intentos maximos de reintento para fallos transitorios |
| `retry_backoff_ms` | `u64` | `500` | Retraso inicial entre reintentos (exponencial) |
| `batch_size` | `usize` | `50` | Numero de memorias a enviar por solicitud de escritura en lote |
| `top_k` | `usize` | `10` | Numero predeterminado de resultados a devolver para consultas de recuperacion |
| `similarity_threshold` | `f64` | `0.5` | Puntuacion minima de similitud (0.0--1.0) para resultados de recuperacion |
| `auto_topics` | `bool` | `true` | Habilitar la agrupacion automatica por temas de Lucid |
| `retention_days` | `u64` | `0` | Auto-eliminar memorias mas antiguas de N dias. 0 = mantener siempre |

## Como funciona

### Almacenamiento de memoria

Cuando el agente almacena una memoria, PRX la envia a la API de Lucid:

1. El texto de memoria y metadatos se envian como solicitud POST a `/memories`
2. Lucid genera el embedding del texto usando su modelo de embeddings alojado
3. La memoria se indexa para busqueda por palabras clave y semantica
4. Si `auto_topics` esta habilitado, Lucid asigna etiquetas de tema automaticamente

### Recuperacion de memoria

Cuando el agente necesita contexto, PRX consulta a Lucid:

1. El contexto de conversacion actual se envia como consulta de recuperacion
2. Lucid realiza una busqueda hibrida (similitud semantica + coincidencia por palabras clave)
3. Los resultados se clasifican por relevancia y se filtran por `similarity_threshold`
4. Los K resultados principales se devuelven con su texto, metadatos y puntuaciones de relevancia

### Organizacion de memoria

Lucid proporciona gestion de memoria del lado del servidor:

- **Deduplicacion** -- memorias casi duplicadas se fusionan automaticamente
- **Agrupacion por temas** -- las memorias se agrupan en temas sin categorizacion manual
- **Compactacion** -- memorias antiguas o de baja relevancia pueden resumirse y consolidarse
- **Retencion** -- memorias expiradas se purgan segun `retention_days`

## Comparacion con backends locales

| Caracteristica | SQLite | PostgreSQL | Lucid |
|---------------|--------|-----------|-------|
| Complejidad de configuracion | Ninguna | Moderada | Minima (clave API) |
| Residencia de datos | Local | Auto-alojado | Nube (servidores de Lucid) |
| Busqueda semantica | Via complemento de embeddings | Via complemento pgvector | Integrada |
| Auto-deduplicacion | No | No | Si |
| Agrupacion automatica por temas | No | No | Si |
| Comparticion entre dispositivos | No | Si (red) | Si (nube) |
| Operacion sin conexion | Si | Si | No |
| Costo | Gratis | Gratis (auto-alojado) | Nivel gratuito + planes de pago |
| Escalabilidad | ~100K memorias | Millones | Millones (gestionado) |

## Variables de entorno

Para despliegues CI/CD o en contenedores, las credenciales pueden establecerse via variables de entorno:

```bash
export PRX_MEMORY_LUCID_API_KEY="luc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export PRX_MEMORY_LUCID_WORKSPACE_ID="ws_abc123"
```

Las variables de entorno tienen precedencia sobre los valores del archivo de configuracion.

## Manejo de errores

El backend Lucid maneja errores transitorios de forma elegante:

- **Fallos de red** -- reintentados hasta `max_retries` veces con backoff exponencial
- **Limitacion de velocidad** -- las respuestas 429 activan backoff automatico usando la cabecera `Retry-After`
- **Errores de autenticacion** -- registrados como errores; el agente continua sin memoria en lugar de fallar
- **Tiempo limite** -- las solicitudes que exceden `timeout_secs` se cancelan y reintentan

Cuando Lucid no es alcanzable, PRX degrada de forma elegante: el agente opera sin recuperacion de memoria hasta que se restablece la conectividad. No se pierden memorias -- las escrituras pendientes se encolan y se vacian cuando la conexion se recupera.

## Limitaciones

- Requiere conectividad a internet; no apto para entornos aislados
- Los datos de memoria se almacenan en la infraestructura de Lucid; revisa su acuerdo de procesamiento de datos para cumplimiento
- El nivel gratuito tiene limites de almacenamiento y consultas (consulta la pagina de precios de Lucid para detalles actuales)
- La latencia es mayor que los backends locales debido a los viajes de ida y vuelta por red (tipicamente 50--200ms por consulta)
- Los despliegues auto-alojados de Lucid requieren una licencia separada

## Solucion de problemas

### Error "Authentication failed"

- Verifica que la clave API es correcta y no ha sido revocada en el panel de Lucid
- Asegurate de que la clave API tiene permisos de "Memory Read/Write"
- Comprueba que la `base_url` apunta al endpoint correcto de Lucid

### La recuperacion de memoria no devuelve resultados

- Verifica que las memorias se han almacenado consultando el panel de Lucid
- Reduce el `similarity_threshold` (ej., a `0.3`) para ver si los resultados estan siendo filtrados
- Comprueba que el `workspace_id` coincide con el espacio de trabajo donde se almacenaron las memorias

### Alta latencia en consultas de recuperacion

- Reduce `top_k` para devolver menos resultados por consulta
- Verifica tu latencia de red hacia el endpoint de la API de Lucid
- Considera usar una `base_url` regional si Lucid ofrece endpoints mas cercanos a tu despliegue

### Las memorias no persisten entre sesiones

- Confirma que `backend = "lucid"` esta establecido en la seccion `[memory]`
- Verifica que el `workspace_id` es consistente en todas las instancias del agente
- Revisa los logs de PRX en busca de errores de escritura que puedan indicar persistencia fallida

## Paginas relacionadas

- [Vision general del sistema de memoria](./)
- [Backend SQLite](./sqlite) -- alternativa local de archivo unico
- [Backend PostgreSQL](./postgres) -- alternativa auto-alojada multi-usuario
- [Backend de embeddings](./embeddings) -- memoria semantica local basada en vectores
- [Higiene de memoria](./hygiene) -- estrategias de compactacion y limpieza
