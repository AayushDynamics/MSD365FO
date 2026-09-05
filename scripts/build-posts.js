// Reads Markdown files from content/posts/, generates:
//  1. A styled HTML page per post in posts/<slug>.html
//  2. Injects the full post list into index.html's inline SITE_DATA.posts array
//
// Runs in GitHub Actions on every push (see .github/workflows/build.yml)
// Uses only Node's built-in modules — no npm install needed in CI.

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const OUTPUT_POSTS_DIR = path.join(__dirname, '..', 'posts');
const INDEX_HTML_PATH = path.join(__dirname, '..', 'index.html');
// Posts listed here are hand-authored HTML pages that must NEVER be touched or
// removed by this script — only CMS-authored posts (from content/posts/*.md)
// are added on top of these.
const MANUAL_POSTS = [
  {
    title: 'Vendor Payment Proposal in D365 Finance',
    url: 'posts/vendor-payment-proposal.html',
    module: 'Accounts payable',
    submodule: 'Major Functionalities',
    excerpt: 'How the payment proposal process automates vendor invoice selection and cash flow planning in D365 F&O.',
    date: 'Sep 1, 2026',
    dateSort: '2026-09-01',
    readTime: '7 min'
  },
  {
    title: 'From Raw Materials to Finished Goods: A Comprehensive Journey',
    url: 'posts/rm-to-fg.html',
    module: 'Production control',
    submodule: 'Module related accounting',
    excerpt: 'Production planning, execution, and costing, with the accounting entries at each step of the RM-to-FG cycle.',
    date: 'Aug 31, 2026',
    dateSort: '2026-08-31',
    readTime: '9 min'
  },
  {
    title: 'Navigating the Order-to-Cash (O2C) Cycle',
    url: 'posts/order-to-cash.html',
    module: 'Accounts receivable',
    submodule: 'Module related accounting',
    excerpt: 'Order creation through picking, invoicing, and payment reconciliation, plus the accounting entries at each stage.',
    date: 'Aug 31, 2026',
    dateSort: '2026-08-31',
    readTime: '8 min'
  },
  {
    title: 'Understanding the Procure-to-Pay (P2P) Cycle',
    url: 'posts/procure-to-pay.html',
    module: 'Accounts payable',
    submodule: 'Module related accounting',
    excerpt: 'From requisition to payment execution, the full P2P journey, including three-way matching and GRNI accounting.',
    date: 'Aug 26, 2026',
    dateSort: '2026-08-26',
    readTime: '10 min'
  }
];

// ---------- Minimal frontmatter parser (YAML-lite, no dependencies) ----------
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const yamlBlock = match[1];
  const body = match[2];
  const data = {};
  yamlBlock.split(/\r?\n/).forEach(function (line) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) return;
    let key = m[1];
    let val = m[2].trim();
    // Strip surrounding quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    data[key] = val;
  });
  return { data: data, body: body.trim() };
}

// ---------- Very small Markdown -> HTML converter ----------
// Supports: headings (##, ###), paragraphs, bold (**text**), unordered lists (- item), line breaks.
function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  let html = '';
  let inList = false;

  function inlineFormat(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  lines.forEach(function (line) {
    const trimmed = line.trim();

    if (trimmed === '') {
      if (inList) { html += '</ul>'; inList = false; }
      return;
    }

    const h3 = trimmed.match(/^###\s+(.*)$/);
    const h2 = trimmed.match(/^##\s+(.*)$/);
    const li = trimmed.match(/^[-*]\s+(.*)$/);

    if (h2) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<h2>' + inlineFormat(h2[1]) + '</h2>';
    } else if (h3) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<h3>' + inlineFormat(h3[1]) + '</h3>';
    } else if (li) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + inlineFormat(li[1]) + '</li>';
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<p>' + inlineFormat(trimmed) + '</p>';
    }
  });
  if (inList) html += '</ul>';
  return html;
}

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeForJs(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function escapeHtmlAttr(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// ---------- Post page template (matches the site's existing FastTabs D365 style) ----------
function renderPostPage(post) {
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + escapeHtmlAttr(post.title) + ' — MS D365 F&O</title>\n' +
    '<link rel="stylesheet" href="../style.css">\n' +
    '</head>\n<body>\n\n' +
    '  <div class="app-bar">\n' +
    '    <a class="site-title-link" href="../index.html">\n' +
    '      <div class="grid-icon"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>\n' +
    '      <span class="site-title">MS D365 F&O</span>\n' +
    '      <span class="site-sub">| Exploring D365 Finance and Operations</span>\n' +
    '    </a>\n' +
    '    <div class="spacer"></div>\n' +
    '    <div class="avatar">AT</div>\n' +
    '  </div>\n\n' +
    '  <div class="shell">\n' +
    '    <div class="nav-pane">\n' +
    '      <div class="nav-section-label">SITE</div>\n' +
    '      <a class="nav-item" href="../index.html">Home</a>\n' +
    '      <a class="nav-item" href="../about.html">About</a>\n' +
    '      <a class="nav-item" href="../contact.html">Contact</a>\n' +
    '    </div>\n\n' +
    '    <div class="main narrow">\n' +
    '      <div class="breadcrumb">\n' +
    '        <a href="../index.html">MS D365 F&O</a><span class="sep">›</span>\n' +
    '        <a href="../index.html">' + escapeHtmlAttr(post.module) + '</a><span class="sep">›</span>\n' +
    '        ' + escapeHtmlAttr(post.title) + '\n' +
    '      </div>\n\n' +
    '      <div class="command-bar">\n' +
    '        <a class="cmd-btn" href="../index.html" style="text-decoration:none;"><span class="cmd-icon">←</span><span class="cmd-label">Back</span></a>\n' +
    '      </div>\n\n' +
    '      <div class="post-header">\n' +
    '        <h1 class="post-title">' + escapeHtmlAttr(post.title) + '</h1>\n' +
    '        <div class="post-meta">\n' +
    '          <span class="badge">' + escapeHtmlAttr(post.module) + '</span>\n' +
    '          <span class="status-dot">Published</span>\n' +
    '          <span>' + escapeHtmlAttr(post.displayDate) + '</span>\n' +
    '          <span>Aayush Tiwari</span>\n' +
    '          <span>' + escapeHtmlAttr(post.readTime) + '</span>\n' +
    '        </div>\n' +
    '      </div>\n\n' +
    (post.image ? '      <img src="../' + escapeHtmlAttr(post.image) + '" alt="" style="width:100%;display:block;border:1px solid var(--border);border-top:none;">\n\n' : '') +
    '      <div class="fasttabs attached">\n' +
    '        <div class="fasttab">\n' +
    '          <div class="fasttab-header"><span class="chevron">▾</span>Post</div>\n' +
    '          <div class="fasttab-body">\n' +
    '            ' + post.bodyHtml + '\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n\n' +
    '<script src="../script.js"></script>\n' +
    '</body>\n</html>\n';
}

// ---------- Main ----------
function main() {
  const cmsPosts = [];

  if (fs.existsSync(POSTS_DIR)) {
    const files = fs.readdirSync(POSTS_DIR).filter(function (f) { return f.endsWith('.md'); });

    if (!fs.existsSync(OUTPUT_POSTS_DIR)) fs.mkdirSync(OUTPUT_POSTS_DIR, { recursive: true });

    files.forEach(function (filename) {
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
      const parsed = parseFrontmatter(raw);
      const data = parsed.data;

      const title = data.title || 'Untitled';
      const slug = slugify(data.title || filename.replace(/\.md$/, ''));
      const dateSort = (data.date || '').slice(0, 10) || '1970-01-01';
      const displayDate = dateSort !== '1970-01-01'
        ? new Date(dateSort + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

      const bodyHtml = markdownToHtml(parsed.body);

      const post = {
        title: title,
        module: data.module || '',
        submodule: data.submodule || '',
        excerpt: data.excerpt || '',
        readTime: data.readTime || '5 min',
        dateSort: dateSort,
        displayDate: displayDate,
        image: data.image || '',
        bodyHtml: bodyHtml,
        url: 'posts/' + slug + '.html'
      };

      fs.writeFileSync(path.join(OUTPUT_POSTS_DIR, slug + '.html'), renderPostPage(post));
      cmsPosts.push(post);
      console.log('Built from CMS:', post.url);
    });
  } else {
    console.log('No content/posts directory found — only manual posts will be listed.');
  }

  // Normalize manual posts to the same shape (they use `date`, cmsPosts use `displayDate`)
  const manualNormalized = MANUAL_POSTS.map(function (p) {
    return {
      title: p.title,
      module: p.module,
      submodule: p.submodule,
      excerpt: p.excerpt,
      readTime: p.readTime,
      dateSort: p.dateSort,
      displayDate: p.date,
      url: p.url
    };
  });

  // Merge: manual posts are always kept; CMS posts are added, de-duplicated by url
  // (so re-running the build after editing a CMS post updates it instead of duplicating it)
  const manualUrls = new Set(manualNormalized.map(function (p) { return p.url; }));
  const cmsDeduped = [];
  const seenCmsUrls = new Set();
  cmsPosts.forEach(function (p) {
    if (manualUrls.has(p.url)) return; // never let a CMS post shadow a manual one
    if (seenCmsUrls.has(p.url)) return;
    seenCmsUrls.add(p.url);
    cmsDeduped.push(p);
  });

  const posts = manualNormalized.concat(cmsDeduped);
  posts.sort(function (a, b) { return a.dateSort < b.dateSort ? 1 : -1; });

  // Build the JS array literal to inject into index.html
  const postsArrayJs = posts.map(function (p) {
    return '    {\n' +
      "      title: '" + escapeForJs(p.title) + "',\n" +
      "      url: '" + escapeForJs(p.url) + "',\n" +
      "      module: '" + escapeForJs(p.module) + "',\n" +
      "      submodule: '" + escapeForJs(p.submodule) + "',\n" +
      "      excerpt: '" + escapeForJs(p.excerpt) + "',\n" +
      "      date: '" + escapeForJs(p.displayDate) + "',\n" +
      "      dateSort: '" + escapeForJs(p.dateSort) + "',\n" +
      "      readTime: '" + escapeForJs(p.readTime) + "'\n" +
      '    }';
  }).join(',\n');

  let indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

  const postsBlockRegex = /(posts:\s*\[)([\s\S]*?)(\n\s*\]\s*\};)/;
  if (!postsBlockRegex.test(indexHtml)) {
    console.error('Could not find posts: [ ... ]; block in index.html — aborting to avoid corrupting the file.');
    process.exit(1);
  }

  indexHtml = indexHtml.replace(postsBlockRegex, function (match, open, _old, close) {
    return open + '\n' + postsArrayJs + close;
  });

  fs.writeFileSync(INDEX_HTML_PATH, indexHtml);
  console.log('Updated index.html with', posts.length, 'total post(s):', manualNormalized.length, 'manual +', cmsDeduped.length, 'from CMS.');
}

main();
