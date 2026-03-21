---
title: 快速上手
description: 5 分钟内运行 Fenfa 并上传第一个应用构建。
---

# 快速上手

本指南带你完成启动 Fenfa、创建产品、上传构建和分享下载页面 -- 全程不超过 5 分钟。

## 第一步：启动 Fenfa

```bash
docker run -d --name fenfa -p 8000:8000 fenfa/fenfa:latest
```

在浏览器中打开 `http://localhost:8000/admin`，使用默认管理 Token `dev-admin-token` 登录。

## 第二步：创建产品

1. 在管理后台侧边栏点击 **产品**。
2. 点击 **创建产品**。
3. 填写产品信息：
   - **名称**：应用名称（如 "MyApp"）
   - **Slug**：URL 友好的标识符（如 "myapp"）-- 将成为下载页面的 URL
   - **描述**：应用的简要描述
4. 点击 **保存**。

## 第三步：添加变体

变体代表一个平台构建目标。每个产品可以有多个变体（iOS、Android、macOS 等）。

1. 打开刚创建的产品。
2. 点击 **添加变体**。
3. 配置变体：
   - **平台**：选择目标平台（如 "ios"）
   - **显示名称**：易读的名称（如 "iOS App Store"）
   - **标识符**：Bundle ID 或包名（如 "com.example.myapp"）
   - **架构**：CPU 架构（如 "arm64"）
   - **安装包类型**：文件类型（如 "ipa"、"apk"、"dmg"）
4. 点击 **保存**。

## 第四步：上传构建

### 通过管理后台

1. 导航到你创建的变体。
2. 点击 **上传发布**。
3. 选择构建文件（IPA、APK、DMG 等）。
4. 填写版本号和更新日志（可选 -- Fenfa 可从 IPA/APK 元数据自动检测）。
5. 点击 **上传**。

### 通过 API（CI/CD）

从构建流水线直接上传：

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: dev-upload-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.0.0" \
  -F "changelog=初始发布"
```

::: tip 智能上传
使用智能上传端点自动检测元数据：
```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: dev-admin-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa"
```
自动从上传包中提取 Bundle ID、版本号、构建号和图标。
:::

## 第五步：分享下载页面

你的应用现在可通过以下地址访问：

```
http://localhost:8000/products/myapp
```

页面特性：

- **平台检测** -- 根据访问者的设备自动显示对应的下载按钮。
- **二维码** -- 扫码即可在移动设备上打开下载页面。
- **版本更新日志** -- 每个发布版本显示其版本号和更新日志。
- **iOS OTA 安装** -- iOS 构建使用 `itms-services://` 协议直接安装（生产环境需要 HTTPS）。

将此 URL 或二维码分享给测试人员和相关人员。

## 下一步

| 目标 | 指南 |
|------|------|
| 设置 iOS ad-hoc 分发与 UDID 绑定 | [iOS 分发](../distribution/ios) |
| 配置 S3/R2 实现可扩展文件存储 | [配置参考](../configuration/) |
| 从 CI/CD 自动化上传 | [上传 API](../api/upload) |
| 在 Nginx 后部署并启用 HTTPS | [生产环境部署](../deployment/production) |
| 添加 Android、macOS 和 Windows 变体 | [平台变体](../products/variants) |
