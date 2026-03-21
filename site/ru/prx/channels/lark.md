---
title: Lark / Feishu
description: Подключение PRX к Lark (международный) или Feishu (Китай)
---

# Lark / Feishu

> Подключение PRX к Lark (международный) или Feishu (континентальный Китай) через API Open Platform с WebSocket-подключением или доставкой событий через HTTP-вебхуки.

## Предварительные требования

- Тенант (организация) Lark или Feishu
- Приложение, созданное в [Lark Developer Console](https://open.larksuite.com/app) или [Feishu Developer Console](https://open.feishu.cn/app)
- App ID, App Secret и Verification Token из консоли разработчика

## Быстрая настройка

### 1. Создание бот-приложения

1. Перейдите в консоль разработчика и создайте новое Custom App
2. В разделе «Credentials» скопируйте **App ID** и **App Secret**
3. В разделе «Event Subscriptions» скопируйте **Verification Token**
4. Добавьте возможность бота и настройте разрешения:
   - `im:message`, `im:message.group_at_msg`, `im:message.p2p_msg`

### 2. Конфигурация

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]
```

Для Feishu (Китай):

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
use_feishu = true
allowed_users = ["*"]
```

### 3. Проверка

```bash
prx channel doctor lark
```

## Справочник конфигурации

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `app_id` | `String` | *обязательный* | App ID из консоли разработчика Lark/Feishu |
| `app_secret` | `String` | *обязательный* | App Secret из консоли разработчика |
| `verification_token` | `String` | `null` | Токен верификации для валидации вебхуков |
| `encrypt_key` | `String` | `null` | Ключ шифрования для расшифровки сообщений вебхуков |
| `allowed_users` | `[String]` | `[]` | Разрешённые user ID или union ID. Пусто = запрещено всем. `"*"` = разрешить всем |
| `mention_only` | `bool` | `false` | Если true, отвечать только на @-упоминания в группах. ЛС обрабатываются всегда |
| `use_feishu` | `bool` | `false` | Если true, использовать API-эндпоинты Feishu (КНР) вместо Lark (международных) |
| `receive_mode` | `String` | `"websocket"` | Режим получения событий: `"websocket"` (по умолчанию, без публичного URL) или `"webhook"` |
| `port` | `u16` | `null` | HTTP-порт только для режима webhook. Обязателен при `receive_mode = "webhook"`, игнорируется для websocket |

## Возможности

- **WebSocket-подключение** — постоянное WSS-подключение для событий в реальном времени без публичного URL (режим по умолчанию)
- **Режим HTTP-вебхуков** — альтернативная доставка событий через HTTP-callback для окружений, где это требуется
- **Поддержка Lark и Feishu** — автоматическое переключение API-эндпоинтов между Lark (международный) и Feishu (Китай)
- **Реакции подтверждения** — реакция на входящие сообщения с локализованными реакциями (zh-CN, zh-TW, en, ja)
- **ЛС и групповые сообщения** — обработка личных чатов и групповых разговоров
- **Управление tenant access token** — автоматическое получение и обновление tenant access token
- **Дедупликация сообщений** — предотвращение двойной диспетчеризации WebSocket-сообщений в 30-минутном окне

## Ограничения

- Режим WebSocket требует стабильного исходящего подключения к серверам Lark/Feishu
- Режим webhook требует публично доступного HTTPS-эндпоинта
- Бот должен быть добавлен в группу, прежде чем сможет получать групповые сообщения
- Feishu и Lark используют разные API-домены; убедитесь, что `use_feishu` соответствует региону вашего тенанта
- В зависимости от политик администратора тенанта может требоваться утверждение приложения

## Устранение неполадок

### Бот не получает сообщения
- В режиме websocket проверьте, что исходящие подключения к `open.larksuite.com` (или `open.feishu.cn`) разрешены
- Убедитесь, что приложение имеет необходимые разрешения `im:message` и было одобрено/опубликовано
- Убедитесь, что бот добавлен в группу или пользователь начал ЛС с ним

### «Verification failed» на событиях вебхука
- Проверьте, что `verification_token` совпадает со значением в консоли разработчика
- При использовании `encrypt_key` убедитесь в точном совпадении с настройкой в консоли

### Неверный регион API
- При использовании тенанта Feishu (Китай) установите `use_feishu = true`
- При использовании тенанта Lark (международный) убедитесь, что `use_feishu = false` (по умолчанию)
