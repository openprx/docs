---
title: الواجهات الخلفية لوقت التشغيل
description: واجهات تنفيذ خلفية قابلة للتركيب في PRX -- أزمنة تشغيل Native وDocker وWASM لتنفيذ الأدوات والأوامر.
---

# الواجهات الخلفية لوقت التشغيل

يدعم PRX عدة واجهات تنفيذ خلفية لتشغيل الأدوات والأوامر والعمليات الخارجية. يقوم نظام وقت التشغيل بتجريد بيئة التنفيذ خلف trait `RuntimeAdapter`، مما يتيح لك التبديل بين تنفيذ العمليات المحلية، وحاويات Docker، وبيئات WebAssembly المعزولة دون تغيير إعدادات الوكيل.

## نظرة عامة

عندما ينفّذ وكيل أداة تتطلب تشغيل أمر خارجي (سكريبتات shell، خوادم MCP، تكاملات skill)، تحدد الواجهة الخلفية لوقت التشغيل كيفية تنفيذ ذلك الأمر:

| Backend | Isolation | Overhead | Use Case |
|---------|-----------|----------|----------|
| **Native** | Process-level | Minimal | Development, trusted environments |
| **Docker** | Container-level | Moderate | Production, untrusted tools, reproducibility |
| **WASM** | Sandbox-level | Low | Portable skills, maximum isolation, plugin system |

```
Agent Loop
    │
    ├── Tool Call: "shell" with command "ls -la"
    │
    ▼
┌───────────────────────────────────┐
│         RuntimeAdapter            │
│  ┌─────────┬─────────┬─────────┐ │
│  │ Native  │ Docker  │  WASM   │ │
│  │ Runtime │ Runtime │ Runtime │ │
│  └────┬────┴────┬────┴────┬────┘ │
└───────┼─────────┼─────────┼──────┘
        │         │         │
   ┌────▼────┐ ┌──▼───┐ ┌──▼────┐
   │ Process │ │ ctr  │ │ wasmr │
   │ spawn   │ │ exec │ │ exec  │
   └─────────┘ └──────┘ └───────┘
```

## Trait ‏RuntimeAdapter

تُنفّذ كل الواجهات الخلفية trait `RuntimeAdapter`:

```rust
#[async_trait]
pub trait RuntimeAdapter: Send + Sync {
    async fn execute(&self, command: &str, args: &[String],
        env: &HashMap<String, String>, working_dir: Option<&Path>,
        timeout: Duration) -> Result<ExecutionOutput>;
    async fn is_available(&self) -> bool;
    fn name(&self) -> &str;
}
```

يحتوي `ExecutionOutput` على `stdout` و`stderr` و`exit_code` و`duration`.

## الإعدادات

اختر الواجهة الخلفية لوقت التشغيل واضبطها في `config.toml`:

```toml
[runtime]
# Backend selection: "native" | "docker" | "wasm" | "auto"
backend = "auto"

# Global execution timeout (can be overridden per-tool).
default_timeout_secs = 60

# Maximum output size captured from stdout/stderr.
max_output_bytes = 1048576  # 1 MB

# Environment variable whitelist. Only these variables are
# passed to child processes (all backends).
env_whitelist = ["PATH", "HOME", "TERM", "LANG", "USER"]
```

### الاكتشاف التلقائي

عندما تكون قيمة `backend = "auto"`، يختار PRX وقت التشغيل بناءً على التوفر:

1. إذا كان Docker يعمل ويمكن الوصول إليه، استخدم Docker
2. إذا كان وقت تشغيل WASM متاحًا، استخدم WASM للأدوات المتوافقة
3. ارجع إلى Native

يعمل الاكتشاف التلقائي مرة واحدة عند بدء التشغيل ويسجل الواجهة الخلفية المختارة.

## وقت تشغيل Native

يقوم وقت تشغيل Native بتشغيل الأوامر كعمليات أبناء محلية باستخدام `tokio::process::Command`. وهو أبسط وأسرع واجهة خلفية، دون تبعيات إضافية.

### الإعدادات

```toml
[runtime]
backend = "native"

[runtime.native]
# Shell to use for command execution.
shell = "/bin/bash"

# Additional environment variables to set.
[runtime.native.env]
RUSTFLAGS = "-D warnings"
```

### الخصائص

| Property | Value |
|----------|-------|
| Isolation | Process-level only (inherits user permissions) |
| Startup time | < 10ms |
| Filesystem access | Full (limited by user permissions and sandbox) |
| Network access | Full (limited by sandbox) |
| Dependencies | None |
| Platform | All (Linux, macOS, Windows) |

### اعتبارات الأمان

لا يوفر وقت تشغيل Native عزلًا يتجاوز حدود عمليات Unix القياسية. تعمل الأوامر بنفس صلاحيات عملية PRX. احرص دائمًا على دمجه مع [نظام sandbox الفرعي](/ar/prx/security/sandbox) عند تشغيل أوامر غير موثوقة:

```toml
[runtime]
backend = "native"

[security.sandbox]
backend = "bubblewrap"
allow_network = false
writable_paths = ["/tmp"]
```

## وقت تشغيل Docker

ينفّذ وقت تشغيل Docker الأوامر داخل حاويات مؤقتة. ينشئ كل تنفيذ حاوية جديدة، وينفذ الأمر، ويلتقط المخرجات، ثم يدمر الحاوية.

### الإعدادات

```toml
[runtime]
backend = "docker"

[runtime.docker]
image = "debian:bookworm-slim"
socket = "/var/run/docker.sock"
memory_limit = "256m"
cpu_limit = "1.0"
pids_limit = 100
network = "none"          # "none" | "bridge" | "host"
mount_workspace = true
workspace_mount_path = "/workspace"
auto_pull = true
auto_remove = true
```

زمن الإقلاع يتراوح بين 500ms و2s حسب الصورة. يكون الوصول إلى نظام الملفات محدودًا بالحاوية إضافةً إلى الأحجام المركبة صراحة.

### الأمان

يوفر وقت تشغيل Docker عزلًا قويًا افتراضيًا: عزل شبكة (`network = "none"`)، وحدود موارد (ذاكرة/CPU/PID)، ونظام ملفات جذري للقراءة فقط، وعدم استخدام وضع privileged، وإزالة تلقائية للحاوية بعد التنفيذ. تُدعَم تجاوزات الصورة لكل أداة عبر `[runtime.docker.tool_images]`.

## وقت تشغيل WASM

ينفّذ وقت تشغيل WASM (WebAssembly) الأدوات المترجمة إلى وحدات `.wasm`. يوفر WASM تنفيذًا قابلًا للنقل ومعزولًا مع تحكم دقيق بالقدرات عبر WASI (WebAssembly System Interface).

### الإعدادات

```toml
[runtime]
backend = "wasm"

[runtime.wasm]
# WASM runtime engine: "wasmtime" | "wasmer"
engine = "wasmtime"

# Directory containing .wasm modules.
module_path = "~/.local/share/openprx/wasm/"

# WASI capabilities granted to WASM modules.
[runtime.wasm.capabilities]
filesystem_read = ["/workspace"]
filesystem_write = ["/tmp"]
network = false
env_vars = ["HOME", "USER"]

# Maximum execution time for a single WASM call.
timeout_secs = 30

# Maximum memory allocation for WASM modules.
max_memory_mb = 128
```

### الخصائص

| Property | Value |
|----------|-------|
| Isolation | WASM sandbox (capability-based) |
| Startup time | 10-50ms |
| Filesystem access | WASI pre-opened directories only |
| Network access | Configurable via WASI |
| Dependencies | `wasmtime` or `wasmer` runtime (conditional compile) |
| Platform | All (WASM is platform-independent) |

### الترجمة الشرطية

يتم ترجمة وقت تشغيل WASM شرطيًا خلف علامة ميزة:

```bash
# Build PRX with WASM support
cargo build --release --features wasm-runtime
```

بدون علامة الميزة، لا تكون الواجهة الخلفية WASM متاحة، وستتجاوزها قيمة `backend = "auto"`.

### نظام الإضافات

يشغّل وقت تشغيل WASM نظام الإضافات في PRX. يمكن تحميل skills الموزعة كوحدات `.wasm` ديناميكيًا دون الثقة بكود أصلي. سجّل أدوات WASM في `config.toml` تحت `[tools.custom.<name>]` مع `type = "wasm"` ومسار `module`.

## دالة المصنع

يستخدم PRX دالة مصنع (`create_runtime`) لاختيار الواجهة الخلفية عند بدء التشغيل. تطابق الدالة سلسلة `backend` المُعدّة مع تنفيذ `RuntimeAdapter` المناسب، وتتحقق من توفر الواجهة الخلفية (مثل تشغيل Docker daemon أو ترجمة محرك WASM).

## مصفوفة المقارنة

| Feature | Native | Docker | WASM |
|---------|--------|--------|------|
| Setup complexity | None | Docker daemon | Feature flag + modules |
| Startup latency | < 10ms | 500ms - 2s | 10-50ms |
| Isolation strength | Low | High | High |
| Resource control | OS limits | cgroups | WASM memory limits |
| Network isolation | Via sandbox | Built-in | WASI capability |
| Filesystem isolation | Via sandbox | Built-in | WASI pre-opens |
| Portability | Platform-native | OCI images | Platform-independent |
| Tool compatibility | All | All (with image) | WASM-compiled only |

## ملاحظات أمنية

- الواجهة الخلفية لوقت التشغيل طبقة دفاع وليست بديلًا عن [sandbox](/ar/prx/security/sandbox). يعمل النظامان معًا: وقت التشغيل يوفر بيئة التنفيذ، وsandbox يضيف قيودًا على مستوى نظام التشغيل.
- يتطلب وقت تشغيل Docker الوصول إلى Docker socket، وهو مورد ذو صلاحيات عالية بحد ذاته. شغّل PRX تحت حساب خدمة مخصص.
- وحدات WASM لا تمتلك صلاحيات ضمنية. يجب منح كل قدرة (نظام الملفات، الشبكة، البيئة) صراحة.
- إعداد `env_whitelist` يطبق على كل الواجهات الخلفية. لا يتم تمرير مفاتيح API والأسرار مطلقًا إلى بيئات تنفيذ الأدوات.

## صفحات ذات صلة

- [بنية وقت تشغيل الوكيل](/ar/prx/agent/runtime)
- [Sandbox](/ar/prx/security/sandbox)
- [Skillforge](/ar/prx/tools/skillforge)
- [عامل الجلسة](/ar/prx/agent/session-worker)
- [نظرة عامة على الأدوات](/ar/prx/tools/)
