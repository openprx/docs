import { defineConfig } from 'vitepress'
import { enConfig } from './locales/en'
import { zhConfig } from './locales/zh'
import { jaConfig } from './locales/ja'
import { koConfig } from './locales/ko'
import { esConfig } from './locales/es'
import { frConfig } from './locales/fr'
import { deConfig } from './locales/de'
import { arConfig } from './locales/ar'
import { ruConfig } from './locales/ru'
import { kaConfig } from './locales/ka'

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
          ja: {
            translations: {
              button: { buttonText: 'ドキュメント検索', buttonAriaLabel: 'ドキュメント検索' },
              modal: {
                noResultsText: '結果が見つかりませんでした',
                resetButtonTitle: '検索条件をクリア',
                footer: { selectText: '選択', navigateText: '移動', closeText: '閉じる' },
              },
            },
          },
          ko: {
            translations: {
              button: { buttonText: '문서 검색', buttonAriaLabel: '문서 검색' },
              modal: {
                noResultsText: '관련 결과를 찾을 수 없습니다',
                resetButtonTitle: '검색 조건 초기화',
                footer: { selectText: '선택', navigateText: '이동', closeText: '닫기' },
              },
            },
          },
          es: {
            translations: {
              button: { buttonText: 'Buscar documentos', buttonAriaLabel: 'Buscar documentos' },
              modal: {
                noResultsText: 'No se encontraron resultados',
                resetButtonTitle: 'Limpiar busqueda',
                footer: { selectText: 'Seleccionar', navigateText: 'Navegar', closeText: 'Cerrar' },
              },
            },
          },
          fr: {
            translations: {
              button: { buttonText: 'Rechercher', buttonAriaLabel: 'Rechercher dans la documentation' },
              modal: {
                noResultsText: 'Aucun resultat trouve',
                resetButtonTitle: 'Effacer la recherche',
                footer: { selectText: 'Selectionner', navigateText: 'Naviguer', closeText: 'Fermer' },
              },
            },
          },
          de: {
            translations: {
              button: { buttonText: 'Dokumentation durchsuchen', buttonAriaLabel: 'Dokumentation durchsuchen' },
              modal: {
                noResultsText: 'Keine Ergebnisse gefunden',
                resetButtonTitle: 'Suche zurucksetzen',
                footer: { selectText: 'Auswahlen', navigateText: 'Navigieren', closeText: 'Schliessen' },
              },
            },
          },
          ar: {
            translations: {
              button: { buttonText: 'البحث في المستندات', buttonAriaLabel: 'البحث في المستندات' },
              modal: {
                noResultsText: 'لم يتم العثور على نتائج',
                resetButtonTitle: 'مسح البحث',
                footer: { selectText: 'اختيار', navigateText: 'تنقل', closeText: 'اغلاق' },
              },
            },
          },
          ru: {
            translations: {
              button: { buttonText: 'Поиск по документации', buttonAriaLabel: 'Поиск по документации' },
              modal: {
                noResultsText: 'Ничего не найдено',
                resetButtonTitle: 'Сбросить поиск',
                footer: { selectText: 'Выбрать', navigateText: 'Навигация', closeText: 'Закрыть' },
              },
            },
          },
          ka: {
            translations: {
              button: { buttonText: 'დოკუმენტაციის ძიება', buttonAriaLabel: 'დოკუმენტაციის ძიება' },
              modal: {
                noResultsText: 'შედეგები ვერ მოიძებნა',
                resetButtonTitle: 'ძიების გასუფთავება',
                footer: { selectText: 'არჩევა', navigateText: 'ნავიგაცია', closeText: 'დახურვა' },
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
    ja: {
      label: '日本語',
      lang: 'ja-JP',
      ...jaConfig,
    },
    ko: {
      label: '한국어',
      lang: 'ko-KR',
      ...koConfig,
    },
    es: {
      label: 'Español',
      lang: 'es-ES',
      ...esConfig,
    },
    fr: {
      label: 'Français',
      lang: 'fr-FR',
      ...frConfig,
    },
    de: {
      label: 'Deutsch',
      lang: 'de-DE',
      ...deConfig,
    },
    ar: {
      label: 'العربية',
      lang: 'ar-SA',
      ...arConfig,
    },
    ru: {
      label: 'Русский',
      lang: 'ru-RU',
      ...ruConfig,
    },
    ka: {
      label: 'ქართული',
      lang: 'ka-GE',
      ...kaConfig,
    },
  },
})
