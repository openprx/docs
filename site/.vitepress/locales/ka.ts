import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'დაწყება',
    collapsed: false,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/' },
      { text: 'ინსტალაცია', link: '/ka/prx/getting-started/installation' },
      { text: 'სწრაფი დაწყება', link: '/ka/prx/getting-started/quickstart' },
      { text: 'კონფიგურაციის ოსტატი', link: '/ka/prx/getting-started/onboarding' },
    ],
  },
  {
    text: 'არხები',
    collapsed: false,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/channels/' },
      { text: 'Telegram', link: '/ka/prx/channels/telegram' },
      { text: 'Discord', link: '/ka/prx/channels/discord' },
      { text: 'Slack', link: '/ka/prx/channels/slack' },
      { text: 'WhatsApp', link: '/ka/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/ka/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/ka/prx/channels/signal' },
      { text: 'iMessage', link: '/ka/prx/channels/imessage' },
      { text: 'Matrix', link: '/ka/prx/channels/matrix' },
      { text: 'ელ-ფოსტა', link: '/ka/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/ka/prx/channels/lark' },
      { text: 'DingTalk', link: '/ka/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/ka/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/ka/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/ka/prx/channels/irc' },
      { text: 'QQ', link: '/ka/prx/channels/qq' },
      { text: 'LINQ', link: '/ka/prx/channels/linq' },
      { text: 'CLI', link: '/ka/prx/channels/cli' },
    ],
  },
  {
    text: 'LLM პროვაიდერები',
    collapsed: false,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/ka/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/ka/prx/providers/openai' },
      { text: 'Google Gemini', link: '/ka/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/ka/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/ka/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/ka/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/ka/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/ka/prx/providers/glm' },
      { text: 'OpenRouter', link: '/ka/prx/providers/openrouter' },
      { text: 'მორგებული თავსებადი', link: '/ka/prx/providers/custom-compatible' },
    ],
  },
  {
    text: 'ხელსაწყოები',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/tools/' },
      { text: 'Shell შესრულება', link: '/ka/prx/tools/shell' },
      { text: 'ფაილის ოპერაციები', link: '/ka/prx/tools/file-operations' },
      { text: 'მეხსიერების ხელსაწყოები', link: '/ka/prx/tools/memory' },
      { text: 'ბრაუზერი', link: '/ka/prx/tools/browser' },
      { text: 'ვებ ძიება', link: '/ka/prx/tools/web-search' },
      { text: 'HTTP მოთხოვნები', link: '/ka/prx/tools/http-request' },
      { text: 'სესიები და აგენტები', link: '/ka/prx/tools/sessions' },
      { text: 'Cron ხელსაწყოები', link: '/ka/prx/tools/cron-tools' },
      { text: 'Git ოპერაციები', link: '/ka/prx/tools/git' },
      { text: 'შეტყობინებები', link: '/ka/prx/tools/messaging' },
      { text: 'დისტანციური კვანძები', link: '/ka/prx/tools/nodes' },
      { text: 'მედია', link: '/ka/prx/tools/media' },
      { text: 'MCP ინტეგრაცია', link: '/ka/prx/tools/mcp' },
      { text: 'SkillForge', link: '/ka/prx/tools/skillforge' },
      { text: 'Hooks', link: '/ka/prx/tools/hooks' },
    ],
  },
  {
    text: 'აგენტის გარემო',
    collapsed: true,
    items: [
      { text: 'არქიტექტურა', link: '/ka/prx/agent/runtime' },
      { text: 'აგენტის ციკლი', link: '/ka/prx/agent/loop' },
      { text: 'ქვე-აგენტები', link: '/ka/prx/agent/subagents' },
      { text: 'სესიის მუშაკი', link: '/ka/prx/agent/session-worker' },
      { text: 'გარემოს ბექენდები', link: '/ka/prx/agent/runtime-backends' },
      { text: 'მულტიმოდალური', link: '/ka/prx/agent/multimodal' },
    ],
  },
  {
    text: 'მეხსიერების სისტემა',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/memory/' },
      { text: 'Markdown ბექენდი', link: '/ka/prx/memory/markdown' },
      { text: 'SQLite ბექენდი', link: '/ka/prx/memory/sqlite' },
      { text: 'PostgreSQL ბექენდი', link: '/ka/prx/memory/postgres' },
      { text: 'ვექტორული ჩანერგვა', link: '/ka/prx/memory/embeddings' },
      { text: 'მეხსიერების წმენდა', link: '/ka/prx/memory/hygiene' },
      { text: 'RAG', link: '/ka/prx/memory/rag' },
      { text: 'Lucid.so', link: '/ka/prx/memory/lucid' },
      { text: 'ვექტორული ძიება', link: '/ka/prx/memory/vector-search' },
    ],
  },
  {
    text: 'თვით-ევოლუცია',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/self-evolution/' },
      { text: 'L1: მეხსიერების ევოლუცია', link: '/ka/prx/self-evolution/l1-memory' },
      { text: 'L2: პრომპტის ევოლუცია', link: '/ka/prx/self-evolution/l2-prompt' },
      { text: 'L3: სტრატეგიის ევოლუცია', link: '/ka/prx/self-evolution/l3-strategy' },
      { text: 'კონვეიერი', link: '/ka/prx/self-evolution/pipeline' },
      { text: 'უსაფრთხოება', link: '/ka/prx/self-evolution/safety' },
      { text: 'გადაწყვეტილების ჟურნალი', link: '/ka/prx/self-evolution/decision-log' },
      { text: 'ექსპერიმენტები', link: '/ka/prx/self-evolution/experiments' },
    ],
  },
  {
    text: 'კონფიგურაცია',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/config/' },
      { text: 'სრული ცნობარი', link: '/ka/prx/config/reference' },
      { text: 'ცხელი გადატვირთვა', link: '/ka/prx/config/hot-reload' },
      { text: 'გარემოს ცვლადები', link: '/ka/prx/config/environment' },
    ],
  },
  {
    text: 'დანამატები (WASM)',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/plugins/' },
      { text: 'არქიტექტურა', link: '/ka/prx/plugins/architecture' },
      { text: 'დეველოპერის სახელმძღვანელო', link: '/ka/prx/plugins/developer-guide' },
      { text: 'ჰოსტ ფუნქციები', link: '/ka/prx/plugins/host-functions' },
      { text: 'PDK', link: '/ka/prx/plugins/pdk' },
      { text: 'მაგალითები', link: '/ka/prx/plugins/examples' },
      { text: 'მოვლენების ავტობუსი', link: '/ka/prx/plugins/event-bus' },
    ],
  },
  {
    text: 'კარიბჭე',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/gateway/' },
      { text: 'HTTP API', link: '/ka/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/ka/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/ka/prx/gateway/webhooks' },
      { text: 'შუამავალი', link: '/ka/prx/gateway/middleware' },
      { text: 'API ცნობარი', link: '/ka/prx/gateway/api-reference' },
    ],
  },
  {
    text: 'უსაფრთხოება',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/security/' },
      { text: 'პოლიტიკის ძრავი', link: '/ka/prx/security/policy-engine' },
      { text: 'დაწყვილება', link: '/ka/prx/security/pairing' },
      { text: 'სანდბოქსი', link: '/ka/prx/security/sandbox' },
      { text: 'საიდუმლოების საცავი', link: '/ka/prx/security/secrets' },
      { text: 'საფრთხის მოდელი', link: '/ka/prx/security/threat-model' },
      { text: 'დამტკიცების სამუშაო პროცესი', link: '/ka/prx/security/approval' },
      { text: 'აუდიტის ჟურნალი', link: '/ka/prx/security/audit' },
    ],
  },
  {
    text: 'LLM მარშრუტიზატორი',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/router/' },
      { text: 'ევრისტიკული მარშრუტიზაცია', link: '/ka/prx/router/heuristic' },
      { text: 'KNN მარშრუტიზაცია', link: '/ka/prx/router/knn' },
      { text: 'Automix', link: '/ka/prx/router/automix' },
    ],
  },
  {
    text: 'მიზეზობრივი ხის ძრავა',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/causal-tree/' },
      { text: 'კონფიგურაცია', link: '/ka/prx/causal-tree/configuration' },
    ],
  },
  {
    text: 'დაგეგმვა (Xin)',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/cron/' },
      { text: 'გულისცემა', link: '/ka/prx/cron/heartbeat' },
      { text: 'Cron ამოცანები', link: '/ka/prx/cron/tasks' },
    ],
  },
  {
    text: 'დისტანციური კვანძები',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/nodes/' },
      { text: 'დაწყვილების პროტოკოლი', link: '/ka/prx/nodes/pairing' },
      { text: 'JSON-RPC პროტოკოლი', link: '/ka/prx/nodes/protocol' },
    ],
  },
  {
    text: 'ავთენტიფიკაცია',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/auth/' },
      { text: 'OAuth2 ნაკადი', link: '/ka/prx/auth/oauth2' },
      { text: 'ავთენტიფიკაციის პროფილები', link: '/ka/prx/auth/profiles' },
      { text: 'იდენტობის მართვა', link: '/ka/prx/auth/identity' },
    ],
  },
  {
    text: 'CLI ცნობარი',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/cli/' },
      { text: 'prx agent', link: '/ka/prx/cli/agent' },
      { text: 'prx chat', link: '/ka/prx/cli/chat' },
      { text: 'prx daemon', link: '/ka/prx/cli/daemon' },
      { text: 'prx gateway', link: '/ka/prx/cli/gateway' },
      { text: 'prx onboard', link: '/ka/prx/cli/onboard' },
      { text: 'prx channel', link: '/ka/prx/cli/channel' },
      { text: 'prx cron', link: '/ka/prx/cli/cron' },
      { text: 'prx evolution', link: '/ka/prx/cli/evolution' },
      { text: 'prx auth', link: '/ka/prx/cli/auth' },
      { text: 'prx config', link: '/ka/prx/cli/config' },
      { text: 'prx doctor', link: '/ka/prx/cli/doctor' },
      { text: 'prx service', link: '/ka/prx/cli/service' },
      { text: 'prx skills', link: '/ka/prx/cli/skills' },
    ],
  },
  {
    text: 'დაკვირვებადობა',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/observability/' },
      { text: 'Prometheus', link: '/ka/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/ka/prx/observability/opentelemetry' },
      { text: 'ხარჯების თვალყურის დევნება', link: '/ka/prx/observability/cost-tracking' },
    ],
  },
  {
    text: 'გვირაბი',
    collapsed: true,
    items: [
      { text: 'მიმოხილვა', link: '/ka/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/ka/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/ka/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/ka/prx/tunnel/ngrok' },
    ],
  },
  {
    text: 'პრობლემების მოგვარება',
    collapsed: true,
    items: [
      { text: 'ხშირი შეცდომები', link: '/ka/prx/troubleshooting/' },
      { text: 'დიაგნოსტიკა', link: '/ka/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'დაწყება', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-sd/' },
    { text: 'ინსტალაცია', link: '/ka/prx-sd/getting-started/installation' },
    { text: 'სწრაფი დაწყება', link: '/ka/prx-sd/getting-started/quickstart' },
  ] },
  { text: 'სკანირება', collapsed: false, items: [
    { text: 'ფაილების და დირექტორიების სკანირება', link: '/ka/prx-sd/scanning/file-scan' },
    { text: 'მეხსიერების სკანირება', link: '/ka/prx-sd/scanning/memory-scan' },
    { text: 'Rootkit აღმოჩენა', link: '/ka/prx-sd/scanning/rootkit' },
    { text: 'USB მოწყობილობების სკანირება', link: '/ka/prx-sd/scanning/usb-scan' },
  ] },
  { text: 'აღმოჩენის ძრავი', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-sd/detection/' },
    { text: 'ჰეშის შედარება', link: '/ka/prx-sd/detection/hash-matching' },
    { text: 'YARA წესები', link: '/ka/prx-sd/detection/yara-rules' },
    { text: 'ევრისტიკული ანალიზი', link: '/ka/prx-sd/detection/heuristics' },
    { text: 'მხარდაჭერილი ფაილის ტიპები', link: '/ka/prx-sd/detection/file-types' },
  ] },
  { text: 'რეალურ დროში დაცვა', collapsed: true, items: [
    { text: 'ფაილების მონიტორინგი', link: '/ka/prx-sd/realtime/monitor' },
    { text: 'დემონი', link: '/ka/prx-sd/realtime/daemon' },
    { text: 'გამოსასყიდის პროგრამებისგან დაცვა', link: '/ka/prx-sd/realtime/ransomware' },
  ] },
  { text: 'საფრთხის დაზვერვა', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-sd/signatures/' },
    { text: 'ხელმოწერების განახლება', link: '/ka/prx-sd/signatures/update' },
    { text: 'დაზვერვის წყაროები', link: '/ka/prx-sd/signatures/sources' },
    { text: 'ჰეშების იმპორტი', link: '/ka/prx-sd/signatures/import' },
    { text: 'მორგებული YARA წესები', link: '/ka/prx-sd/signatures/custom-rules' },
  ] },
  { text: 'კარანტინი', collapsed: true, items: [
    { text: 'კარანტინის მართვა', link: '/ka/prx-sd/quarantine/' },
  ] },
  { text: 'საფრთხეზე რეაგირება', collapsed: true, items: [
    { text: 'ავტომატური გამოსწორება', link: '/ka/prx-sd/remediation/' },
  ] },
  { text: 'შეტყობინებები და დაგეგმვა', collapsed: true, items: [
    { text: 'Webhook შეტყობინებები', link: '/ka/prx-sd/alerts/webhook' },
    { text: 'ელ-ფოსტის შეტყობინებები', link: '/ka/prx-sd/alerts/email' },
    { text: 'დაგეგმილი სკანირება', link: '/ka/prx-sd/alerts/schedule' },
  ] },
  { text: 'ქსელის დაცვა', collapsed: true, items: [
    { text: 'რეკლამისა და მავნე დომენების ბლოკირება', link: '/ka/prx-sd/network/adblock' },
    { text: 'DNS პროქსი', link: '/ka/prx-sd/network/dns-proxy' },
  ] },
  { text: 'კონფიგურაცია', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-sd/configuration/' },
    { text: 'სრული ცნობარი', link: '/ka/prx-sd/configuration/reference' },
  ] },
  { text: 'CLI ცნობარი', collapsed: true, items: [
    { text: 'ბრძანებების სია', link: '/ka/prx-sd/cli/' },
  ] },
  { text: 'დანამატები (WASM)', collapsed: true, items: [
    { text: 'დანამატის შემუშავება', link: '/ka/prx-sd/plugins/' },
  ] },
  { text: 'დესკტოპ აპლიკაცია', collapsed: true, items: [
    { text: 'Tauri GUI', link: '/ka/prx-sd/gui/' },
  ] },
  { text: 'პრობლემების მოგვარება', collapsed: true, items: [
    { text: 'ხშირი კითხვები', link: '/ka/prx-sd/troubleshooting/' },
  ] },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'დაწყება', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-waf/' },
    { text: 'ინსტალაცია', link: '/ka/prx-waf/getting-started/installation' },
    { text: 'სწრაფი დაწყება', link: '/ka/prx-waf/getting-started/quickstart' },
  ] },
  { text: 'წესების ძრავი', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-waf/rules/' },
    { text: 'YAML სინტაქსი', link: '/ka/prx-waf/rules/yaml-syntax' },
    { text: 'ჩაშენებული წესები', link: '/ka/prx-waf/rules/builtin-rules' },
    { text: 'მორგებული წესები', link: '/ka/prx-waf/rules/custom-rules' },
  ] },
  { text: 'კარიბჭე', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-waf/gateway/' },
    { text: 'უკუ პროქსი', link: '/ka/prx-waf/gateway/reverse-proxy' },
    { text: 'SSL / TLS', link: '/ka/prx-waf/gateway/ssl-tls' },
  ] },
  { text: 'კლასტერი', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-waf/cluster/' },
    { text: 'განლაგება', link: '/ka/prx-waf/cluster/deployment' },
  ] },
  { text: 'CrowdSec', collapsed: true, items: [
    { text: 'ინტეგრაცია', link: '/ka/prx-waf/crowdsec/' },
  ] },
  { text: 'ადმინისტრაციის UI', collapsed: true, items: [
    { text: 'სამართავი პანელი', link: '/ka/prx-waf/admin-ui/' },
  ] },
  { text: 'კონფიგურაცია', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-waf/configuration/' },
    { text: 'სრული ცნობარი', link: '/ka/prx-waf/configuration/reference' },
  ] },
  { text: 'CLI ცნობარი', collapsed: true, items: [
    { text: 'ბრძანებების სია', link: '/ka/prx-waf/cli/' },
  ] },
  { text: 'პრობლემების მოგვარება', collapsed: true, items: [
    { text: 'ხშირი კითხვები', link: '/ka/prx-waf/troubleshooting/' },
  ] },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'დაწყება', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/openpr/' },
    { text: 'ინსტალაცია', link: '/ka/openpr/getting-started/installation' },
    { text: 'სწრაფი დაწყება', link: '/ka/openpr/getting-started/quickstart' },
  ] },
  { text: 'სამუშაო სივრცე', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/openpr/workspace/' },
    { text: 'პროექტები', link: '/ka/openpr/workspace/projects' },
    { text: 'წევრები', link: '/ka/openpr/workspace/members' },
  ] },
  { text: 'სამუშაო ელემენტები', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/openpr/issues/' },
    { text: 'სამუშაო პროცესი', link: '/ka/openpr/issues/workflow' },
    { text: 'სპრინტები', link: '/ka/openpr/issues/sprints' },
    { text: 'ლეიბლები', link: '/ka/openpr/issues/labels' },
  ] },
  { text: 'მმართველობა', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/openpr/governance/' },
    { text: 'წინადადებები', link: '/ka/openpr/governance/proposals' },
    { text: 'ხმის მიცემა', link: '/ka/openpr/governance/voting' },
    { text: 'ნდობის ქულები', link: '/ka/openpr/governance/trust-scores' },
  ] },
  { text: 'API', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/openpr/api/' },
    { text: 'ავთენტიფიკაცია', link: '/ka/openpr/api/authentication' },
    { text: 'ბოლო წერტილები', link: '/ka/openpr/api/endpoints' },
  ] },
  { text: 'MCP სერვერი', collapsed: true, items: [
    { text: 'ინტეგრაცია', link: '/ka/openpr/mcp-server/' },
  ] },
  { text: 'განლაგება', collapsed: true, items: [
    { text: 'Docker', link: '/ka/openpr/deployment/docker' },
    { text: 'პროდაქშენი', link: '/ka/openpr/deployment/production' },
  ] },
  { text: 'CLI ცნობარი', collapsed: true, items: [
    { text: 'ბრძანებების სია', link: '/ka/openpr/cli/' },
  ] },
  { text: 'კონფიგურაცია', collapsed: true, items: [
    { text: 'ცნობარი', link: '/ka/openpr/configuration/' },
  ] },
  { text: 'პრობლემების მოგვარება', collapsed: true, items: [
    { text: 'ხშირი კითხვები', link: '/ka/openpr/troubleshooting/' },
  ] },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'დაწყება', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/openpr-webhook/' },
    { text: 'ინსტალაცია', link: '/ka/openpr-webhook/getting-started/installation' },
    { text: 'სწრაფი დაწყება', link: '/ka/openpr-webhook/getting-started/quickstart' },
  ] },
  { text: 'აგენტები', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/openpr-webhook/agents/' },
    { text: 'შემსრულებლები', link: '/ka/openpr-webhook/agents/executors' },
  ] },
  { text: 'WSS გვირაბი', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/openpr-webhook/tunnel/' },
  ] },
  { text: 'კონფიგურაცია', collapsed: true, items: [
    { text: 'ცნობარი', link: '/ka/openpr-webhook/configuration/' },
  ] },
  { text: 'პრობლემების მოგვარება', collapsed: true, items: [
    { text: 'ხშირი კითხვები', link: '/ka/openpr-webhook/troubleshooting/' },
  ] },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  { text: 'დაწყება', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-memory/' },
    { text: 'ინსტალაცია', link: '/ka/prx-memory/getting-started/installation' },
    { text: 'სწრაფი დაწყება', link: '/ka/prx-memory/getting-started/quickstart' },
  ] },
  { text: 'ვექტორული ჩანერგვა', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-memory/embedding/' },
    { text: 'მოდელები', link: '/ka/prx-memory/embedding/models' },
    { text: 'პაკეტური დამუშავება', link: '/ka/prx-memory/embedding/batch-processing' },
  ] },
  { text: 'ხელახალი რანჟირება', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-memory/reranking/' },
    { text: 'მოდელები', link: '/ka/prx-memory/reranking/models' },
  ] },
  { text: 'საცავი', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-memory/storage/' },
    { text: 'SQLite', link: '/ka/prx-memory/storage/sqlite' },
    { text: 'ვექტორული ძიება', link: '/ka/prx-memory/storage/vector-search' },
  ] },
  { text: 'MCP პროტოკოლი', collapsed: true, items: [
    { text: 'ინტეგრაცია', link: '/ka/prx-memory/mcp/' },
  ] },
  { text: 'API ცნობარი', collapsed: true, items: [
    { text: 'Rust API', link: '/ka/prx-memory/api/' },
  ] },
  { text: 'კონფიგურაცია', collapsed: true, items: [
    { text: 'ცნობარი', link: '/ka/prx-memory/configuration/' },
  ] },
  { text: 'პრობლემების მოგვარება', collapsed: true, items: [
    { text: 'ხშირი კითხვები', link: '/ka/prx-memory/troubleshooting/' },
  ] },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'დაწყება', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-email/' },
    { text: 'ინსტალაცია', link: '/ka/prx-email/getting-started/installation' },
    { text: 'სწრაფი დაწყება', link: '/ka/prx-email/getting-started/quickstart' },
  ] },
  { text: 'ელ-ფოსტის ანგარიშები', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/prx-email/accounts/' },
    { text: 'IMAP', link: '/ka/prx-email/accounts/imap' },
    { text: 'SMTP', link: '/ka/prx-email/accounts/smtp' },
    { text: 'OAuth', link: '/ka/prx-email/accounts/oauth' },
  ] },
  { text: 'საცავი', collapsed: true, items: [
    { text: 'SQLite', link: '/ka/prx-email/storage/' },
  ] },
  { text: 'დანამატები', collapsed: true, items: [
    { text: 'WASM დანამატები', link: '/ka/prx-email/plugins/' },
  ] },
  { text: 'კონფიგურაცია', collapsed: true, items: [
    { text: 'ცნობარი', link: '/ka/prx-email/configuration/' },
  ] },
  { text: 'პრობლემების მოგვარება', collapsed: true, items: [
    { text: 'ხშირი კითხვები', link: '/ka/prx-email/troubleshooting/' },
  ] },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'დაწყება', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/fenfa/' },
    { text: 'ინსტალაცია', link: '/ka/fenfa/getting-started/installation' },
    { text: 'სწრაფი დაწყება', link: '/ka/fenfa/getting-started/quickstart' },
  ] },
  { text: 'პროდუქტის მართვა', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/fenfa/products/' },
    { text: 'ვარიანტები', link: '/ka/fenfa/products/variants' },
    { text: 'გამოშვებები', link: '/ka/fenfa/products/releases' },
  ] },
  { text: 'აპლიკაციის გავრცელება', collapsed: false, items: [
    { text: 'მიმოხილვა', link: '/ka/fenfa/distribution/' },
    { text: 'iOS', link: '/ka/fenfa/distribution/ios' },
    { text: 'Android', link: '/ka/fenfa/distribution/android' },
    { text: 'დესკტოპი', link: '/ka/fenfa/distribution/desktop' },
  ] },
  { text: 'API', collapsed: true, items: [
    { text: 'მიმოხილვა', link: '/ka/fenfa/api/' },
    { text: 'ატვირთვის API', link: '/ka/fenfa/api/upload' },
    { text: 'ადმინისტრირების API', link: '/ka/fenfa/api/admin' },
  ] },
  { text: 'განლაგება', collapsed: true, items: [
    { text: 'Docker', link: '/ka/fenfa/deployment/docker' },
    { text: 'პროდაქშენი', link: '/ka/fenfa/deployment/production' },
  ] },
  { text: 'კონფიგურაცია', collapsed: true, items: [
    { text: 'ცნობარი', link: '/ka/fenfa/configuration/' },
  ] },
  { text: 'პრობლემების მოგვარება', collapsed: true, items: [
    { text: 'ხშირი კითხვები', link: '/ka/fenfa/troubleshooting/' },
  ] },
]

const nav: DefaultTheme.NavItem[] = [
  { text: 'PRX', items: [
    { text: 'დაწყება', link: '/ka/prx/' },
    { text: 'არხები', link: '/ka/prx/channels/' },
    { text: 'პროვაიდერები', link: '/ka/prx/providers/' },
    { text: 'ხელსაწყოები', link: '/ka/prx/tools/' },
    { text: 'კონფიგურაცია', link: '/ka/prx/config/' },
  ] },
  { text: 'PRX-SD', items: [
    { text: 'დაწყება', link: '/ka/prx-sd/' },
    { text: 'სკანირება', link: '/ka/prx-sd/scanning/file-scan' },
    { text: 'აღმოჩენის ძრავი', link: '/ka/prx-sd/detection/' },
    { text: 'საფრთხის დაზვერვა', link: '/ka/prx-sd/signatures/' },
    { text: 'კონფიგურაცია', link: '/ka/prx-sd/configuration/' },
  ] },
  { text: 'PRX-WAF', items: [
    { text: 'დაწყება', link: '/ka/prx-waf/' },
    { text: 'წესების ძრავი', link: '/ka/prx-waf/rules/' },
    { text: 'კარიბჭე', link: '/ka/prx-waf/gateway/' },
    { text: 'კლასტერი', link: '/ka/prx-waf/cluster/' },
    { text: 'კონფიგურაცია', link: '/ka/prx-waf/configuration/' },
  ] },
  { text: 'სხვა', items: [
    { text: 'OpenPR', link: '/ka/openpr/' },
    { text: 'OpenPR-Webhook', link: '/ka/openpr-webhook/' },
    { text: 'PRX-Memory', link: '/ka/prx-memory/' },
    { text: 'PRX-Email', link: '/ka/prx-email/' },
    { text: 'Fenfa', link: '/ka/fenfa/' },
  ] },
]

export const kaConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/ka/prx/': prxSidebar,
      '/ka/prx-sd/': prxSdSidebar,
      '/ka/prx-waf/': prxWafSidebar,
      '/ka/openpr/': openprSidebar,
      '/ka/openpr-webhook/': openprWebhookSidebar,
      '/ka/prx-memory/': prxMemorySidebar,
      '/ka/prx-email/': prxEmailSidebar,
      '/ka/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'GitHub-ზე ამ გვერდის რედაქტირება',
    },
    lastUpdated: {
      text: 'ბოლო განახლება',
    },
    docFooter: {
      prev: 'წინა გვერდი',
      next: 'შემდეგი გვერდი',
    },
    outline: {
      label: 'ამ გვერდზე',
      level: [2, 3],
    },
  },
}
