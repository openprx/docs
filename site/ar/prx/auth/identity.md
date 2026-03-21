---
title: إدارة الهوية
description: تحديد النطاق على مستوى مساحة العمل والمستخدم، وتعدد المستأجرين، وتمرير سياق الهوية في PRX.
---

# إدارة الهوية

يوفر نظام الهوية في PRX تحديد النطاق على مستوى مساحة العمل وعلى مستوى المستخدم لكل عمليات الوكيل. في عمليات النشر متعددة المستأجرين، يحدد سياق الهوية أي الذكريات والإعدادات والأدوات والموارد يمكن لجلسة معينة الوصول إليها. تُعد وحدة الهوية الأساس للتحكم بالوصول، وتدقيق السجلات، والتخصيص.

## نظرة عامة

تعمل كل جلسة PRX ضمن سياق هوية يتضمن:

| Component | Description |
|-----------|-------------|
| **User** | The human or bot interacting with the agent |
| **Workspace** | A logical boundary grouping users, configurations, and data |
| **Session** | A single conversation between a user and the agent |
| **Principal** | The effective identity for access control decisions |

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

## الإعدادات

### إعداد مساحة العمل

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

### ملفات تعريف المستخدم

تخزن ملفات تعريف المستخدم التفضيلات والبيانات الوصفية لكل مستخدم:

```toml
[identity.profiles]
# Storage backend for user profiles: "memory" | "sqlite" | "postgres"
backend = "sqlite"
path = "~/.local/share/openprx/identities.db"
```

### إعداد مساحة العمل

يمكن أن تمتلك كل مساحة عمل طبقة إعدادات خاصة بها تتجاوز الإعدادات الأساسية:

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

## سياق الهوية

يتم تمرير البنية `IdentityContext` عبر خط معالجة الطلب بالكامل. وهي تحتوي على: `user_id` و`display_name` و`workspace_id` و`session_id` و`role` (Owner/Admin/Member/Guest) و`channel` و`metadata` مخصصة.

ينتشر سياق الهوية عبر كل طبقة: تستخرجه gateway من الطلبات الواردة، وتستخدمه حلقة الوكيل لتحديد نطاق الذاكرة والوصول إلى الأدوات، ويضع نظام الذاكرة مساحات أسماء للبيانات حسب مساحة العمل والمستخدم، وينسب تتبع التكلفة الاستهلاك، ويسجل سجل التدقيق الجهة الفاعلة.

## تعدد المستأجرين

يدعم PRX عمليات نشر متعددة المستأجرين حيث تتشارك عدة مؤسسات مثيل PRX واحدًا. يتم فرض حدود المستأجرين على مستوى مساحة العمل:

### عزل البيانات

| Resource | Isolation Level |
|----------|----------------|
| Memories | Per-workspace + per-user |
| Configuration | Per-workspace overlay on global defaults |
| Tool policies | Per-workspace overrides |
| Secrets | Per-workspace vault |
| Cost budgets | Per-workspace limits |
| Audit logs | Per-workspace filtering |

### الوصول عبر مساحات العمل

افتراضيًا، يمكن للمستخدمين الوصول فقط إلى الموارد داخل مساحة عملهم. يتطلب الوصول عبر مساحات العمل إعدادًا صريحًا:

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

## تحديد هوية المستخدم

يحدد PRX هوية المستخدم بشكل مختلف وفقًا لقناة الاتصال:

| Channel | Identity Source | User ID Format |
|---------|----------------|----------------|
| Telegram | Telegram user ID | `telegram:<user_id>` |
| Discord | Discord user ID | `discord:<user_id>` |
| Slack | Slack user ID | `slack:<workspace_id>:<user_id>` |
| CLI | System username | `cli:<username>` |
| API/Gateway | Bearer token / API key | `api:<key_hash>` |
| WeChat | WeChat OpenID | `wechat:<open_id>` |
| QQ | QQ number | `qq:<qq_number>` |

### التسجيل عند أول تواصل

عندما يتفاعل مستخدم جديد مع PRX لأول مرة، يتم إنشاء سجل هوية تلقائيًا: يستخرج مُحوّل القناة معرّف المستخدم، وينشئ ملف تعريف بإعدادات افتراضية، ويعيّن المستخدم إلى `default_workspace` بدور `Member`.

### إدارة المستخدمين يدويًا

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

## إدارة مساحات العمل

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

## ملفات تعريف المستخدم

تخزن ملفات تعريف المستخدم تفضيلات تخصّص سلوك الوكيل:

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Unique identifier |
| `display_name` | string | Human-readable name |
| `language` | string | Preferred language (ISO 639-1) |
| `timezone` | string | Preferred timezone (IANA format) |
| `role` | enum | Workspace role (owner, admin, member, guest) |
| `preferences` | map | Key-value preferences (model, verbosity, etc.) |
| `created_at` | datetime | First interaction timestamp |
| `last_seen_at` | datetime | Most recent interaction timestamp |

### الوصول إلى الملف الشخصي في System Prompts

يمكن أن يتضمن system prompt للوكيل معلومات ملف المستخدم عبر متغيرات القوالب (مثل <code v-pre>{{identity.display_name}}</code> و<code v-pre>{{identity.language}}</code>)، والتي يتم حلّها من سياق الهوية قبل إرسال prompt إلى LLM.

## التحكم بالوصول المعتمد على الأدوار

تحدد أدوار مساحة العمل الإجراءات التي يمكن للمستخدم تنفيذها:

| Permission | Owner | Admin | Member | Guest |
|------------|-------|-------|--------|-------|
| Use agent (chat) | Yes | Yes | Yes | Yes |
| Store memories | Yes | Yes | Yes | No |
| Configure tools | Yes | Yes | No | No |
| Manage users | Yes | Yes | No | No |
| Manage workspace | Yes | No | No | No |
| View audit logs | Yes | Yes | No | No |

## نقاط التكامل

عندما تكون `identity.enabled = true`، يتم تحديد نطاق كل عمليات الذاكرة بواسطة `workspace:{workspace_id}:user:{user_id}:{key}`، ما يضمن عزل البيانات. ويمكن تجاوز سياسات الأدوات لكل مساحة عمل، كما يُنسب استهلاك الرموز إلى سياق الهوية لإعداد تقارير تكلفة لكل مستخدم.

## ملاحظات أمنية

- **Identity spoofing** -- يثق نظام الهوية في أن مُحوّل القناة يعرّف المستخدمين بشكل صحيح. تأكد من إعداد مصادقة القناة بشكل صحيح (bot tokens وOAuth وغيرها).
- **Workspace isolation** -- تُفرض حدود مساحة العمل في منطق التطبيق. لا يوفر التخزين الأساسي (SQLite, Postgres) عزلًا على مستوى قاعدة البيانات. قد يؤدي خطأ في منطق تحديد النطاق إلى تسرب بيانات.
- **Guest access** -- يمتلك الضيوف صلاحيات دنيا افتراضيًا. راجع إعدادات دور الضيف عند تمكين وكلاء موجّهين للجمهور.
- **Profile data** -- قد تحتوي ملفات تعريف المستخدم على معلومات شخصية. تعامل معها وفق سياسة الخصوصية واللوائح المعمول بها.
- **Cross-workspace grants** -- امنح وصولًا عبر مساحات العمل بحذر. كل منحة توسّع نطاق التأثر عند اختراق حساب.

## صفحات ذات صلة

- [نظرة عامة على المصادقة](/ar/prx/auth/)
- [تدفقات OAuth2](/ar/prx/auth/oauth2)
- [ملفات تعريف المزوّد](/ar/prx/auth/profiles)
- [نظرة عامة على الأمان](/ar/prx/security/)
- [محرك السياسات](/ar/prx/security/policy-engine)
- [نظام الذاكرة](/ar/prx/memory/)
