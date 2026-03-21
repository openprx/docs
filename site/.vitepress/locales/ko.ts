import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

const prxSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '시작하기',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx/' },
      { text: '설치', link: '/ko/prx/getting-started/installation' },
      { text: '빠른 시작', link: '/ko/prx/getting-started/quickstart' },
      { text: '온보딩 마법사', link: '/ko/prx/getting-started/onboarding' },
    ],
  },
  {
    text: '채널',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx/channels/' },
      { text: 'Telegram', link: '/ko/prx/channels/telegram' },
      { text: 'Discord', link: '/ko/prx/channels/discord' },
      { text: 'Slack', link: '/ko/prx/channels/slack' },
      { text: 'WhatsApp', link: '/ko/prx/channels/whatsapp' },
      { text: 'WhatsApp Web', link: '/ko/prx/channels/whatsapp-web' },
      { text: 'Signal', link: '/ko/prx/channels/signal' },
      { text: 'iMessage', link: '/ko/prx/channels/imessage' },
      { text: 'Matrix', link: '/ko/prx/channels/matrix' },
      { text: '이메일', link: '/ko/prx/channels/email' },
      { text: 'Lark / Feishu', link: '/ko/prx/channels/lark' },
      { text: 'DingTalk', link: '/ko/prx/channels/dingtalk' },
      { text: 'Mattermost', link: '/ko/prx/channels/mattermost' },
      { text: 'Nextcloud Talk', link: '/ko/prx/channels/nextcloud-talk' },
      { text: 'IRC', link: '/ko/prx/channels/irc' },
      { text: 'QQ', link: '/ko/prx/channels/qq' },
      { text: 'LINQ', link: '/ko/prx/channels/linq' },
      { text: 'CLI', link: '/ko/prx/channels/cli' },
    ],
  },
  {
    text: 'LLM 제공자',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx/providers/' },
      { text: 'Anthropic (Claude)', link: '/ko/prx/providers/anthropic' },
      { text: 'OpenAI', link: '/ko/prx/providers/openai' },
      { text: 'Google Gemini', link: '/ko/prx/providers/google-gemini' },
      { text: 'OpenAI Codex', link: '/ko/prx/providers/openai-codex' },
      { text: 'GitHub Copilot', link: '/ko/prx/providers/github-copilot' },
      { text: 'Ollama', link: '/ko/prx/providers/ollama' },
      { text: 'AWS Bedrock', link: '/ko/prx/providers/aws-bedrock' },
      { text: 'GLM (Zhipu)', link: '/ko/prx/providers/glm' },
      { text: 'OpenRouter', link: '/ko/prx/providers/openrouter' },
      { text: '사용자 정의 호환', link: '/ko/prx/providers/custom-compatible' },
    ],
  },
  {
    text: '도구',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/tools/' },
      { text: '셸 실행', link: '/ko/prx/tools/shell' },
      { text: '파일 작업', link: '/ko/prx/tools/file-operations' },
      { text: '메모리 도구', link: '/ko/prx/tools/memory' },
      { text: '브라우저', link: '/ko/prx/tools/browser' },
      { text: '웹 검색', link: '/ko/prx/tools/web-search' },
      { text: 'HTTP 요청', link: '/ko/prx/tools/http-request' },
      { text: '세션 및 에이전트', link: '/ko/prx/tools/sessions' },
      { text: 'Cron 도구', link: '/ko/prx/tools/cron-tools' },
      { text: 'Git 작업', link: '/ko/prx/tools/git' },
      { text: '메시징', link: '/ko/prx/tools/messaging' },
      { text: '원격 노드', link: '/ko/prx/tools/nodes' },
      { text: '미디어', link: '/ko/prx/tools/media' },
      { text: 'MCP 통합', link: '/ko/prx/tools/mcp' },
      { text: 'SkillForge', link: '/ko/prx/tools/skillforge' },
      { text: 'Hooks', link: '/ko/prx/tools/hooks' },
    ],
  },
  {
    text: '에이전트 런타임',
    collapsed: true,
    items: [
      { text: '아키텍처', link: '/ko/prx/agent/runtime' },
      { text: '에이전트 루프', link: '/ko/prx/agent/loop' },
      { text: '서브 에이전트', link: '/ko/prx/agent/subagents' },
      { text: '세션 워커', link: '/ko/prx/agent/session-worker' },
      { text: '런타임 백엔드', link: '/ko/prx/agent/runtime-backends' },
      { text: '멀티모달', link: '/ko/prx/agent/multimodal' },
    ],
  },
  {
    text: '메모리 시스템',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/memory/' },
      { text: 'Markdown 백엔드', link: '/ko/prx/memory/markdown' },
      { text: 'SQLite 백엔드', link: '/ko/prx/memory/sqlite' },
      { text: 'PostgreSQL 백엔드', link: '/ko/prx/memory/postgres' },
      { text: '벡터 임베딩', link: '/ko/prx/memory/embeddings' },
      { text: '메모리 정리', link: '/ko/prx/memory/hygiene' },
      { text: 'RAG', link: '/ko/prx/memory/rag' },
      { text: 'Lucid.so', link: '/ko/prx/memory/lucid' },
      { text: '벡터 검색', link: '/ko/prx/memory/vector-search' },
    ],
  },
  {
    text: '자가 진화',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/self-evolution/' },
      { text: 'L1: 메모리 진화', link: '/ko/prx/self-evolution/l1-memory' },
      { text: 'L2: 프롬프트 진화', link: '/ko/prx/self-evolution/l2-prompt' },
      { text: 'L3: 전략 진화', link: '/ko/prx/self-evolution/l3-strategy' },
      { text: '파이프라인', link: '/ko/prx/self-evolution/pipeline' },
      { text: '안전 메커니즘', link: '/ko/prx/self-evolution/safety' },
      { text: '결정 로그', link: '/ko/prx/self-evolution/decision-log' },
      { text: '실험 시스템', link: '/ko/prx/self-evolution/experiments' },
    ],
  },
  {
    text: '구성',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/config/' },
      { text: '전체 레퍼런스', link: '/ko/prx/config/reference' },
      { text: '핫 리로드', link: '/ko/prx/config/hot-reload' },
      { text: '환경 변수', link: '/ko/prx/config/environment' },
    ],
  },
  {
    text: '플러그인 (WASM)',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/plugins/' },
      { text: '아키텍처', link: '/ko/prx/plugins/architecture' },
      { text: '개발 가이드', link: '/ko/prx/plugins/developer-guide' },
      { text: '호스트 함수', link: '/ko/prx/plugins/host-functions' },
      { text: 'PDK', link: '/ko/prx/plugins/pdk' },
      { text: '예제', link: '/ko/prx/plugins/examples' },
      { text: '이벤트 버스', link: '/ko/prx/plugins/event-bus' },
    ],
  },
  {
    text: '게이트웨이',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/gateway/' },
      { text: 'HTTP API', link: '/ko/prx/gateway/http-api' },
      { text: 'WebSocket', link: '/ko/prx/gateway/websocket' },
      { text: 'Webhooks', link: '/ko/prx/gateway/webhooks' },
      { text: '미들웨어', link: '/ko/prx/gateway/middleware' },
      { text: 'API 레퍼런스', link: '/ko/prx/gateway/api-reference' },
    ],
  },
  {
    text: '보안',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/security/' },
      { text: '정책 엔진', link: '/ko/prx/security/policy-engine' },
      { text: '페어링 인증', link: '/ko/prx/security/pairing' },
      { text: '샌드박스', link: '/ko/prx/security/sandbox' },
      { text: '비밀 저장소', link: '/ko/prx/security/secrets' },
      { text: '위협 모델', link: '/ko/prx/security/threat-model' },
      { text: '승인 워크플로', link: '/ko/prx/security/approval' },
      { text: '감사 로그', link: '/ko/prx/security/audit' },
    ],
  },
  {
    text: 'LLM 라우터',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/router/' },
      { text: '휴리스틱 라우팅', link: '/ko/prx/router/heuristic' },
      { text: 'KNN 라우팅', link: '/ko/prx/router/knn' },
      { text: 'Automix', link: '/ko/prx/router/automix' },
    ],
  },
  {
    text: '스케줄링 (Xin)',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/cron/' },
      { text: '하트비트', link: '/ko/prx/cron/heartbeat' },
      { text: 'Cron 작업', link: '/ko/prx/cron/tasks' },
    ],
  },
  {
    text: '원격 노드',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/nodes/' },
      { text: '페어링 프로토콜', link: '/ko/prx/nodes/pairing' },
      { text: 'JSON-RPC 프로토콜', link: '/ko/prx/nodes/protocol' },
    ],
  },
  {
    text: '인증',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/auth/' },
      { text: 'OAuth2 플로', link: '/ko/prx/auth/oauth2' },
      { text: '인증 프로필', link: '/ko/prx/auth/profiles' },
      { text: 'ID 관리', link: '/ko/prx/auth/identity' },
    ],
  },
  {
    text: 'CLI 레퍼런스',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/cli/' },
      { text: 'prx agent', link: '/ko/prx/cli/agent' },
      { text: 'prx chat', link: '/ko/prx/cli/chat' },
      { text: 'prx daemon', link: '/ko/prx/cli/daemon' },
      { text: 'prx gateway', link: '/ko/prx/cli/gateway' },
      { text: 'prx onboard', link: '/ko/prx/cli/onboard' },
      { text: 'prx channel', link: '/ko/prx/cli/channel' },
      { text: 'prx cron', link: '/ko/prx/cli/cron' },
      { text: 'prx evolution', link: '/ko/prx/cli/evolution' },
      { text: 'prx auth', link: '/ko/prx/cli/auth' },
      { text: 'prx config', link: '/ko/prx/cli/config' },
      { text: 'prx doctor', link: '/ko/prx/cli/doctor' },
      { text: 'prx service', link: '/ko/prx/cli/service' },
      { text: 'prx skills', link: '/ko/prx/cli/skills' },
    ],
  },
  {
    text: '관측성',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/observability/' },
      { text: 'Prometheus', link: '/ko/prx/observability/prometheus' },
      { text: 'OpenTelemetry', link: '/ko/prx/observability/opentelemetry' },
      { text: '비용 추적', link: '/ko/prx/observability/cost-tracking' },
    ],
  },
  {
    text: '터널',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx/tunnel/' },
      { text: 'Cloudflare Tunnel', link: '/ko/prx/tunnel/cloudflare' },
      { text: 'Tailscale Funnel', link: '/ko/prx/tunnel/tailscale' },
      { text: 'ngrok', link: '/ko/prx/tunnel/ngrok' },
    ],
  },
  {
    text: '문제 해결',
    collapsed: true,
    items: [
      { text: '자주 발생하는 오류', link: '/ko/prx/troubleshooting/' },
      { text: '진단 도구', link: '/ko/prx/troubleshooting/diagnostics' },
    ],
  },
]

const prxSdSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '시작하기',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx-sd/' },
      { text: '설치', link: '/ko/prx-sd/getting-started/installation' },
      { text: '빠른 시작', link: '/ko/prx-sd/getting-started/quickstart' },
    ],
  },
  {
    text: '스캔',
    collapsed: false,
    items: [
      { text: '파일 및 디렉토리 스캔', link: '/ko/prx-sd/scanning/file-scan' },
      { text: '메모리 스캔', link: '/ko/prx-sd/scanning/memory-scan' },
      { text: 'Rootkit 탐지', link: '/ko/prx-sd/scanning/rootkit' },
      { text: 'USB 장치 스캔', link: '/ko/prx-sd/scanning/usb-scan' },
    ],
  },
  {
    text: '탐지 엔진',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx-sd/detection/' },
      { text: '해시 매칭', link: '/ko/prx-sd/detection/hash-matching' },
      { text: 'YARA 규칙', link: '/ko/prx-sd/detection/yara-rules' },
      { text: '휴리스틱 분석', link: '/ko/prx-sd/detection/heuristics' },
      { text: '지원 파일 형식', link: '/ko/prx-sd/detection/file-types' },
    ],
  },
  {
    text: '실시간 보호',
    collapsed: true,
    items: [
      { text: '파일 모니터링', link: '/ko/prx-sd/realtime/monitor' },
      { text: '데몬', link: '/ko/prx-sd/realtime/daemon' },
      { text: '랜섬웨어 보호', link: '/ko/prx-sd/realtime/ransomware' },
    ],
  },
  {
    text: '위협 인텔리전스',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx-sd/signatures/' },
      { text: '시그니처 업데이트', link: '/ko/prx-sd/signatures/update' },
      { text: '인텔리전스 소스', link: '/ko/prx-sd/signatures/sources' },
      { text: '해시 가져오기', link: '/ko/prx-sd/signatures/import' },
      { text: '사용자 정의 YARA 규칙', link: '/ko/prx-sd/signatures/custom-rules' },
    ],
  },
  {
    text: '격리',
    collapsed: true,
    items: [
      { text: '격리 관리', link: '/ko/prx-sd/quarantine/' },
    ],
  },
  {
    text: '위협 대응',
    collapsed: true,
    items: [
      { text: '자동 복구', link: '/ko/prx-sd/remediation/' },
    ],
  },
  {
    text: '알림 및 스케줄링',
    collapsed: true,
    items: [
      { text: 'Webhook 알림', link: '/ko/prx-sd/alerts/webhook' },
      { text: '이메일 알림', link: '/ko/prx-sd/alerts/email' },
      { text: '예약 스캔', link: '/ko/prx-sd/alerts/schedule' },
    ],
  },
  {
    text: '네트워크 보호',
    collapsed: true,
    items: [
      { text: '광고 및 악성 도메인 차단', link: '/ko/prx-sd/network/adblock' },
      { text: 'DNS 프록시', link: '/ko/prx-sd/network/dns-proxy' },
    ],
  },
  {
    text: '구성',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx-sd/configuration/' },
      { text: '전체 레퍼런스', link: '/ko/prx-sd/configuration/reference' },
    ],
  },
  {
    text: 'CLI 레퍼런스',
    collapsed: true,
    items: [
      { text: '명령어 목록', link: '/ko/prx-sd/cli/' },
    ],
  },
  {
    text: '플러그인 (WASM)',
    collapsed: true,
    items: [
      { text: '플러그인 개발', link: '/ko/prx-sd/plugins/' },
    ],
  },
  {
    text: '데스크톱 앱',
    collapsed: true,
    items: [
      { text: 'Tauri GUI', link: '/ko/prx-sd/gui/' },
    ],
  },
  {
    text: '문제 해결',
    collapsed: true,
    items: [
      { text: '자주 묻는 질문', link: '/ko/prx-sd/troubleshooting/' },
    ],
  },
]

const prxWafSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '시작하기',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx-waf/' },
      { text: '설치', link: '/ko/prx-waf/getting-started/installation' },
      { text: '빠른 시작', link: '/ko/prx-waf/getting-started/quickstart' },
    ],
  },
  {
    text: '규칙 엔진',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx-waf/rules/' },
      { text: 'YAML 문법', link: '/ko/prx-waf/rules/yaml-syntax' },
      { text: '기본 규칙', link: '/ko/prx-waf/rules/builtin-rules' },
      { text: '사용자 정의 규칙', link: '/ko/prx-waf/rules/custom-rules' },
    ],
  },
  {
    text: '게이트웨이',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx-waf/gateway/' },
      { text: '리버스 프록시', link: '/ko/prx-waf/gateway/reverse-proxy' },
      { text: 'SSL / TLS', link: '/ko/prx-waf/gateway/ssl-tls' },
    ],
  },
  {
    text: '클러스터',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx-waf/cluster/' },
      { text: '배포', link: '/ko/prx-waf/cluster/deployment' },
    ],
  },
  {
    text: 'CrowdSec',
    collapsed: true,
    items: [
      { text: '통합', link: '/ko/prx-waf/crowdsec/' },
    ],
  },
  {
    text: '관리 UI',
    collapsed: true,
    items: [
      { text: '대시보드', link: '/ko/prx-waf/admin-ui/' },
    ],
  },
  {
    text: '구성',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx-waf/configuration/' },
      { text: '전체 레퍼런스', link: '/ko/prx-waf/configuration/reference' },
    ],
  },
  {
    text: 'CLI 레퍼런스',
    collapsed: true,
    items: [
      { text: '명령어 목록', link: '/ko/prx-waf/cli/' },
    ],
  },
  {
    text: '문제 해결',
    collapsed: true,
    items: [
      { text: '자주 묻는 질문', link: '/ko/prx-waf/troubleshooting/' },
    ],
  },
]

const openprSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '시작하기',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/openpr/' },
      { text: '설치', link: '/ko/openpr/getting-started/installation' },
      { text: '빠른 시작', link: '/ko/openpr/getting-started/quickstart' },
    ],
  },
  {
    text: '워크스페이스',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/openpr/workspace/' },
      { text: '프로젝트', link: '/ko/openpr/workspace/projects' },
      { text: '멤버', link: '/ko/openpr/workspace/members' },
    ],
  },
  {
    text: '작업 항목',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/openpr/issues/' },
      { text: '워크플로', link: '/ko/openpr/issues/workflow' },
      { text: '스프린트', link: '/ko/openpr/issues/sprints' },
      { text: '레이블', link: '/ko/openpr/issues/labels' },
    ],
  },
  {
    text: '거버넌스',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/openpr/governance/' },
      { text: '제안', link: '/ko/openpr/governance/proposals' },
      { text: '투표', link: '/ko/openpr/governance/voting' },
      { text: '신뢰 점수', link: '/ko/openpr/governance/trust-scores' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/openpr/api/' },
      { text: '인증', link: '/ko/openpr/api/authentication' },
      { text: '엔드포인트', link: '/ko/openpr/api/endpoints' },
    ],
  },
  {
    text: 'MCP 서버',
    collapsed: true,
    items: [
      { text: '통합', link: '/ko/openpr/mcp-server/' },
    ],
  },
  {
    text: '배포',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/ko/openpr/deployment/docker' },
      { text: '프로덕션', link: '/ko/openpr/deployment/production' },
    ],
  },
  {
    text: 'CLI 레퍼런스',
    collapsed: true,
    items: [
      { text: '명령어 목록', link: '/ko/openpr/cli/' },
    ],
  },
  {
    text: '구성',
    collapsed: true,
    items: [
      { text: '레퍼런스', link: '/ko/openpr/configuration/' },
    ],
  },
  {
    text: '문제 해결',
    collapsed: true,
    items: [
      { text: '자주 묻는 질문', link: '/ko/openpr/troubleshooting/' },
    ],
  },
]

const openprWebhookSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '시작하기',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/openpr-webhook/' },
      { text: '설치', link: '/ko/openpr-webhook/getting-started/installation' },
      { text: '빠른 시작', link: '/ko/openpr-webhook/getting-started/quickstart' },
    ],
  },
  {
    text: '에이전트',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/openpr-webhook/agents/' },
      { text: '실행기', link: '/ko/openpr-webhook/agents/executors' },
    ],
  },
  {
    text: 'WSS 터널',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/openpr-webhook/tunnel/' },
    ],
  },
  {
    text: '구성',
    collapsed: true,
    items: [
      { text: '레퍼런스', link: '/ko/openpr-webhook/configuration/' },
    ],
  },
  {
    text: '문제 해결',
    collapsed: true,
    items: [
      { text: '자주 묻는 질문', link: '/ko/openpr-webhook/troubleshooting/' },
    ],
  },
]

const prxMemorySidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '시작하기',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx-memory/' },
      { text: '설치', link: '/ko/prx-memory/getting-started/installation' },
      { text: '빠른 시작', link: '/ko/prx-memory/getting-started/quickstart' },
    ],
  },
  {
    text: '벡터 임베딩',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx-memory/embedding/' },
      { text: '모델', link: '/ko/prx-memory/embedding/models' },
      { text: '배치 처리', link: '/ko/prx-memory/embedding/batch-processing' },
    ],
  },
  {
    text: '리랭킹',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx-memory/reranking/' },
      { text: '모델', link: '/ko/prx-memory/reranking/models' },
    ],
  },
  {
    text: '스토리지',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/prx-memory/storage/' },
      { text: 'SQLite', link: '/ko/prx-memory/storage/sqlite' },
      { text: '벡터 검색', link: '/ko/prx-memory/storage/vector-search' },
    ],
  },
  {
    text: 'MCP 프로토콜',
    collapsed: true,
    items: [
      { text: '통합', link: '/ko/prx-memory/mcp/' },
    ],
  },
  {
    text: 'API 레퍼런스',
    collapsed: true,
    items: [
      { text: 'Rust API', link: '/ko/prx-memory/api/' },
    ],
  },
  {
    text: '구성',
    collapsed: true,
    items: [
      { text: '레퍼런스', link: '/ko/prx-memory/configuration/' },
    ],
  },
  {
    text: '문제 해결',
    collapsed: true,
    items: [
      { text: '자주 묻는 질문', link: '/ko/prx-memory/troubleshooting/' },
    ],
  },
]

const prxEmailSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '시작하기',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx-email/' },
      { text: '설치', link: '/ko/prx-email/getting-started/installation' },
      { text: '빠른 시작', link: '/ko/prx-email/getting-started/quickstart' },
    ],
  },
  {
    text: '이메일 계정',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/prx-email/accounts/' },
      { text: 'IMAP', link: '/ko/prx-email/accounts/imap' },
      { text: 'SMTP', link: '/ko/prx-email/accounts/smtp' },
      { text: 'OAuth', link: '/ko/prx-email/accounts/oauth' },
    ],
  },
  {
    text: '스토리지',
    collapsed: true,
    items: [
      { text: 'SQLite', link: '/ko/prx-email/storage/' },
    ],
  },
  {
    text: '플러그인',
    collapsed: true,
    items: [
      { text: 'WASM 플러그인', link: '/ko/prx-email/plugins/' },
    ],
  },
  {
    text: '구성',
    collapsed: true,
    items: [
      { text: '레퍼런스', link: '/ko/prx-email/configuration/' },
    ],
  },
  {
    text: '문제 해결',
    collapsed: true,
    items: [
      { text: '자주 묻는 질문', link: '/ko/prx-email/troubleshooting/' },
    ],
  },
]

const fenfaSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '시작하기',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/fenfa/' },
      { text: '설치', link: '/ko/fenfa/getting-started/installation' },
      { text: '빠른 시작', link: '/ko/fenfa/getting-started/quickstart' },
    ],
  },
  {
    text: '제품 관리',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/fenfa/products/' },
      { text: '변형', link: '/ko/fenfa/products/variants' },
      { text: '릴리스', link: '/ko/fenfa/products/releases' },
    ],
  },
  {
    text: '앱 배포',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/fenfa/distribution/' },
      { text: 'iOS', link: '/ko/fenfa/distribution/ios' },
      { text: 'Android', link: '/ko/fenfa/distribution/android' },
      { text: '데스크톱', link: '/ko/fenfa/distribution/desktop' },
    ],
  },
  {
    text: 'API',
    collapsed: true,
    items: [
      { text: '개요', link: '/ko/fenfa/api/' },
      { text: '업로드 API', link: '/ko/fenfa/api/upload' },
      { text: '관리 API', link: '/ko/fenfa/api/admin' },
    ],
  },
  {
    text: '배포',
    collapsed: true,
    items: [
      { text: 'Docker', link: '/ko/fenfa/deployment/docker' },
      { text: '프로덕션', link: '/ko/fenfa/deployment/production' },
    ],
  },
  {
    text: '구성',
    collapsed: true,
    items: [
      { text: '레퍼런스', link: '/ko/fenfa/configuration/' },
    ],
  },
  {
    text: '문제 해결',
    collapsed: true,
    items: [
      { text: '자주 묻는 질문', link: '/ko/fenfa/troubleshooting/' },
    ],
  },
]

const nav: DefaultTheme.NavItem[] = [
  {
    text: 'PRX',
    items: [
      { text: '시작하기', link: '/ko/prx/' },
      { text: '채널', link: '/ko/prx/channels/' },
      { text: '제공자', link: '/ko/prx/providers/' },
      { text: '도구', link: '/ko/prx/tools/' },
      { text: '구성', link: '/ko/prx/config/' },
    ],
  },
  {
    text: 'PRX-SD',
    items: [
      { text: '시작하기', link: '/ko/prx-sd/' },
      { text: '스캔', link: '/ko/prx-sd/scanning/file-scan' },
      { text: '탐지 엔진', link: '/ko/prx-sd/detection/' },
      { text: '위협 인텔리전스', link: '/ko/prx-sd/signatures/' },
      { text: '구성', link: '/ko/prx-sd/configuration/' },
    ],
  },
  {
    text: 'PRX-WAF',
    items: [
      { text: '시작하기', link: '/ko/prx-waf/' },
      { text: '규칙 엔진', link: '/ko/prx-waf/rules/' },
      { text: '게이트웨이', link: '/ko/prx-waf/gateway/' },
      { text: '클러스터', link: '/ko/prx-waf/cluster/' },
      { text: '구성', link: '/ko/prx-waf/configuration/' },
    ],
  },
  {
    text: '더 보기',
    items: [
      { text: 'OpenPR', link: '/ko/openpr/' },
      { text: 'OpenPR-Webhook', link: '/ko/openpr-webhook/' },
      { text: 'PRX-Memory', link: '/ko/prx-memory/' },
      { text: 'PRX-Email', link: '/ko/prx-email/' },
      { text: 'Fenfa', link: '/ko/fenfa/' },
    ],
  },
]

export const koConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  themeConfig: {
    nav,
    sidebar: {
      '/ko/prx/': prxSidebar,
      '/ko/prx-sd/': prxSdSidebar,
      '/ko/prx-waf/': prxWafSidebar,
      '/ko/openpr/': openprSidebar,
      '/ko/openpr-webhook/': openprWebhookSidebar,
      '/ko/prx-memory/': prxMemorySidebar,
      '/ko/prx-email/': prxEmailSidebar,
      '/ko/fenfa/': fenfaSidebar,
    },
    editLink: {
      pattern: 'https://github.com/openprx/docs/edit/main/site/:path',
      text: 'GitHub에서 이 페이지 편집',
    },
    lastUpdated: {
      text: '마지막 업데이트',
    },
    docFooter: {
      prev: '이전 페이지',
      next: '다음 페이지',
    },
    outline: {
      label: '페이지 탐색',
      level: [2, 3],
    },
  },
}
