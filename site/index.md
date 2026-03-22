---
layout: page
title: OpenPRX — Open Infrastructure for the AI Era
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const langMap = {
    'zh': '/zh/',
    'ja': '/ja/',
    'ko': '/ko/',
    'es': '/es/',
    'fr': '/fr/',
    'de': '/de/',
    'ar': '/ar/',
    'ru': '/ru/',
    'ka': '/ka/',
  }

  const browserLang = navigator.language || navigator.userLanguage || ''
  const prefix = browserLang.split('-')[0].toLowerCase()
  const target = langMap[prefix] || '/en/'

  window.location.replace(target)
})
</script>

<div style="display:flex;justify-content:center;align-items:center;min-height:50vh">
  <p style="color:var(--vp-c-text-2)">Redirecting...</p>
</div>
