---
title: Gestion de identidad
description: Alcance de espacios de trabajo y usuarios, multi-tenencia y propagacion del contexto de identidad en PRX.
---

# Gestion de identidad

El sistema de identidad de PRX proporciona alcance a nivel de espacio de trabajo y a nivel de usuario para todas las operaciones del agente. En despliegues multi-tenant, el contexto de identidad determina a que memorias, configuraciones, herramientas y recursos puede acceder una sesion determinada. El modulo de identidad es la base para el control de acceso, registro de auditoria y personalizacion.

## Vision general

Cada sesion de PRX opera dentro de un contexto de identidad que incluye:

| Componente | Descripcion |
|-----------|-------------|
| **Usuario** | El humano o bot que interactua con el agente |
| **Espacio de trabajo** | Un limite logico que agrupa usuarios, configuraciones y datos |
| **Sesion** | Una conversacion individual entre un usuario y el agente |
| **Principal** | La identidad efectiva para decisiones de control de acceso |

```
┌─────────────────────────────────────────┐
│              Workspace: "acme"          │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ User: A  │  │ User: B  │  ...       │
│  │          │  │          │            │
│  │ Sessions │  │ Sessions │            │
│  │ Memories │  │ Memories │            │
│  │ Config   │  │ Config   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  Shared: workspace config, tools, keys │
└─────────────────────────────────────────┘
```

## Configuracion

### Configuracion de espacio de trabajo

```toml
[identity]
# Enable multi-tenant identity scoping.
enabled = true

# Default workspace for sessions that do not specify one.
default_workspace = "default"

# Allow users to create new workspaces.
allow_workspace_creation = true

# Maximum workspaces per deployment.
max_workspaces = 100
```

### Perfiles de usuario

Los perfiles de usuario almacenan preferencias y metadatos por usuario:

```toml
[identity.profiles]
# Storage backend for user profiles: "memory" | "sqlite" | "postgres"
backend = "sqlite"
path = "~/.local/share/openprx/identities.db"
```

### Configuracion de espacio de trabajo

Cada espacio de trabajo puede tener su propia capa de configuracion:

```toml
# Workspace-specific overrides in config.toml
[workspaces.acme]
display_name = "ACME Corp"
default_provider = "openai"
default_model = "gpt-4o"

[workspaces.acme.memory]
backend = "postgres"

[workspaces.acme.security.tool_policy]
default = "supervised"
```

## Contexto de identidad

La estructura `IdentityContext` se propaga a traves de todo el pipeline de solicitudes. Contiene: `user_id`, `display_name`, `workspace_id`, `session_id`, `role` (Owner/Admin/Member/Guest), `channel` y `metadata` arbitrarios.

El contexto de identidad se propaga a traves de cada capa: el gateway lo extrae de las solicitudes entrantes, el bucle del agente lo usa para delimitar el acceso a memoria y herramientas, el sistema de memoria asigna namespaces a los datos por espacio de trabajo y usuario, el seguimiento de costos atribuye el uso, y el registro de auditoria registra el actor.

## Multi-tenencia

PRX soporta despliegues multi-tenant donde multiples organizaciones comparten una unica instancia de PRX. Los limites de tenencia se aplican a nivel del espacio de trabajo:

### Aislamiento de datos

| Recurso | Nivel de aislamiento |
|---------|---------------------|
| Memorias | Por espacio de trabajo + por usuario |
| Configuracion | Capa por espacio de trabajo sobre valores globales por defecto |
| Politicas de herramientas | Sobreescrituras por espacio de trabajo |
| Secretos | Boveda por espacio de trabajo |
| Presupuestos de costo | Limites por espacio de trabajo |
| Registros de auditoria | Filtrado por espacio de trabajo |

### Acceso entre espacios de trabajo

Por defecto, los usuarios solo pueden acceder a recursos dentro de su espacio de trabajo. El acceso entre espacios de trabajo requiere configuracion explicita:

```toml
[identity.cross_workspace]
# Allow workspace admins to access other workspaces.
admin_cross_access = false

# Allow specific users to access multiple workspaces.
[[identity.cross_workspace.grants]]
user_id = "shared-bot"
workspaces = ["acme", "beta-corp"]
role = "member"
```

## Resolucion de usuarios

PRX resuelve la identidad de usuario de forma diferente dependiendo del canal de comunicacion:

| Canal | Fuente de identidad | Formato de ID de usuario |
|-------|---------------------|--------------------------|
| Telegram | ID de usuario de Telegram | `telegram:<user_id>` |
| Discord | ID de usuario de Discord | `discord:<user_id>` |
| Slack | ID de usuario de Slack | `slack:<workspace_id>:<user_id>` |
| CLI | Nombre de usuario del sistema | `cli:<username>` |
| API/Gateway | Token Bearer / Clave API | `api:<key_hash>` |
| WeChat | OpenID de WeChat | `wechat:<open_id>` |
| QQ | Numero de QQ | `qq:<qq_number>` |

### Registro de primer contacto

Cuando un nuevo usuario interactua con PRX por primera vez, se crea automaticamente un registro de identidad: el adaptador de canal extrae el identificador del usuario, crea un perfil con ajustes por defecto y asigna al usuario al `default_workspace` con el rol `Member`.

### Gestion manual de usuarios

```bash
# List all known users
prx identity list

# Show user details
prx identity info telegram:123456

# Assign a user to a workspace
prx identity assign telegram:123456 --workspace acme --role admin

# Remove a user from a workspace
prx identity remove telegram:123456 --workspace acme

# Set user metadata
prx identity set telegram:123456 --key language --value en
```

## Gestion de espacios de trabajo

```bash
# List all workspaces
prx workspace list

# Create a new workspace
prx workspace create acme --display-name "ACME Corp"

# Show workspace details
prx workspace info acme

# Set workspace configuration
prx workspace config acme --set default_provider=anthropic

# Delete a workspace (requires confirmation)
prx workspace delete acme --confirm
```

## Perfiles de usuario

Los perfiles de usuario almacenan preferencias que personalizan el comportamiento del agente:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `user_id` | string | Identificador unico |
| `display_name` | string | Nombre legible por humanos |
| `language` | string | Idioma preferido (ISO 639-1) |
| `timezone` | string | Zona horaria preferida (formato IANA) |
| `role` | enum | Rol en el espacio de trabajo (owner, admin, member, guest) |
| `preferences` | map | Preferencias clave-valor (modelo, verbosidad, etc.) |
| `created_at` | datetime | Marca de tiempo de la primera interaccion |
| `last_seen_at` | datetime | Marca de tiempo de la interaccion mas reciente |

### Acceso a perfiles en prompts del sistema

El prompt del sistema del agente puede incluir informacion del perfil de usuario via variables de plantilla (ej. <code v-pre>{{identity.display_name}}</code>, <code v-pre>{{identity.language}}</code>), resueltas desde el contexto de identidad antes de que el prompt se envie al LLM.

## Control de acceso basado en roles

Los roles del espacio de trabajo determinan que acciones puede realizar un usuario:

| Permiso | Owner | Admin | Member | Guest |
|---------|-------|-------|--------|-------|
| Usar agente (chat) | Si | Si | Si | Si |
| Almacenar memorias | Si | Si | Si | No |
| Configurar herramientas | Si | Si | No | No |
| Gestionar usuarios | Si | Si | No | No |
| Gestionar espacio de trabajo | Si | No | No | No |
| Ver registros de auditoria | Si | Si | No | No |

## Puntos de integracion

Cuando `identity.enabled = true`, todas las operaciones de memoria se delimitan por `workspace:{workspace_id}:user:{user_id}:{key}`, asegurando el aislamiento de datos. Las politicas de herramientas pueden sobreescribirse por espacio de trabajo, y el uso de tokens se atribuye al contexto de identidad para informes de costos por usuario.

## Notas de seguridad

- **Suplantacion de identidad** -- el sistema de identidad confia en el adaptador de canal para identificar correctamente a los usuarios. Asegurate de que la autenticacion del canal esta correctamente configurada (tokens de bot, OAuth, etc.).
- **Aislamiento de espacios de trabajo** -- los limites del espacio de trabajo se aplican en la logica de la aplicacion. El almacenamiento subyacente (SQLite, Postgres) no proporciona aislamiento a nivel de base de datos. Un error en la logica de alcance podria filtrar datos.
- **Acceso de invitados** -- los invitados tienen permisos minimos por defecto. Revisa la configuracion del rol de invitado al habilitar agentes de cara al publico.
- **Datos de perfil** -- los perfiles de usuario pueden contener informacion personal. Manejalos de acuerdo con tu politica de privacidad y las regulaciones aplicables.
- **Concesiones entre espacios de trabajo** -- otorga acceso entre espacios de trabajo con moderacion. Cada concesion expande el radio de impacto de una cuenta comprometida.

## Paginas relacionadas

- [Vision general de autenticacion](/es/prx/auth/)
- [Flujos OAuth2](/es/prx/auth/oauth2)
- [Perfiles de proveedores](/es/prx/auth/profiles)
- [Vision general de seguridad](/es/prx/security/)
- [Motor de politicas](/es/prx/security/policy-engine)
- [Sistema de memoria](/es/prx/memory/)
