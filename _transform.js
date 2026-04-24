#!/usr/bin/env node
/**
 * Transformation script: replace logo + all emojis with SVG icons in generate.js
 */
const fs = require('fs');
const filePath = '/data/.openclaw/workspace/projects/comparedge-blog/generate.js';
let content = fs.readFileSync(filePath, 'utf8');

// ── 1. ICONS CONST definition ──────────────────────────────────────────────
const ICONS_CONST = `
const ICONS = {
  lightbulb: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  trophy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  chart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  trending: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  lightning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  money: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  free: '<span style="display:inline-block;background:#10b98120;color:#10b981;font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px;border:1px solid #10b98140">FREE</span>',
  clipboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  books: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  swords: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="3" y2="21"/></svg>',
};
`;

// ── 2. Inject ICONS_CONST after the TODAY_DISPLAY line ─────────────────────
content = content.replace(
  `const TODAY_DISPLAY = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });`,
  `const TODAY_DISPLAY = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });\n${ICONS_CONST}`
);

// ── 3. Replace logo HTML ───────────────────────────────────────────────────
const OLD_LOGO = `<a href="\${BLOG_URL}/" class="site-logo">Compar<span>Edge</span> Blog</a>`;
const NEW_LOGO = `<a href="\${BLOG_URL}/" class="site-logo" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none">
  <svg width="26" height="24" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs>
    <path d="M4 38 L20 6 L25 15 L34 5 L32 17 L42 15 L30 34 L24 25 Z" fill="none" stroke="url(#lg)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M40 6 L24 38 L19 29 L10 39 L12 27 L2 29 L14 10 L20 19 Z" fill="none" stroke="white" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.15"/>
  </svg>
  <span style="font-weight:800;font-size:17px;letter-spacing:-.3px;background:linear-gradient(90deg,#3b82f6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">ComparEdge</span>
</a>`;
content = content.replace(OLD_LOGO, NEW_LOGO);

// ── 4. Update .site-logo CSS (remove text styling since it's now inline) ───
content = content.replace(
  `.site-logo{color:#fff;font-weight:800;font-size:17px;letter-spacing:-.3px}
.site-logo span{background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}`,
  `.site-logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none}`
);

// ── 5. Fix console lines first (replace emoji with text so global passes don't mangle them) ──
// console.log/warn lines - replace with plain text markers
content = content.replace(/console\.log\(`✅ /g, 'console.log(`[OK] ');
content = content.replace(/console\.warn\(`⚠️  /g, 'console.warn(`[WARN] ');

// ── 6. Fix ternary string patterns inside ${} expressions ─────────────────
// Pattern: ? '✅ Yes' : '❌ No'
content = content.replace(/\? '✅ Yes' : '❌ No'/g, `? ICONS.check+' Yes' : ICONS.x+' No'`);
// Pattern: ? '✅' : '❌' (standalone in table cells)
content = content.replace(/\? '✅' : '❌'/g, `? ICONS.check : ICONS.x`);

// ── 7. Fix section emoji properties ───────────────────────────────────────
content = content.replace(`emoji: '📚'`, `emoji: ICONS.books`);
content = content.replace(`emoji: '⚔️'`, `emoji: ICONS.swords`);
content = content.replace(`emoji: '📊'`, `emoji: ICONS.chart`);
content = content.replace(`emoji: '🏆'`, `emoji: ICONS.trophy`);

// ── 8. Global template-literal emoji replacements ─────────────────────────
// These appear directly in template literal HTML strings (not inside ${})
// Replace each with ${ICONS.xxx} interpolation

const emojiMap = [
  ['📋 ', '${ICONS.clipboard} '],   // clipboard - Contents heading
  ['💡 ', '${ICONS.lightbulb} '],   // lightbulb
  ['✅ ', '${ICONS.check} '],        // check (remaining after ternary fixes)
  ['❌ ', '${ICONS.x} '],            // x mark (remaining)
  ['🏆 ', '${ICONS.trophy} '],       // trophy
  ['🔗 ', '${ICONS.link} '],         // link
  ['📊 ', '${ICONS.chart} '],        // chart (with trailing space)
  ['📈 ', '${ICONS.trending} '],     // trending up
  ['⚡ ', '${ICONS.lightning} '],    // lightning
  ['🎯 ', '${ICONS.target} '],       // target
  ['💰 ', '${ICONS.money} '],        // money
  ['⚠️ ', '${ICONS.warning} '],     // warning (with trailing space)
  ['🆓 ', '${ICONS.free} '],         // free badge

  // Without trailing space (end of string or followed by non-space)
  ['📋', '${ICONS.clipboard}'],
  ['💡', '${ICONS.lightbulb}'],
  ['✅', '${ICONS.check}'],
  ['❌', '${ICONS.x}'],
  ['🏆', '${ICONS.trophy}'],
  ['🔗', '${ICONS.link}'],
  ['📊', '${ICONS.chart}'],
  ['📈', '${ICONS.trending}'],
  ['⚡', '${ICONS.lightning}'],
  ['🎯', '${ICONS.target}'],
  ['💰', '${ICONS.money}'],
  ['⚠️', '${ICONS.warning}'],
  ['🆓', '${ICONS.free}'],
];

for (const [emoji, replacement] of emojiMap) {
  // Use split/join for global replacement
  content = content.split(emoji).join(replacement);
}

// ── 9. Write back ──────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8');
console.log('[OK] generate.js transformed successfully');

// ── 10. Verify no leftover emojis (spot check) ────────────────────────────
const remaining = [...content.matchAll(/[💡✅❌🏆🔗📊📈⚡🎯💰⚠️🆓📋📚⚔️💎🔍🤖🛡️💻🎨📧]/gu)];
if (remaining.length > 0) {
  const ctx = remaining.map(m => `  pos ${m.index}: "${content.slice(Math.max(0,m.index-20), m.index+20)}"`).join('\n');
  console.warn(`[WARN] ${remaining.length} emoji(s) still present:\n${ctx}`);
} else {
  console.log('[OK] No emojis remaining in generate.js');
}
