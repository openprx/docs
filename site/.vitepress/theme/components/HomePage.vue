<script setup lang="ts">
import { useData } from 'vitepress'

const { isDark, lang } = useData()

import { computed } from 'vue'

type LangKey = 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'ar' | 'ru' | 'ka' | 'en'

const langMap: Record<string, LangKey> = {
  'zh-CN': 'zh',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'es-ES': 'es',
  'fr-FR': 'fr',
  'de-DE': 'de',
  'ar-SA': 'ar',
  'ru-RU': 'ru',
  'ka-GE': 'ka',
}

const currentLang = computed<LangKey>(() => langMap[lang.value] ?? 'en')

function t(translations: Record<LangKey, string>): string {
  return translations[currentLang.value] ?? translations.en
}

const prefixMap: Record<LangKey, string> = {
  en: '/en', zh: '/zh', ja: '/ja', ko: '/ko', es: '/es',
  fr: '/fr', de: '/de', ar: '/ar', ru: '/ru', ka: '/ka',
}

const products = computed(() => {
  const prefix = prefixMap[currentLang.value]

  return [
    {
      name: 'PRX',
      tagline: t({
        en: 'AI Agent Framework', zh: 'AI 智能体框架', ja: 'AIエージェントフレームワーク',
        ko: 'AI 에이전트 프레임워크', es: 'Framework de agentes IA', fr: 'Framework d\'agents IA',
        de: 'KI-Agenten-Framework', ar: 'إطار وكلاء الذكاء الاصطناعي', ru: 'Фреймворк AI-агентов',
        ka: 'AI აგენტის ფრეიმვორკი',
      }),
      description: t({
        en: 'Self-evolving agents that connect LLMs to messaging platforms, tools, and WASM plugins — with autonomous memory, prompt, and strategy improvement.',
        zh: '自进化智能体，连接 LLM 到消息平台、工具和 WASM 插件——具备自主记忆、提示词和策略优化能力。',
        ja: 'LLMをメッセージングプラットフォーム、ツール、WASMプラグインに接続する自己進化エージェント。自律的なメモリ、プロンプト、戦略の改善機能付き。',
        ko: 'LLM을 메시징 플랫폼, 도구, WASM 플러그인에 연결하는 자가 진화 에이전트 -- 자율적 메모리, 프롬프트, 전략 개선 기능 포함.',
        es: 'Agentes auto-evolutivos que conectan LLMs a plataformas de mensajeria, herramientas y plugins WASM, con mejora autonoma de memoria, prompts y estrategia.',
        fr: 'Agents auto-evolutifs connectant les LLMs aux plateformes de messagerie, outils et plugins WASM, avec amelioration autonome de la memoire, des prompts et de la strategie.',
        de: 'Selbst-evolvierende Agenten, die LLMs mit Messaging-Plattformen, Tools und WASM-Plugins verbinden -- mit autonomer Verbesserung von Gedachtnis, Prompts und Strategie.',
        ar: 'وكلاء ذاتيو التطور يربطون نماذج اللغة بمنصات المراسلة والأدوات وإضافات WASM مع تحسين مستقل للذاكرة والموجهات والاستراتيجية.',
        ru: 'Самоэволюционирующие агенты, соединяющие LLM с платформами обмена сообщениями, инструментами и WASM-плагинами -- с автономным улучшением памяти, промптов и стратегии.',
        ka: 'თვით-ევოლუციური აგენტები, რომლებიც LLM-ებს აკავშირებენ შეტყობინებების პლატფორმებთან, ხელსაწყოებთან და WASM დანამატებთან.',
      }),
      status: 'Stable',
      statusClass: 'stable',
      docsLink: `${prefix}/prx/`,
      repoLink: 'https://github.com/openprx/prx',
      highlights: t({
        en: '19 Channels,9 Providers,46+ Tools,WASM Plugins',
        zh: '19 个渠道,9 个提供商,46+ 工具,WASM 插件',
        ja: '19チャンネル,9プロバイダー,46+ツール,WASMプラグイン',
        ko: '19 채널,9 제공자,46+ 도구,WASM 플러그인',
        es: '19 Canales,9 Proveedores,46+ Herramientas,Plugins WASM',
        fr: '19 Canaux,9 Fournisseurs,46+ Outils,Plugins WASM',
        de: '19 Kanale,9 Anbieter,46+ Werkzeuge,WASM-Plugins',
        ar: '19 قناة,9 مزودين,46+ أداة,إضافات WASM',
        ru: '19 каналов,9 провайдеров,46+ инструментов,WASM-плагины',
        ka: '19 არხი,9 პროვაიდერი,46+ ხელსაწყო,WASM დანამატები',
      }).split(','),
    },
    {
      name: 'OpenPR',
      tagline: t({
        en: 'Project Governance', zh: '项目治理平台', ja: 'プロジェクトガバナンス',
        ko: '프로젝트 거버넌스', es: 'Gobernanza de proyectos', fr: 'Gouvernance de projet',
        de: 'Projekt-Governance', ar: 'حوكمة المشاريع', ru: 'Управление проектами',
        ka: 'პროექტის მმართველობა',
      }),
      description: t({
        en: 'Democratic project management with proposals, trust scoring, veto mechanics, and AI-assisted decision making.',
        zh: '民主化项目管理，支持提案、信任评分、否决机制和 AI 辅助决策。',
        ja: '提案、信頼スコア、拒否権メカニクス、AI支援による意思決定を備えた民主的プロジェクト管理。',
        ko: '제안, 신뢰 점수, 거부권 메커니즘, AI 보조 의사결정을 지원하는 민주적 프로젝트 관리.',
        es: 'Gestion democratica de proyectos con propuestas, puntuacion de confianza, mecanica de veto y toma de decisiones asistida por IA.',
        fr: 'Gestion de projet democratique avec propositions, scores de confiance, mecanismes de veto et prise de decision assistee par IA.',
        de: 'Demokratisches Projektmanagement mit Vorschlagen, Vertrauensbewertung, Veto-Mechanismen und KI-gestutzter Entscheidungsfindung.',
        ar: 'إدارة مشاريع ديمقراطية مع مقترحات وتقييم الثقة وآليات الفيتو واتخاذ القرار بمساعدة الذكاء الاصطناعي.',
        ru: 'Демократическое управление проектами с предложениями, оценкой доверия, механикой вето и принятием решений с помощью ИИ.',
        ka: 'დემოკრატიული პროექტის მართვა წინადადებებით, ნდობის ქულებით, ვეტოს მექანიზმებით და AI-ით მხარდაჭერილი გადაწყვეტილებების მიღებით.',
      }),
      status: 'Beta',
      statusClass: 'beta',
      docsLink: `${prefix}/openpr/`,
      repoLink: 'https://github.com/openprx/openpr',
      highlights: t({
        en: 'Governance,Trust Scoring,AI Participants,Sprint Management',
        zh: '治理中心,信任评分,AI 参与者,冲刺管理',
        ja: 'ガバナンス,信頼スコア,AI参加者,スプリント管理',
        ko: '거버넌스,신뢰 점수,AI 참여자,스프린트 관리',
        es: 'Gobernanza,Confianza,Participantes IA,Sprints',
        fr: 'Gouvernance,Confiance,Participants IA,Sprints',
        de: 'Governance,Vertrauen,KI-Teilnehmer,Sprint-Verwaltung',
        ar: 'الحوكمة,تقييم الثقة,مشاركون AI,إدارة السبرنت',
        ru: 'Управление,Доверие,ИИ-участники,Спринты',
        ka: 'მმართველობა,ნდობის ქულა,AI მონაწილეები,სპრინტების მართვა',
      }).split(','),
    },
    {
      name: 'PRX-SD',
      tagline: t({
        en: 'Threat Detection Engine', zh: '威胁检测引擎', ja: '脅威検出エンジン',
        ko: '위협 탐지 엔진', es: 'Motor de deteccion de amenazas', fr: 'Moteur de detection de menaces',
        de: 'Bedrohungserkennungs-Engine', ar: 'محرك كشف التهديدات', ru: 'Движок обнаружения угроз',
        ka: 'საფრთხის აღმოჩენის ძრავი',
      }),
      description: t({
        en: 'Open-source malware scanner with YARA rules, hash signatures, and heuristic analysis across PE, ELF, and Mach-O binaries.',
        zh: '开源恶意软件扫描器，支持 YARA 规则、哈希签名和启发式分析，覆盖 PE、ELF 和 Mach-O 格式。',
        ja: 'YARAルール、ハッシュシグネチャ、ヒューリスティック分析を備えたオープンソースマルウェアスキャナー。PE、ELF、Mach-Oバイナリに対応。',
        ko: 'YARA 규칙, 해시 서명, 휴리스틱 분석을 지원하는 오픈소스 맬웨어 스캐너. PE, ELF, Mach-O 바이너리 지원.',
        es: 'Escaner de malware de codigo abierto con reglas YARA, firmas hash y analisis heuristico para binarios PE, ELF y Mach-O.',
        fr: 'Scanner de malware open-source avec regles YARA, signatures de hash et analyse heuristique pour les binaires PE, ELF et Mach-O.',
        de: 'Open-Source-Malware-Scanner mit YARA-Regeln, Hash-Signaturen und heuristischer Analyse fur PE-, ELF- und Mach-O-Binardateien.',
        ar: 'ماسح برمجيات خبيثة مفتوح المصدر مع قواعد YARA وتوقيعات الهاش والتحليل الاستكشافي لملفات PE و ELF و Mach-O.',
        ru: 'Сканер вредоносного ПО с открытым исходным кодом с правилами YARA, хэш-сигнатурами и эвристическим анализом для бинарных файлов PE, ELF и Mach-O.',
        ka: 'ღია კოდის მავნე პროგრამების სკანერი YARA წესებით, ჰეშ ხელმოწერებით და ევრისტიკული ანალიზით PE, ELF და Mach-O ბინარებისთვის.',
      }),
      status: 'Beta',
      statusClass: 'beta',
      docsLink: `${prefix}/prx-sd/`,
      repoLink: 'https://github.com/openprx/prx-sd',
      highlights: t({
        en: 'YARA Rules,Hash Matching,Heuristic Analysis,Real-time Monitor',
        zh: 'YARA 规则,哈希匹配,启发式分析,实时监控',
        ja: 'YARAルール,ハッシュマッチング,ヒューリスティック分析,リアルタイム監視',
        ko: 'YARA 규칙,해시 매칭,휴리스틱 분석,실시간 모니터',
        es: 'Reglas YARA,Hash,Heuristico,Tiempo real',
        fr: 'Regles YARA,Hash,Heuristique,Temps reel',
        de: 'YARA-Regeln,Hash-Abgleich,Heuristik,Echtzeit',
        ar: 'قواعد YARA,مطابقة الهاش,تحليل استكشافي,مراقبة فورية',
        ru: 'Правила YARA,Хэш-сопоставление,Эвристика,Мониторинг',
        ka: 'YARA წესები,ჰეშის შედარება,ევრისტიკა,რეალურ დროში',
      }).split(','),
    },
    {
      name: 'PRX-WAF',
      tagline: t({
        en: 'Web Application Firewall', zh: 'Web 应用防火墙', ja: 'Webアプリケーションファイアウォール',
        ko: '웹 애플리케이션 방화벽', es: 'Firewall de aplicaciones web', fr: 'Pare-feu applicatif web',
        de: 'Web Application Firewall', ar: 'جدار حماية تطبيقات الويب', ru: 'Файрвол веб-приложений',
        ka: 'ვებ აპლიკაციის Firewall',
      }),
      description: t({
        en: 'Community-driven WAF with rate limiting, IP reputation, threat intelligence feeds, and rule hot-reload.',
        zh: '社区驱动的 WAF，支持速率限制、IP 信誉、威胁情报和规则热重载。',
        ja: 'レート制限、IPレピュテーション、脅威インテリジェンスフィード、ルールホットリロードを備えたコミュニティ駆動WAF。',
        ko: '속도 제한, IP 평판, 위협 인텔리전스 피드, 규칙 핫 리로드를 지원하는 커뮤니티 기반 WAF.',
        es: 'WAF impulsado por la comunidad con limitacion de tasa, reputacion IP, fuentes de inteligencia de amenazas y recarga en caliente de reglas.',
        fr: 'WAF communautaire avec limitation de debit, reputation IP, flux de renseignement sur les menaces et rechargement a chaud des regles.',
        de: 'Community-getriebene WAF mit Rate Limiting, IP-Reputation, Threat-Intelligence-Feeds und Regel-Hot-Reload.',
        ar: 'جدار حماية مجتمعي مع تحديد المعدل وسمعة IP ومصادر استخبارات التهديدات وإعادة تحميل القواعد مباشرة.',
        ru: 'WAF, управляемый сообществом, с ограничением скорости, репутацией IP, каналами разведки угроз и горячей перезагрузкой правил.',
        ka: 'საზოგადოებით მართული WAF სიჩქარის შეზღუდვით, IP რეპუტაციით, საფრთხის დაზვერვის არხებით და წესების ცხელი გადატვირთვით.',
      }),
      status: 'Alpha',
      statusClass: 'alpha',
      docsLink: `${prefix}/prx-waf/`,
      repoLink: 'https://github.com/openprx/prx-waf',
      highlights: t({
        en: 'Rule Engine,Rate Limiting,IP Reputation,Hot Reload',
        zh: '规则引擎,速率限制,IP 信誉,热重载',
        ja: 'ルールエンジン,レート制限,IPレピュテーション,ホットリロード',
        ko: '규칙 엔진,속도 제한,IP 평판,핫 리로드',
        es: 'Motor de reglas,Limitacion,Reputacion IP,Recarga',
        fr: 'Moteur de regles,Limitation,Reputation IP,Rechargement',
        de: 'Regel-Engine,Rate Limiting,IP-Reputation,Hot Reload',
        ar: 'محرك القواعد,تحديد المعدل,سمعة IP,تحميل مباشر',
        ru: 'Движок правил,Лимитирование,Репутация IP,Горячая перезагрузка',
        ka: 'წესების ძრავი,სიჩქარის შეზღუდვა,IP რეპუტაცია,ცხელი გადატვირთვა',
      }).split(','),
    },
    {
      name: 'OpenPR-Webhook',
      tagline: t({
        en: 'Event Dispatcher', zh: '事件调度服务', ja: 'イベントディスパッチャー',
        ko: '이벤트 디스패처', es: 'Despachador de eventos', fr: 'Distributeur d\'evenements',
        de: 'Event-Dispatcher', ar: 'موزع الأحداث', ru: 'Диспетчер событий',
        ka: 'მოვლენების დისპეტჩერი',
      }),
      description: t({
        en: 'Webhook event receiver and multi-agent notification dispatcher — supports Signal, Telegram, HTTP forwarding, and CLI executors.',
        zh: 'Webhook 事件接收与多代理通知分发——支持 Signal、Telegram、HTTP 转发和 CLI 执行器。',
        ja: 'Webhookイベントの受信とマルチエージェント通知ディスパッチャー。Signal、Telegram、HTTP転送、CLIエグゼキューターに対応。',
        ko: 'Webhook 이벤트 수신기 및 다중 에이전트 알림 디스패처 -- Signal, Telegram, HTTP 전달, CLI 실행기 지원.',
        es: 'Receptor de eventos Webhook y despachador de notificaciones multi-agente. Soporta Signal, Telegram, reenvio HTTP y ejecutores CLI.',
        fr: 'Recepteur d\'evenements Webhook et distributeur de notifications multi-agents. Prend en charge Signal, Telegram, le transfert HTTP et les executeurs CLI.',
        de: 'Webhook-Ereignisempfanger und Multi-Agenten-Benachrichtigungs-Dispatcher. Unterstutzt Signal, Telegram, HTTP-Weiterleitung und CLI-Ausfuhrer.',
        ar: 'مستقبل أحداث Webhook وموزع إشعارات متعدد الوكلاء -- يدعم Signal و Telegram وإعادة توجيه HTTP ومنفذي CLI.',
        ru: 'Приемник событий Webhook и диспетчер уведомлений для нескольких агентов -- поддерживает Signal, Telegram, переадресацию HTTP и CLI-исполнители.',
        ka: 'Webhook მოვლენების მიმღები და მრავალ-აგენტური შეტყობინებების დისპეტჩერი -- მხარდაჭერა Signal, Telegram, HTTP გადამისამართებისა და CLI შემსრულებლებისთვის.',
      }),
      status: 'Beta',
      statusClass: 'beta',
      docsLink: `${prefix}/openpr-webhook/`,
      repoLink: 'https://github.com/openprx/openpr-webhook',
      highlights: t({
        en: 'HMAC Signing,Multi-agent,WSS Tunnel,CLI Executor',
        zh: 'HMAC 验签,多代理分发,WSS 隧道,CLI 执行',
        ja: 'HMAC署名,マルチエージェント,WSSトンネル,CLIエグゼキューター',
        ko: 'HMAC 서명,다중 에이전트,WSS 터널,CLI 실행기',
        es: 'HMAC,Multi-agente,Tunel WSS,Ejecutor CLI',
        fr: 'HMAC,Multi-agent,Tunnel WSS,Executeur CLI',
        de: 'HMAC,Multi-Agent,WSS-Tunnel,CLI-Ausfuhrer',
        ar: 'HMAC,متعدد الوكلاء,نفق WSS,منفذ CLI',
        ru: 'HMAC,Мульти-агент,WSS-туннель,CLI-исполнитель',
        ka: 'HMAC,მრავალ-აგენტი,WSS გვირაბი,CLI შემსრულებელი',
      }).split(','),
    },
    {
      name: 'Fenfa',
      tagline: t({
        en: 'Distribution Platform', zh: '应用分发平台', ja: 'ディストリビューションプラットフォーム',
        ko: '배포 플랫폼', es: 'Plataforma de distribucion', fr: 'Plateforme de distribution',
        de: 'Verteilungsplattform', ar: 'منصة التوزيع', ru: 'Платформа дистрибуции',
        ka: 'გავრცელების პლატფორმა',
      }),
      description: t({
        en: 'Self-hosted app distribution for iOS OTA, Android APK, and desktop releases with QR codes and admin panel.',
        zh: '自托管应用分发平台，支持 iOS OTA、Android APK 和桌面端分发管理。',
        ja: 'iOS OTA、Android APK、デスクトップリリースに対応したセルフホストアプリ配布プラットフォーム。QRコードと管理パネル付き。',
        ko: 'iOS OTA, Android APK, 데스크톱 릴리스를 위한 자체 호스팅 앱 배포 플랫폼. QR 코드 및 관리 패널 포함.',
        es: 'Distribucion de aplicaciones auto-hospedada para iOS OTA, Android APK y versiones de escritorio con codigos QR y panel de administracion.',
        fr: 'Distribution d\'applications auto-hebergee pour iOS OTA, Android APK et versions bureau avec codes QR et panneau d\'administration.',
        de: 'Selbst-gehostete App-Verteilung fur iOS OTA, Android APK und Desktop-Releases mit QR-Codes und Admin-Panel.',
        ar: 'منصة توزيع تطبيقات ذاتية الاستضافة لـ iOS OTA و Android APK وإصدارات سطح المكتب مع رموز QR ولوحة الإدارة.',
        ru: 'Самохостинговая платформа дистрибуции приложений для iOS OTA, Android APK и десктопных релизов с QR-кодами и панелью администратора.',
        ka: 'თვით-ჰოსტინგის აპლიკაციის გავრცელება iOS OTA, Android APK და დესკტოპ გამოშვებებისთვის QR კოდებითა და ადმინ პანელით.',
      }),
      status: 'Beta',
      statusClass: 'beta',
      docsLink: `${prefix}/fenfa/`,
      repoLink: 'https://github.com/openprx/fenfa',
      highlights: t({
        en: 'iOS OTA,Android APK,Desktop,Admin Panel',
        zh: 'iOS OTA,Android APK,桌面分发,管理面板',
        ja: 'iOS OTA,Android APK,デスクトップ,管理パネル',
        ko: 'iOS OTA,Android APK,데스크톱,관리 패널',
        es: 'iOS OTA,Android APK,Escritorio,Panel admin',
        fr: 'iOS OTA,Android APK,Bureau,Panneau admin',
        de: 'iOS OTA,Android APK,Desktop,Admin-Panel',
        ar: 'iOS OTA,Android APK,سطح المكتب,لوحة الإدارة',
        ru: 'iOS OTA,Android APK,Десктоп,Админ-панель',
        ka: 'iOS OTA,Android APK,დესკტოპი,ადმინ პანელი',
      }).split(','),
    },
  ]
})

const values = computed(() => {
  return [
    {
      title: t({
        en: 'Self-Evolving', zh: '自进化', ja: '自己進化', ko: '자가 진화',
        es: 'Auto-evolutivo', fr: 'Auto-evolutif', de: 'Selbst-Evolvierend',
        ar: 'ذاتي التطور', ru: 'Самоэволюция', ka: 'თვით-ევოლუცია',
      }),
      description: t({
        en: 'Systems that learn from every interaction. Memory, prompts, and strategies improve autonomously with safety rollback.',
        zh: '系统从每次交互中学习。记忆、提示词和策略自主优化，并具备安全回滚机制。',
        ja: 'すべてのインタラクションから学習するシステム。メモリ、プロンプト、戦略は安全なロールバック機能付きで自律的に改善。',
        ko: '모든 상호작용에서 학습하는 시스템. 안전한 롤백 기능으로 메모리, 프롬프트, 전략이 자율적으로 개선.',
        es: 'Sistemas que aprenden de cada interaccion. Memoria, prompts y estrategias mejoran autonomamente con rollback de seguridad.',
        fr: 'Des systemes qui apprennent de chaque interaction. Memoire, prompts et strategies s\'ameliorent de maniere autonome avec rollback de securite.',
        de: 'Systeme, die aus jeder Interaktion lernen. Gedachtnis, Prompts und Strategien verbessern sich autonom mit sicherem Rollback.',
        ar: 'أنظمة تتعلم من كل تفاعل. تتحسن الذاكرة والموجهات والاستراتيجيات بشكل مستقل مع آلية التراجع الآمن.',
        ru: 'Системы, обучающиеся на каждом взаимодействии. Память, промпты и стратегии улучшаются автономно с безопасным откатом.',
        ka: 'სისტემები, რომლებიც სწავლობენ ყოველი ინტერაქციიდან. მეხსიერება, პრომპტები და სტრატეგიები უმჯობესდება ავტონომიურად უსაფრთხო უკუქცევით.',
      }),
    },
    {
      title: t({
        en: 'Security First', zh: '安全优先', ja: 'セキュリティ最優先', ko: '보안 우선',
        es: 'Seguridad primero', fr: 'Securite d\'abord', de: 'Sicherheit zuerst',
        ar: 'الأمان أولاً', ru: 'Безопасность прежде всего', ka: 'უსაფრთხოება პირველ რიგში',
      }),
      description: t({
        en: 'Defense in depth at every layer — sandbox isolation, encrypted secrets, policy engines, and threat detection built in.',
        zh: '每一层的纵深防御——沙箱隔离、加密密钥、策略引擎和内置威胁检测。',
        ja: 'すべてのレイヤーで多層防御——サンドボックス分離、暗号化されたシークレット、ポリシーエンジン、組み込みの脅威検出。',
        ko: '모든 계층에서 심층 방어 -- 샌드박스 격리, 암호화된 비밀, 정책 엔진, 내장 위협 탐지.',
        es: 'Defensa en profundidad en cada capa: aislamiento sandbox, secretos cifrados, motores de politicas y deteccion de amenazas integrada.',
        fr: 'Defense en profondeur a chaque couche : isolation sandbox, secrets chiffres, moteurs de politiques et detection de menaces integree.',
        de: 'Tiefenverteidigung auf jeder Ebene -- Sandbox-Isolation, verschlusselte Geheimnisse, Richtlinien-Engines und eingebaute Bedrohungserkennung.',
        ar: 'دفاع معمق في كل طبقة -- عزل صندوق الرمل، أسرار مشفرة، محركات السياسات، وكشف التهديدات المدمج.',
        ru: 'Глубокая защита на каждом уровне -- изоляция в песочнице, зашифрованные секреты, движки политик и встроенное обнаружение угроз.',
        ka: 'ღრმა დაცვა ყველა დონეზე -- სანდბოქსის იზოლაცია, დაშიფრული საიდუმლოებები, პოლიტიკის ძრავები და ჩაშენებული საფრთხის აღმოჩენა.',
      }),
    },
    {
      title: t({
        en: 'Open by Default', zh: '默认开放', ja: 'デフォルトでオープン', ko: '기본적으로 개방',
        es: 'Abierto por defecto', fr: 'Ouvert par defaut', de: 'Standardmassig offen',
        ar: 'مفتوح افتراضيًا', ru: 'Открытость по умолчанию', ka: 'ნაგულისხმევად ღია',
      }),
      description: t({
        en: 'Transparent, auditable, community-driven. Apache-2.0 licensed. No vendor lock-in, no black boxes.',
        zh: '透明、可审计、社区驱动。Apache-2.0 许可证，无供应商锁定，无黑盒。',
        ja: '透明、監査可能、コミュニティ駆動。Apache-2.0ライセンス。ベンダーロックインなし、ブラックボックスなし。',
        ko: '투명하고, 감사 가능하며, 커뮤니티 중심. Apache-2.0 라이선스. 벤더 종속 없음, 블랙박스 없음.',
        es: 'Transparente, auditable, impulsado por la comunidad. Licencia Apache-2.0. Sin dependencia de proveedores, sin cajas negras.',
        fr: 'Transparent, auditable, communautaire. Licence Apache-2.0. Pas de dependance fournisseur, pas de boites noires.',
        de: 'Transparent, uberprufbar, community-getrieben. Apache-2.0-lizenziert. Keine Anbieterabhangigkeit, keine Blackboxes.',
        ar: 'شفاف وقابل للتدقيق ومجتمعي. رخصة Apache-2.0. بدون تقييد بالمورد، بدون صناديق سوداء.',
        ru: 'Прозрачный, проверяемый, управляемый сообществом. Лицензия Apache-2.0. Без привязки к поставщику, без черных ящиков.',
        ka: 'გამჭვირვალე, აუდიტირებადი, საზოგადოებით მართული. Apache-2.0 ლიცენზია. მომწოდებელზე დამოკიდებულების გარეშე.',
      }),
    },
    {
      title: t({
        en: 'Rust-Powered', zh: 'Rust 驱动', ja: 'Rust搭載', ko: 'Rust 기반',
        es: 'Potenciado por Rust', fr: 'Propulse par Rust', de: 'Rust-betrieben',
        ar: 'مدعوم بـ Rust', ru: 'На базе Rust', ka: 'Rust-ით მართული',
      }),
      description: t({
        en: 'Built in Rust for memory safety, zero-cost abstractions, and production-grade reliability. No garbage collector pauses.',
        zh: '使用 Rust 构建，确保内存安全、零成本抽象和生产级可靠性。无 GC 停顿。',
        ja: 'Rustで構築。メモリ安全性、ゼロコスト抽象化、本番環境レベルの信頼性。GCの停止なし。',
        ko: '메모리 안전성, 제로 비용 추상화, 프로덕션 수준 안정성을 위해 Rust로 구축. GC 일시 정지 없음.',
        es: 'Construido en Rust para seguridad de memoria, abstracciones de costo cero y fiabilidad de grado de produccion. Sin pausas de GC.',
        fr: 'Construit en Rust pour la securite memoire, les abstractions a cout zero et la fiabilite de production. Pas de pauses GC.',
        de: 'In Rust gebaut fur Speichersicherheit, kostenlose Abstraktionen und produktionsreife Zuverlassigkeit. Keine GC-Pausen.',
        ar: 'مبني بـ Rust لأمان الذاكرة والتجريدات بدون تكلفة وموثوقية بمستوى الإنتاج. بدون توقف جامع القمامة.',
        ru: 'Создан на Rust для безопасности памяти, абстракций с нулевой стоимостью и надежности промышленного уровня. Без пауз сборщика мусора.',
        ka: 'აგებულია Rust-ზე მეხსიერების უსაფრთხოებისთვის, ნულოვანი ღირებულების აბსტრაქციებისთვის და პროდაქშენის დონის საიმედოობისთვის.',
      }),
    },
  ]
})

const heroTitle = computed(() => t({
  en: 'Open Infrastructure for the AI Era', zh: 'AI 时代的开放基础设施',
  ja: 'AI時代のオープンインフラストラクチャ', ko: 'AI 시대의 오픈 인프라',
  es: 'Infraestructura abierta para la era de la IA', fr: 'Infrastructure ouverte pour l\'ere de l\'IA',
  de: 'Offene Infrastruktur fur das KI-Zeitalter', ar: 'بنية تحتية مفتوحة لعصر الذكاء الاصطناعي',
  ru: 'Открытая инфраструктура для эпохи ИИ', ka: 'ღია ინფრასტრუქტურა AI ეპოქისთვის',
}))
const heroDesc = computed(() => t({
  en: 'We build open-source tools that let AI agents work autonomously — connecting, defending, evolving, and shipping.',
  zh: '我们构建开源工具，让 AI 智能体自主工作——连接、防御、进化和分发。',
  ja: 'AIエージェントが自律的に動作するためのオープンソースツールを構築します——接続、防御、進化、配布。',
  ko: 'AI 에이전트가 자율적으로 작업할 수 있는 오픈소스 도구를 구축합니다 -- 연결, 방어, 진화, 배포.',
  es: 'Construimos herramientas de codigo abierto que permiten a los agentes de IA trabajar de forma autonoma: conectar, defender, evolucionar y distribuir.',
  fr: 'Nous construisons des outils open-source permettant aux agents IA de travailler de maniere autonome : connecter, defendre, evoluer et distribuer.',
  de: 'Wir bauen Open-Source-Werkzeuge, mit denen KI-Agenten autonom arbeiten konnen -- verbinden, verteidigen, weiterentwickeln und ausliefern.',
  ar: 'نبني أدوات مفتوحة المصدر تمكّن وكلاء الذكاء الاصطناعي من العمل بشكل مستقل -- الاتصال والدفاع والتطور والتوزيع.',
  ru: 'Мы создаем инструменты с открытым исходным кодом, позволяющие ИИ-агентам работать автономно -- подключение, защита, эволюция и доставка.',
  ka: 'ჩვენ ვქმნით ღია კოდის ხელსაწყოებს, რომლებიც AI აგენტებს ავტონომიურად მუშაობის საშუალებას აძლევს -- დაკავშირება, დაცვა, ევოლუცია და გავრცელება.',
}))
const btnStart = computed(() => t({
  en: 'Get Started', zh: '快速入门', ja: 'はじめる', ko: '시작하기',
  es: 'Comenzar', fr: 'Demarrer', de: 'Erste Schritte',
  ar: 'البدء', ru: 'Начать', ka: 'დაწყება',
}))
const sectionProducts = computed(() => t({
  en: 'Products', zh: '产品', ja: '製品', ko: '제품',
  es: 'Productos', fr: 'Produits', de: 'Produkte',
  ar: 'المنتجات', ru: 'Продукты', ka: 'პროდუქტები',
}))
const sectionWhy = computed(() => t({
  en: 'Why OpenPRX', zh: '为什么选择 OpenPRX', ja: 'なぜOpenPRXか', ko: '왜 OpenPRX인가',
  es: 'Por que OpenPRX', fr: 'Pourquoi OpenPRX', de: 'Warum OpenPRX',
  ar: 'لماذا OpenPRX', ru: 'Почему OpenPRX', ka: 'რატომ OpenPRX',
}))
</script>

<template>
  <div class="home-container">
    <!-- Hero -->
    <section class="hero-section">
      <div class="hero-inner">
        <h1 class="hero-brand">OpenPRX</h1>
        <p class="hero-title">{{ heroTitle }}</p>
        <p class="hero-description">{{ heroDesc }}</p>
        <div class="hero-actions">
          <a :href="prefixMap[currentLang] + '/prx/'" class="btn btn-primary">{{ btnStart }}</a>
          <a href="https://github.com/openprx" class="btn btn-ghost" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </section>

    <!-- Products -->
    <section class="products-section">
      <div class="section-inner">
        <h2 class="section-title">{{ sectionProducts }}</h2>
        <div class="products-grid">
          <a
            v-for="product in products"
            :key="product.name"
            :href="product.docsLink"
            class="product-card"
          >
            <div class="product-header">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-status" :class="product.statusClass">{{ product.status }}</span>
            </div>
            <p class="product-tagline">{{ product.tagline }}</p>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-highlights">
              <span v-for="h in product.highlights" :key="h" class="highlight-tag">{{ h }}</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="values-section">
      <div class="section-inner">
        <h2 class="section-title">{{ sectionWhy }}</h2>
        <div class="values-grid">
          <div v-for="v in values" :key="v.title" class="value-card">
            <h3 class="value-title">{{ v.title }}</h3>
            <p class="value-description">{{ v.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Layout */
.home-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero */
.hero-section {
  padding: 80px 0 64px;
  text-align: center;
}

.hero-brand {
  font-size: 3.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #A78BFA 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1.1;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 12px 0 0;
  letter-spacing: -0.01em;
}

.hero-description {
  font-size: 1.05rem;
  color: var(--vp-c-text-2);
  max-width: 560px;
  margin: 16px auto 0;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.btn-primary:hover {
  background: var(--vp-c-brand-3);
}

.btn-ghost {
  background: transparent;
  color: var(--vp-c-text-2);
  border-color: var(--vp-c-divider);
}
.btn-ghost:hover {
  border-color: var(--vp-c-text-2);
  color: var(--vp-c-text-1);
}

/* Sections */
.section-inner {
  padding: 48px 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 24px;
  letter-spacing: -0.01em;
}

/* Products */
.products-section {
  border-top: 1px solid var(--vp-c-divider);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.product-card {
  display: block;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.product-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
  transform: translateY(-2px);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.product-status {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.product-status.stable {
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
}
.product-status.beta {
  background: rgba(59, 130, 246, 0.12);
  color: #3B82F6;
}
.product-status.alpha {
  background: rgba(245, 158, 11, 0.12);
  color: #F59E0B;
}

.product-tagline {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  margin: 0 0 8px;
}

.product-description {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  margin: 0 0 12px;
}

.product-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.highlight-tag {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

/* Values */
.values-section {
  border-top: 1px solid var(--vp-c-divider);
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.value-card {
  padding: 20px;
}

.value-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
}

.value-description {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  margin: 0;
}

/* Responsive */
@media (max-width: 960px) {
  .hero-brand { font-size: 2.5rem; }
  .hero-title { font-size: 1.25rem; }
  .values-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .hero-section { padding: 48px 0 40px; }
  .hero-brand { font-size: 2rem; }
  .hero-title { font-size: 1.1rem; }
  .products-grid { grid-template-columns: 1fr; }
  .values-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; align-items: center; }
}
</style>
