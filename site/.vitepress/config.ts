import { defineConfig } from 'vitepress'
import { enConfig } from './locales/en'
import { zhConfig } from './locales/zh'

export default defineConfig({
  title: 'OpenPRX Docs',
  description: 'Documentation for the OpenPRX ecosystem',

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap', rel: 'stylesheet' }],
    ['meta', { name: 'theme-color', content: '#6366F1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'OpenPRX Docs' }],
  ],

  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'one-dark-pro',
    },
    lineNumbers: true,
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'OpenPRX',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/openprx' },
    ],

    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
              },
            },
          },
        },
      },
    },

    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: 'Copyright © 2026 OpenPRX',
    },
  },

  locales: {
    en: {
      label: 'English',
      lang: 'en-US',
      ...enConfig,
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      ...zhConfig,
    },
  },
})
