---
title: WhatsApp (Cloud API)
description: Подключение PRX к WhatsApp через Business Cloud API
---

# WhatsApp (Cloud API)

> Подключение PRX к WhatsApp через Meta Business Cloud API для обмена сообщениями на основе вебхуков с платформой WhatsApp Business.

## Предварительные требования

- [Бизнес-аккаунт Meta](https://business.facebook.com/)
- Приложение WhatsApp Business API, настроенное в [Meta Developer Portal](https://developers.facebook.com/)
- Phone Number ID и токен доступа из WhatsApp Business API
- Публично доступный HTTPS-эндпоинт для вебхуков

## Быстрая настройка

### 1. Настройка WhatsApp Business API

1. Перейдите в [Meta Developer Portal](https://developers.facebook.com/) и создайте приложение
2. Добавьте продукт «WhatsApp» в ваше приложение
3. В разделе «WhatsApp > API Setup» запишите **Phone Number ID** и сгенерируйте **Постоянный токен доступа**

### 2. Конфигурация PRX

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxxxxxxxxxxxxxxxxxxx"
phone_number_id = "123456789012345"
verify_token = "my-secret-verify-token"
allowed_numbers = ["+1234567890"]
```

### 3. Настройка вебхуков

1. В Meta Developer Portal перейдите в «WhatsApp > Configuration»
2. Установите URL вебхука: `https://your-domain.com/whatsapp`
3. Введите тот же `verify_token`, который вы настроили в PRX
4. Подпишитесь на поле вебхука `messages`

### 4. Проверка

```bash
prx channel doctor whatsapp
```

## Справочник конфигурации

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `access_token` | `String` | *обязательный* | Постоянный токен доступа из Meta Business API |
| `phone_number_id` | `String` | *обязательный* | Phone Number ID из Meta Business API. Наличие этого поля выбирает режим Cloud API |
| `verify_token` | `String` | *обязательный* | Общий секрет для рукопожатия верификации вебхука |
| `app_secret` | `String` | `null` | Секрет приложения для верификации подписи вебхука (HMAC-SHA256). Также может быть задан через переменную окружения `ZEROCLAW_WHATSAPP_APP_SECRET` |
| `allowed_numbers` | `[String]` | `[]` | Разрешённые номера телефонов в формате E.164 (например, `"+1234567890"`). `"*"` = разрешить все |

## Возможности

- **Обмен сообщениями через вебхуки** — получение сообщений через push-уведомления Meta
- **Фильтрация по номерам E.164** — ограничение доступа конкретными номерами телефонов
- **Обязательный HTTPS** — отказ от передачи данных через не-HTTPS URL
- **Верификация подписи вебхуков** — необязательная валидация HMAC-SHA256 с `app_secret`
- **Текстовые и медиа-сообщения** — обработка входящих текстовых сообщений, изображений и других типов медиа

## Ограничения

- Требуется публично доступный HTTPS-эндпоинт для доставки вебхуков
- Cloud API Meta имеет ограничения частоты в зависимости от вашего бизнес-уровня
- 24-часовое окно сообщений: ответ возможен только в течение 24 часов с момента последнего сообщения пользователя (если не используются шаблоны сообщений)
- Номера телефонов должны быть в формате E.164 для списка разрешённых

## Устранение неполадок

### Верификация вебхука не проходит
- Убедитесь, что `verify_token` в конфигурации PRX точно совпадает с введённым в Meta Developer Portal
- Эндпоинт вебхука должен отвечать на GET-запросы с параметром `hub.challenge`

### Сообщения не получаются
- Проверьте, что подписка вебхука включает поле `messages`
- Убедитесь, что URL вебхука публично доступен через HTTPS
- Просмотрите журналы доставки вебхуков в Meta Developer Portal

### Ошибка «Refusing to transmit over non-HTTPS»
- Все коммуникации WhatsApp Cloud API требуют HTTPS
- Убедитесь, что шлюз PRX находится за прокси с терминацией TLS (например, Caddy, Nginx с SSL)

::: tip Режим WhatsApp Web
Для нативного клиента WhatsApp Web, не требующего настройки Meta Business API, см. [WhatsApp Web](./whatsapp-web).
:::
