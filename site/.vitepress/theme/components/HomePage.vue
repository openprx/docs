<script setup lang="ts">
import { useData } from 'vitepress'

const { isDark } = useData()

const products = [
  {
    name: 'PRX',
    tagline: 'AI Agent Framework',
    description: 'Self-evolving agents that connect LLMs to messaging platforms, tools, and WASM plugins — with autonomous memory, prompt, and strategy improvement.',
    status: 'Stable',
    statusClass: 'stable',
    docsLink: '/en/prx/',
    repoLink: 'https://github.com/openprx/prx',
    highlights: ['19 Channels', '9 Providers', '46+ Tools', 'WASM Plugins'],
  },
  {
    name: 'OpenPR',
    tagline: 'Project Governance',
    description: 'Democratic project management with proposals, trust scoring, veto mechanics, and AI-assisted decision making.',
    status: 'Beta',
    statusClass: 'beta',
    docsLink: '/en/openpr/',
    repoLink: 'https://github.com/openprx/openpr',
    highlights: ['Governance', 'Trust Scoring', 'AI Participants', 'Sprint Management'],
  },
  {
    name: 'PRX-SD',
    tagline: 'Threat Detection Engine',
    description: 'Open-source malware scanner with YARA rules, hash signatures, and heuristic analysis across PE, ELF, and Mach-O binaries.',
    status: 'Beta',
    statusClass: 'beta',
    docsLink: '/en/prx-sd/',
    repoLink: 'https://github.com/openprx/prx-sd',
    highlights: ['YARA Rules', 'Hash Matching', 'Heuristic Analysis', 'Real-time Monitor'],
  },
  {
    name: 'PRX-WAF',
    tagline: 'Web Application Firewall',
    description: 'Community-driven WAF with rate limiting, IP reputation, threat intelligence feeds, and rule hot-reload.',
    status: 'Alpha',
    statusClass: 'alpha',
    docsLink: '/en/prx-waf/',
    repoLink: 'https://github.com/openprx/prx-waf',
    highlights: ['Rule Engine', 'Rate Limiting', 'IP Reputation', 'Hot Reload'],
  },
  {
    name: 'Fenfa',
    tagline: 'Distribution Platform',
    description: 'Multi-channel software distribution and deployment automation for release management.',
    status: 'Planned',
    statusClass: 'planned',
    docsLink: '#',
    repoLink: 'https://github.com/openprx/fenfa',
    highlights: ['Multi-channel', 'Release Automation', 'CDN Integration'],
  },
]

const values = [
  {
    title: 'Self-Evolving',
    description: 'Systems that learn from every interaction. Memory, prompts, and strategies improve autonomously with safety rollback.',
  },
  {
    title: 'Security First',
    description: 'Defense in depth at every layer — sandbox isolation, encrypted secrets, policy engines, and threat detection built in.',
  },
  {
    title: 'Open by Default',
    description: 'Transparent, auditable, community-driven. Apache-2.0 licensed. No vendor lock-in, no black boxes.',
  },
  {
    title: 'Rust-Powered',
    description: 'Built in Rust for memory safety, zero-cost abstractions, and production-grade reliability. No garbage collector pauses.',
  },
]
</script>

<template>
  <div class="home-container">
    <!-- Hero -->
    <section class="hero-section">
      <div class="hero-inner">
        <h1 class="hero-brand">OpenPRX</h1>
        <p class="hero-title">Open Infrastructure for the AI Era</p>
        <p class="hero-description">
          We build open-source tools that let AI agents work autonomously —
          connecting, defending, evolving, and shipping.
        </p>
        <div class="hero-actions">
          <a href="/en/prx/" class="btn btn-primary">Get Started</a>
          <a href="/zh/prx/" class="btn btn-secondary">中文文档</a>
          <a href="https://github.com/openprx" class="btn btn-ghost" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </section>

    <!-- Products -->
    <section class="products-section">
      <div class="section-inner">
        <h2 class="section-title">Products</h2>
        <div class="products-grid">
          <a
            v-for="product in products"
            :key="product.name"
            :href="product.docsLink"
            class="product-card"
            :class="{ 'is-planned': product.status === 'Planned' }"
          >
            <div class="product-header">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-status" :class="product.statusClass">{{ product.status }}</span>
            </div>
            <p class="product-tagline">{{ product.tagline }}</p>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-highlights">
              <span v-for="h in product.highlights" :key="h" class="highlight-tag">{{ h }}</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="values-section">
      <div class="section-inner">
        <h2 class="section-title">Why OpenPRX</h2>
        <div class="values-grid">
          <div v-for="v in values" :key="v.title" class="value-card">
            <h3 class="value-title">{{ v.title }}</h3>
            <p class="value-description">{{ v.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Layout */
.home-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero */
.hero-section {
  padding: 80px 0 64px;
  text-align: center;
}

.hero-brand {
  font-size: 3.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #A78BFA 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1.1;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 12px 0 0;
  letter-spacing: -0.01em;
}

.hero-description {
  font-size: 1.05rem;
  color: var(--vp-c-text-2);
  max-width: 560px;
  margin: 16px auto 0;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.btn-primary:hover {
  background: var(--vp-c-brand-3);
}

.btn-secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}
.btn-secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.btn-ghost {
  background: transparent;
  color: var(--vp-c-text-2);
  border-color: var(--vp-c-divider);
}
.btn-ghost:hover {
  border-color: var(--vp-c-text-2);
  color: var(--vp-c-text-1);
}

/* Sections */
.section-inner {
  padding: 48px 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 24px;
  letter-spacing: -0.01em;
}

/* Products */
.products-section {
  border-top: 1px solid var(--vp-c-divider);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.product-card {
  display: block;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.product-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
  transform: translateY(-2px);
}
.product-card.is-planned {
  opacity: 0.6;
  pointer-events: none;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.product-status {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.product-status.stable {
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
}
.product-status.beta {
  background: rgba(59, 130, 246, 0.12);
  color: #3B82F6;
}
.product-status.alpha {
  background: rgba(245, 158, 11, 0.12);
  color: #F59E0B;
}
.product-status.planned {
  background: rgba(100, 116, 139, 0.12);
  color: #64748B;
}

.product-tagline {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  margin: 0 0 8px;
}

.product-description {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  margin: 0 0 12px;
}

.product-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.highlight-tag {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

/* Values */
.values-section {
  border-top: 1px solid var(--vp-c-divider);
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.value-card {
  padding: 20px;
}

.value-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
}

.value-description {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  margin: 0;
}

/* Responsive */
@media (max-width: 960px) {
  .hero-brand { font-size: 2.5rem; }
  .hero-title { font-size: 1.25rem; }
  .values-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .hero-section { padding: 48px 0 40px; }
  .hero-brand { font-size: 2rem; }
  .hero-title { font-size: 1.1rem; }
  .products-grid { grid-template-columns: 1fr; }
  .values-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; align-items: center; }
}
</style>
