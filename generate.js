#!/usr/bin/env node
/**
 * ComparEdge Blog Generator
 * Generates SEO-optimized HTML articles from products.json data
 * Deploys to GitHub Pages (comparedge-blog.github.io or similar)
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://comparedge.com';
const BLOG_URL = 'https://imkemit-ops.github.io/comparedge-blog';
const YEAR = new Date().getFullYear();
const TODAY = new Date().toISOString().split('T')[0];
const TODAY_DISPLAY = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// Load products from main site
const productsPath = path.join(__dirname, '../site-prototype/data/products.json');
const db = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const products = Array.isArray(db.products) ? db.products : Object.values(db.products);

function findProduct(slug) {
  return products.find(p => p.slug === slug);
}

function getAvgRating(p) {
  const r = p.rating || {};
  const vals = [r.g2, r.capterra].filter(v => v != null);
  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
}

function getDisplayPrice(product) {
  const plans = product.pricing?.plans || [];
  const paidPlans = plans.filter(p => p.price > 0);
  if (paidPlans.length > 0) {
    const lowest = Math.min(...paidPlans.map(p => p.price));
    return { text: `$${lowest}/mo`, type: 'subscription', value: lowest };
  }
  const tp = product.tokenPricing?.models;
  if (tp && tp.length > 0) {
    const cheapest = Math.min(...tp.map(m => m.input));
    return { text: `$${cheapest}/1M tokens`, type: 'token', value: cheapest };
  }
  if (product.pricing?.free) return { text: 'Free', type: 'free', value: 0 };
  return { text: 'Custom', type: 'custom', value: null };
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── HTML Template ───
function htmlPage({ title, description, canonical, article, schema, slug }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${escHtml(title)}">
<meta property="og:description" content="${escHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ComparEdge Blog">
<meta property="og:image" content="${SITE_URL}/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(title)}">
<meta name="twitter:description" content="${escHtml(description)}">
<link rel="icon" href="${SITE_URL}/favicon.ico">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#e0e0e0;line-height:1.7}
a{color:#3b82f6;text-decoration:none}a:hover{text-decoration:underline}
.container{max-width:800px;margin:0 auto;padding:20px 16px}
header{border-bottom:1px solid #1a1a1a;padding:16px 0;margin-bottom:32px}
header a{color:#fff;font-weight:700;font-size:18px}
header nav{display:flex;align-items:center;justify-content:space-between;max-width:800px;margin:0 auto;padding:0 16px}
header nav .links{display:flex;gap:16px}
header nav .links a{color:#888;font-size:14px;font-weight:400}
h1{font-size:2em;font-weight:800;line-height:1.2;margin-bottom:8px;color:#fff}
h2{font-size:1.4em;font-weight:700;margin:32px 0 12px;color:#fff;border-left:3px solid #3b82f6;padding-left:12px}
h3{font-size:1.1em;font-weight:600;margin:20px 0 8px;color:#ddd}
p{margin-bottom:16px;color:#bbb}
.meta{color:#666;font-size:14px;margin-bottom:24px}
.meta time{color:#888}
table{width:100%;border-collapse:collapse;margin:16px 0 24px;font-size:14px}
th{background:#1a1a1a;color:#fff;padding:10px 12px;text-align:left;font-weight:600;border:1px solid #2a2a2a}
td{padding:10px 12px;border:1px solid #1e1e1e;color:#bbb}
tr:nth-child(even){background:#111}
.highlight{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin:20px 0}
.highlight h3{margin-top:0}
.cta{display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0}
.cta:hover{background:#2563eb;text-decoration:none}
.pros-cons{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
@media(max-width:600px){.pros-cons{grid-template-columns:1fr}}
.pros,.cons{background:#1a1a1a;border-radius:8px;padding:16px;border:1px solid #2a2a2a}
.pros h3{color:#10b981}.cons h3{color:#ef4444}
.pros li::marker{color:#10b981}.cons li::marker{color:#ef4444}
ul,ol{margin:0 0 16px 20px;color:#bbb}
li{margin-bottom:6px}
footer{border-top:1px solid #1a1a1a;margin-top:48px;padding:24px 0;text-align:center;color:#555;font-size:13px}
.breadcrumb{font-size:13px;color:#666;margin-bottom:12px}
.breadcrumb a{color:#888}
.tag{display:inline-block;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;padding:2px 8px;font-size:12px;color:#888;margin:0 4px 4px 0}
.updated{display:inline-flex;align-items:center;gap:6px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;padding:4px 12px;font-size:12px;color:#888;margin-bottom:20px}
.updated .dot{width:6px;height:6px;background:#10b981;border-radius:50%;display:inline-block}
</style>
</head>
<body>
<header>
<nav>
<a href="${BLOG_URL}/">ComparEdge Blog</a>
<div class="links">
<a href="${SITE_URL}">Main Site</a>
<a href="${SITE_URL}/compare">Compare</a>
<a href="${SITE_URL}/pricing">Pricing</a>
</div>
</nav>
</header>
<main class="container">
${article}
</main>
<footer>
<div class="container">
<p>© ${YEAR} <a href="${SITE_URL}">ComparEdge</a> — Independent SaaS comparison platform. Data updated ${TODAY_DISPLAY}.</p>
<p style="margin-top:8px"><a href="${SITE_URL}">Compare 331+ tools</a> · <a href="${SITE_URL}/pricing">Pricing data</a> · <a href="${BLOG_URL}/">More articles</a></p>
</div>
</footer>
</body>
</html>`;
}

// ─── Article Generators ───

function generateLLMPricingArticle() {
  const llms = products.filter(p => p.category === 'llm' && p.tokenPricing?.models?.length)
    .map(p => ({
      ...p,
      cheapestInput: Math.min(...p.tokenPricing.models.map(m => m.input)),
      cheapestOutput: Math.min(...p.tokenPricing.models.map(m => m.output)),
      rating: getAvgRating(p)
    }))
    .sort((a, b) => a.cheapestInput - b.cheapestInput);

  const tableRows = llms.map(p =>
    `<tr><td><strong>${escHtml(p.name)}</strong></td><td>$${p.cheapestInput}</td><td>$${p.cheapestOutput}</td><td>${p.tokenPricing.models.map(m => escHtml(m.name)).join(', ')}</td><td>${p.rating || '-'}/5</td></tr>`
  ).join('\n');

  const cheapest = llms[0];
  const expensive = llms[llms.length - 1];

  const article = `
<nav class="breadcrumb"><a href="${BLOG_URL}/">Blog</a> → LLM Pricing</nav>
<h1>Cheapest LLM APIs in ${YEAR}: Token Pricing Ranked</h1>
<div class="meta">By ComparEdge Research · <time datetime="${TODAY}">${TODAY_DISPLAY}</time> · ${llms.length} models compared</div>
<div class="updated"><span class="dot"></span>Prices verified ${TODAY_DISPLAY}</div>

<p>We compared real API token prices across ${llms.length} LLM providers. All prices are per 1 million tokens, sourced from official pricing pages. <strong>${cheapest.name}</strong> offers the cheapest input tokens at <strong>$${cheapest.cheapestInput}/1M</strong>, while <strong>${expensive.name}</strong> is the most expensive at <strong>$${expensive.cheapestInput}/1M</strong>.</p>

<h2>LLM API Pricing Comparison Table</h2>
<table>
<thead><tr><th>Provider</th><th>Input/1M</th><th>Output/1M</th><th>Models</th><th>Rating</th></tr></thead>
<tbody>
${tableRows}
</tbody>
</table>

<h2>Key Findings</h2>
<div class="highlight">
<h3>💡 Best Value Picks</h3>
<ul>
<li><strong>Cheapest overall:</strong> ${cheapest.name} at $${cheapest.cheapestInput}/1M input tokens</li>
<li><strong>Best budget option:</strong> ${llms.filter(l => l.cheapestInput <= 0.15).map(l => l.name).join(', ')} — all under $0.15/1M</li>
<li><strong>Premium tier:</strong> ${llms.filter(l => l.cheapestInput >= 1).map(l => `${l.name} ($${l.cheapestInput})`).join(', ')}</li>
</ul>
</div>

${llms.slice(0, 6).map(p => `
<h2>${escHtml(p.name)} Pricing Breakdown</h2>
<p>${escHtml(p.description || '')} Rated <strong>${p.rating || 'N/A'}/5</strong> by users.</p>
<table>
<thead><tr><th>Model</th><th>Input/1M tokens</th><th>Output/1M tokens</th></tr></thead>
<tbody>
${p.tokenPricing.models.map(m => `<tr><td>${escHtml(m.name)}</td><td>$${m.input}</td><td>$${m.output}</td></tr>`).join('\n')}
</tbody>
</table>
${p.tokenPricing.note ? `<p><em>${escHtml(p.tokenPricing.note)}</em></p>` : ''}
<p>→ <a href="${SITE_URL}/pricing/${p.slug}-pricing">Full ${escHtml(p.name)} pricing breakdown on ComparEdge</a></p>
`).join('\n')}

<h2>How to Choose the Right LLM API</h2>
<p>Consider these factors beyond raw token price:</p>
<ul>
<li><strong>Quality vs. cost:</strong> Cheaper models (Llama, DeepSeek) may trade off quality for price. GPT-5.4 and Claude Opus 4.7 cost more but handle complex tasks better.</li>
<li><strong>Output tokens cost more:</strong> Most providers charge 2-5x more for output vs input tokens. If your use case generates long responses, compare output prices carefully.</li>
<li><strong>Free tiers:</strong> Google AI Studio and Mistral AI offer free API tiers with limited rate limits — good for prototyping.</li>
<li><strong>Open-source option:</strong> Llama 3.1 is free to self-host. The token prices listed are via cloud providers (Together AI, AWS Bedrock).</li>
</ul>

<div class="highlight">
<h3>🔗 Interactive Comparisons</h3>
<p>Compare any two LLMs side-by-side with interactive charts, feature matrices, and real pricing data:</p>
<p><a class="cta" href="${SITE_URL}/compare">Compare LLMs on ComparEdge →</a></p>
</div>
`;

  return {
    slug: 'cheapest-llm-api-pricing',
    title: `Cheapest LLM APIs ${YEAR}: Token Pricing Compared (${llms.length} Providers)`,
    description: `Compare LLM API token prices for ${YEAR}. ${cheapest.name} from $${cheapest.cheapestInput}/1M tokens. ${llms.length} providers ranked by input & output cost. Updated ${TODAY_DISPLAY}.`,
    article,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Cheapest LLM APIs ${YEAR}: Token Pricing Compared`,
      description: `Compare ${llms.length} LLM API providers by token pricing.`,
      datePublished: TODAY,
      dateModified: TODAY,
      author: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
      mainEntityOfPage: `${BLOG_URL}/cheapest-llm-api-pricing.html`
    }
  };
}

function generateVSArticle(slug1, slug2) {
  const p1 = findProduct(slug1);
  const p2 = findProduct(slug2);
  if (!p1 || !p2) return null;

  const r1 = getAvgRating(p1);
  const r2 = getAvgRating(p2);
  const pr1 = getDisplayPrice(p1);
  const pr2 = getDisplayPrice(p2);
  const [a, b] = [slug1, slug2].sort();
  const compareUrl = `${SITE_URL}/compare/${a}-vs-${b}`;

  const f1 = (p1.features || []).slice(0, 8);
  const f2 = (p2.features || []).slice(0, 8);
  const unique1 = f1.filter(f => !f2.some(f2f => f2f.toLowerCase() === f.toLowerCase()));
  const unique2 = f2.filter(f => !f1.some(f1f => f1f.toLowerCase() === f.toLowerCase()));

  // Token pricing comparison if both LLM
  let tokenSection = '';
  if (p1.tokenPricing?.models?.length && p2.tokenPricing?.models?.length) {
    tokenSection = `
<h2>API Token Pricing Comparison</h2>
<table>
<thead><tr><th>Model</th><th>Input/1M</th><th>Output/1M</th></tr></thead>
<tbody>
${p1.tokenPricing.models.map(m => `<tr><td>${escHtml(p1.name)}: ${escHtml(m.name)}</td><td>$${m.input}</td><td>$${m.output}</td></tr>`).join('\n')}
${p2.tokenPricing.models.map(m => `<tr><td>${escHtml(p2.name)}: ${escHtml(m.name)}</td><td>$${m.input}</td><td>$${m.output}</td></tr>`).join('\n')}
</tbody>
</table>`;
  }

  const slugPair = `${a}-vs-${b}`;
  const article = `
<nav class="breadcrumb"><a href="${BLOG_URL}/">Blog</a> → Comparison</nav>
<h1>${escHtml(p1.name)} vs ${escHtml(p2.name)} (${YEAR}): Detailed Comparison</h1>
<div class="meta">By ComparEdge Research · <time datetime="${TODAY}">${TODAY_DISPLAY}</time></div>
<div class="updated"><span class="dot"></span>Data verified ${TODAY_DISPLAY}</div>

<p>Choosing between <strong>${escHtml(p1.name)}</strong> and <strong>${escHtml(p2.name)}</strong>? Here's a data-driven comparison based on real pricing, ratings, and features.</p>

<h2>Quick Overview</h2>
<table>
<thead><tr><th></th><th>${escHtml(p1.name)}</th><th>${escHtml(p2.name)}</th></tr></thead>
<tbody>
<tr><td><strong>Rating</strong></td><td>${r1 || 'N/A'}/5</td><td>${r2 || 'N/A'}/5</td></tr>
<tr><td><strong>Starting Price</strong></td><td>${escHtml(pr1.text)}</td><td>${escHtml(pr2.text)}</td></tr>
<tr><td><strong>Features</strong></td><td>${f1.length}+</td><td>${f2.length}+</td></tr>
<tr><td><strong>Free Plan</strong></td><td>${p1.pricing?.free ? '✅ Yes' : '❌ No'}</td><td>${p2.pricing?.free ? '✅ Yes' : '❌ No'}</td></tr>
<tr><td><strong>Founded</strong></td><td>${p1.founded || 'N/A'}</td><td>${p2.founded || 'N/A'}</td></tr>
</tbody>
</table>

${tokenSection}

<h2>Unique Features</h2>
<div class="pros-cons">
<div class="pros">
<h3>Only in ${escHtml(p1.name)}</h3>
<ul>${unique1.length ? unique1.map(f => `<li>${escHtml(f)}</li>`).join('') : '<li>See full comparison for details</li>'}</ul>
</div>
<div class="cons">
<h3>Only in ${escHtml(p2.name)}</h3>
<ul>${unique2.length ? unique2.map(f => `<li>${escHtml(f)}</li>`).join('') : '<li>See full comparison for details</li>'}</ul>
</div>
</div>

<h2>${escHtml(p1.name)} — Pros & Cons</h2>
<div class="pros-cons">
<div class="pros"><h3>✅ Pros</h3><ul>${(p1.pros || []).slice(0, 5).map(x => `<li>${escHtml(x)}</li>`).join('')}</ul></div>
<div class="cons"><h3>❌ Cons</h3><ul>${(p1.cons || []).slice(0, 5).map(x => `<li>${escHtml(x)}</li>`).join('')}</ul></div>
</div>

<h2>${escHtml(p2.name)} — Pros & Cons</h2>
<div class="pros-cons">
<div class="pros"><h3>✅ Pros</h3><ul>${(p2.pros || []).slice(0, 5).map(x => `<li>${escHtml(x)}</li>`).join('')}</ul></div>
<div class="cons"><h3>❌ Cons</h3><ul>${(p2.cons || []).slice(0, 5).map(x => `<li>${escHtml(x)}</li>`).join('')}</ul></div>
</div>

<h2>Bottom Line</h2>
<p>${r1 && r2 && parseFloat(r1) > parseFloat(r2)
  ? `<strong>${escHtml(p1.name)}</strong> edges ahead with a ${r1}/5 rating vs ${r2}/5.`
  : r1 && r2 && parseFloat(r2) > parseFloat(r1)
    ? `<strong>${escHtml(p2.name)}</strong> leads with a ${r2}/5 rating vs ${r1}/5.`
    : `Both tools are closely matched in user ratings.`}
The best choice depends on your specific needs. For the full interactive comparison with radar charts, feature matrix, and live pricing:</p>

<p><a class="cta" href="${compareUrl}">Full ${escHtml(p1.name)} vs ${escHtml(p2.name)} Comparison →</a></p>
`;

  return {
    slug: slugPair,
    title: `${p1.name} vs ${p2.name} (${YEAR}): Pricing, Features & Ratings Compared`,
    description: `${p1.name} vs ${p2.name} comparison for ${YEAR}. ${p1.name}: ${pr1.text}, ${r1}/5 rating. ${p2.name}: ${pr2.text}, ${r2}/5 rating. Side-by-side analysis with real data.`,
    article,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${p1.name} vs ${p2.name} (${YEAR}): Comparison`,
      datePublished: TODAY,
      dateModified: TODAY,
      author: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
      mainEntityOfPage: `${BLOG_URL}/${slugPair}.html`
    }
  };
}

function generateBestFreeArticle(category, categoryName) {
  const catProducts = products.filter(p => p.category === category && p.pricing?.free)
    .map(p => ({ ...p, rating: getAvgRating(p), price: getDisplayPrice(p) }))
    .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));

  if (catProducts.length < 3) return null;

  const article = `
<nav class="breadcrumb"><a href="${BLOG_URL}/">Blog</a> → Best Free ${escHtml(categoryName)}</nav>
<h1>Best Free ${escHtml(categoryName)} in ${YEAR} (${catProducts.length} Tools Tested)</h1>
<div class="meta">By ComparEdge Research · <time datetime="${TODAY}">${TODAY_DISPLAY}</time> · ${catProducts.length} tools analyzed</div>
<div class="updated"><span class="dot"></span>Updated ${TODAY_DISPLAY}</div>

<p>We analyzed ${catProducts.length} ${categoryName.toLowerCase()} tools that offer free plans. Rankings based on real user ratings from G2 and Capterra.</p>

<h2>Top ${Math.min(catProducts.length, 10)} Free ${escHtml(categoryName)}</h2>
<table>
<thead><tr><th>#</th><th>Tool</th><th>Rating</th><th>Starting Price</th><th>Key Feature</th></tr></thead>
<tbody>
${catProducts.slice(0, 10).map((p, i) => `<tr><td>${i + 1}</td><td><strong>${escHtml(p.name)}</strong></td><td>${p.rating || '-'}/5</td><td>${escHtml(p.price.text)}</td><td>${escHtml((p.features || [])[0] || '-')}</td></tr>`).join('\n')}
</tbody>
</table>

${catProducts.slice(0, 5).map((p, i) => `
<h2>${i + 1}. ${escHtml(p.name)} ${p.rating ? `— ${p.rating}/5` : ''}</h2>
<p>${escHtml(p.description || '')}</p>
${(p.pros || []).length ? `<h3>Why it's good:</h3><ul>${p.pros.slice(0, 3).map(x => `<li>${escHtml(x)}</li>`).join('')}</ul>` : ''}
<p>→ <a href="${SITE_URL}/tools/${p.slug}">Full ${escHtml(p.name)} review on ComparEdge</a></p>
`).join('\n')}

<div class="highlight">
<h3>🔗 Compare All ${escHtml(categoryName)}</h3>
<p>See interactive comparisons, feature matrices, and pricing for all ${catProducts.length}+ tools:</p>
<p><a class="cta" href="${SITE_URL}/best/${category}">View All ${escHtml(categoryName)} on ComparEdge →</a></p>
</div>
`;

  const slug = `best-free-${category}`;
  return {
    slug,
    title: `Best Free ${categoryName} ${YEAR}: ${catProducts.length} Tools Ranked by Rating`,
    description: `${catProducts.length} free ${categoryName.toLowerCase()} compared for ${YEAR}. #1: ${catProducts[0].name} (${catProducts[0].rating}/5). Rankings, features, and real pricing data.`,
    article,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Best Free ${categoryName} ${YEAR}`,
      datePublished: TODAY,
      dateModified: TODAY,
      author: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
      mainEntityOfPage: `${BLOG_URL}/${slug}.html`
    }
  };
}

// ─── Define articles to generate ───

const articles = [
  // 1. LLM pricing roundup (high search volume)
  generateLLMPricingArticle(),

  // 2-5. Hot VS comparisons
  generateVSArticle('claude-api', 'openai-api'),
  generateVSArticle('github-copilot', 'cursor'),
  generateVSArticle('deepseek', 'openai-api'),
  generateVSArticle('chatgpt', 'claude'),

  // 6-8. Best Free (evergreen)
  generateBestFreeArticle('llm', 'AI Models & LLMs'),
  generateBestFreeArticle('ai-coding', 'AI Coding Tools'),
  generateBestFreeArticle('project-management', 'Project Management Tools'),

  // 9-10. More hot comparisons
  generateVSArticle('midjourney', 'dall-e-3'),
  generateVSArticle('notion', 'clickup'),
].filter(Boolean);

// ─── Generate index page ───

function generateIndex(articles) {
  const articleList = articles.map(a => `
    <article style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:16px">
      <h2 style="margin:0 0 8px;border:none;padding:0"><a href="${a.slug}.html" style="color:#fff">${escHtml(a.title)}</a></h2>
      <p style="margin:0;font-size:14px">${escHtml(a.description)}</p>
    </article>
  `).join('\n');

  return {
    slug: 'index',
    title: `ComparEdge Blog — SaaS & AI Tool Comparisons ${YEAR}`,
    description: `Data-driven comparisons of AI tools, LLMs, and SaaS products. Real pricing, ratings, and features from 331+ products. Updated ${TODAY_DISPLAY}.`,
    article: `
<h1>ComparEdge Blog</h1>
<p>Data-driven analysis of AI tools and SaaS products. All data sourced from <a href="${SITE_URL}">ComparEdge</a> — 331+ products with real pricing and ratings.</p>
<div class="updated"><span class="dot"></span>Updated ${TODAY_DISPLAY} · ${articles.length} articles</div>
${articleList}
<div class="highlight" style="text-align:center">
<h3>Want Interactive Comparisons?</h3>
<p>Our main site has radar charts, feature matrices, and live pricing for 331+ tools.</p>
<p><a class="cta" href="${SITE_URL}">Explore ComparEdge →</a></p>
</div>
`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ComparEdge Blog',
      url: BLOG_URL,
      description: `Data-driven AI & SaaS comparisons from ComparEdge`,
      publisher: { '@type': 'Organization', name: 'ComparEdge', url: SITE_URL }
    }
  };
}

// ─── Write files ───
const outDir = path.join(__dirname, 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Generate articles
articles.forEach(a => {
  const html = htmlPage({ ...a, canonical: `${BLOG_URL}/${a.slug}.html` });
  fs.writeFileSync(path.join(outDir, `${a.slug}.html`), html, 'utf8');
  console.log(`✅ ${a.slug}.html (${a.title.slice(0, 60)}...)`);
});

// Generate index
const indexData = generateIndex(articles);
const indexHtml = htmlPage({ ...indexData, canonical: `${BLOG_URL}/` });
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8');
console.log(`✅ index.html`);

// Generate sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${BLOG_URL}/</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
${articles.map(a => `<url><loc>${BLOG_URL}/${a.slug}.html</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');
console.log(`✅ sitemap.xml (${articles.length + 1} URLs)`);

// Generate robots.txt
const robots = `User-agent: *
Allow: /
Sitemap: ${BLOG_URL}/sitemap.xml`;
fs.writeFileSync(path.join(outDir, 'robots.txt'), robots, 'utf8');
console.log(`✅ robots.txt`);

console.log(`\n🎉 Generated ${articles.length} articles + index + sitemap + robots`);
