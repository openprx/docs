import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Начало работы',
    collapsed: false,
    items: [
      { text: 'Обзор', link: '/ru/prx/' },
      { text: 'Установка', link: '/ru/prx/getting-started/installation' },
      { text: 'Быстрый старт', link: '/ru/prx/getting-started/quickstart' },
      { text: 'Мастер настройки', link: '/ru/prx/getting-started/onboarding' },
    ],
  },
  {
    text: 'Каналы',
    collapsed: false,
    items: [
      { text: 'Обзор', link: '/ru/prx/channels/' },
      { text: 'Telegram', link: '/ru/prx/channels/telegram' },
      { text: 'Discord', link: '/ru/prx/channels/discord' },
      { text: 'Slack', link: '/ru/prx/channels/slack' },
      { text: 'WhatsApp', link: '/ru/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/ru/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/ru/prx/channels/signal' },
      { text: 'iMessage', link: '/ru/prx/channels/imessage' },
      { text: 'Matrix', link: '/ru/prx/channels/matrix' },
      { text: 'Электронная почта', link: '/ru/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/ru/prx/channels/lark' },
      { text: 'DingTalk', link: '/ru/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/ru/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/ru/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/ru/prx/channels/irc' },
      { text: 'QQ', link: '/ru/prx/channels/qq' },
      { text: 'LINQ', link: '/ru/prx/channels/linq' },
      { text: 'CLI', link: '/ru/prx/channels/cli' },
    ],
  },
  {
    text: 'Провайдеры LLM',
    collapsed: false,
    items: [
      { text: 'Обзор', link: '/ru/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/ru/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/ru/prx/providers/openai' },
      { text: 'Google Gemini', link: '/ru/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/ru/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/ru/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/ru/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/ru/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/ru/prx/providers/glm' },
      { text: 'OpenRouter', link: '/ru/prx/providers/openrouter' },
      { text: 'Пользовательский совместимый', link: '/ru/prx/providers/custom-compatible' },
    ],
  },
  {
    text: 'Инструменты',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/tools/' },
      { text: 'Выполнение Shell', link: '/ru/prx/tools/shell' },
      { text: 'Операции с файлами', link: '/ru/prx/tools/file-operations' },
      { text: 'Инструменты памяти', link: '/ru/prx/tools/memory' },
      { text: 'Браузер', link: '/ru/prx/tools/browser' },
      { text: 'Веб-поиск', link: '/ru/prx/tools/web-search' },
      { text: 'HTTP-запросы', link: '/ru/prx/tools/http-request' },
      { text: 'Сессии и агенты', link: '/ru/prx/tools/sessions' },
      { text: 'Инструменты Cron', link: '/ru/prx/tools/cron-tools' },
      { text: 'Операции Git', link: '/ru/prx/tools/git' },
      { text: 'Обмен сообщениями', link: '/ru/prx/tools/messaging' },
      { text: 'Удаленные узлы', link: '/ru/prx/tools/nodes' },
      { text: 'Медиа', link: '/ru/prx/tools/media' },
      { text: 'Интеграция MCP', link: '/ru/prx/tools/mcp' },
      { text: 'SkillForge', link: '/ru/prx/tools/skillforge' },
      { text: 'Hooks', link: '/ru/prx/tools/hooks' },
    ],
  },
  {
    text: 'Среда выполнения агента',
    collapsed: true,
    items: [
      { text: 'Архитектура', link: '/ru/prx/agent/runtime' },
      { text: 'Цикл агента', link: '/ru/prx/agent/loop' },
      { text: 'Суб-агенты', link: '/ru/prx/agent/subagents' },
      { text: 'Воркер сессии', link: '/ru/prx/agent/session-worker' },
      { text: 'Бэкенды среды выполнения', link: '/ru/prx/agent/runtime-backends' },
      { text: 'Мультимодальность', link: '/ru/prx/agent/multimodal' },
    ],
  },
  {
    text: 'Система памяти',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/memory/' },
      { text: 'Бэкенд Markdown', link: '/ru/prx/memory/markdown' },
      { text: 'Бэкенд SQLite', link: '/ru/prx/memory/sqlite' },
      { text: 'Бэкенд PostgreSQL', link: '/ru/prx/memory/postgres' },
      { text: 'Векторные эмбеддинги', link: '/ru/prx/memory/embeddings' },
      { text: 'Очистка памяти', link: '/ru/prx/memory/hygiene' },
      { text: 'RAG', link: '/ru/prx/memory/rag' },
      { text: 'Lucid.so', link: '/ru/prx/memory/lucid' },
      { text: 'Векторный поиск', link: '/ru/prx/memory/vector-search' },
    ],
  },
  {
    text: 'Самоэволюция',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/self-evolution/' },
      { text: 'L1: Эволюция памяти', link: '/ru/prx/self-evolution/l1-memory' },
      { text: 'L2: Эволюция промптов', link: '/ru/prx/self-evolution/l2-prompt' },
      { text: 'L3: Эволюция стратегии', link: '/ru/prx/self-evolution/l3-strategy' },
      { text: 'Конвейер', link: '/ru/prx/self-evolution/pipeline' },
      { text: 'Безопасность', link: '/ru/prx/self-evolution/safety' },
      { text: 'Журнал решений', link: '/ru/prx/self-evolution/decision-log' },
      { text: 'Эксперименты', link: '/ru/prx/self-evolution/experiments' },
    ],
  },
  {
    text: 'Конфигурация',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/config/' },
      { text: 'Полный справочник', link: '/ru/prx/config/reference' },
      { text: 'Горячая перезагрузка', link: '/ru/prx/config/hot-reload' },
      { text: 'Переменные окружения', link: '/ru/prx/config/environment' },
    ],
  },
  {
    text: 'Плагины (WASM)',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/plugins/' },
      { text: 'Архитектура', link: '/ru/prx/plugins/architecture' },
      { text: 'Руководство разработчика', link: '/ru/prx/plugins/developer-guide' },
      { text: 'Хост-функции', link: '/ru/prx/plugins/host-functions' },
      { text: 'PDK', link: '/ru/prx/plugins/pdk' },
      { text: 'Примеры', link: '/ru/prx/plugins/examples' },
      { text: 'Шина событий', link: '/ru/prx/plugins/event-bus' },
    ],
  },
  {
    text: 'Шлюз',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/gateway/' },
      { text: 'HTTP API', link: '/ru/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/ru/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/ru/prx/gateway/webhooks' },
      { text: 'Middleware', link: '/ru/prx/gateway/middleware' },
      { text: 'Справочник API', link: '/ru/prx/gateway/api-reference' },
    ],
  },
  {
    text: 'Безопасность',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/security/' },
      { text: 'Движок политик', link: '/ru/prx/security/policy-engine' },
      { text: 'Сопряжение', link: '/ru/prx/security/pairing' },
      { text: 'Песочница', link: '/ru/prx/security/sandbox' },
      { text: 'Хранилище секретов', link: '/ru/prx/security/secrets' },
      { text: 'Модель угроз', link: '/ru/prx/security/threat-model' },
      { text: 'Процесс утверждения', link: '/ru/prx/security/approval' },
      { text: 'Журнал аудита', link: '/ru/prx/security/audit' },
    ],
  },
  {
    text: 'Маршрутизатор LLM',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/router/' },
      { text: 'Эвристическая маршрутизация', link: '/ru/prx/router/heuristic' },
      { text: 'KNN маршрутизация', link: '/ru/prx/router/knn' },
      { text: 'Automix', link: '/ru/prx/router/automix' },
    ],
  },
  {
    text: 'Каузальное дерево',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/causal-tree/' },
      { text: 'Конфигурация', link: '/ru/prx/causal-tree/configuration' },
    ],
  },
  {
    text: 'Планирование (Xin)',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/cron/' },
      { text: 'Heartbeat', link: '/ru/prx/cron/heartbeat' },
      { text: 'Задачи Cron', link: '/ru/prx/cron/tasks' },
    ],
  },
  {
    text: 'Удаленные узлы',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/nodes/' },
      { text: 'Протокол сопряжения', link: '/ru/prx/nodes/pairing' },
      { text: 'Протокол JSON-RPC', link: '/ru/prx/nodes/protocol' },
    ],
  },
  {
    text: 'Аутентификация',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/auth/' },
      { text: 'Поток OAuth2', link: '/ru/prx/auth/oauth2' },
      { text: 'Профили аутентификации', link: '/ru/prx/auth/profiles' },
      { text: 'Управление идентификацией', link: '/ru/prx/auth/identity' },
    ],
  },
  {
    text: 'Справочник CLI',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/cli/' },
      { text: 'prx agent', link: '/ru/prx/cli/agent' },
      { text: 'prx chat', link: '/ru/prx/cli/chat' },
      { text: 'prx daemon', link: '/ru/prx/cli/daemon' },
      { text: 'prx gateway', link: '/ru/prx/cli/gateway' },
      { text: 'prx onboard', link: '/ru/prx/cli/onboard' },
      { text: 'prx channel', link: '/ru/prx/cli/channel' },
      { text: 'prx cron', link: '/ru/prx/cli/cron' },
      { text: 'prx evolution', link: '/ru/prx/cli/evolution' },
      { text: 'prx auth', link: '/ru/prx/cli/auth' },
      { text: 'prx config', link: '/ru/prx/cli/config' },
      { text: 'prx doctor', link: '/ru/prx/cli/doctor' },
      { text: 'prx service', link: '/ru/prx/cli/service' },
      { text: 'prx skills', link: '/ru/prx/cli/skills' },
    ],
  },
  {
    text: 'Наблюдаемость',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/observability/' },
      { text: 'Prometheus', link: '/ru/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/ru/prx/observability/opentelemetry' },
      { text: 'Отслеживание затрат', link: '/ru/prx/observability/cost-tracking' },
    ],
  },
  {
    text: 'Туннель',
    collapsed: true,
    items: [
      { text: 'Обзор', link: '/ru/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/ru/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/ru/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/ru/prx/tunnel/ngrok' },
    ],
  },
  {
    text: 'Устранение неполадок',
    collapsed: true,
    items: [
      { text: 'Частые ошибки', link: '/ru/prx/troubleshooting/' },
      { text: 'Диагностика', link: '/ru/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Начало работы', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/prx-sd/' },
    { text: 'Установка', link: '/ru/prx-sd/getting-started/installation' },
    { text: 'Быстрый старт', link: '/ru/prx-sd/getting-started/quickstart' },
  ] },
  { text: 'Сканирование', collapsed: false, items: [
    { text: 'Сканирование файлов и каталогов', link: '/ru/prx-sd/scanning/file-scan' },
    { text: 'Сканирование памяти', link: '/ru/prx-sd/scanning/memory-scan' },
    { text: 'Обнаружение Rootkit', link: '/ru/prx-sd/scanning/rootkit' },
    { text: 'Сканирование USB-устройств', link: '/ru/prx-sd/scanning/usb-scan' },
  ] },
  { text: 'Движок обнаружения', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/prx-sd/detection/' },
    { text: 'Сопоставление хэшей', link: '/ru/prx-sd/detection/hash-matching' },
    { text: 'Правила YARA', link: '/ru/prx-sd/detection/yara-rules' },
    { text: 'Эвристический анализ', link: '/ru/prx-sd/detection/heuristics' },
    { text: 'Поддерживаемые типы файлов', link: '/ru/prx-sd/detection/file-types' },
  ] },
  { text: 'Защита в реальном времени', collapsed: true, items: [
    { text: 'Мониторинг файлов', link: '/ru/prx-sd/realtime/monitor' },
    { text: 'Демон', link: '/ru/prx-sd/realtime/daemon' },
    { text: 'Защита от вымогателей', link: '/ru/prx-sd/realtime/ransomware' },
  ] },
  { text: 'Разведка угроз', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/prx-sd/signatures/' },
    { text: 'Обновление сигнатур', link: '/ru/prx-sd/signatures/update' },
    { text: 'Источники разведки', link: '/ru/prx-sd/signatures/sources' },
    { text: 'Импорт хэшей', link: '/ru/prx-sd/signatures/import' },
    { text: 'Пользовательские правила YARA', link: '/ru/prx-sd/signatures/custom-rules' },
  ] },
  { text: 'Карантин', collapsed: true, items: [
    { text: 'Управление карантином', link: '/ru/prx-sd/quarantine/' },
  ] },
  { text: 'Реагирование на угрозы', collapsed: true, items: [
    { text: 'Автоматическое исправление', link: '/ru/prx-sd/remediation/' },
  ] },
  { text: 'Оповещения и планирование', collapsed: true, items: [
    { text: 'Webhook-оповещения', link: '/ru/prx-sd/alerts/webhook' },
    { text: 'E-mail-оповещения', link: '/ru/prx-sd/alerts/email' },
    { text: 'Запланированные сканирования', link: '/ru/prx-sd/alerts/schedule' },
  ] },
  { text: 'Защита сети', collapsed: true, items: [
    { text: 'Блокировка рекламы и вредоносных доменов', link: '/ru/prx-sd/network/adblock' },
    { text: 'DNS-прокси', link: '/ru/prx-sd/network/dns-proxy' },
  ] },
  { text: 'Конфигурация', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/prx-sd/configuration/' },
    { text: 'Полный справочник', link: '/ru/prx-sd/configuration/reference' },
  ] },
  { text: 'Справочник CLI', collapsed: true, items: [
    { text: 'Список команд', link: '/ru/prx-sd/cli/' },
  ] },
  { text: 'Плагины (WASM)', collapsed: true, items: [
    { text: 'Разработка плагинов', link: '/ru/prx-sd/plugins/' },
  ] },
  { text: 'Десктопное приложение', collapsed: true, items: [
    { text: 'Tauri GUI', link: '/ru/prx-sd/gui/' },
  ] },
  { text: 'Устранение неполадок', collapsed: true, items: [
    { text: 'Частые вопросы', link: '/ru/prx-sd/troubleshooting/' },
  ] },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Начало работы', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/prx-waf/' },
    { text: 'Установка', link: '/ru/prx-waf/getting-started/installation' },
    { text: 'Быстрый старт', link: '/ru/prx-waf/getting-started/quickstart' },
  ] },
  { text: 'Движок правил', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/prx-waf/rules/' },
    { text: 'Синтаксис YAML', link: '/ru/prx-waf/rules/yaml-syntax' },
    { text: 'Встроенные правила', link: '/ru/prx-waf/rules/builtin-rules' },
    { text: 'Пользовательские правила', link: '/ru/prx-waf/rules/custom-rules' },
  ] },
  { text: 'Шлюз', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/prx-waf/gateway/' },
    { text: 'Обратный прокси', link: '/ru/prx-waf/gateway/reverse-proxy' },
    { text: 'SSL / TLS', link: '/ru/prx-waf/gateway/ssl-tls' },
  ] },
  { text: 'Кластер', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/prx-waf/cluster/' },
    { text: 'Развертывание', link: '/ru/prx-waf/cluster/deployment' },
  ] },
  { text: 'CrowdSec', collapsed: true, items: [
    { text: 'Интеграция', link: '/ru/prx-waf/crowdsec/' },
  ] },
  { text: 'Панель администратора', collapsed: true, items: [
    { text: 'Дашборд', link: '/ru/prx-waf/admin-ui/' },
  ] },
  { text: 'Конфигурация', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/prx-waf/configuration/' },
    { text: 'Полный справочник', link: '/ru/prx-waf/configuration/reference' },
  ] },
  { text: 'Справочник CLI', collapsed: true, items: [
    { text: 'Список команд', link: '/ru/prx-waf/cli/' },
  ] },
  { text: 'Устранение неполадок', collapsed: true, items: [
    { text: 'Частые вопросы', link: '/ru/prx-waf/troubleshooting/' },
  ] },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Начало работы', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/openpr/' },
    { text: 'Установка', link: '/ru/openpr/getting-started/installation' },
    { text: 'Быстрый старт', link: '/ru/openpr/getting-started/quickstart' },
  ] },
  { text: 'Рабочее пространство', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/openpr/workspace/' },
    { text: 'Проекты', link: '/ru/openpr/workspace/projects' },
    { text: 'Участники', link: '/ru/openpr/workspace/members' },
  ] },
  { text: 'Рабочие элементы', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/openpr/issues/' },
    { text: 'Рабочий процесс', link: '/ru/openpr/issues/workflow' },
    { text: 'Спринты', link: '/ru/openpr/issues/sprints' },
    { text: 'Метки', link: '/ru/openpr/issues/labels' },
  ] },
  { text: 'Управление', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/openpr/governance/' },
    { text: 'Предложения', link: '/ru/openpr/governance/proposals' },
    { text: 'Голосование', link: '/ru/openpr/governance/voting' },
    { text: 'Очки доверия', link: '/ru/openpr/governance/trust-scores' },
  ] },
  { text: 'API', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/openpr/api/' },
    { text: 'Аутентификация', link: '/ru/openpr/api/authentication' },
    { text: 'Эндпоинты', link: '/ru/openpr/api/endpoints' },
  ] },
  { text: 'MCP-сервер', collapsed: true, items: [
    { text: 'Интеграция', link: '/ru/openpr/mcp-server/' },
  ] },
  { text: 'Развертывание', collapsed: true, items: [
    { text: 'Docker', link: '/ru/openpr/deployment/docker' },
    { text: 'Продакшен', link: '/ru/openpr/deployment/production' },
  ] },
  { text: 'Справочник CLI', collapsed: true, items: [
    { text: 'Список команд', link: '/ru/openpr/cli/' },
  ] },
  { text: 'Конфигурация', collapsed: true, items: [
    { text: 'Справочник', link: '/ru/openpr/configuration/' },
  ] },
  { text: 'Устранение неполадок', collapsed: true, items: [
    { text: 'Частые вопросы', link: '/ru/openpr/troubleshooting/' },
  ] },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Начало работы', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/openpr-webhook/' },
    { text: 'Установка', link: '/ru/openpr-webhook/getting-started/installation' },
    { text: 'Быстрый старт', link: '/ru/openpr-webhook/getting-started/quickstart' },
  ] },
  { text: 'Агенты', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/openpr-webhook/agents/' },
    { text: 'Исполнители', link: '/ru/openpr-webhook/agents/executors' },
  ] },
  { text: 'WSS-туннель', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/openpr-webhook/tunnel/' },
  ] },
  { text: 'Конфигурация', collapsed: true, items: [
    { text: 'Справочник', link: '/ru/openpr-webhook/configuration/' },
  ] },
  { text: 'Устранение неполадок', collapsed: true, items: [
    { text: 'Частые вопросы', link: '/ru/openpr-webhook/troubleshooting/' },
  ] },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Начало работы', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/prx-memory/' },
    { text: 'Установка', link: '/ru/prx-memory/getting-started/installation' },
    { text: 'Быстрый старт', link: '/ru/prx-memory/getting-started/quickstart' },
  ] },
  { text: 'Векторные эмбеддинги', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/prx-memory/embedding/' },
    { text: 'Модели', link: '/ru/prx-memory/embedding/models' },
    { text: 'Пакетная обработка', link: '/ru/prx-memory/embedding/batch-processing' },
  ] },
  { text: 'Ранжирование', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/prx-memory/reranking/' },
    { text: 'Модели', link: '/ru/prx-memory/reranking/models' },
  ] },
  { text: 'Хранилище', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/prx-memory/storage/' },
    { text: 'SQLite', link: '/ru/prx-memory/storage/sqlite' },
    { text: 'Векторный поиск', link: '/ru/prx-memory/storage/vector-search' },
  ] },
  { text: 'Протокол MCP', collapsed: true, items: [
    { text: 'Интеграция', link: '/ru/prx-memory/mcp/' },
  ] },
  { text: 'Справочник API', collapsed: true, items: [
    { text: 'Rust API', link: '/ru/prx-memory/api/' },
  ] },
  { text: 'Конфигурация', collapsed: true, items: [
    { text: 'Справочник', link: '/ru/prx-memory/configuration/' },
  ] },
  { text: 'Устранение неполадок', collapsed: true, items: [
    { text: 'Частые вопросы', link: '/ru/prx-memory/troubleshooting/' },
  ] },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Начало работы', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/prx-email/' },
    { text: 'Установка', link: '/ru/prx-email/getting-started/installation' },
    { text: 'Быстрый старт', link: '/ru/prx-email/getting-started/quickstart' },
  ] },
  { text: 'Учетные записи', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/prx-email/accounts/' },
    { text: 'IMAP', link: '/ru/prx-email/accounts/imap' },
    { text: 'SMTP', link: '/ru/prx-email/accounts/smtp' },
    { text: 'OAuth', link: '/ru/prx-email/accounts/oauth' },
  ] },
  { text: 'Хранилище', collapsed: true, items: [
    { text: 'SQLite', link: '/ru/prx-email/storage/' },
  ] },
  { text: 'Плагины', collapsed: true, items: [
    { text: 'WASM-плагины', link: '/ru/prx-email/plugins/' },
  ] },
  { text: 'Конфигурация', collapsed: true, items: [
    { text: 'Справочник', link: '/ru/prx-email/configuration/' },
  ] },
  { text: 'Устранение неполадок', collapsed: true, items: [
    { text: 'Частые вопросы', link: '/ru/prx-email/troubleshooting/' },
  ] },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Начало работы', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/fenfa/' },
    { text: 'Установка', link: '/ru/fenfa/getting-started/installation' },
    { text: 'Быстрый старт', link: '/ru/fenfa/getting-started/quickstart' },
  ] },
  { text: 'Управление продуктами', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/fenfa/products/' },
    { text: 'Варианты', link: '/ru/fenfa/products/variants' },
    { text: 'Релизы', link: '/ru/fenfa/products/releases' },
  ] },
  { text: 'Дистрибуция приложений', collapsed: false, items: [
    { text: 'Обзор', link: '/ru/fenfa/distribution/' },
    { text: 'iOS', link: '/ru/fenfa/distribution/ios' },
    { text: 'Android', link: '/ru/fenfa/distribution/android' },
    { text: 'Десктоп', link: '/ru/fenfa/distribution/desktop' },
  ] },
  { text: 'API', collapsed: true, items: [
    { text: 'Обзор', link: '/ru/fenfa/api/' },
    { text: 'API загрузки', link: '/ru/fenfa/api/upload' },
    { text: 'API администрирования', link: '/ru/fenfa/api/admin' },
  ] },
  { text: 'Развертывание', collapsed: true, items: [
    { text: 'Docker', link: '/ru/fenfa/deployment/docker' },
    { text: 'Продакшен', link: '/ru/fenfa/deployment/production' },
  ] },
  { text: 'Конфигурация', collapsed: true, items: [
    { text: 'Справочник', link: '/ru/fenfa/configuration/' },
  ] },
  { text: 'Устранение неполадок', collapsed: true, items: [
    { text: 'Частые вопросы', link: '/ru/fenfa/troubleshooting/' },
  ] },
]

const nav: DefaultTheme.NavItem[] = [
  { text: 'PRX', items: [
    { text: 'Начало работы', link: '/ru/prx/' },
    { text: 'Каналы', link: '/ru/prx/channels/' },
    { text: 'Провайдеры', link: '/ru/prx/providers/' },
    { text: 'Инструменты', link: '/ru/prx/tools/' },
    { text: 'Конфигурация', link: '/ru/prx/config/' },
  ] },
  { text: 'PRX-SD', items: [
    { text: 'Начало работы', link: '/ru/prx-sd/' },
    { text: 'Сканирование', link: '/ru/prx-sd/scanning/file-scan' },
    { text: 'Движок обнаружения', link: '/ru/prx-sd/detection/' },
    { text: 'Разведка угроз', link: '/ru/prx-sd/signatures/' },
    { text: 'Конфигурация', link: '/ru/prx-sd/configuration/' },
  ] },
  { text: 'PRX-WAF', items: [
    { text: 'Начало работы', link: '/ru/prx-waf/' },
    { text: 'Движок правил', link: '/ru/prx-waf/rules/' },
    { text: 'Шлюз', link: '/ru/prx-waf/gateway/' },
    { text: 'Кластер', link: '/ru/prx-waf/cluster/' },
    { text: 'Конфигурация', link: '/ru/prx-waf/configuration/' },
  ] },
  { text: 'Ещё', items: [
    { text: 'OpenPR', link: '/ru/openpr/' },
    { text: 'OpenPR-Webhook', link: '/ru/openpr-webhook/' },
    { text: 'PRX-Memory', link: '/ru/prx-memory/' },
    { text: 'PRX-Email', link: '/ru/prx-email/' },
    { text: 'Fenfa', link: '/ru/fenfa/' },
  ] },
]

export const ruConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/ru/prx/': prxSidebar,
      '/ru/prx-sd/': prxSdSidebar,
      '/ru/prx-waf/': prxWafSidebar,
      '/ru/openpr/': openprSidebar,
      '/ru/openpr-webhook/': openprWebhookSidebar,
      '/ru/prx-memory/': prxMemorySidebar,
      '/ru/prx-email/': prxEmailSidebar,
      '/ru/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'Редактировать эту страницу на GitHub',
    },
    lastUpdated: {
      text: 'Последнее обновление',
    },
    docFooter: {
      prev: 'Предыдущая страница',
      next: 'Следующая страница',
    },
    outline: {
      label: 'На этой странице',
      level: [2, 3],
    },
  },
}
