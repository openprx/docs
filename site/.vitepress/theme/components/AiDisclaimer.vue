<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page, lang } = useData()

const i18n: Record<string, { text: string; link: string }> = {
  'en-US': {
    text: 'This page was generated and translated with the assistance of AI. If you spot any inaccuracies, feel free to help improve it.',
    link: 'Edit on GitHub',
  },
  'zh-CN': {
    text: '\u672C\u9875\u5185\u5BB9\u7531 AI \u8F85\u52A9\u751F\u6210\u4E0E\u7FFB\u8BD1\uFF0C\u5982\u6709\u4E0D\u5F53\u4E4B\u5904\uFF0C\u6B22\u8FCE\u534F\u52A9\u6539\u8FDB\u3002',
    link: '\u5728 GitHub \u4E0A\u7F16\u8F91',
  },
  'ja-JP': {
    text: '\u3053\u306E\u30DA\u30FC\u30B8\u306F AI \u306E\u652F\u63F4\u306B\u3088\u308A\u4F5C\u6210\u30FB\u7FFB\u8A33\u3055\u308C\u307E\u3057\u305F\u3002\u8AA4\u308A\u304C\u3042\u308C\u3070\u3001\u6539\u5584\u306B\u3054\u5354\u529B\u304F\u3060\u3055\u3044\u3002',
    link: 'GitHub \u3067\u7DE8\u96C6',
  },
  'ko-KR': {
    text: '\uC774 \uD398\uC774\uC9C0\uB294 AI\uC758 \uB3C4\uC6C0\uC73C\uB85C \uC791\uC131 \uBC0F \uBC88\uC5ED\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBD80\uC815\uD655\uD55C \uB0B4\uC6A9\uC774 \uC788\uC73C\uBA74 \uAC1C\uC120\uC5D0 \uCC38\uC5EC\uD574 \uC8FC\uC138\uC694.',
    link: 'GitHub\uC5D0\uC11C \uD3B8\uC9D1',
  },
  'es-ES': {
    text: 'Esta p\u00E1gina fue generada y traducida con asistencia de IA. Si encuentra alguna imprecisi\u00F3n, no dude en ayudar a mejorarla.',
    link: 'Editar en GitHub',
  },
  'fr-FR': {
    text: "Cette page a \u00E9t\u00E9 g\u00E9n\u00E9r\u00E9e et traduite avec l'aide de l'IA. Si vous remarquez des inexactitudes, n'h\u00E9sitez pas \u00E0 contribuer.",
    link: 'Modifier sur GitHub',
  },
  'de-DE': {
    text: 'Diese Seite wurde mit KI-Unterst\u00FCtzung erstellt und \u00FCbersetzt. Falls Ihnen Ungenauigkeiten auffallen, helfen Sie gerne bei der Verbesserung.',
    link: 'Auf GitHub bearbeiten',
  },
  'ar-SA': {
    text: '\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u0648\u062A\u0631\u062C\u0645\u062A\u0647\u0627 \u0628\u0645\u0633\u0627\u0639\u062F\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A. \u0625\u0630\u0627 \u0644\u0627\u062D\u0638\u062A \u0623\u064A \u0623\u062E\u0637\u0627\u0621\u060C \u0644\u0627 \u062A\u062A\u0631\u062F\u062F \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0641\u064A \u062A\u062D\u0633\u064A\u0646\u0647\u0627.',
    link: '\u062A\u0639\u062F\u064A\u0644 \u0639\u0644\u0649 GitHub',
  },
  'ru-RU': {
    text: '\u042D\u0442\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0430 \u0438 \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043D\u0430 \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0418\u0418. \u0415\u0441\u043B\u0438 \u0432\u044B \u0437\u0430\u043C\u0435\u0442\u0438\u043B\u0438 \u043D\u0435\u0442\u043E\u0447\u043D\u043E\u0441\u0442\u0438, \u043F\u043E\u043C\u043E\u0433\u0438\u0442\u0435 \u043D\u0430\u043C \u0443\u043B\u0443\u0447\u0448\u0438\u0442\u044C \u0435\u0451.',
    link: '\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043D\u0430 GitHub',
  },
  'ka-GE': {
    text: '\u10D4\u10E1 \u10D2\u10D5\u10D4\u10E0\u10D3\u10D8 \u10E8\u10D4\u10D8\u10E5\u10DB\u10DC\u10D0 \u10D3\u10D0 \u10D8\u10D7\u10D0\u10E0\u10D2\u10DB\u10DC\u10D0 \u10EE\u10D4\u10DA\u10DD\u10D5\u10DC\u10E3\u10E0\u10D8 \u10D8\u10DC\u10E2\u10D4\u10DA\u10D4\u10E5\u10E2\u10D8\u10E1 \u10D3\u10D0\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10D8\u10D7. \u10D7\u10E3 \u10E8\u10D4\u10D0\u10DB\u10E9\u10DC\u10D4\u10D5\u10D7 \u10E3\u10D6\u10E3\u10E1\u10E2\u10DD\u10D1\u10D0\u10E1, \u10D2\u10D7\u10EE\u10DD\u10D5\u10D7, \u10D3\u10D0\u10D2\u10D5\u10D4\u10EE\u10DB\u10D0\u10E0\u10D4\u10D7 \u10D2\u10D0\u10E3\u10DB\u10EF\u10DD\u10D1\u10D4\u10E1\u10D4\u10D1\u10D0\u10E8\u10D8.',
    link: 'GitHub-\u10D6\u10D4 \u10E0\u10D4\u10D3\u10D0\u10E5\u10E2\u10D8\u10E0\u10D4\u10D1\u10D0',
  },
}

const t = computed(() => i18n[lang.value] || i18n['en-US'])

const editUrl = computed(() => {
  const path = page.value.relativePath
  return `https://github.com/openprx/docs/edit/main/site/${path}`
})
</script>

<template>
  <div class="ai-disclaimer">
    <span class="ai-disclaimer-text">{{ t.text }}</span>
    <a class="ai-disclaimer-link" :href="editUrl" target="_blank" rel="noopener noreferrer">
      <svg class="ai-disclaimer-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
      </svg>
      {{ t.link }}
    </a>
  </div>
</template>

<style scoped>
.ai-disclaimer {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
  border-left: 2px solid var(--vp-c-brand-1, #6366F1);
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.06);
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  flex-wrap: wrap;
}

.dark .ai-disclaimer {
  background: rgba(99, 102, 241, 0.10);
}

.ai-disclaimer-text {
  flex: 1 1 auto;
  min-width: 200px;
}

.ai-disclaimer-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--vp-c-brand-1, #6366F1);
  text-decoration: none;
  white-space: nowrap;
  font-weight: 500;
  flex-shrink: 0;
}

.ai-disclaimer-link:hover {
  text-decoration: underline;
}

.ai-disclaimer-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
