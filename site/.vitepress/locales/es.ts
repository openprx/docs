import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Comenzar',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx/' },
      { text: 'Instalacion', link: '/es/prx/getting-started/installation' },
      { text: 'Inicio rapido', link: '/es/prx/getting-started/quickstart' },
      { text: 'Asistente de configuracion', link: '/es/prx/getting-started/onboarding' },
    ],
  },
  {
    text: 'Canales',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx/channels/' },
      { text: 'Telegram', link: '/es/prx/channels/telegram' },
      { text: 'Discord', link: '/es/prx/channels/discord' },
      { text: 'Slack', link: '/es/prx/channels/slack' },
      { text: 'WhatsApp', link: '/es/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/es/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/es/prx/channels/signal' },
      { text: 'iMessage', link: '/es/prx/channels/imessage' },
      { text: 'Matrix', link: '/es/prx/channels/matrix' },
      { text: 'Correo electronico', link: '/es/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/es/prx/channels/lark' },
      { text: 'DingTalk', link: '/es/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/es/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/es/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/es/prx/channels/irc' },
      { text: 'QQ', link: '/es/prx/channels/qq' },
      { text: 'LINQ', link: '/es/prx/channels/linq' },
      { text: 'CLI', link: '/es/prx/channels/cli' },
    ],
  },
  {
    text: 'Proveedores LLM',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/es/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/es/prx/providers/openai' },
      { text: 'Google Gemini', link: '/es/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/es/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/es/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/es/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/es/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/es/prx/providers/glm' },
      { text: 'OpenRouter', link: '/es/prx/providers/openrouter' },
      { text: 'Compatible personalizado', link: '/es/prx/providers/custom-compatible' },
    ],
  },
  {
    text: 'Herramientas',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/tools/' },
      { text: 'Ejecucion Shell', link: '/es/prx/tools/shell' },
      { text: 'Operaciones de archivos', link: '/es/prx/tools/file-operations' },
      { text: 'Herramientas de memoria', link: '/es/prx/tools/memory' },
      { text: 'Navegador', link: '/es/prx/tools/browser' },
      { text: 'Busqueda web', link: '/es/prx/tools/web-search' },
      { text: 'Solicitudes HTTP', link: '/es/prx/tools/http-request' },
      { text: 'Sesiones y agentes', link: '/es/prx/tools/sessions' },
      { text: 'Herramientas Cron', link: '/es/prx/tools/cron-tools' },
      { text: 'Operaciones Git', link: '/es/prx/tools/git' },
      { text: 'Mensajeria', link: '/es/prx/tools/messaging' },
      { text: 'Nodos remotos', link: '/es/prx/tools/nodes' },
      { text: 'Medios', link: '/es/prx/tools/media' },
      { text: 'Integracion MCP', link: '/es/prx/tools/mcp' },
      { text: 'SkillForge', link: '/es/prx/tools/skillforge' },
      { text: 'Hooks', link: '/es/prx/tools/hooks' },
    ],
  },
  {
    text: 'Runtime del agente',
    collapsed: true,
    items: [
      { text: 'Arquitectura', link: '/es/prx/agent/runtime' },
      { text: 'Bucle del agente', link: '/es/prx/agent/loop' },
      { text: 'Sub-agentes', link: '/es/prx/agent/subagents' },
      { text: 'Worker de sesion', link: '/es/prx/agent/session-worker' },
      { text: 'Backends de runtime', link: '/es/prx/agent/runtime-backends' },
      { text: 'Multimodal', link: '/es/prx/agent/multimodal' },
    ],
  },
  {
    text: 'Sistema de memoria',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/memory/' },
      { text: 'Backend Markdown', link: '/es/prx/memory/markdown' },
      { text: 'Backend SQLite', link: '/es/prx/memory/sqlite' },
      { text: 'Backend PostgreSQL', link: '/es/prx/memory/postgres' },
      { text: 'Embeddings vectoriales', link: '/es/prx/memory/embeddings' },
      { text: 'Limpieza de memoria', link: '/es/prx/memory/hygiene' },
      { text: 'RAG', link: '/es/prx/memory/rag' },
      { text: 'Lucid.so', link: '/es/prx/memory/lucid' },
      { text: 'Busqueda vectorial', link: '/es/prx/memory/vector-search' },
    ],
  },
  {
    text: 'Auto-evolucion',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/self-evolution/' },
      { text: 'L1: Evolucion de memoria', link: '/es/prx/self-evolution/l1-memory' },
      { text: 'L2: Evolucion de prompts', link: '/es/prx/self-evolution/l2-prompt' },
      { text: 'L3: Evolucion de estrategia', link: '/es/prx/self-evolution/l3-strategy' },
      { text: 'Pipeline', link: '/es/prx/self-evolution/pipeline' },
      { text: 'Seguridad', link: '/es/prx/self-evolution/safety' },
      { text: 'Registro de decisiones', link: '/es/prx/self-evolution/decision-log' },
      { text: 'Experimentos', link: '/es/prx/self-evolution/experiments' },
    ],
  },
  {
    text: 'Configuracion',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/config/' },
      { text: 'Referencia completa', link: '/es/prx/config/reference' },
      { text: 'Recarga en caliente', link: '/es/prx/config/hot-reload' },
      { text: 'Variables de entorno', link: '/es/prx/config/environment' },
    ],
  },
  {
    text: 'Plugins (WASM)',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/plugins/' },
      { text: 'Arquitectura', link: '/es/prx/plugins/architecture' },
      { text: 'Guia de desarrollo', link: '/es/prx/plugins/developer-guide' },
      { text: 'Funciones del host', link: '/es/prx/plugins/host-functions' },
      { text: 'PDK', link: '/es/prx/plugins/pdk' },
      { text: 'Ejemplos', link: '/es/prx/plugins/examples' },
      { text: 'Bus de eventos', link: '/es/prx/plugins/event-bus' },
    ],
  },
  {
    text: 'Gateway',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/gateway/' },
      { text: 'HTTP API', link: '/es/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/es/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/es/prx/gateway/webhooks' },
      { text: 'Middleware', link: '/es/prx/gateway/middleware' },
      { text: 'Referencia API', link: '/es/prx/gateway/api-reference' },
    ],
  },
  {
    text: 'Seguridad',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/security/' },
      { text: 'Motor de politicas', link: '/es/prx/security/policy-engine' },
      { text: 'Emparejamiento', link: '/es/prx/security/pairing' },
      { text: 'Sandbox', link: '/es/prx/security/sandbox' },
      { text: 'Almacen de secretos', link: '/es/prx/security/secrets' },
      { text: 'Modelo de amenazas', link: '/es/prx/security/threat-model' },
      { text: 'Flujo de aprobacion', link: '/es/prx/security/approval' },
      { text: 'Registro de auditoria', link: '/es/prx/security/audit' },
    ],
  },
  {
    text: 'Router LLM',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/router/' },
      { text: 'Enrutamiento heuristico', link: '/es/prx/router/heuristic' },
      { text: 'Enrutamiento KNN', link: '/es/prx/router/knn' },
      { text: 'Automix', link: '/es/prx/router/automix' },
    ],
  },
  {
    text: 'Programacion (Xin)',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/cron/' },
      { text: 'Heartbeat', link: '/es/prx/cron/heartbeat' },
      { text: 'Tareas Cron', link: '/es/prx/cron/tasks' },
    ],
  },
  {
    text: 'Nodos remotos',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/nodes/' },
      { text: 'Protocolo de emparejamiento', link: '/es/prx/nodes/pairing' },
      { text: 'Protocolo JSON-RPC', link: '/es/prx/nodes/protocol' },
    ],
  },
  {
    text: 'Autenticacion',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/auth/' },
      { text: 'Flujo OAuth2', link: '/es/prx/auth/oauth2' },
      { text: 'Perfiles de autenticacion', link: '/es/prx/auth/profiles' },
      { text: 'Gestion de identidad', link: '/es/prx/auth/identity' },
    ],
  },
  {
    text: 'Referencia CLI',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/cli/' },
      { text: 'prx agent', link: '/es/prx/cli/agent' },
      { text: 'prx chat', link: '/es/prx/cli/chat' },
      { text: 'prx daemon', link: '/es/prx/cli/daemon' },
      { text: 'prx gateway', link: '/es/prx/cli/gateway' },
      { text: 'prx onboard', link: '/es/prx/cli/onboard' },
      { text: 'prx channel', link: '/es/prx/cli/channel' },
      { text: 'prx cron', link: '/es/prx/cli/cron' },
      { text: 'prx evolution', link: '/es/prx/cli/evolution' },
      { text: 'prx auth', link: '/es/prx/cli/auth' },
      { text: 'prx config', link: '/es/prx/cli/config' },
      { text: 'prx doctor', link: '/es/prx/cli/doctor' },
      { text: 'prx service', link: '/es/prx/cli/service' },
      { text: 'prx skills', link: '/es/prx/cli/skills' },
    ],
  },
  {
    text: 'Observabilidad',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/observability/' },
      { text: 'Prometheus', link: '/es/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/es/prx/observability/opentelemetry' },
      { text: 'Seguimiento de costos', link: '/es/prx/observability/cost-tracking' },
    ],
  },
  {
    text: 'Tunel',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/es/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/es/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/es/prx/tunnel/ngrok' },
    ],
  },
  {
    text: 'Solucion de problemas',
    collapsed: true,
    items: [
      { text: 'Errores comunes', link: '/es/prx/troubleshooting/' },
      { text: 'Diagnosticos', link: '/es/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Comenzar',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx-sd/' },
      { text: 'Instalacion', link: '/es/prx-sd/getting-started/installation' },
      { text: 'Inicio rapido', link: '/es/prx-sd/getting-started/quickstart' },
    ],
  },
  {
    text: 'Escaneo',
    collapsed: false,
    items: [
      { text: 'Escaneo de archivos y directorios', link: '/es/prx-sd/scanning/file-scan' },
      { text: 'Escaneo de memoria', link: '/es/prx-sd/scanning/memory-scan' },
      { text: 'Deteccion de Rootkit', link: '/es/prx-sd/scanning/rootkit' },
      { text: 'Escaneo de dispositivos USB', link: '/es/prx-sd/scanning/usb-scan' },
    ],
  },
  {
    text: 'Motor de deteccion',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx-sd/detection/' },
      { text: 'Coincidencia de hash', link: '/es/prx-sd/detection/hash-matching' },
      { text: 'Reglas YARA', link: '/es/prx-sd/detection/yara-rules' },
      { text: 'Analisis heuristico', link: '/es/prx-sd/detection/heuristics' },
      { text: 'Tipos de archivo soportados', link: '/es/prx-sd/detection/file-types' },
    ],
  },
  {
    text: 'Proteccion en tiempo real',
    collapsed: true,
    items: [
      { text: 'Monitor de archivos', link: '/es/prx-sd/realtime/monitor' },
      { text: 'Daemon', link: '/es/prx-sd/realtime/daemon' },
      { text: 'Proteccion contra ransomware', link: '/es/prx-sd/realtime/ransomware' },
    ],
  },
  {
    text: 'Inteligencia de amenazas',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx-sd/signatures/' },
      { text: 'Actualizar firmas', link: '/es/prx-sd/signatures/update' },
      { text: 'Fuentes de inteligencia', link: '/es/prx-sd/signatures/sources' },
      { text: 'Importar hashes', link: '/es/prx-sd/signatures/import' },
      { text: 'Reglas YARA personalizadas', link: '/es/prx-sd/signatures/custom-rules' },
    ],
  },
  {
    text: 'Cuarentena',
    collapsed: true,
    items: [
      { text: 'Gestion de cuarentena', link: '/es/prx-sd/quarantine/' },
    ],
  },
  {
    text: 'Respuesta a amenazas',
    collapsed: true,
    items: [
      { text: 'Correccion automatica', link: '/es/prx-sd/remediation/' },
    ],
  },
  {
    text: 'Alertas y programacion',
    collapsed: true,
    items: [
      { text: 'Alertas Webhook', link: '/es/prx-sd/alerts/webhook' },
      { text: 'Alertas por correo', link: '/es/prx-sd/alerts/email' },
      { text: 'Escaneos programados', link: '/es/prx-sd/alerts/schedule' },
    ],
  },
  {
    text: 'Proteccion de red',
    collapsed: true,
    items: [
      { text: 'Bloqueo de anuncios y malware', link: '/es/prx-sd/network/adblock' },
      { text: 'Proxy DNS', link: '/es/prx-sd/network/dns-proxy' },
    ],
  },
  {
    text: 'Configuracion',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx-sd/configuration/' },
      { text: 'Referencia completa', link: '/es/prx-sd/configuration/reference' },
    ],
  },
  {
    text: 'Referencia CLI',
    collapsed: true,
    items: [
      { text: 'Lista de comandos', link: '/es/prx-sd/cli/' },
    ],
  },
  {
    text: 'Plugins (WASM)',
    collapsed: true,
    items: [
      { text: 'Desarrollo de plugins', link: '/es/prx-sd/plugins/' },
    ],
  },
  {
    text: 'Aplicacion de escritorio',
    collapsed: true,
    items: [
      { text: 'Tauri GUI', link: '/es/prx-sd/gui/' },
    ],
  },
  {
    text: 'Solucion de problemas',
    collapsed: true,
    items: [
      { text: 'Preguntas frecuentes', link: '/es/prx-sd/troubleshooting/' },
    ],
  },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Comenzar',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx-waf/' },
      { text: 'Instalacion', link: '/es/prx-waf/getting-started/installation' },
      { text: 'Inicio rapido', link: '/es/prx-waf/getting-started/quickstart' },
    ],
  },
  {
    text: 'Motor de reglas',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx-waf/rules/' },
      { text: 'Sintaxis YAML', link: '/es/prx-waf/rules/yaml-syntax' },
      { text: 'Reglas integradas', link: '/es/prx-waf/rules/builtin-rules' },
      { text: 'Reglas personalizadas', link: '/es/prx-waf/rules/custom-rules' },
    ],
  },
  {
    text: 'Gateway',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx-waf/gateway/' },
      { text: 'Proxy inverso', link: '/es/prx-waf/gateway/reverse-proxy' },
      { text: 'SSL / TLS', link: '/es/prx-waf/gateway/ssl-tls' },
    ],
  },
  {
    text: 'Cluster',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx-waf/cluster/' },
      { text: 'Despliegue', link: '/es/prx-waf/cluster/deployment' },
    ],
  },
  {
    text: 'CrowdSec',
    collapsed: true,
    items: [
      { text: 'Integracion', link: '/es/prx-waf/crowdsec/' },
    ],
  },
  {
    text: 'UI de administracion',
    collapsed: true,
    items: [
      { text: 'Panel de control', link: '/es/prx-waf/admin-ui/' },
    ],
  },
  {
    text: 'Configuracion',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx-waf/configuration/' },
      { text: 'Referencia completa', link: '/es/prx-waf/configuration/reference' },
    ],
  },
  {
    text: 'Referencia CLI',
    collapsed: true,
    items: [
      { text: 'Lista de comandos', link: '/es/prx-waf/cli/' },
    ],
  },
  {
    text: 'Solucion de problemas',
    collapsed: true,
    items: [
      { text: 'Preguntas frecuentes', link: '/es/prx-waf/troubleshooting/' },
    ],
  },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Comenzar',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/openpr/' },
      { text: 'Instalacion', link: '/es/openpr/getting-started/installation' },
      { text: 'Inicio rapido', link: '/es/openpr/getting-started/quickstart' },
    ],
  },
  {
    text: 'Espacio de trabajo',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/openpr/workspace/' },
      { text: 'Proyectos', link: '/es/openpr/workspace/projects' },
      { text: 'Miembros', link: '/es/openpr/workspace/members' },
    ],
  },
  {
    text: 'Elementos de trabajo',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/openpr/issues/' },
      { text: 'Flujo de trabajo', link: '/es/openpr/issues/workflow' },
      { text: 'Sprints', link: '/es/openpr/issues/sprints' },
      { text: 'Etiquetas', link: '/es/openpr/issues/labels' },
    ],
  },
  {
    text: 'Gobernanza',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/openpr/governance/' },
      { text: 'Propuestas', link: '/es/openpr/governance/proposals' },
      { text: 'Votacion', link: '/es/openpr/governance/voting' },
      { text: 'Puntuaciones de confianza', link: '/es/openpr/governance/trust-scores' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/openpr/api/' },
      { text: 'Autenticacion', link: '/es/openpr/api/authentication' },
      { text: 'Endpoints', link: '/es/openpr/api/endpoints' },
    ],
  },
  {
    text: 'Servidor MCP',
    collapsed: true,
    items: [
      { text: 'Integracion', link: '/es/openpr/mcp-server/' },
    ],
  },
  {
    text: 'Despliegue',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/es/openpr/deployment/docker' },
      { text: 'Produccion', link: '/es/openpr/deployment/production' },
    ],
  },
  {
    text: 'Referencia CLI',
    collapsed: true,
    items: [
      { text: 'Lista de comandos', link: '/es/openpr/cli/' },
    ],
  },
  {
    text: 'Configuracion',
    collapsed: true,
    items: [
      { text: 'Referencia', link: '/es/openpr/configuration/' },
    ],
  },
  {
    text: 'Solucion de problemas',
    collapsed: true,
    items: [
      { text: 'Preguntas frecuentes', link: '/es/openpr/troubleshooting/' },
    ],
  },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Comenzar',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/openpr-webhook/' },
      { text: 'Instalacion', link: '/es/openpr-webhook/getting-started/installation' },
      { text: 'Inicio rapido', link: '/es/openpr-webhook/getting-started/quickstart' },
    ],
  },
  {
    text: 'Agentes',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/openpr-webhook/agents/' },
      { text: 'Ejecutores', link: '/es/openpr-webhook/agents/executors' },
    ],
  },
  {
    text: 'Tunel WSS',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/openpr-webhook/tunnel/' },
    ],
  },
  {
    text: 'Configuracion',
    collapsed: true,
    items: [
      { text: 'Referencia', link: '/es/openpr-webhook/configuration/' },
    ],
  },
  {
    text: 'Solucion de problemas',
    collapsed: true,
    items: [
      { text: 'Preguntas frecuentes', link: '/es/openpr-webhook/troubleshooting/' },
    ],
  },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Comenzar',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx-memory/' },
      { text: 'Instalacion', link: '/es/prx-memory/getting-started/installation' },
      { text: 'Inicio rapido', link: '/es/prx-memory/getting-started/quickstart' },
    ],
  },
  {
    text: 'Embeddings vectoriales',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx-memory/embedding/' },
      { text: 'Modelos', link: '/es/prx-memory/embedding/models' },
      { text: 'Procesamiento por lotes', link: '/es/prx-memory/embedding/batch-processing' },
    ],
  },
  {
    text: 'Reranking',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx-memory/reranking/' },
      { text: 'Modelos', link: '/es/prx-memory/reranking/models' },
    ],
  },
  {
    text: 'Almacenamiento',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/prx-memory/storage/' },
      { text: 'SQLite', link: '/es/prx-memory/storage/sqlite' },
      { text: 'Busqueda vectorial', link: '/es/prx-memory/storage/vector-search' },
    ],
  },
  {
    text: 'Protocolo MCP',
    collapsed: true,
    items: [
      { text: 'Integracion', link: '/es/prx-memory/mcp/' },
    ],
  },
  {
    text: 'Referencia API',
    collapsed: true,
    items: [
      { text: 'Rust API', link: '/es/prx-memory/api/' },
    ],
  },
  {
    text: 'Configuracion',
    collapsed: true,
    items: [
      { text: 'Referencia', link: '/es/prx-memory/configuration/' },
    ],
  },
  {
    text: 'Solucion de problemas',
    collapsed: true,
    items: [
      { text: 'Preguntas frecuentes', link: '/es/prx-memory/troubleshooting/' },
    ],
  },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Comenzar',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx-email/' },
      { text: 'Instalacion', link: '/es/prx-email/getting-started/installation' },
      { text: 'Inicio rapido', link: '/es/prx-email/getting-started/quickstart' },
    ],
  },
  {
    text: 'Cuentas de correo',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/prx-email/accounts/' },
      { text: 'IMAP', link: '/es/prx-email/accounts/imap' },
      { text: 'SMTP', link: '/es/prx-email/accounts/smtp' },
      { text: 'OAuth', link: '/es/prx-email/accounts/oauth' },
    ],
  },
  {
    text: 'Almacenamiento',
    collapsed: true,
    items: [
      { text: 'SQLite', link: '/es/prx-email/storage/' },
    ],
  },
  {
    text: 'Plugins',
    collapsed: true,
    items: [
      { text: 'Plugins WASM', link: '/es/prx-email/plugins/' },
    ],
  },
  {
    text: 'Configuracion',
    collapsed: true,
    items: [
      { text: 'Referencia', link: '/es/prx-email/configuration/' },
    ],
  },
  {
    text: 'Solucion de problemas',
    collapsed: true,
    items: [
      { text: 'Preguntas frecuentes', link: '/es/prx-email/troubleshooting/' },
    ],
  },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Comenzar',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/fenfa/' },
      { text: 'Instalacion', link: '/es/fenfa/getting-started/installation' },
      { text: 'Inicio rapido', link: '/es/fenfa/getting-started/quickstart' },
    ],
  },
  {
    text: 'Gestion de productos',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/fenfa/products/' },
      { text: 'Variantes', link: '/es/fenfa/products/variants' },
      { text: 'Lanzamientos', link: '/es/fenfa/products/releases' },
    ],
  },
  {
    text: 'Distribucion de apps',
    collapsed: false,
    items: [
      { text: 'Descripcion general', link: '/es/fenfa/distribution/' },
      { text: 'iOS', link: '/es/fenfa/distribution/ios' },
      { text: 'Android', link: '/es/fenfa/distribution/android' },
      { text: 'Escritorio', link: '/es/fenfa/distribution/desktop' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: 'Descripcion general', link: '/es/fenfa/api/' },
      { text: 'API de carga', link: '/es/fenfa/api/upload' },
      { text: 'API de administracion', link: '/es/fenfa/api/admin' },
    ],
  },
  {
    text: 'Despliegue',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/es/fenfa/deployment/docker' },
      { text: 'Produccion', link: '/es/fenfa/deployment/production' },
    ],
  },
  {
    text: 'Configuracion',
    collapsed: true,
    items: [
      { text: 'Referencia', link: '/es/fenfa/configuration/' },
    ],
  },
  {
    text: 'Solucion de problemas',
    collapsed: true,
    items: [
      { text: 'Preguntas frecuentes', link: '/es/fenfa/troubleshooting/' },
    ],
  },
]

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'PRX',
    items: [
      { text: 'Comenzar', link: '/es/prx/' },
      { text: 'Canales', link: '/es/prx/channels/' },
      { text: 'Proveedores', link: '/es/prx/providers/' },
      { text: 'Herramientas', link: '/es/prx/tools/' },
      { text: 'Configuracion', link: '/es/prx/config/' },
    ],
  },
  {
    text: 'PRX-SD',
    items: [
      { text: 'Comenzar', link: '/es/prx-sd/' },
      { text: 'Escaneo', link: '/es/prx-sd/scanning/file-scan' },
      { text: 'Motor de deteccion', link: '/es/prx-sd/detection/' },
      { text: 'Inteligencia de amenazas', link: '/es/prx-sd/signatures/' },
      { text: 'Configuracion', link: '/es/prx-sd/configuration/' },
    ],
  },
  {
    text: 'PRX-WAF',
    items: [
      { text: 'Comenzar', link: '/es/prx-waf/' },
      { text: 'Motor de reglas', link: '/es/prx-waf/rules/' },
      { text: 'Gateway', link: '/es/prx-waf/gateway/' },
      { text: 'Cluster', link: '/es/prx-waf/cluster/' },
      { text: 'Configuracion', link: '/es/prx-waf/configuration/' },
    ],
  },
  {
    text: 'Mas',
    items: [
      { text: 'OpenPR', link: '/es/openpr/' },
      { text: 'OpenPR-Webhook', link: '/es/openpr-webhook/' },
      { text: 'PRX-Memory', link: '/es/prx-memory/' },
      { text: 'PRX-Email', link: '/es/prx-email/' },
      { text: 'Fenfa', link: '/es/fenfa/' },
    ],
  },
]

export const esConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/es/prx/': prxSidebar,
      '/es/prx-sd/': prxSdSidebar,
      '/es/prx-waf/': prxWafSidebar,
      '/es/openpr/': openprSidebar,
      '/es/openpr-webhook/': openprWebhookSidebar,
      '/es/prx-memory/': prxMemorySidebar,
      '/es/prx-email/': prxEmailSidebar,
      '/es/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'Editar esta pagina en GitHub',
    },
    lastUpdated: {
      text: 'Ultima actualizacion',
    },
    docFooter: {
      prev: 'Pagina anterior',
      next: 'Pagina siguiente',
    },
    outline: {
      label: 'En esta pagina',
      level: [2, 3],
    },
  },
}
