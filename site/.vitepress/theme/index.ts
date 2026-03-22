import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import HomePage from './components/HomePage.vue'
import AiDisclaimer from './components/AiDisclaimer.vue'
import './styles/vars.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(AiDisclaimer),
    })
  },
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  },
} satisfies Theme
