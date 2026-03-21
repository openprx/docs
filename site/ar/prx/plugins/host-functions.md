---
title: وظائف المضيف
description: مرجع وظائف المضيف المتاحة لإضافات PRX المبنية على WASM.
---

# وظائف المضيف

وظائف المضيف هي سطح API الذي يقدّمه PRX لإضافات WASM. وهي توفّر وصولًا مضبوطًا إلى قدرات المضيف مثل طلبات HTTP وعمليات الملفات وحالة الوكيل.

## وظائف المضيف المتاحة

### HTTP

| Function | Description | Permission |
|----------|-------------|-----------|
| `http_request(method, url, headers, body)` | تنفيذ طلب HTTP | `net.http` |
| `http_get(url)` | اختصار لطلب GET | `net.http` |
| `http_post(url, body)` | اختصار لطلب POST | `net.http` |

### نظام الملفات

| Function | Description | Permission |
|----------|-------------|-----------|
| `fs_read(path)` | قراءة ملف | `fs.read` |
| `fs_write(path, data)` | كتابة ملف | `fs.write` |
| `fs_list(path)` | عرض محتويات دليل | `fs.read` |

### حالة الوكيل

| Function | Description | Permission |
|----------|-------------|-----------|
| `memory_get(key)` | قراءة من ذاكرة الوكيل | `agent.memory.read` |
| `memory_set(key, value)` | كتابة في ذاكرة الوكيل | `agent.memory.write` |
| `config_get(key)` | قراءة إعدادات الإضافة | `agent.config` |

### التسجيل

| Function | Description | Permission |
|----------|-------------|-----------|
| `log_info(msg)` | تسجيل بمستوى info | مسموح دائمًا |
| `log_warn(msg)` | تسجيل بمستوى warn | مسموح دائمًا |
| `log_error(msg)` | تسجيل بمستوى error | مسموح دائمًا |

## Permission Manifest

تُعرّف كل إضافة الصلاحيات المطلوبة في manifest الخاص بها:

```toml
[permissions]
net.http = ["api.example.com"]
fs.read = ["/data/*"]
agent.memory.read = true
```

## صفحات ذات صلة

- [بنية الإضافات](./architecture)
- [مرجع PDK](./pdk)
- [Security Sandbox](/ar/prx/security/sandbox)
