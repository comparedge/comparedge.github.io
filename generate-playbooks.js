#!/usr/bin/env node
/**
 * generate-playbooks.js
 * Generates 331 product playbook pages + index for ComparEdge Blog
 */

const fs   = require('fs');
const path = require('path');

// ─── Constants ───
const SITE_URL     = 'https://comparedge.com';
const BLOG_URL     = 'https://blog.comparedge.com';
const YEAR         = new Date().getFullYear();
const TODAY        = new Date().toISOString().split('T')[0];
const TODAY_DISPLAY = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// ─── Load products ───
const productsPath = path.join(__dirname, '../site-prototype/data/products.json');
const db           = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const products     = Array.isArray(db.products) ? db.products : Object.values(db.products);

// ─── Output directory ───
const outDir = path.join(__dirname, 'playbooks');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─── Seeded deterministic utilities ───
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return Math.abs(hash);
}
function seededFloat(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Date distribution: March 28 – April 24, 2026 ───
function getPlaybookDate(slug, index, total) {
  const seed   = hashCode(slug);
  const start  = new Date('2026-03-28').getTime();
  const end    = new Date('2026-04-24').getTime();
  const range  = end - start;
  const base   = Math.floor((index / total) * range);
  const jitter = Math.floor(seededFloat(seed) * 172800000) - 86400000; // ±1 day
  const ts     = Math.min(end, Math.max(start, start + base + jitter));
  return new Date(ts).toISOString().split('T')[0];
}

// ─── HTML helpers ───
function escHtml(s) {
  return (String(s == null ? '' : s))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stars(rating) {
  if (!rating) return '';
  const r    = parseFloat(rating);
  const full = Math.floor(r);
  const half = r - full >= 0.3 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function getAvgRating(p) {
  const r    = p.rating || {};
  const vals = [r.g2, r.capterra].filter(v => v != null);
  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
}

function getMinPaidPrice(p) {
  const plans  = p.pricing?.plans || [];
  const prices = plans.filter(pl => pl.price != null && pl.price > 0).map(pl => pl.price);
  return prices.length ? Math.min(...prices) : null;
}

function getDisplayPrice(p) {
  const mp = getMinPaidPrice(p);
  if (mp !== null) return `$${mp}/mo`;
  const tp = p.tokenPricing?.models;
  if (tp?.length) return `$${Math.min(...tp.map(m => m.input))}/1M tokens`;
  if (p.pricing?.free) return 'Free';
  return 'Custom pricing';
}

function getUseCase(uc) {
  if (!uc) return null;
  if (typeof uc === 'string') return uc;
  if (typeof uc === 'object' && uc.title) return uc.title;
  return String(uc);
}

// ─── Logo helpers ───
function logoSVG(w = 26, h = 24) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs><path d="M4 38 L20 6 L25 15 L34 5 L32 17 L42 15 L30 34 L24 25 Z" fill="none" stroke="url(#lg)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M40 6 L24 38 L19 29 L10 39 L12 27 L2 29 L14 10 L20 19 Z" fill="none" stroke="white" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.12"/></svg>`;
}

function logoWordmark(size = 17) {
  return `<span style="font-weight:800;font-size:${size}px;letter-spacing:-.3px;background:linear-gradient(90deg,#3b82f6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">ComparEdge</span><span style="font-weight:700;font-size:${size}px;letter-spacing:-.3px;background:linear-gradient(90deg,#06b6d4,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Blog</span>`;
}

// ─── CSS ───
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
:root{--bg:#0a0a0f;--surface:#0f1119;--surface2:#141620;--border:#1e2433;--accent:#00e5ff;--accent2:#8b5cf6;--accent3:#3b82f6;--text:#e2e8f0;--text-dim:#64748b;--text-muted:#334155;}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.75;font-size:17px}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--accent2);border-radius:3px}
a{color:var(--accent);text-decoration:none}a:hover{color:var(--accent);opacity:.85}
.site-logo:hover{text-decoration:none!important;opacity:1!important}
.container{max-width:1200px;margin:0 auto;padding:24px 24px}
.fade-in{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}.fade-in.visible{opacity:1;transform:none}
header{height:60px;border-bottom:1px solid var(--border);position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(10,10,15,.88);backdrop-filter:blur(16px)}
header nav{display:flex;align-items:center;justify-content:center;height:100%;max-width:1200px;margin:0 auto;padding:0 24px;gap:40px}
.site-logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}
.nav-center{display:flex;gap:28px;align-items:center}
.nav-center a{font-family:'Space Mono',monospace;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;text-decoration:none;transition:color .2s}
.nav-center a:hover{color:#00e5ff;text-decoration:none}
.nav-center a.nav-active{color:#00e5ff}
.burger{display:none;background:none;border:none;cursor:pointer;padding:6px}
.burger svg{display:block}
.mobile-menu{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,15,.98);z-index:200;flex-direction:column;padding:24px}
.mobile-menu.open{display:flex}
.mobile-menu-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px}
.mobile-menu-close{background:none;border:none;cursor:pointer;padding:6px}
.mobile-menu a{display:block;font-family:'Space Mono',monospace;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim);padding:16px 0;border-bottom:1px solid var(--border);text-decoration:none}
.mobile-menu a:hover{color:#00e5ff;text-decoration:none}
.mobile-menu a.primary-link{color:var(--accent);font-weight:700}
main{padding-top:60px}
.breadcrumb{font-family:'Space Mono',monospace;font-size:0.72rem;color:var(--text-dim);margin-bottom:20px;letter-spacing:0.03em}
.breadcrumb a{color:var(--text-dim)}.breadcrumb a:hover{color:var(--text)}
.hero{background:linear-gradient(135deg,#080d1e 0%,#0a0f1e 100%);border:1px solid var(--border);border-radius:16px;padding:44px 40px;margin-bottom:36px}
.category-tag{display:inline-block;font-family:'Space Mono',monospace;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.25);color:var(--accent);border-radius:20px;padding:4px 14px;margin-bottom:18px}
.hero h1{font-family:system-ui,-apple-system,sans-serif;font-size:2.1em;font-weight:800;line-height:1.2;color:#fff;margin-bottom:14px;letter-spacing:-0.02em}
.hero-subtitle{color:var(--text-dim);font-size:1.05em;margin-bottom:24px;line-height:1.6}
.hero-stats{display:flex;flex-wrap:wrap;gap:28px;margin-top:12px}
.stat{display:flex;flex-direction:column;align-items:flex-start}
.stat-num{font-family:system-ui,-apple-system,sans-serif;font-size:1.8em;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.1}
.stat-label{font-family:'Space Mono',monospace;font-size:0.6rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin-top:2px}
.meta{font-family:'Space Mono',monospace;font-size:0.65rem;color:var(--text-dim);margin-bottom:20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;letter-spacing:0.03em}
.meta-sep{color:var(--border)}
.updated{display:inline-flex;align-items:center;gap:5px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:3px 10px;font-size:0.6rem;color:var(--text-dim);font-family:'Space Mono',monospace}
.updated .dot{width:7px;height:7px;background:#10b981;border-radius:50%;flex-shrink:0;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.toc{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin:0 0 36px}
.toc h4{font-family:'Space Mono',monospace;color:var(--text-dim);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px}
.toc ol{margin:0 0 0 18px}.toc li{margin-bottom:6px}.toc a{color:var(--accent);font-size:15px}
h1{font-family:system-ui,-apple-system,sans-serif;font-size:2.2em;font-weight:800;line-height:1.2;color:#fff;margin-bottom:10px;letter-spacing:-0.02em}
h2{font-family:system-ui,-apple-system,sans-serif;font-size:1.4em;font-weight:700;margin:40px 0 14px;color:var(--text);border-left:3px solid var(--accent);padding-left:14px;scroll-margin-top:88px;letter-spacing:-0.01em}
h3{font-family:system-ui,-apple-system,sans-serif;font-size:1.12em;font-weight:700;margin:24px 0 10px;color:var(--text)}
p{margin-bottom:18px;color:var(--text-dim)}
strong{color:var(--text)}
.section-label{display:flex;align-items:center;gap:10px;font-family:'Space Mono',monospace;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-dim);margin-bottom:24px;margin-top:8px}
.section-label::before{content:'';display:block;width:24px;height:2px;background:var(--accent)}
.takeaway{border-left:4px solid var(--accent);background:#050d10;padding:16px 20px;border-radius:0 10px 10px 0;margin:24px 0;color:var(--text-dim)}
.takeaway strong{color:#67e8f9}
.takeaway.green{border-color:#10b981;background:#0a1f18}.takeaway.green strong{color:#6ee7b7}
.takeaway.yellow{border-color:#f59e0b;background:#1a1505}.takeaway.yellow strong{color:#fcd34d}
.table-wrap{overflow-x:auto;margin:16px 0 28px;border-radius:10px;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse;font-size:15px}
th{background:var(--surface);color:var(--text);padding:12px 14px;text-align:left;font-weight:600;border-bottom:1px solid var(--border);white-space:nowrap;font-family:'Space Mono',monospace;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em}
td{padding:11px 14px;border-bottom:1px solid var(--surface2);color:var(--text-dim);vertical-align:middle}
tr:last-child td{border-bottom:none}tr:hover td{background:#0a0a12}
.rank-badge{display:inline-block;background:linear-gradient(135deg,var(--accent3),var(--accent2));color:#fff;border-radius:6px;padding:1px 8px;font-size:12px;font-weight:700;margin-right:4px;font-family:'Space Mono',monospace}
.pros-cons{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0 24px}
.pros,.cons{background:var(--surface);border-radius:10px;padding:18px;border:1px solid var(--border)}
.pros{border-top:2px solid #10b981}.cons{border-top:2px solid #ef4444}
.pros h3{color:#10b981;font-size:0.65rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;font-family:'Space Mono',monospace}
.cons h3{color:#ef4444;font-size:0.65rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;font-family:'Space Mono',monospace}
.pros li::marker{color:#10b981}.cons li::marker{color:#ef4444}
ul,ol{margin:0 0 18px 20px;color:var(--text-dim)}
li{margin-bottom:7px;font-size:15px}
.highlight{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px 24px;margin:24px 0}
.highlight h3{font-family:system-ui,-apple-system,sans-serif;margin-top:0;margin-bottom:10px;color:var(--text)}
.faq{margin:8px 0 32px}
.faq-item{border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden}
.faq-q{background:var(--surface);padding:16px 20px;color:var(--text);font-weight:600;font-size:15px;cursor:pointer;font-family:system-ui,-apple-system,sans-serif}
.faq-a{padding:16px 20px;background:var(--bg);color:var(--text-dim);font-size:15px;border-top:1px solid var(--border)}
.cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0369a1,#7c3aed);color:#fff!important;padding:12px 26px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none!important;transition:opacity .2s}
.cta:hover{opacity:.85;text-decoration:none!important}
.tag{display:inline-block;font-family:'Space Mono',monospace;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.06em;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:2px 9px;color:var(--text-dim);margin:0 4px 4px 0}
.feature-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:16px 0 28px}
.feature-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px 18px}
.feature-card h4{color:var(--text);font-size:0.95em;margin-bottom:6px}
.feature-card p{color:var(--text-dim);font-size:13px;margin:0}
.metric-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--surface2)}
.metric-row:last-child{border-bottom:none}
.metric-label{color:var(--text-dim);font-size:14px}
.metric-value{color:var(--accent);font-weight:700;font-family:'Space Mono',monospace;font-size:14px}
.pill-row{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 20px}
.pill{display:inline-block;background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 14px;font-size:13px;color:var(--text-dim)}
.pill.green{border-color:#10b98140;background:#10b98110;color:#10b981}
.pill.blue{border-color:#3b82f640;background:#3b82f610;color:#60a5fa}
.pill.purple{border-color:#8b5cf640;background:#8b5cf610;color:#a78bfa}
/* Article grid (for index) */
.article-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:24px}
.article-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:all .25s;display:flex;flex-direction:column;text-decoration:none!important}
.article-card:hover{border-color:rgba(0,229,255,.5);transform:translateY(-3px);box-shadow:0 0 20px rgba(0,229,255,.08)}
.article-card .card-img{height:120px;flex-shrink:0;overflow:hidden}
.article-card .card-img svg{display:block;width:100%;height:100%}
.article-card .card-body{padding:16px;flex:1;display:flex;flex-direction:column}
.article-card .card-tag-pill{display:inline-block;font-family:'Space Mono',monospace;font-size:0.55rem;text-transform:uppercase;letter-spacing:0.08em;padding:2px 8px;border-radius:20px;margin-bottom:8px;align-self:flex-start}
.article-card h3{font-family:system-ui,-apple-system,sans-serif;font-size:0.95rem;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:8px}
.article-card .card-footer{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border)}
.article-card .card-date{font-family:'Space Mono',monospace;font-size:0.55rem;color:var(--text-muted)}
.article-card .card-read{font-family:'Space Mono',monospace;font-size:0.6rem;color:var(--accent);text-transform:uppercase;letter-spacing:0.06em}
.filter-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}
.filter-pill{font-family:'Space Mono',monospace;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;padding:6px 16px;border-radius:20px;border:1px solid var(--border);color:var(--text-dim);background:none;cursor:pointer;transition:all .2s}
.filter-pill:hover{border-color:var(--accent);color:var(--accent)}
.filter-pill.active{background:rgba(0,229,255,.08);border-color:var(--accent);color:var(--accent)}
.search-wrap{margin-bottom:24px}
.search-wrap input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 18px;color:var(--text);font-size:15px;outline:none;transition:border-color .2s}
.search-wrap input:focus{border-color:var(--accent)}
.search-wrap input::placeholder{color:var(--text-muted)}
/* Footer */
footer{border-top:1px solid var(--border);margin-top:80px;padding:48px 0 28px;background:var(--surface)}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;max-width:1100px;margin:0 auto;padding:0 24px 36px;border-bottom:1px solid var(--border)}
.footer-brand p{color:var(--text-dim);font-size:14px;margin-top:12px;line-height:1.7;max-width:240px}
.footer-col h4{font-family:'Space Mono',monospace;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-dim);margin-bottom:16px}
.footer-col a{display:block;color:var(--text-dim);font-size:14px;margin-bottom:8px;text-decoration:none}
.footer-col a:hover{color:var(--accent)}
.footer-bottom{max-width:1100px;margin:0 auto;padding:20px 24px 0;display:flex;align-items:center;justify-content:space-between;color:var(--text-muted);font-size:13px;font-family:'Space Mono',monospace}
.footer-bottom a{color:var(--text-dim)}
@media(max-width:768px){
  .article-grid{grid-template-columns:repeat(2,1fr)}
  .footer-grid{grid-template-columns:1fr 1fr;gap:28px}
  .pros-cons{grid-template-columns:1fr}
  .feature-grid{grid-template-columns:1fr}
}
@media(max-width:640px){
  .article-grid{grid-template-columns:1fr}
  .hero{padding:28px 20px}.hero h1{font-size:1.5em}
  h1{font-size:1.6em}h2{font-size:1.2em}
  body{font-size:16px}
  header nav{padding:0 16px}
  .nav-center{display:none}.burger{display:block}
  .container{padding:16px 14px}
  .footer-grid{grid-template-columns:1fr}
  .footer-bottom{flex-direction:column;gap:8px;text-align:center}
}
`;

// ─── Nav HTML ───
function navHTML() {
  return `<header>
<nav>
  <a href="${BLOG_URL}/" class="site-logo">${logoSVG()}${logoWordmark()}</a>
  <div class="nav-center">
    <a href="${BLOG_URL}/">Home</a>
    <a href="${BLOG_URL}/playbooks/" class="nav-active">Playbooks</a>
    <a href="${SITE_URL}" target="_blank" rel="noopener">ComparEdge</a>
    <a href="${SITE_URL}/compare" target="_blank" rel="noopener">Compare</a>
    <a href="${SITE_URL}/pricing" target="_blank" rel="noopener">Pricing</a>
  </div>
  <button class="burger" onclick="document.getElementById('mob-menu').classList.add('open')" aria-label="Open menu">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>
</nav>
</header>
<div id="mob-menu" class="mobile-menu">
  <div class="mobile-menu-header">
    <a href="${BLOG_URL}/" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px">${logoSVG(22, 20)}${logoWordmark(15)}</a>
    <button class="mobile-menu-close" onclick="document.getElementById('mob-menu').classList.remove('open')" aria-label="Close">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <a href="${BLOG_URL}/">Home</a>
  <a href="${BLOG_URL}/playbooks/">Playbooks</a>
  <a href="${SITE_URL}" target="_blank" rel="noopener" class="primary-link">ComparEdge →</a>
  <a href="${SITE_URL}/compare" target="_blank" rel="noopener">Compare</a>
  <a href="${SITE_URL}/pricing" target="_blank" rel="noopener">Pricing</a>
</div>`;
}

// ─── Footer HTML ───
function footerHTML() {
  return `<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <a href="${BLOG_URL}/" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">${logoSVG(22, 20)}${logoWordmark(15)}</a>
      <p>Data-driven SaaS & AI intelligence. Independent comparisons, real pricing data, and market analysis for ${YEAR} and beyond.</p>
    </div>
    <div class="footer-col">
      <h4>Pages</h4>
      <a href="${BLOG_URL}/">Home</a>
      <a href="${BLOG_URL}/playbooks/">All Playbooks</a>
      <a href="${SITE_URL}/compare" target="_blank" rel="noopener">Compare Tools</a>
    </div>
    <div class="footer-col">
      <h4>Topics</h4>
      <a href="${BLOG_URL}/cheapest-llm-api-pricing.html">LLM Pricing</a>
      <a href="${BLOG_URL}/chatgpt-vs-claude.html">ChatGPT vs Claude</a>
      <a href="${BLOG_URL}/cursor-vs-github-copilot.html">AI Coding Tools</a>
      <a href="${BLOG_URL}/best-free-llm.html">Free LLMs</a>
    </div>
    <div class="footer-col">
      <h4>Connect</h4>
      <a href="${SITE_URL}" target="_blank" rel="noopener">ComparEdge.com</a>
      <a href="${SITE_URL}/submit" target="_blank" rel="noopener">Submit a Tool</a>
      <a href="https://github.com/comparedge" target="_blank" rel="noopener">GitHub</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© ${YEAR} ComparEdge · <a href="${SITE_URL}">comparedge.com</a></span>
    <span>Data updated ${TODAY_DISPLAY}</span>
  </div>
</footer>`;
}

// ─── Page wrapper ───
function htmlPage({ title, desc, canonical, body, schemas, extraCss = '' }) {
  const schemaArr = Array.isArray(schemas) ? schemas : [schemas];
  const schemaHtml = schemaArr.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${escHtml(title)}">
<meta property="og:description" content="${escHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ComparEdge Blog">
<meta property="og:image" content="${SITE_URL}/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(title)}">
<meta name="twitter:description" content="${escHtml(desc)}">
<link rel="icon" href="${SITE_URL}/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${schemaHtml}
<style>${CSS}${extraCss}</style>
</head>
<body>
${navHTML()}
<main class="container">
${body}
</main>
${footerHTML()}
<script>
(function(){
  var els=document.querySelectorAll('.fade-in');
  if(!els.length)return;
  var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:0.1});
  els.forEach(function(el){io.observe(el);});
})();
</script>
</body>
</html>`;
}

// ─── Template type mapping ───
const TEMPLATE_MAP = {
  'llm':                       'llm',
  'ai-coding':                 'ai-coding',
  'ai-image':                  'creative',
  'ai-video':                  'creative',
  'ai-voice':                  'creative',
  'design-tools':              'creative',
  'crm':                       'crm',
  'project-management':        'pm',
  'email-marketing':           'marketing',
  'cloud-hosting':             'cloud',
  'crypto-wallets':            'crypto',
  'crypto-trading-bots':       'crypto',
  'crypto-analytics':          'crypto',
  'crypto-exchanges':          'crypto',
  'crypto-telegram-bots':      'crypto',
  'dex':                       'crypto',
  'crypto-tax':                'crypto',
  'crypto-portfolio-trackers': 'crypto',
  'defi-tools':                'crypto',
  'video-conferencing':        'video-conf',
};

function getTemplateType(category) {
  return TEMPLATE_MAP[category] || 'general';
}

// ─── Category colors for SVG ───
const CAT_COLORS = {
  'llm':        { c1: '#3b82f6', c2: '#06b6d4', label: 'AI · LLM' },
  'ai-coding':  { c1: '#10b981', c2: '#14b8a6', label: 'AI Coding' },
  'creative':   { c1: '#8b5cf6', c2: '#ec4899', label: 'Creative AI' },
  'crm':        { c1: '#f97316', c2: '#f59e0b', label: 'CRM · Sales' },
  'pm':         { c1: '#6366f1', c2: '#3b82f6', label: 'Project Mgmt' },
  'marketing':  { c1: '#f43f5e', c2: '#ec4899', label: 'Marketing' },
  'cloud':      { c1: '#0ea5e9', c2: '#3b82f6', label: 'Cloud · DevOps' },
  'crypto':     { c1: '#eab308', c2: '#f97316', label: 'Crypto · Web3' },
  'video-conf': { c1: '#14b8a6', c2: '#06b6d4', label: 'Video · Comms' },
  'general':    { c1: '#64748b', c2: '#3b82f6', label: 'Productivity' },
};

// ─── Animated SVG per product ───
function playbookSVG(product, idx, tmpl) {
  const col   = CAT_COLORS[tmpl] || CAT_COLORS['general'];
  const c1    = col.c1;
  const c2    = col.c2;
  const label = col.label;
  const name  = product.name.length > 18 ? product.name.slice(0, 16) + '…' : product.name;
  const price = getDisplayPrice(product);
  const rating = getAvgRating(product);
  const gid   = `g${idx}`;

  // Different SVG shapes per template type
  const shapes = {
    'llm': `
      <circle cx="200" cy="70" r="45" fill="none" stroke="url(#${gid})" stroke-width="1.5" opacity="0.6">
        <animate attributeName="r" values="42;48;42" dur="4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="70" r="28" fill="${c1}18">
        <animate attributeName="r" values="26;30;26" dur="3s" repeatCount="indefinite"/>
      </circle>
      <line x1="120" y1="70" x2="155" y2="70" stroke="${c1}" stroke-width="1" opacity="0.5">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite"/>
      </line>
      <line x1="245" y1="70" x2="280" y2="70" stroke="${c2}" stroke-width="1" opacity="0.5">
        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>
      </line>
      <circle cx="200" cy="70" r="8" fill="${c1}">
        <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>`,
    'ai-coding': `
      <rect x="130" y="30" width="140" height="90" rx="6" fill="none" stroke="url(#${gid})" stroke-width="1.5" opacity="0.7"/>
      <line x1="140" y1="50" x2="200" y2="50" stroke="${c1}" stroke-width="2" opacity="0.8">
        <animate attributeName="x2" values="150;210;150" dur="3s" repeatCount="indefinite"/>
      </line>
      <line x1="140" y1="65" x2="230" y2="65" stroke="${c2}" stroke-width="2" opacity="0.6">
        <animate attributeName="x2" values="180;240;180" dur="4s" repeatCount="indefinite"/>
      </line>
      <line x1="140" y1="80" x2="185" y2="80" stroke="${c1}" stroke-width="2" opacity="0.5">
        <animate attributeName="x2" values="160;200;160" dur="2.5s" repeatCount="indefinite"/>
      </line>
      <rect x="250" y="48" width="6" height="14" rx="2" fill="${c2}">
        <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
      </rect>`,
    'creative': `
      <ellipse cx="200" cy="68" rx="70" ry="42" fill="none" stroke="url(#${gid})" stroke-width="1.5" opacity="0.6">
        <animate attributeName="rx" values="65;75;65" dur="5s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="38;46;38" dur="5s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="170" cy="55" r="18" fill="${c1}20">
        <animate attributeName="cx" values="165;175;165" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="230" cy="82" r="14" fill="${c2}20">
        <animate attributeName="cy" values="78;86;78" dur="3.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="68" r="5" fill="${c1}">
        <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/>
      </circle>`,
    'crm': `
      <circle cx="150" cy="70" r="20" fill="none" stroke="${c1}" stroke-width="1.5" opacity="0.7"/>
      <circle cx="200" cy="45" r="20" fill="none" stroke="url(#${gid})" stroke-width="1.5" opacity="0.7"/>
      <circle cx="250" cy="70" r="20" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.7"/>
      <line x1="168" y1="62" x2="182" y2="53" stroke="${c1}" stroke-width="1" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite"/>
      </line>
      <line x1="218" y1="53" x2="232" y2="62" stroke="${c2}" stroke-width="1" opacity="0.6">
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite"/>
      </line>
      <circle cx="200" cy="45" r="6" fill="${c1}">
        <animate attributeName="r" values="5;8;5" dur="3s" repeatCount="indefinite"/>
      </circle>`,
    'pm': `
      <rect x="120" y="35" width="50" height="30" rx="4" fill="${c1}20" stroke="${c1}" stroke-width="1.2" opacity="0.8"/>
      <rect x="175" y="55" width="50" height="30" rx="4" fill="${c2}20" stroke="${c2}" stroke-width="1.2" opacity="0.8"/>
      <rect x="230" y="35" width="50" height="30" rx="4" fill="${c1}20" stroke="${c1}" stroke-width="1.2" opacity="0.8"/>
      <line x1="170" y1="50" x2="175" y2="62" stroke="${c1}" stroke-width="1" opacity="0.5"/>
      <line x1="225" y1="70" x2="230" y2="58" stroke="${c2}" stroke-width="1" opacity="0.5"/>
      <rect x="155" y="80" width="90" height="18" rx="3" fill="${c2}15" stroke="${c2}" stroke-width="1" opacity="0.6">
        <animate attributeName="width" values="70;100;70" dur="4s" repeatCount="indefinite"/>
      </rect>`,
    'marketing': `
      <path d="M120 90 Q160 20 200 60 Q240 100 280 40" fill="none" stroke="url(#${gid})" stroke-width="2.5" opacity="0.7">
        <animate attributeName="d" values="M120 90 Q160 20 200 60 Q240 100 280 40;M120 80 Q160 30 200 70 Q240 90 280 50;M120 90 Q160 20 200 60 Q240 100 280 40" dur="5s" repeatCount="indefinite"/>
      </path>
      <circle cx="200" cy="60" r="5" fill="${c1}">
        <animate attributeName="cy" values="60;70;60" dur="5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="250" cy="65" r="4" fill="${c2}" opacity="0.8">
        <animate attributeName="cy" values="65;55;65" dur="3.5s" repeatCount="indefinite"/>
      </circle>`,
    'cloud': `
      <rect x="110" y="90" width="180" height="2" rx="1" fill="${c1}" opacity="0.3"/>
      <rect x="140" y="60" width="2" height="30" rx="1" fill="${c1}" opacity="0.6">
        <animate attributeName="height" values="20;40;20" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="y" values="70;50;70" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="165" y="50" width="2" height="40" rx="1" fill="${c2}" opacity="0.6">
        <animate attributeName="height" values="30;55;30" dur="4s" repeatCount="indefinite"/>
        <animate attributeName="y" values="60;35;60" dur="4s" repeatCount="indefinite"/>
      </rect>
      <rect x="190" y="40" width="2" height="50" rx="1" fill="${c1}" opacity="0.8">
        <animate attributeName="height" values="40;65;40" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="y" values="50;25;50" dur="2.5s" repeatCount="indefinite"/>
      </rect>
      <rect x="215" y="55" width="2" height="35" rx="1" fill="${c2}" opacity="0.6">
        <animate attributeName="height" values="25;45;25" dur="3.8s" repeatCount="indefinite"/>
        <animate attributeName="y" values="65;45;65" dur="3.8s" repeatCount="indefinite"/>
      </rect>
      <rect x="240" y="65" width="2" height="25" rx="1" fill="${c1}" opacity="0.5">
        <animate attributeName="height" values="15;35;15" dur="3.2s" repeatCount="indefinite"/>
        <animate attributeName="y" values="75;55;75" dur="3.2s" repeatCount="indefinite"/>
      </rect>`,
    'crypto': `
      <polygon points="200,28 220,60 200,52 180,60" fill="${c1}30" stroke="${c1}" stroke-width="1.5" opacity="0.8">
        <animateTransform attributeName="transform" type="rotate" values="0 200 68;360 200 68" dur="12s" repeatCount="indefinite"/>
      </polygon>
      <polygon points="200,108 220,76 200,84 180,76" fill="${c2}30" stroke="${c2}" stroke-width="1.5" opacity="0.8">
        <animateTransform attributeName="transform" type="rotate" values="0 200 68;-360 200 68" dur="16s" repeatCount="indefinite"/>
      </polygon>
      <circle cx="200" cy="68" r="12" fill="${c1}40" stroke="${c1}" stroke-width="1.5">
        <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite"/>
      </circle>`,
    'video-conf': `
      <rect x="130" y="38" width="100" height="65" rx="6" fill="none" stroke="url(#${gid})" stroke-width="1.5" opacity="0.8"/>
      <rect x="245" y="52" width="30" height="18" rx="3" fill="${c2}30" stroke="${c2}" stroke-width="1" opacity="0.8">
        <animate attributeName="x" values="240;250;240" dur="4s" repeatCount="indefinite"/>
      </rect>
      <circle cx="180" cy="70" r="15" fill="${c1}25" stroke="${c1}" stroke-width="1" opacity="0.7"/>
      <circle cx="180" cy="70" r="6" fill="${c1}" opacity="0.8">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite"/>
      </circle>`,
    'general': `
      <rect x="120" y="38" width="160" height="60" rx="8" fill="none" stroke="url(#${gid})" stroke-width="1.5" opacity="0.6">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite"/>
      </rect>
      <line x1="140" y1="58" x2="200" y2="58" stroke="${c1}" stroke-width="2" opacity="0.7">
        <animate attributeName="x2" values="170;210;170" dur="3s" repeatCount="indefinite"/>
      </line>
      <line x1="140" y1="72" x2="220" y2="72" stroke="${c2}" stroke-width="2" opacity="0.5">
        <animate attributeName="x2" values="190;230;190" dur="4s" repeatCount="indefinite"/>
      </line>
      <line x1="140" y1="86" x2="180" y2="86" stroke="${c1}" stroke-width="2" opacity="0.4">
        <animate attributeName="x2" values="165;195;165" dur="2.5s" repeatCount="indefinite"/>
      </line>`,
  };

  const shape = shapes[tmpl] || shapes['general'];

  return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:100%">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="180" fill="#0a0e1a"/>
  <!-- Grid -->
  <path d="M0 30 H400 M0 60 H400 M0 90 H400 M0 120 H400 M0 150 H400 M40 0 V180 M80 0 V180 M120 0 V180 M160 0 V180 M200 0 V180 M240 0 V180 M280 0 V180 M320 0 V180 M360 0 V180" stroke="${c1}" stroke-width="0.3" opacity="0.08"/>
  ${shape}
  <!-- Product name -->
  <text x="200" y="138" text-anchor="middle" fill="white" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="800" opacity="0.95">${escHtml(name)}</text>
  <!-- Category pill -->
  <rect x="50" y="155" width="300" height="18" rx="9" fill="${c1}18" stroke="${c1}" stroke-width="0.8" opacity="0.7"/>
  <text x="200" y="168" text-anchor="middle" fill="${c1}" font-family="'Space Mono',monospace" font-size="9" letter-spacing="1.5" opacity="0.9">${label} · ${escHtml(price)}</text>
</svg>`;
}

// ─── Title patterns (5 per template) ───
const TITLE_PATTERNS = {
  llm: [
    (p) => `${p.name}: The Complete ${YEAR} LLM Playbook`,
    (p) => `Mastering ${p.name} — A Data-Driven LLM Guide`,
    (p) => `${p.name} Playbook: API, Pricing & Use Cases ${YEAR}`,
    (p) => `The Ultimate ${p.name} Guide for Developers`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  'ai-coding': [
    (p) => `${p.name}: The Complete ${YEAR} AI Coding Playbook`,
    (p) => `Mastering ${p.name} — Developer Productivity Guide`,
    (p) => `${p.name} Playbook: IDE Setup, Workflows & Tips`,
    (p) => `The Ultimate ${p.name} Guide for Engineers ${YEAR}`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  creative: [
    (p) => `${p.name}: The Complete ${YEAR} Creative AI Playbook`,
    (p) => `Mastering ${p.name} — Creative Workflow Guide`,
    (p) => `${p.name} Playbook: Prompts, Quality & Pricing`,
    (p) => `The Ultimate ${p.name} Guide for Creators ${YEAR}`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  crm: [
    (p) => `${p.name}: The Complete ${YEAR} CRM Playbook`,
    (p) => `Mastering ${p.name} — Sales & CRM Data Guide`,
    (p) => `${p.name} Playbook: Setup, Features & ROI ${YEAR}`,
    (p) => `The Ultimate ${p.name} Guide for Sales Teams`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  pm: [
    (p) => `${p.name}: The Complete ${YEAR} PM Playbook`,
    (p) => `Mastering ${p.name} — Project Management Guide`,
    (p) => `${p.name} Playbook: Agile, Features & Pricing`,
    (p) => `The Ultimate ${p.name} Guide for Teams ${YEAR}`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  marketing: [
    (p) => `${p.name}: The Complete ${YEAR} Email Marketing Playbook`,
    (p) => `Mastering ${p.name} — Marketing Automation Guide`,
    (p) => `${p.name} Playbook: Campaigns, Automations & ROI`,
    (p) => `The Ultimate ${p.name} Guide for Marketers ${YEAR}`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  cloud: [
    (p) => `${p.name}: The Complete ${YEAR} Cloud Hosting Playbook`,
    (p) => `Mastering ${p.name} — DevOps & Cloud Guide`,
    (p) => `${p.name} Playbook: Infrastructure, Scale & Pricing`,
    (p) => `The Ultimate ${p.name} Guide for Developers ${YEAR}`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  crypto: [
    (p) => `${p.name}: The Complete ${YEAR} Crypto Playbook`,
    (p) => `Mastering ${p.name} — Crypto & Web3 Data Guide`,
    (p) => `${p.name} Playbook: Security, Fees & Features`,
    (p) => `The Ultimate ${p.name} Guide for Crypto Users`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  'video-conf': [
    (p) => `${p.name}: The Complete ${YEAR} Video Conf Playbook`,
    (p) => `Mastering ${p.name} — Meeting & Collaboration Guide`,
    (p) => `${p.name} Playbook: Features, Limits & Pricing ${YEAR}`,
    (p) => `The Ultimate ${p.name} Guide for Remote Teams`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
  general: [
    (p) => `${p.name}: The Complete ${YEAR} Productivity Playbook`,
    (p) => `Mastering ${p.name} — A Data-Driven Guide`,
    (p) => `${p.name} Playbook: Features, Pricing & Workflows`,
    (p) => `The Ultimate ${p.name} Guide for Professionals`,
    (p) => `How to Get the Most Out of ${p.name} in ${YEAR}`,
  ],
};

function getTitle(p, tmpl, idx) {
  const patterns = TITLE_PATTERNS[tmpl] || TITLE_PATTERNS.general;
  const raw = patterns[idx % patterns.length](p);
  return raw.length > 60 ? raw.slice(0, 57) + '…' : raw;
}

// ─── Description generator ───
function getDescription(p, tmpl, idx) {
  const rating    = getAvgRating(p);
  const price     = getDisplayPrice(p);
  const featCount = (p.features || []).length;
  const uc        = p.useCases?.[0];
  const ucText    = getUseCase(uc);
  const patterns  = [
    () => `${p.name} playbook for ${YEAR}: rated ${rating || 'N/A'}/5, starting at ${price}. ${featCount} features analyzed. ${ucText ? ucText.slice(0, 60) + '.' : 'Data-driven guide for professionals.'}`,
    () => `Complete ${p.name} guide: ${price} starting price, ${rating ? rating + '/5 rating' : 'top-rated'}, ${featCount} core features. Everything you need to know for ${YEAR}.`,
    () => `${p.name} ${YEAR} playbook: ${ucText ? ucText.slice(0, 70) + '. ' : ''}${price} · ${rating ? rating + '/5 stars' : 'Highly rated'} · ${featCount} features compared.`,
    () => `Data-driven ${p.name} guide: pricing from ${price}, ${rating ? rating + '/5 avg rating' : 'top pick'}, ${featCount} features. Real-world use cases and alternatives.`,
  ];
  const raw = patterns[idx % patterns.length]();
  // Ensure 150-160 chars
  if (raw.length < 140) return raw + ' ComparEdge analysis.';
  return raw.slice(0, 157) + '…';
}

// ─── Schema builders ───
function articleSchema(p, title, desc, canonical, date) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    url: canonical,
    datePublished: date,
    dateModified: TODAY,
    author: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    mainEntityOfPage: canonical,
  };
}

function breadcrumbSchema(p, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BLOG_URL + '/' },
      { '@type': 'ListItem', position: 2, name: 'Playbooks', item: BLOG_URL + '/playbooks/' },
      { '@type': 'ListItem', position: 3, name: p.name, item: canonical },
    ],
  };
}

function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

// ─── FAQ generators per template ───
function generateFAQs(p, tmpl) {
  const name    = p.name;
  const price   = getDisplayPrice(p);
  const rating  = getAvgRating(p);
  const free    = p.pricing?.free ? 'Yes' : 'No';
  const plans   = (p.pricing?.plans || []).filter(pl => pl.price != null);
  const verdict = p.pricingAnalysis?.verdict || '';
  const features = (p.features || []).slice(0, 3).join(', ') || 'core features';

  const templates = {
    llm: [
      { q: `What models does ${name} offer?`, a: `${name} provides ${features}. ${verdict ? verdict.slice(0, 200) : 'Check the official site for the latest model lineup.'}` },
      { q: `How much does ${name} cost?`, a: `${name} starts at ${price}. ${plans.length ? `Plans available: ${plans.map(pl => pl.name + ' ($' + pl.price + ')').slice(0, 3).join(', ')}.` : ''} Free tier available: ${free}.` },
      { q: `What is ${name} rated by users?`, a: `${name} has an average rating of ${rating || 'N/A'}/5 based on verified reviews from G2 and Capterra.` },
      { q: `What are the best use cases for ${name}?`, a: `${name} excels at ${features}. ${(p.useCases || []).slice(0, 1).map(uc => getUseCase(uc)).filter(Boolean).join(' ')}` },
    ],
    'ai-coding': [
      { q: `How does ${name} integrate with my IDE?`, a: `${name} supports ${features}. It integrates directly into popular IDEs via plugin or extension.` },
      { q: `Is ${name} free for developers?`, a: `${name} offers a free tier: ${free}. Paid plans start at ${price}. ${plans.length ? `Options: ${plans.map(pl => pl.name).slice(0, 3).join(', ')}.` : ''}` },
      { q: `What languages does ${name} support?`, a: `${name} provides ${features}. Most AI coding tools support the major programming languages including Python, JavaScript, TypeScript, and more.` },
      { q: `How does ${name} compare to alternatives?`, a: `${name} is rated ${rating || 'N/A'}/5 and starts at ${price}. ${verdict ? verdict.slice(0, 200) : 'Compare on ComparEdge for a full feature matrix.'}` },
    ],
    creative: [
      { q: `What can ${name} create?`, a: `${name} offers ${features}. It's designed for ${(p.useCases || []).slice(0, 1).map(uc => getUseCase(uc)).filter(Boolean).join(', ') || 'creative professionals'}.` },
      { q: `How much does ${name} cost per generation?`, a: `${name} pricing starts at ${price}. Free tier: ${free}. ${verdict ? verdict.slice(0, 150) : ''}` },
      { q: `What is the output quality of ${name}?`, a: `${name} is rated ${rating || 'N/A'}/5. Key strengths: ${(p.pros || []).slice(0, 2).join(', ') || features}.` },
      { q: `Who is ${name} best for?`, a: `${name} is best suited for ${(p.useCases || []).slice(0, 2).map(uc => getUseCase(uc)).filter(Boolean).join(' and ') || 'creative professionals and teams'}.` },
    ],
    crm: [
      { q: `How easy is ${name} to set up?`, a: `${name} offers ${features}. ${(p.pros || []).slice(0, 1).join('. ') || 'Setup is streamlined with onboarding guides.'}` },
      { q: `What does ${name} cost per seat?`, a: `${name} starts at ${price}. Free tier: ${free}. ${plans.length ? `Plans: ${plans.map(pl => pl.name + ' - $' + pl.price).slice(0, 3).join(', ')}.` : ''}` },
      { q: `What integrations does ${name} support?`, a: `${name} includes ${features}. Most CRM platforms integrate with email, calendar, marketing tools, and Zapier/Make.` },
      { q: `Is ${name} suitable for small teams?`, a: `${name} is rated ${rating || 'N/A'}/5. ${verdict ? verdict.slice(0, 200) : 'It suits teams of all sizes with flexible pricing plans.'}` },
    ],
    pm: [
      { q: `Does ${name} support Agile/Scrum?`, a: `${name} features include ${features}. It supports modern project management methodologies including Agile and Kanban.` },
      { q: `How much does ${name} cost per user?`, a: `${name} pricing starts at ${price}. Free plan: ${free}. ${plans.length ? `Tiers: ${plans.map(pl => pl.name + ' ($' + pl.price + ')').slice(0, 3).join(', ')}.` : ''}` },
      { q: `What automations does ${name} offer?`, a: `${name} provides ${features}. Automation features help teams reduce manual work and streamline workflows.` },
      { q: `How does ${name} compare to competitors?`, a: `${name} scores ${rating || 'N/A'}/5. ${verdict ? verdict.slice(0, 200) : 'Compare alternatives on ComparEdge for full context.'}` },
    ],
    marketing: [
      { q: `What email automation does ${name} offer?`, a: `${name} includes ${features}. Automation flows let you trigger emails based on user behavior, time, or custom events.` },
      { q: `What does ${name} cost?`, a: `${name} starts at ${price}. Free tier: ${free}. ${verdict ? verdict.slice(0, 150) : ''}` },
      { q: `What is ${name}'s deliverability rate?`, a: `${name} is rated ${rating || 'N/A'}/5 for overall quality. ${(p.pros || []).slice(0, 1).join('. ') || 'Deliverability depends on domain setup and list hygiene.'}` },
      { q: `Who should use ${name}?`, a: `${name} is best for ${(p.useCases || []).slice(0, 2).map(uc => getUseCase(uc)).filter(Boolean).join(' and ') || 'marketing teams and e-commerce businesses'}.` },
    ],
    cloud: [
      { q: `What infrastructure does ${name} provide?`, a: `${name} offers ${features}. It's designed for ${(p.useCases || []).slice(0, 1).map(uc => getUseCase(uc)).filter(Boolean).join(', ') || 'scalable cloud infrastructure'}.` },
      { q: `How is ${name} priced?`, a: `${name} pricing: ${price}. ${plans.length ? `Plans: ${plans.map(pl => pl.name + ' ($' + pl.price + ')').slice(0, 3).join(', ')}.` : ''} ${free === 'Yes' ? 'Free tier available.' : ''}` },
      { q: `What security certifications does ${name} have?`, a: `${name} includes ${features}. Enterprise cloud providers typically hold SOC2, ISO 27001, and GDPR compliance certifications.` },
      { q: `How does ${name} scale?`, a: `${name} is rated ${rating || 'N/A'}/5. ${verdict ? verdict.slice(0, 200) : 'Scalability depends on your architecture and chosen plan.'}` },
    ],
    crypto: [
      { q: `Is ${name} safe to use?`, a: `${name} includes ${features}. ${(p.pros || []).slice(0, 1).join('. ') || 'Security features vary — always verify smart contract audits and use hardware wallets for large holdings.'}` },
      { q: `What fees does ${name} charge?`, a: `${name} costs ${price}. ${(p.cons || []).slice(0, 1).join('. ') || 'Fee structures vary by transaction type and network.'}` },
      { q: `Which blockchains does ${name} support?`, a: `${name} offers ${features}. Support for specific chains depends on the product version and network integrations.` },
      { q: `Is ${name} regulated?`, a: `${name} is rated ${rating || 'N/A'}/5. ${verdict ? verdict.slice(0, 200) : 'Regulatory status varies by jurisdiction. Always check local requirements.'}` },
    ],
    'video-conf': [
      { q: `How many participants can join a ${name} meeting?`, a: `${name} features include ${features}. Participant limits depend on your chosen plan.` },
      { q: `Does ${name} offer recording?`, a: `${name} provides ${features}. Recording and transcription features are typically available on paid tiers.` },
      { q: `How much does ${name} cost per host?`, a: `${name} starts at ${price}. Free plan: ${free}. ${plans.length ? `Options: ${plans.map(pl => pl.name + ' ($' + pl.price + ')').slice(0, 3).join(', ')}.` : ''}` },
      { q: `Is ${name} secure for business meetings?`, a: `${name} is rated ${rating || 'N/A'}/5. ${(p.pros || []).slice(0, 1).join('. ') || 'Enterprise plans include end-to-end encryption and compliance features.'}` },
    ],
    general: [
      { q: `What does ${name} do?`, a: `${name} provides ${features}. ${(p.useCases || []).slice(0, 1).map(uc => getUseCase(uc)).filter(Boolean).join(' ')}` },
      { q: `Is ${name} free?`, a: `Free tier available: ${free}. ${name} pricing starts at ${price}. ${verdict ? verdict.slice(0, 150) : ''}` },
      { q: `What do users say about ${name}?`, a: `${name} holds a ${rating || 'N/A'}/5 average rating. ${(p.pros || []).slice(0, 2).join('. ') || 'Users praise its core functionality and ease of use.'}` },
      { q: `Who is ${name} best for?`, a: `${name} is best for ${(p.useCases || []).slice(0, 2).map(uc => getUseCase(uc)).filter(Boolean).join(' and ') || 'professionals and teams'}.` },
    ],
  };

  return (templates[tmpl] || templates.general).map(f => ({
    q: f.q.slice(0, 200),
    a: f.a.slice(0, 500),
  }));
}

// ─── Content sections per template ───
function renderPricingTable(p) {
  const plans = (p.pricing?.plans || []).filter(pl => pl.price != null);
  if (!plans.length) return '';
  return `<div class="table-wrap"><table>
    <thead><tr><th>Plan</th><th>Price</th><th>What You Get</th></tr></thead>
    <tbody>${plans.map(pl => `<tr>
      <td><strong>${escHtml(pl.name)}</strong></td>
      <td><span style="color:var(--accent);font-weight:700;font-family:'Space Mono',monospace">${pl.price === 0 ? 'Free' : '$' + pl.price + '/' + (pl.period || 'mo')}</span></td>
      <td>${(pl.highlights || []).slice(0, 3).map(h => escHtml(h)).join(' · ') || '—'}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function renderFeatureGrid(p) {
  const feats = (p.features || []).slice(0, 6);
  if (!feats.length) return '';
  return `<div class="feature-grid">${feats.map(f => `<div class="feature-card">
    <h4>✦ ${escHtml(f)}</h4>
    <p>Included in ${escHtml(p.name)} — see full feature list on <a href="${SITE_URL}/tool/${p.slug}" target="_blank" rel="noopener">ComparEdge</a>.</p>
  </div>`).join('')}</div>`;
}

function renderProsCons(p) {
  const pros = (p.pros || []).slice(0, 4);
  const cons = (p.cons || []).slice(0, 4);
  if (!pros.length && !cons.length) return '';
  return `<div class="pros-cons">
    <div class="pros"><h3>✓ Pros</h3><ul>${pros.map(pr => `<li>${escHtml(pr)}</li>`).join('')}</ul></div>
    <div class="cons"><h3>✗ Cons</h3><ul>${cons.map(c => `<li>${escHtml(c)}</li>`).join('')}</ul></div>
  </div>`;
}

function renderUseCases(p) {
  const cases = (p.useCases || []).slice(0, 3);
  if (!cases.length) return '';
  return cases.map((uc, i) => {
    const title = typeof uc === 'object' ? uc.title : String(uc);
    const desc  = typeof uc === 'object' ? uc.description : '';
    return `<div class="highlight fade-in">
      <h3>${i + 1}. ${escHtml(title)}</h3>
      ${desc ? `<p>${escHtml(desc.slice(0, 300))}</p>` : ''}
    </div>`;
  }).join('');
}

function renderAlternatives(p, allProducts) {
  const alts = allProducts
    .filter(alt => alt.category === p.category && alt.slug !== p.slug)
    .slice(0, 3);
  if (!alts.length) return '';
  return `<div class="table-wrap"><table>
    <thead><tr><th>Alternative</th><th>Rating</th><th>Starting Price</th><th>Free Tier</th></tr></thead>
    <tbody>${alts.map(alt => {
      const r = getAvgRating(alt);
      return `<tr>
        <td><a href="${BLOG_URL}/playbooks/${alt.slug}.html">${escHtml(alt.name)}</a></td>
        <td>${r ? `<span style="color:#f59e0b">${r}/5</span>` : '—'}</td>
        <td style="font-family:'Space Mono',monospace;font-size:13px">${escHtml(getDisplayPrice(alt))}</td>
        <td>${alt.pricing?.free ? '<span class="pill green">Yes</span>' : '<span class="pill">No</span>'}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ─── Main content generators by template ───

function genLLM(p, allProducts) {
  const rating   = getAvgRating(p);
  const price    = getDisplayPrice(p);
  const models   = p.tokenPricing?.models || [];

  const tokenTable = models.length ? `<div class="table-wrap"><table>
    <thead><tr><th>Model</th><th>Input (per 1M)</th><th>Output (per 1M)</th></tr></thead>
    <tbody>${models.map(m => `<tr>
      <td><strong>${escHtml(m.name)}</strong></td>
      <td style="color:var(--accent);font-family:'Space Mono',monospace">$${m.input}</td>
      <td style="font-family:'Space Mono',monospace">$${m.output}</td>
    </tr>`).join('')}</tbody>
  </table></div>` : '';

  return `
<h2 id="overview">Model Overview</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a leading LLM provider for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="pricing">Pricing Breakdown</h2>
${tokenTable}
${renderPricingTable(p)}
<div class="takeaway"><strong>Bottom line:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `${p.name} starts at ${price}. Free tier: ${p.pricing?.free ? 'Yes' : 'No'}.`)}</div>

<h2 id="quickstart">API Quick Start</h2>
<p>Integrating <strong>${escHtml(p.name)}</strong> into your project typically involves:</p>
<ul>
  <li>Create an account at the official ${escHtml(p.name)} portal</li>
  <li>Generate an API key from your dashboard</li>
  <li>Install the SDK: <code>npm install ${p.slug}-sdk</code> or use the REST API directly</li>
  <li>Make your first call with your preferred programming language</li>
  <li>Monitor usage and costs in the dashboard</li>
</ul>
${renderFeatureGrid(p)}

<h2 id="usecases">Use Case Scenarios</h2>
${renderUseCases(p)}

<h2 id="alternatives">Alternatives Comparison</h2>
${renderAlternatives(p, allProducts)}
<p>→ <a href="${SITE_URL}/compare?cat=llm" target="_blank" rel="noopener">Compare all LLM APIs on ComparEdge</a></p>
`;
}

function genAICoding(p, allProducts) {
  return `
<h2 id="overview">IDE Integration Guide</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a top AI coding assistant for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="languages">Supported Languages & Features</h2>
${renderFeatureGrid(p)}
<p><strong>${escHtml(p.name)}</strong> supports the most popular programming languages including Python, JavaScript, TypeScript, Go, Rust, and more. Check the official documentation for the full compatibility matrix.</p>

<h2 id="workflow">Productivity Workflow</h2>
<p>Here's how developers integrate <strong>${escHtml(p.name)}</strong> into their daily workflow:</p>
<ul>
  <li>Install the extension/plugin for your IDE (VS Code, JetBrains, Neovim)</li>
  <li>Authenticate with your license key</li>
  <li>Enable inline completions and chat assistant</li>
  <li>Use keyboard shortcuts for context-aware code generation</li>
  <li>Review and accept/reject suggestions with one keystroke</li>
</ul>
${renderUseCases(p)}

<h2 id="pricing">Team Pricing</h2>
${renderPricingTable(p)}
<div class="takeaway"><strong>Verdict:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `${p.name} starts at ${getDisplayPrice(p)}.`)}</div>

<h2 id="alternatives">Alternatives</h2>
${renderAlternatives(p, allProducts)}
`;
}

function genCreative(p, allProducts) {
  return `
<h2 id="overview">Creative Capabilities</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a leading creative AI tool for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="quality">Style & Output Quality</h2>
${renderFeatureGrid(p)}
<div class="pill-row">
  ${(p.features || []).slice(0, 6).map(f => `<span class="pill blue">${escHtml(f)}</span>`).join('')}
</div>

<h2 id="workflow">Workflow Integration</h2>
${renderUseCases(p)}

<h2 id="pricing">Pricing per Generation</h2>
${renderPricingTable(p)}
<div class="takeaway"><strong>Verdict:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `${p.name} starts at ${getDisplayPrice(p)}.`)}</div>

<h2 id="alternatives">Alternatives Comparison</h2>
${renderAlternatives(p, allProducts)}
<p>→ <a href="${SITE_URL}/compare?cat=${p.category}" target="_blank" rel="noopener">Full comparison on ComparEdge</a></p>
`;
}

function genCRM(p, allProducts) {
  return `
<h2 id="overview">Pipeline Setup</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a leading CRM platform for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="contacts">Contact Management & Features</h2>
${renderFeatureGrid(p)}

<h2 id="integrations">Integration Ecosystem</h2>
<p><strong>${escHtml(p.name)}</strong> integrates with email clients, marketing tools, calendar apps, and automation platforms like Zapier and Make. This ensures your CRM data stays in sync across your entire tech stack.</p>
${renderUseCases(p)}

<h2 id="pricing">Pricing per Seat</h2>
${renderPricingTable(p)}
<div class="takeaway green"><strong>ROI Insight:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `Start with ${p.name}'s free tier to validate fit before upgrading.`)}</div>

<h2 id="alternatives">Alternatives</h2>
${renderAlternatives(p, allProducts)}
`;
}

function genPM(p, allProducts) {
  return `
<h2 id="overview">Methodology Fit</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a top project management tool for ${YEAR}.`)}</p>
<div class="pill-row">
  <span class="pill blue">Agile</span>
  <span class="pill purple">Scrum</span>
  <span class="pill green">Kanban</span>
</div>
${renderProsCons(p)}

<h2 id="collaboration">Team Collaboration</h2>
${renderFeatureGrid(p)}
${renderUseCases(p)}

<h2 id="pricing">Pricing Analysis</h2>
${renderPricingTable(p)}
<div class="takeaway"><strong>Verdict:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `${p.name} starts at ${getDisplayPrice(p)}.`)}</div>

<h2 id="alternatives">Alternatives</h2>
${renderAlternatives(p, allProducts)}
`;
}

function genMarketing(p, allProducts) {
  return `
<h2 id="overview">Campaign Builder</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a leading email marketing platform for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="automation">Automation Flows & Segmentation</h2>
${renderFeatureGrid(p)}
<p><strong>${escHtml(p.name)}</strong> provides behavioral triggers, audience segmentation, and A/B testing to optimize campaign performance. Advanced automation flows let you nurture leads without manual intervention.</p>
${renderUseCases(p)}

<h2 id="pricing">Pricing Tiers</h2>
${renderPricingTable(p)}
<div class="takeaway"><strong>Verdict:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `${p.name} starts at ${getDisplayPrice(p)}.`)}</div>

<h2 id="alternatives">Alternatives</h2>
${renderAlternatives(p, allProducts)}
`;
}

function genCloud(p, allProducts) {
  return `
<h2 id="overview">Infrastructure Overview</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a leading cloud hosting provider for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="scale">Scalability & Features</h2>
${renderFeatureGrid(p)}
<div class="highlight fade-in">
  <h3>Uptime & Reliability</h3>
  <p>Enterprise cloud providers typically guarantee 99.9%+ uptime SLAs. Review <strong>${escHtml(p.name)}'s</strong> SLA documentation for specific guarantees and credits.</p>
</div>
${renderUseCases(p)}

<h2 id="pricing">Pricing Model</h2>
${renderPricingTable(p)}
<div class="takeaway"><strong>Verdict:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `${p.name} pricing: ${getDisplayPrice(p)}.`)}</div>

<h2 id="alternatives">Alternatives</h2>
${renderAlternatives(p, allProducts)}
`;
}

function genCrypto(p, allProducts) {
  return `
<h2 id="overview">Security Architecture</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a trusted crypto platform for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="chains">Supported Chains & Features</h2>
${renderFeatureGrid(p)}
<div class="pill-row">
  ${(p.features || []).slice(0, 5).map(f => `<span class="pill">${escHtml(f)}</span>`).join('')}
</div>
${renderUseCases(p)}

<h2 id="fees">Fee Structure</h2>
${renderPricingTable(p)}
<div class="takeaway yellow"><strong>Risk Note:</strong> Cryptocurrency products carry significant financial risk. Always verify security audits, regulatory compliance in your jurisdiction, and use hardware wallets for large holdings.</div>

<h2 id="alternatives">Alternatives</h2>
${renderAlternatives(p, allProducts)}
<p>→ <a href="${SITE_URL}/compare?cat=${p.category}" target="_blank" rel="noopener">Full crypto comparison on ComparEdge</a></p>
`;
}

function genVideoConf(p, allProducts) {
  return `
<h2 id="overview">Meeting Features</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a leading video conferencing platform for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="features">Feature Matrix</h2>
${renderFeatureGrid(p)}
${renderUseCases(p)}

<h2 id="pricing">Pricing per Host</h2>
${renderPricingTable(p)}
<div class="takeaway"><strong>Verdict:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `${p.name} starts at ${getDisplayPrice(p)}.`)}</div>

<h2 id="alternatives">Alternatives</h2>
${renderAlternatives(p, allProducts)}
`;
}

function genGeneral(p, allProducts) {
  return `
<h2 id="overview">Core Capabilities</h2>
<p>${escHtml(p.pricingAnalysis?.overview || p.description || `${p.name} is a powerful productivity tool for ${YEAR}.`)}</p>
${renderProsCons(p)}

<h2 id="features">Features & Workflow Integration</h2>
${renderFeatureGrid(p)}
${renderUseCases(p)}

<h2 id="pricing">Pricing Analysis</h2>
${renderPricingTable(p)}
<div class="takeaway"><strong>Verdict:</strong> ${escHtml(p.pricingAnalysis?.verdict?.slice(0, 300) || `${p.name} starts at ${getDisplayPrice(p)}.`)}</div>

<h2 id="alternatives">Alternatives Comparison</h2>
${renderAlternatives(p, allProducts)}
<p>→ <a href="${SITE_URL}/compare?cat=${p.category}" target="_blank" rel="noopener">Full comparison on ComparEdge</a></p>
`;
}

const CONTENT_GENERATORS = {
  llm:          genLLM,
  'ai-coding':  genAICoding,
  creative:     genCreative,
  crm:          genCRM,
  pm:           genPM,
  marketing:    genMarketing,
  cloud:        genCloud,
  crypto:       genCrypto,
  'video-conf': genVideoConf,
  general:      genGeneral,
};

// ─── TOC per template ───
const TOCS = {
  llm:          ['overview', 'pricing', 'quickstart', 'usecases', 'alternatives', 'faq'],
  'ai-coding':  ['overview', 'languages', 'workflow', 'pricing', 'alternatives', 'faq'],
  creative:     ['overview', 'quality', 'workflow', 'pricing', 'alternatives', 'faq'],
  crm:          ['overview', 'contacts', 'integrations', 'pricing', 'alternatives', 'faq'],
  pm:           ['overview', 'collaboration', 'pricing', 'alternatives', 'faq'],
  marketing:    ['overview', 'automation', 'pricing', 'alternatives', 'faq'],
  cloud:        ['overview', 'scale', 'pricing', 'alternatives', 'faq'],
  crypto:       ['overview', 'chains', 'fees', 'alternatives', 'faq'],
  'video-conf': ['overview', 'features', 'pricing', 'alternatives', 'faq'],
  general:      ['overview', 'features', 'pricing', 'alternatives', 'faq'],
};

const TOC_LABELS = {
  overview:     'Overview',
  pricing:      'Pricing',
  quickstart:   'Quick Start',
  usecases:     'Use Cases',
  alternatives: 'Alternatives',
  faq:          'FAQ',
  languages:    'Languages',
  workflow:     'Workflow',
  contacts:     'Contact Management',
  integrations: 'Integrations',
  collaboration:'Collaboration',
  quality:      'Output Quality',
  automation:   'Automation',
  scale:        'Scalability',
  chains:       'Chains & Assets',
  fees:         'Fee Structure',
  features:     'Features',
};

function renderTOC(tmpl) {
  const items = TOCS[tmpl] || TOCS.general;
  return `<nav class="toc" aria-label="Table of contents">
  <h4>Table of Contents</h4>
  <ol>${items.map((id, i) => `<li><a href="#${id}">${i + 1}. ${TOC_LABELS[id] || id}</a></li>`).join('')}</ol>
</nav>`;
}

// ─── Generate single playbook page ───
function generatePlaybook(p, idx, total, allProducts) {
  const tmpl    = getTemplateType(p.category);
  const date    = getPlaybookDate(p.slug, idx, total);
  const titleIdx = idx % 5;
  const title   = getTitle(p, tmpl, titleIdx);
  const desc    = getDescription(p, tmpl, idx % 4);
  const canonical = `${BLOG_URL}/playbooks/${p.slug}.html`;
  const rating  = getAvgRating(p);
  const price   = getDisplayPrice(p);
  const featCount = (p.features || []).length;

  const contentFn = CONTENT_GENERATORS[tmpl] || genGeneral;
  const contentHTML = contentFn(p, allProducts);

  const faqs = generateFAQs(p, tmpl);
  const faqHTML = `<h2 id="faq">Frequently Asked Questions</h2>
<div class="faq">
${faqs.map(f => `<div class="faq-item">
  <div class="faq-q">${escHtml(f.q)}</div>
  <div class="faq-a">${escHtml(f.a)}</div>
</div>`).join('')}
</div>`;

  const catLabel = p.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const svgHtml = playbookSVG(p, idx, tmpl);

  const schemas = [
    articleSchema(p, title, desc, canonical, date),
    breadcrumbSchema(p, canonical),
    faqSchema(faqs),
  ];

  const body = `
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="${BLOG_URL}/">Home</a> / <a href="${BLOG_URL}/playbooks/">Playbooks</a> / ${escHtml(p.name)}
</nav>

<div class="hero">
  <div style="border-radius:12px;overflow:hidden;margin-bottom:24px;height:180px">${svgHtml}</div>
  <span class="category-tag">${escHtml(catLabel)}</span>
  <h1>${escHtml(title)}</h1>
  <p class="hero-subtitle">${escHtml(desc)}</p>
  <div class="hero-stats">
    ${rating ? `<div class="stat"><span class="stat-num">${rating}</span><span class="stat-label">Avg Rating</span></div>` : ''}
    <div class="stat"><span class="stat-num">${escHtml(price)}</span><span class="stat-label">Starting Price</span></div>
    <div class="stat"><span class="stat-num">${featCount}</span><span class="stat-label">Features</span></div>
    ${p.pricing?.free ? `<div class="stat"><span class="stat-num" style="font-size:1.2em">✓</span><span class="stat-label">Free Tier</span></div>` : ''}
  </div>
</div>

<div class="meta">
  <span class="updated"><span class="dot"></span>Last updated ${date}</span>
  <span class="meta-sep">·</span>
  <span>By ComparEdge Editorial</span>
  <span class="meta-sep">·</span>
  <span>${escHtml(catLabel)}</span>
</div>

${renderTOC(tmpl)}

${contentHTML}

${faqHTML}

<div class="highlight fade-in" style="text-align:center;margin-top:48px">
  <h3>Ready to Try ${escHtml(p.name)}?</h3>
  <p>Compare it against ${(allProducts.filter(a => a.category === p.category && a.slug !== p.slug).length)} alternatives on ComparEdge.</p>
  <p style="margin-top:18px">
    <a class="cta" href="${SITE_URL}/tool/${p.slug}" target="_blank" rel="noopener">View on ComparEdge →</a>
    &nbsp;
    <a class="cta" href="${SITE_URL}/compare?cat=${p.category}" target="_blank" rel="noopener" style="background:transparent;border:1px solid var(--accent);color:var(--accent)!important">Compare Alternatives</a>
  </p>
</div>
`;

  return htmlPage({ title, desc, canonical, body, schemas });
}

// ─── Category colors for index cards ───
const CAT_TAG_STYLE = {
  'llm':                       'background:#3b82f615;border:1px solid #3b82f630;color:#60a5fa',
  'ai-coding':                 'background:#10b98115;border:1px solid #10b98130;color:#34d399',
  'ai-image':                  'background:#8b5cf615;border:1px solid #8b5cf630;color:#a78bfa',
  'ai-video':                  'background:#ec489915;border:1px solid #ec489930;color:#f472b6',
  'ai-voice':                  'background:#8b5cf615;border:1px solid #8b5cf630;color:#a78bfa',
  'design-tools':              'background:#8b5cf615;border:1px solid #8b5cf630;color:#a78bfa',
  'crm':                       'background:#f9731615;border:1px solid #f9731630;color:#fb923c',
  'project-management':        'background:#6366f115;border:1px solid #6366f130;color:#818cf8',
  'email-marketing':           'background:#f43f5e15;border:1px solid #f43f5e30;color:#fb7185',
  'cloud-hosting':             'background:#0ea5e915;border:1px solid #0ea5e930;color:#38bdf8',
  'crypto-wallets':            'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'crypto-trading-bots':       'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'crypto-analytics':          'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'crypto-exchanges':          'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'crypto-telegram-bots':      'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'dex':                       'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'crypto-tax':                'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'crypto-portfolio-trackers': 'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'defi-tools':                'background:#eab30815;border:1px solid #eab30830;color:#fcd34d',
  'video-conferencing':        'background:#14b8a615;border:1px solid #14b8a630;color:#2dd4bf',
  'ai-productivity':           'background:#64748b15;border:1px solid #64748b30;color:#94a3b8',
  'ai-writing':                'background:#64748b15;border:1px solid #64748b30;color:#94a3b8',
  'ai-assistants':             'background:#3b82f615;border:1px solid #3b82f630;color:#60a5fa',
  'ai-agents':                 'background:#10b98115;border:1px solid #10b98130;color:#34d399',
  'website-builders':          'background:#0ea5e915;border:1px solid #0ea5e930;color:#38bdf8',
  'accounting':                'background:#10b98115;border:1px solid #10b98130;color:#34d399',
  'password-managers':         'background:#6366f115;border:1px solid #6366f130;color:#818cf8',
  'vpn':                       'background:#64748b15;border:1px solid #64748b30;color:#94a3b8',
};

// ─── Generate index page ───
function generateIndex(products, dates) {
  const categories = [...new Set(products.map(p => p.category))].sort();
  const catLabels  = categories.reduce((acc, c) => {
    acc[c] = c.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
    return acc;
  }, {});

  const filterPills = `<div class="filter-pills" id="filter-pills">
    <button class="filter-pill active" data-cat="all">All (${products.length})</button>
    ${categories.map(c => `<button class="filter-pill" data-cat="${c}">${escHtml(catLabels[c])}</button>`).join('')}
  </div>`;

  const cardsHtml = products.map((p, idx) => {
    const tmpl    = getTemplateType(p.category);
    const date    = dates[idx];
    const tagStyle = CAT_TAG_STYLE[p.category] || CAT_TAG_STYLE['ai-productivity'];
    const catLabel = catLabels[p.category] || p.category;
    const rating   = getAvgRating(p);
    const price    = getDisplayPrice(p);
    const svgHtml  = playbookSVG(p, idx, tmpl);
    const title    = getTitle(p, tmpl, idx % 5);

    return `<a class="article-card" href="${BLOG_URL}/playbooks/${p.slug}.html" data-cat="${p.category}" data-name="${escHtml(p.name.toLowerCase())}">
  <div class="card-img">${svgHtml}</div>
  <div class="card-body">
    <span class="card-tag-pill" style="${tagStyle}">${escHtml(catLabel)}</span>
    <h3>${escHtml(title)}</h3>
    <div class="card-footer">
      <span class="card-date">${date}${rating ? ` · ★${rating}` : ''} · ${escHtml(price)}</span>
      <span class="card-read">Read →</span>
    </div>
  </div>
</a>`;
  }).join('\n');

  const title = `Product Playbooks — ${products.length} Tools Analyzed | ComparEdge Blog`;
  const desc  = `${products.length} product playbooks covering AI tools, crypto, CRM, project management, and more. Data-driven guides with real pricing, features, and alternatives for ${YEAR}.`;
  const canonical = `${BLOG_URL}/playbooks/`;

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Product Playbooks',
      description: desc,
      url: canonical,
      publisher: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BLOG_URL + '/' },
        { '@type': 'ListItem', position: 2, name: 'Playbooks', item: canonical },
      ],
    },
  ];

  const body = `
<div style="padding:40px 0 24px">
  <div class="section-label">ComparEdge · ${YEAR}</div>
  <h1 style="font-size:2.2em;margin-bottom:16px">Product Playbooks</h1>
  <p style="color:var(--text-dim);font-size:1.1em;max-width:640px;margin-bottom:32px">
    ${products.length} data-driven guides — one per product. Real pricing, feature breakdowns, use cases, and alternatives. Updated ${TODAY_DISPLAY}.
  </p>
  <div class="search-wrap">
    <input type="text" id="pb-search" placeholder="Search playbooks…" aria-label="Search playbooks">
  </div>
  ${filterPills}
  <div class="article-grid" id="pb-grid">
    ${cardsHtml}
  </div>
</div>
<script>
(function(){
  var pills = document.querySelectorAll('.filter-pill');
  var searchInput = document.getElementById('pb-search');
  function getActiveCat(){
    var active = document.querySelector('.filter-pill.active');
    return active ? active.dataset.cat : 'all';
  }
  function filterCards(){
    var cat   = getActiveCat();
    var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var cards = document.querySelectorAll('.article-card[data-cat]');
    cards.forEach(function(c){
      var catOk  = cat === 'all' || c.dataset.cat === cat;
      var nameOk = !query || (c.dataset.name || '').includes(query) || c.textContent.toLowerCase().includes(query);
      c.style.display = (catOk && nameOk) ? '' : 'none';
    });
  }
  pills.forEach(function(pill){
    pill.addEventListener('click', function(){
      pills.forEach(function(p){ p.classList.remove('active'); });
      this.classList.add('active');
      filterCards();
    });
  });
  if(searchInput){ searchInput.addEventListener('input', filterCards); }
})();
</script>
`;

  const extraCss = `
  .article-grid { grid-template-columns: repeat(3, 1fr); }
  @media(max-width:900px){ .article-grid{grid-template-columns:repeat(2,1fr)} }
  @media(max-width:560px){ .article-grid{grid-template-columns:1fr} }
  `;

  return htmlPage({ title, desc, canonical, body, schemas, extraCss });
}

// ─── Main ───
console.log(`[playbooks] Loading ${products.length} products…`);

const total = products.length;
const dates = products.map((p, i) => getPlaybookDate(p.slug, i, total));

// Write individual playbooks
let written = 0;
products.forEach((p, idx) => {
  try {
    const html = generatePlaybook(p, idx, total, products);
    const filePath = path.join(outDir, `${p.slug}.html`);
    fs.writeFileSync(filePath, html, 'utf8');
    written++;
    if (written % 50 === 0) console.log(`[playbooks] Written ${written}/${total}…`);
  } catch (err) {
    console.error(`[playbooks] ERROR on ${p.slug}:`, err.message);
  }
});

// Write index
const indexHtml = generateIndex(products, dates);
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8');
console.log(`[playbooks] index.html written`);

// Update sitemap — read existing sitemap.xml and append playbook URLs
const sitemapPath = path.join(__dirname, 'sitemap.xml');
let sitemapContent = '';
try { sitemapContent = fs.readFileSync(sitemapPath, 'utf8'); } catch(e) {}

const playbookSitemapUrls = [
  `<url><loc>${BLOG_URL}/playbooks/</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
  ...products.map(p => `<url><loc>${BLOG_URL}/playbooks/${p.slug}.html</loc><lastmod>${dates[products.indexOf(p)]}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`),
].join('\n');

if (sitemapContent.includes('</urlset>')) {
  const newSitemap = sitemapContent.replace('</urlset>', `${playbookSitemapUrls}\n</urlset>`);
  fs.writeFileSync(sitemapPath, newSitemap, 'utf8');
  console.log(`[playbooks] sitemap.xml updated (+${total + 1} URLs)`);
} else {
  // Write standalone playbooks sitemap
  const standaloneSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${playbookSitemapUrls}\n</urlset>`;
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), standaloneSitemap, 'utf8');
  console.log(`[playbooks] playbooks/sitemap.xml written`);
}

console.log(`\n✅ Done: ${written} playbooks + index (${path.join(__dirname, 'playbooks')})`);
