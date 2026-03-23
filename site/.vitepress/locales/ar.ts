import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'البدء السريع',
    collapsed: false,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/' },
      { text: 'التثبيت', link: '/ar/prx/getting-started/installation' },
      { text: 'بداية سريعة', link: '/ar/prx/getting-started/quickstart' },
      { text: 'معالج الاعداد', link: '/ar/prx/getting-started/onboarding' },
    ],
  },
  {
    text: 'القنوات',
    collapsed: false,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/channels/' },
      { text: 'Telegram', link: '/ar/prx/channels/telegram' },
      { text: 'Discord', link: '/ar/prx/channels/discord' },
      { text: 'Slack', link: '/ar/prx/channels/slack' },
      { text: 'WhatsApp', link: '/ar/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/ar/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/ar/prx/channels/signal' },
      { text: 'iMessage', link: '/ar/prx/channels/imessage' },
      { text: 'Matrix', link: '/ar/prx/channels/matrix' },
      { text: 'البريد الالكتروني', link: '/ar/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/ar/prx/channels/lark' },
      { text: 'DingTalk', link: '/ar/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/ar/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/ar/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/ar/prx/channels/irc' },
      { text: 'QQ', link: '/ar/prx/channels/qq' },
      { text: 'LINQ', link: '/ar/prx/channels/linq' },
      { text: 'CLI', link: '/ar/prx/channels/cli' },
    ],
  },
  {
    text: 'مزودو LLM',
    collapsed: false,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/ar/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/ar/prx/providers/openai' },
      { text: 'Google Gemini', link: '/ar/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/ar/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/ar/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/ar/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/ar/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/ar/prx/providers/glm' },
      { text: 'OpenRouter', link: '/ar/prx/providers/openrouter' },
      { text: 'متوافق مخصص', link: '/ar/prx/providers/custom-compatible' },
    ],
  },
  {
    text: 'الادوات',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/tools/' },
      { text: 'تنفيذ Shell', link: '/ar/prx/tools/shell' },
      { text: 'عمليات الملفات', link: '/ar/prx/tools/file-operations' },
      { text: 'ادوات الذاكرة', link: '/ar/prx/tools/memory' },
      { text: 'المتصفح', link: '/ar/prx/tools/browser' },
      { text: 'البحث على الويب', link: '/ar/prx/tools/web-search' },
      { text: 'طلبات HTTP', link: '/ar/prx/tools/http-request' },
      { text: 'الجلسات والوكلاء', link: '/ar/prx/tools/sessions' },
      { text: 'ادوات Cron', link: '/ar/prx/tools/cron-tools' },
      { text: 'عمليات Git', link: '/ar/prx/tools/git' },
      { text: 'المراسلة', link: '/ar/prx/tools/messaging' },
      { text: 'العقد البعيدة', link: '/ar/prx/tools/nodes' },
      { text: 'الوسائط', link: '/ar/prx/tools/media' },
      { text: 'تكامل MCP', link: '/ar/prx/tools/mcp' },
      { text: 'SkillForge', link: '/ar/prx/tools/skillforge' },
      { text: 'Hooks', link: '/ar/prx/tools/hooks' },
    ],
  },
  {
    text: 'وقت تشغيل الوكيل',
    collapsed: true,
    items: [
      { text: 'البنية', link: '/ar/prx/agent/runtime' },
      { text: 'حلقة الوكيل', link: '/ar/prx/agent/loop' },
      { text: 'الوكلاء الفرعيون', link: '/ar/prx/agent/subagents' },
      { text: 'عامل الجلسة', link: '/ar/prx/agent/session-worker' },
      { text: 'خلفيات وقت التشغيل', link: '/ar/prx/agent/runtime-backends' },
      { text: 'متعدد الوسائط', link: '/ar/prx/agent/multimodal' },
    ],
  },
  {
    text: 'نظام الذاكرة',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/memory/' },
      { text: 'خلفية Markdown', link: '/ar/prx/memory/markdown' },
      { text: 'خلفية SQLite', link: '/ar/prx/memory/sqlite' },
      { text: 'خلفية PostgreSQL', link: '/ar/prx/memory/postgres' },
      { text: 'تضمين المتجهات', link: '/ar/prx/memory/embeddings' },
      { text: 'تنظيف الذاكرة', link: '/ar/prx/memory/hygiene' },
      { text: 'RAG', link: '/ar/prx/memory/rag' },
      { text: 'Lucid.so', link: '/ar/prx/memory/lucid' },
      { text: 'البحث المتجهي', link: '/ar/prx/memory/vector-search' },
    ],
  },
  {
    text: 'التطور الذاتي',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/self-evolution/' },
      { text: 'L1: تطور الذاكرة', link: '/ar/prx/self-evolution/l1-memory' },
      { text: 'L2: تطور الموجهات', link: '/ar/prx/self-evolution/l2-prompt' },
      { text: 'L3: تطور الاستراتيجية', link: '/ar/prx/self-evolution/l3-strategy' },
      { text: 'خط الانابيب', link: '/ar/prx/self-evolution/pipeline' },
      { text: 'الامان', link: '/ar/prx/self-evolution/safety' },
      { text: 'سجل القرارات', link: '/ar/prx/self-evolution/decision-log' },
      { text: 'التجارب', link: '/ar/prx/self-evolution/experiments' },
    ],
  },
  {
    text: 'الاعدادات',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/config/' },
      { text: 'المرجع الكامل', link: '/ar/prx/config/reference' },
      { text: 'اعادة التحميل المباشر', link: '/ar/prx/config/hot-reload' },
      { text: 'متغيرات البيئة', link: '/ar/prx/config/environment' },
    ],
  },
  {
    text: 'الاضافات (WASM)',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/plugins/' },
      { text: 'البنية', link: '/ar/prx/plugins/architecture' },
      { text: 'دليل المطور', link: '/ar/prx/plugins/developer-guide' },
      { text: 'دوال المضيف', link: '/ar/prx/plugins/host-functions' },
      { text: 'PDK', link: '/ar/prx/plugins/pdk' },
      { text: 'امثلة', link: '/ar/prx/plugins/examples' },
      { text: 'ناقل الاحداث', link: '/ar/prx/plugins/event-bus' },
    ],
  },
  {
    text: 'البوابة',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/gateway/' },
      { text: 'HTTP API', link: '/ar/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/ar/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/ar/prx/gateway/webhooks' },
      { text: 'البرمجيات الوسيطة', link: '/ar/prx/gateway/middleware' },
      { text: 'مرجع API', link: '/ar/prx/gateway/api-reference' },
    ],
  },
  {
    text: 'الامان',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/security/' },
      { text: 'محرك السياسات', link: '/ar/prx/security/policy-engine' },
      { text: 'الاقتران', link: '/ar/prx/security/pairing' },
      { text: 'صندوق الرمل', link: '/ar/prx/security/sandbox' },
      { text: 'مخزن الاسرار', link: '/ar/prx/security/secrets' },
      { text: 'نموذج التهديد', link: '/ar/prx/security/threat-model' },
      { text: 'سير عمل الموافقة', link: '/ar/prx/security/approval' },
      { text: 'سجل التدقيق', link: '/ar/prx/security/audit' },
    ],
  },
  {
    text: 'موجه LLM',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/router/' },
      { text: 'التوجيه الاستكشافي', link: '/ar/prx/router/heuristic' },
      { text: 'توجيه KNN', link: '/ar/prx/router/knn' },
      { text: 'Automix', link: '/ar/prx/router/automix' },
    ],
  },
  {
    text: 'محرك الشجرة السببية',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/causal-tree/' },
      { text: 'مرجع التكوين', link: '/ar/prx/causal-tree/configuration' },
    ],
  },
  {
    text: 'الجدولة (Xin)',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/cron/' },
      { text: 'نبض القلب', link: '/ar/prx/cron/heartbeat' },
      { text: 'مهام Cron', link: '/ar/prx/cron/tasks' },
    ],
  },
  {
    text: 'العقد البعيدة',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/nodes/' },
      { text: 'بروتوكول الاقتران', link: '/ar/prx/nodes/pairing' },
      { text: 'بروتوكول JSON-RPC', link: '/ar/prx/nodes/protocol' },
    ],
  },
  {
    text: 'المصادقة',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/auth/' },
      { text: 'تدفق OAuth2', link: '/ar/prx/auth/oauth2' },
      { text: 'ملفات المصادقة', link: '/ar/prx/auth/profiles' },
      { text: 'ادارة الهوية', link: '/ar/prx/auth/identity' },
    ],
  },
  {
    text: 'مرجع CLI',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/cli/' },
      { text: 'prx agent', link: '/ar/prx/cli/agent' },
      { text: 'prx chat', link: '/ar/prx/cli/chat' },
      { text: 'prx daemon', link: '/ar/prx/cli/daemon' },
      { text: 'prx gateway', link: '/ar/prx/cli/gateway' },
      { text: 'prx onboard', link: '/ar/prx/cli/onboard' },
      { text: 'prx channel', link: '/ar/prx/cli/channel' },
      { text: 'prx cron', link: '/ar/prx/cli/cron' },
      { text: 'prx evolution', link: '/ar/prx/cli/evolution' },
      { text: 'prx auth', link: '/ar/prx/cli/auth' },
      { text: 'prx config', link: '/ar/prx/cli/config' },
      { text: 'prx doctor', link: '/ar/prx/cli/doctor' },
      { text: 'prx service', link: '/ar/prx/cli/service' },
      { text: 'prx skills', link: '/ar/prx/cli/skills' },
    ],
  },
  {
    text: 'المراقبة',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/observability/' },
      { text: 'Prometheus', link: '/ar/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/ar/prx/observability/opentelemetry' },
      { text: 'تتبع التكاليف', link: '/ar/prx/observability/cost-tracking' },
    ],
  },
  {
    text: 'النفق',
    collapsed: true,
    items: [
      { text: 'نظرة عامة', link: '/ar/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/ar/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/ar/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/ar/prx/tunnel/ngrok' },
    ],
  },
  {
    text: 'استكشاف الاخطاء',
    collapsed: true,
    items: [
      { text: 'الاخطاء الشائعة', link: '/ar/prx/troubleshooting/' },
      { text: 'ادوات التشخيص', link: '/ar/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'البدء السريع', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/prx-sd/' },
    { text: 'التثبيت', link: '/ar/prx-sd/getting-started/installation' },
    { text: 'بداية سريعة', link: '/ar/prx-sd/getting-started/quickstart' },
  ] },
  { text: 'الفحص', collapsed: false, items: [
    { text: 'فحص الملفات والمجلدات', link: '/ar/prx-sd/scanning/file-scan' },
    { text: 'فحص الذاكرة', link: '/ar/prx-sd/scanning/memory-scan' },
    { text: 'كشف Rootkit', link: '/ar/prx-sd/scanning/rootkit' },
    { text: 'فحص اجهزة USB', link: '/ar/prx-sd/scanning/usb-scan' },
  ] },
  { text: 'محرك الكشف', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/prx-sd/detection/' },
    { text: 'مطابقة الهاش', link: '/ar/prx-sd/detection/hash-matching' },
    { text: 'قواعد YARA', link: '/ar/prx-sd/detection/yara-rules' },
    { text: 'التحليل الاستكشافي', link: '/ar/prx-sd/detection/heuristics' },
    { text: 'انواع الملفات المدعومة', link: '/ar/prx-sd/detection/file-types' },
  ] },
  { text: 'الحماية الفورية', collapsed: true, items: [
    { text: 'مراقبة الملفات', link: '/ar/prx-sd/realtime/monitor' },
    { text: 'الخدمة الخلفية', link: '/ar/prx-sd/realtime/daemon' },
    { text: 'الحماية من برامج الفدية', link: '/ar/prx-sd/realtime/ransomware' },
  ] },
  { text: 'استخبارات التهديدات', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/prx-sd/signatures/' },
    { text: 'تحديث التوقيعات', link: '/ar/prx-sd/signatures/update' },
    { text: 'مصادر الاستخبارات', link: '/ar/prx-sd/signatures/sources' },
    { text: 'استيراد الهاشات', link: '/ar/prx-sd/signatures/import' },
    { text: 'قواعد YARA مخصصة', link: '/ar/prx-sd/signatures/custom-rules' },
  ] },
  { text: 'الحجر الصحي', collapsed: true, items: [
    { text: 'ادارة الحجر الصحي', link: '/ar/prx-sd/quarantine/' },
  ] },
  { text: 'الاستجابة للتهديدات', collapsed: true, items: [
    { text: 'الاصلاح التلقائي', link: '/ar/prx-sd/remediation/' },
  ] },
  { text: 'التنبيهات والجدولة', collapsed: true, items: [
    { text: 'تنبيهات Webhook', link: '/ar/prx-sd/alerts/webhook' },
    { text: 'تنبيهات البريد', link: '/ar/prx-sd/alerts/email' },
    { text: 'الفحوصات المجدولة', link: '/ar/prx-sd/alerts/schedule' },
  ] },
  { text: 'حماية الشبكة', collapsed: true, items: [
    { text: 'حظر الاعلانات والبرمجيات الخبيثة', link: '/ar/prx-sd/network/adblock' },
    { text: 'وكيل DNS', link: '/ar/prx-sd/network/dns-proxy' },
  ] },
  { text: 'الاعدادات', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/prx-sd/configuration/' },
    { text: 'المرجع الكامل', link: '/ar/prx-sd/configuration/reference' },
  ] },
  { text: 'مرجع CLI', collapsed: true, items: [
    { text: 'قائمة الاوامر', link: '/ar/prx-sd/cli/' },
  ] },
  { text: 'الاضافات (WASM)', collapsed: true, items: [
    { text: 'تطوير الاضافات', link: '/ar/prx-sd/plugins/' },
  ] },
  { text: 'تطبيق سطح المكتب', collapsed: true, items: [
    { text: 'Tauri GUI', link: '/ar/prx-sd/gui/' },
  ] },
  { text: 'استكشاف الاخطاء', collapsed: true, items: [
    { text: 'الاسئلة الشائعة', link: '/ar/prx-sd/troubleshooting/' },
  ] },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'البدء السريع', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/prx-waf/' },
    { text: 'التثبيت', link: '/ar/prx-waf/getting-started/installation' },
    { text: 'بداية سريعة', link: '/ar/prx-waf/getting-started/quickstart' },
  ] },
  { text: 'محرك القواعد', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/prx-waf/rules/' },
    { text: 'صياغة YAML', link: '/ar/prx-waf/rules/yaml-syntax' },
    { text: 'القواعد المدمجة', link: '/ar/prx-waf/rules/builtin-rules' },
    { text: 'قواعد مخصصة', link: '/ar/prx-waf/rules/custom-rules' },
  ] },
  { text: 'البوابة', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/prx-waf/gateway/' },
    { text: 'الوكيل العكسي', link: '/ar/prx-waf/gateway/reverse-proxy' },
    { text: 'SSL / TLS', link: '/ar/prx-waf/gateway/ssl-tls' },
  ] },
  { text: 'المجموعة', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/prx-waf/cluster/' },
    { text: 'النشر', link: '/ar/prx-waf/cluster/deployment' },
  ] },
  { text: 'CrowdSec', collapsed: true, items: [
    { text: 'التكامل', link: '/ar/prx-waf/crowdsec/' },
  ] },
  { text: 'واجهة الادارة', collapsed: true, items: [
    { text: 'لوحة التحكم', link: '/ar/prx-waf/admin-ui/' },
  ] },
  { text: 'الاعدادات', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/prx-waf/configuration/' },
    { text: 'المرجع الكامل', link: '/ar/prx-waf/configuration/reference' },
  ] },
  { text: 'مرجع CLI', collapsed: true, items: [
    { text: 'قائمة الاوامر', link: '/ar/prx-waf/cli/' },
  ] },
  { text: 'استكشاف الاخطاء', collapsed: true, items: [
    { text: 'الاسئلة الشائعة', link: '/ar/prx-waf/troubleshooting/' },
  ] },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'البدء السريع', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/openpr/' },
    { text: 'التثبيت', link: '/ar/openpr/getting-started/installation' },
    { text: 'بداية سريعة', link: '/ar/openpr/getting-started/quickstart' },
  ] },
  { text: 'مساحة العمل', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/openpr/workspace/' },
    { text: 'المشاريع', link: '/ar/openpr/workspace/projects' },
    { text: 'الاعضاء', link: '/ar/openpr/workspace/members' },
  ] },
  { text: 'عناصر العمل', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/openpr/issues/' },
    { text: 'سير العمل', link: '/ar/openpr/issues/workflow' },
    { text: 'السبرنت', link: '/ar/openpr/issues/sprints' },
    { text: 'التسميات', link: '/ar/openpr/issues/labels' },
  ] },
  { text: 'الحوكمة', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/openpr/governance/' },
    { text: 'المقترحات', link: '/ar/openpr/governance/proposals' },
    { text: 'التصويت', link: '/ar/openpr/governance/voting' },
    { text: 'درجات الثقة', link: '/ar/openpr/governance/trust-scores' },
  ] },
  { text: 'API', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/openpr/api/' },
    { text: 'المصادقة', link: '/ar/openpr/api/authentication' },
    { text: 'نقاط النهاية', link: '/ar/openpr/api/endpoints' },
  ] },
  { text: 'خادم MCP', collapsed: true, items: [
    { text: 'التكامل', link: '/ar/openpr/mcp-server/' },
  ] },
  { text: 'النشر', collapsed: true, items: [
    { text: 'Docker', link: '/ar/openpr/deployment/docker' },
    { text: 'الانتاج', link: '/ar/openpr/deployment/production' },
  ] },
  { text: 'مرجع CLI', collapsed: true, items: [
    { text: 'قائمة الاوامر', link: '/ar/openpr/cli/' },
  ] },
  { text: 'الاعدادات', collapsed: true, items: [
    { text: 'المرجع', link: '/ar/openpr/configuration/' },
  ] },
  { text: 'استكشاف الاخطاء', collapsed: true, items: [
    { text: 'الاسئلة الشائعة', link: '/ar/openpr/troubleshooting/' },
  ] },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'البدء السريع', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/openpr-webhook/' },
    { text: 'التثبيت', link: '/ar/openpr-webhook/getting-started/installation' },
    { text: 'بداية سريعة', link: '/ar/openpr-webhook/getting-started/quickstart' },
  ] },
  { text: 'الوكلاء', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/openpr-webhook/agents/' },
    { text: 'المنفذون', link: '/ar/openpr-webhook/agents/executors' },
  ] },
  { text: 'نفق WSS', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/openpr-webhook/tunnel/' },
  ] },
  { text: 'الاعدادات', collapsed: true, items: [
    { text: 'المرجع', link: '/ar/openpr-webhook/configuration/' },
  ] },
  { text: 'استكشاف الاخطاء', collapsed: true, items: [
    { text: 'الاسئلة الشائعة', link: '/ar/openpr-webhook/troubleshooting/' },
  ] },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  { text: 'البدء السريع', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/prx-memory/' },
    { text: 'التثبيت', link: '/ar/prx-memory/getting-started/installation' },
    { text: 'بداية سريعة', link: '/ar/prx-memory/getting-started/quickstart' },
  ] },
  { text: 'تضمين المتجهات', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/prx-memory/embedding/' },
    { text: 'النماذج', link: '/ar/prx-memory/embedding/models' },
    { text: 'المعالجة الدفعية', link: '/ar/prx-memory/embedding/batch-processing' },
  ] },
  { text: 'اعادة الترتيب', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/prx-memory/reranking/' },
    { text: 'النماذج', link: '/ar/prx-memory/reranking/models' },
  ] },
  { text: 'التخزين', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/prx-memory/storage/' },
    { text: 'SQLite', link: '/ar/prx-memory/storage/sqlite' },
    { text: 'البحث المتجهي', link: '/ar/prx-memory/storage/vector-search' },
  ] },
  { text: 'بروتوكول MCP', collapsed: true, items: [
    { text: 'التكامل', link: '/ar/prx-memory/mcp/' },
  ] },
  { text: 'مرجع API', collapsed: true, items: [
    { text: 'Rust API', link: '/ar/prx-memory/api/' },
  ] },
  { text: 'الاعدادات', collapsed: true, items: [
    { text: 'المرجع', link: '/ar/prx-memory/configuration/' },
  ] },
  { text: 'استكشاف الاخطاء', collapsed: true, items: [
    { text: 'الاسئلة الشائعة', link: '/ar/prx-memory/troubleshooting/' },
  ] },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'البدء السريع', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/prx-email/' },
    { text: 'التثبيت', link: '/ar/prx-email/getting-started/installation' },
    { text: 'بداية سريعة', link: '/ar/prx-email/getting-started/quickstart' },
  ] },
  { text: 'حسابات البريد', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/prx-email/accounts/' },
    { text: 'IMAP', link: '/ar/prx-email/accounts/imap' },
    { text: 'SMTP', link: '/ar/prx-email/accounts/smtp' },
    { text: 'OAuth', link: '/ar/prx-email/accounts/oauth' },
  ] },
  { text: 'التخزين', collapsed: true, items: [
    { text: 'SQLite', link: '/ar/prx-email/storage/' },
  ] },
  { text: 'الاضافات', collapsed: true, items: [
    { text: 'اضافات WASM', link: '/ar/prx-email/plugins/' },
  ] },
  { text: 'الاعدادات', collapsed: true, items: [
    { text: 'المرجع', link: '/ar/prx-email/configuration/' },
  ] },
  { text: 'استكشاف الاخطاء', collapsed: true, items: [
    { text: 'الاسئلة الشائعة', link: '/ar/prx-email/troubleshooting/' },
  ] },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'البدء السريع', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/fenfa/' },
    { text: 'التثبيت', link: '/ar/fenfa/getting-started/installation' },
    { text: 'بداية سريعة', link: '/ar/fenfa/getting-started/quickstart' },
  ] },
  { text: 'ادارة المنتجات', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/fenfa/products/' },
    { text: 'المتغيرات', link: '/ar/fenfa/products/variants' },
    { text: 'الاصدارات', link: '/ar/fenfa/products/releases' },
  ] },
  { text: 'توزيع التطبيقات', collapsed: false, items: [
    { text: 'نظرة عامة', link: '/ar/fenfa/distribution/' },
    { text: 'iOS', link: '/ar/fenfa/distribution/ios' },
    { text: 'Android', link: '/ar/fenfa/distribution/android' },
    { text: 'سطح المكتب', link: '/ar/fenfa/distribution/desktop' },
  ] },
  { text: 'API', collapsed: true, items: [
    { text: 'نظرة عامة', link: '/ar/fenfa/api/' },
    { text: 'API الرفع', link: '/ar/fenfa/api/upload' },
    { text: 'API الادارة', link: '/ar/fenfa/api/admin' },
  ] },
  { text: 'النشر', collapsed: true, items: [
    { text: 'Docker', link: '/ar/fenfa/deployment/docker' },
    { text: 'الانتاج', link: '/ar/fenfa/deployment/production' },
  ] },
  { text: 'الاعدادات', collapsed: true, items: [
    { text: 'المرجع', link: '/ar/fenfa/configuration/' },
  ] },
  { text: 'استكشاف الاخطاء', collapsed: true, items: [
    { text: 'الاسئلة الشائعة', link: '/ar/fenfa/troubleshooting/' },
  ] },
]

const nav: DefaultTheme.NavItem[] = [
  { text: 'PRX', items: [
    { text: 'البدء السريع', link: '/ar/prx/' },
    { text: 'القنوات', link: '/ar/prx/channels/' },
    { text: 'المزودون', link: '/ar/prx/providers/' },
    { text: 'الادوات', link: '/ar/prx/tools/' },
    { text: 'الاعدادات', link: '/ar/prx/config/' },
  ] },
  { text: 'PRX-SD', items: [
    { text: 'البدء السريع', link: '/ar/prx-sd/' },
    { text: 'الفحص', link: '/ar/prx-sd/scanning/file-scan' },
    { text: 'محرك الكشف', link: '/ar/prx-sd/detection/' },
    { text: 'استخبارات التهديدات', link: '/ar/prx-sd/signatures/' },
    { text: 'الاعدادات', link: '/ar/prx-sd/configuration/' },
  ] },
  { text: 'PRX-WAF', items: [
    { text: 'البدء السريع', link: '/ar/prx-waf/' },
    { text: 'محرك القواعد', link: '/ar/prx-waf/rules/' },
    { text: 'البوابة', link: '/ar/prx-waf/gateway/' },
    { text: 'المجموعة', link: '/ar/prx-waf/cluster/' },
    { text: 'الاعدادات', link: '/ar/prx-waf/configuration/' },
  ] },
  { text: 'المزيد', items: [
    { text: 'OpenPR', link: '/ar/openpr/' },
    { text: 'OpenPR-Webhook', link: '/ar/openpr-webhook/' },
    { text: 'PRX-Memory', link: '/ar/prx-memory/' },
    { text: 'PRX-Email', link: '/ar/prx-email/' },
    { text: 'Fenfa', link: '/ar/fenfa/' },
  ] },
]

export const arConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/ar/prx/': prxSidebar,
      '/ar/prx-sd/': prxSdSidebar,
      '/ar/prx-waf/': prxWafSidebar,
      '/ar/openpr/': openprSidebar,
      '/ar/openpr-webhook/': openprWebhookSidebar,
      '/ar/prx-memory/': prxMemorySidebar,
      '/ar/prx-email/': prxEmailSidebar,
      '/ar/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'تحرير هذه الصفحة على GitHub',
    },
    lastUpdated: {
      text: 'اخر تحديث',
    },
    docFooter: {
      prev: 'الصفحة السابقة',
      next: 'الصفحة التالية',
    },
    outline: {
      label: 'في هذه الصفحة',
      level: [2, 3],
    },
  },
}
