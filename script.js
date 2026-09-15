// FastTab collapse/expand (used on post pages)
document.addEventListener('click', function(e){
  const header = e.target.closest('.fasttab-header');
  if(header){
    header.classList.toggle('collapsed');
    const body = header.nextElementSibling;
    if(body) body.classList.toggle('hidden');
    header.setAttribute('aria-expanded', header.classList.contains('collapsed') ? 'false' : 'true');
  }
});

// ===== Home page: module tree + post grid =====
document.addEventListener('DOMContentLoaded', function(){
  const treeEl = document.getElementById('moduleTree');
  if(!treeEl || typeof SITE_DATA === 'undefined') return;

  // Build: module -> submodule -> [posts], only including combos that have posts
  const grouped = {};
  SITE_DATA.posts.forEach(function(post){
    if(!grouped[post.module]) grouped[post.module] = {};
    if(!grouped[post.module][post.submodule]) grouped[post.module][post.submodule] = [];
    grouped[post.module][post.submodule].push(post);
  });

  // Render tree — only modules that exist in `grouped`, in the canonical module order
  let treeHTML = '';
  SITE_DATA.modules.forEach(function(moduleName){
    if(!grouped[moduleName]) return; // hide modules with no posts

    const submods = grouped[moduleName];
    treeHTML += '<div class="module-row" data-module="' + moduleName + '">' +
                  '<span class="tree-chevron">▸</span>' +
                  '<span class="module-name">' + moduleName + '</span>' +
                '</div>';
    treeHTML += '<div class="submodule-list" data-module-list="' + moduleName + '">';
    SITE_DATA.submodules.forEach(function(subName){
      if(!submods[subName]) return; // hide submodules with no posts
      treeHTML += '<div class="submodule-item" data-module="' + moduleName + '" data-submodule="' + subName + '">' +
                    subName + ' <span style="opacity:.6">(' + submods[subName].length + ')</span>' +
                  '</div>';
    });
    treeHTML += '</div>';
  });
  treeEl.innerHTML = treeHTML;

  // Expand/collapse module rows
  treeEl.querySelectorAll('.module-row').forEach(function(row){
    row.addEventListener('click', function(){
      row.classList.toggle('expanded');
      const list = treeEl.querySelector('.submodule-list[data-module-list="' + row.getAttribute('data-module') + '"]');
      if(list) list.classList.toggle('expanded');
    });
  });

  // Submodule click -> filter
  treeEl.querySelectorAll('.submodule-item').forEach(function(item){
    item.addEventListener('click', function(e){
      e.stopPropagation();
      const mod = item.getAttribute('data-module');
      const sub = item.getAttribute('data-submodule');
      renderGrid(mod, sub);
      treeEl.querySelectorAll('.submodule-item').forEach(function(i){ i.classList.remove('active'); });
      item.classList.add('active');
      const homeLink = document.getElementById('homeNavItem');
      if(homeLink) homeLink.classList.remove('active');
    });
  });

  // "Home" nav item resets filter
  const homeLink = document.getElementById('homeNavItem');
  if(homeLink){
    homeLink.addEventListener('click', function(){
      renderGrid(null, null);
      treeEl.querySelectorAll('.submodule-item').forEach(function(i){ i.classList.remove('active'); });
      homeLink.classList.add('active');
    });
  }

  function renderGrid(moduleFilter, submoduleFilter){
    const tbody = document.getElementById('postGridBody');
    const countEl = document.getElementById('gridCount');
    const titleEl = document.getElementById('gridTitle');
    if(!tbody) return;

    let posts = SITE_DATA.posts.slice().sort(function(a,b){ return a.dateSort < b.dateSort ? 1 : -1; });
    if(moduleFilter){
      posts = posts.filter(function(p){ return p.module === moduleFilter; });
    }
    if(submoduleFilter){
      posts = posts.filter(function(p){ return p.submodule === submoduleFilter; });
    }

    if(titleEl){
      titleEl.textContent = moduleFilter
        ? (moduleFilter + (submoduleFilter ? ' — ' + submoduleFilter : ''))
        : 'All posts';
    }

    if(posts.length === 0){
      tbody.innerHTML = '';
      const panel = document.getElementById('gridPanel');
      if(panel){
        panel.innerHTML = '<div class="empty-state"><div class="empty-title">No posts yet</div>' +
          'There\u2019s nothing published in this section yet — check back soon.</div>';
      }
      if(countEl) countEl.textContent = '0 posts';
      return;
    }

    tbody.innerHTML = posts.map(function(p){
      return '<tr onclick="window.location=\'' + p.url + '\'">' +
        '<td class="post-title-cell"><a href="' + p.url + '">' + p.title + '</a>' +
        '<span class="post-excerpt">' + p.excerpt + '</span></td>' +
        '<td><span class="badge">' + p.module + '</span></td>' +
        '<td><span class="status-dot">Published</span></td>' +
        '<td class="col-date">' + p.date + '</td>' +
        '<td>' + p.readTime + '</td>' +
        '</tr>';
    }).join('');

    if(countEl) countEl.textContent = posts.length + ' post' + (posts.length === 1 ? '' : 's');
  }

  // Search box filters across all posts regardless of tree selection
  const searchBox = document.getElementById('searchBox');
  if(searchBox){
    searchBox.addEventListener('input', function(){
      const q = this.value.toLowerCase();
      const rows = document.querySelectorAll('#postGridBody tr');
      rows.forEach(function(row){
        const text = row.textContent.toLowerCase();
        row.style.display = (q.length > 0 && !text.includes(q)) ? 'none' : '';
      });
    });
  }

  // Initial render: all posts
  renderGrid(null, null);
});

// ===== Post pages: give wide tables their own horizontal scroll =====
// A wrapper keeps thead/tbody column alignment intact, which setting
// display:block on the table itself does not.
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.fasttab-body table').forEach(function(table){
    if(table.parentElement && table.parentElement.classList.contains('table-scroll')) return;
    if(table.closest('.table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
});

// ===== Mobile navigation drawer (all pages) =====
// The button and scrim are injected here so no page markup has to change.
document.addEventListener('DOMContentLoaded', function(){
  const bar = document.querySelector('.app-bar');
  const pane = document.querySelector('.nav-pane');
  if(!bar || !pane || document.getElementById('navToggle')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.id = 'navToggle';
  btn.setAttribute('aria-label', 'Toggle navigation');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  bar.insertBefore(btn, bar.firstChild);

  const scrim = document.createElement('div');
  scrim.className = 'nav-scrim';
  document.body.appendChild(scrim);

  function setOpen(open){
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', function(){
    setOpen(!document.body.classList.contains('nav-open'));
  });
  scrim.addEventListener('click', function(){ setOpen(false); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') setOpen(false);
  });

  // Close once a destination is chosen, but not when expanding the tree
  pane.addEventListener('click', function(e){
    if(e.target.closest('a.nav-item, a.toc-item, .submodule-item, #homeNavItem')) setOpen(false);
  });

  window.addEventListener('resize', function(){
    if(window.innerWidth > 900) setOpen(false);
  });
});

// ===== Post pages: TOC navigation + keyboard access =====
// Previously duplicated inline in every post page; centralised here so all
// posts share one copy.
document.addEventListener('DOMContentLoaded', function(){
  const toc = document.getElementById('postToc');

  if(toc){
    toc.querySelectorAll('.toc-item').forEach(function(link){
      link.addEventListener('click', function(e){
        e.preventDefault();
        const targetId = this.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if(!target) return;
        const tab = target.closest('.fasttab');
        if(tab){
          const header = tab.querySelector('.fasttab-header');
          const body = tab.querySelector('.fasttab-body');
          if(header && body && body.classList.contains('hidden')){
            header.classList.remove('collapsed');
            body.classList.remove('hidden');
            header.setAttribute('aria-expanded', 'true');
          }
        }
        toc.querySelectorAll('.toc-item').forEach(function(l){ l.classList.remove('active'); });
        this.classList.add('active');
        setTimeout(function(){ target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
      });
    });

    toc.querySelectorAll('.toc-chevron[data-toc-toggle]').forEach(function(chevron){
      chevron.setAttribute('role', 'button');
      chevron.setAttribute('tabindex', '0');
      chevron.setAttribute('aria-label', 'Toggle section');
      function toggle(e){
        e.preventDefault();
        e.stopPropagation();
        const children = document.getElementById('tocChildren-' + chevron.getAttribute('data-toc-toggle'));
        const row = chevron.closest('.toc-h1-row');
        if(children) children.classList.toggle('collapsed');
        if(row) row.classList.toggle('collapsed');
        chevron.setAttribute('aria-expanded', row && row.classList.contains('collapsed') ? 'false' : 'true');
      }
      chevron.addEventListener('click', toggle);
      chevron.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' ') toggle(e);
      });
      chevron.setAttribute('aria-expanded', 'true');
    });
  }

  // FastTab headers are divs; make them reachable and operable by keyboard
  document.querySelectorAll('.fasttab-header').forEach(function(header){
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    const body = header.nextElementSibling;
    header.setAttribute('aria-expanded', body && body.classList.contains('hidden') ? 'false' : 'true');
    header.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        header.click();
      }
    });
  });
});

// ===== Post pages: "Collapse all" / "Expand all" for the ON THIS PAGE tree =====
document.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('collapseAllNavBtn');
  const toc = document.getElementById('postToc');
  if(!btn || !toc) return;

  function chevrons(){
    return Array.prototype.slice.call(
      toc.querySelectorAll('.toc-h1-row .toc-chevron[data-toc-toggle]')
    );
  }

  function allCollapsed(){
    const list = chevrons();
    return list.length > 0 && list.every(function(ch){
      const row = ch.closest('.toc-h1-row');
      return row && row.classList.contains('collapsed');
    });
  }

  function syncLabel(){
    btn.textContent = allCollapsed() ? 'Expand all' : 'Collapse all';
  }

  btn.addEventListener('click', function(){
    const collapse = !allCollapsed();
    chevrons().forEach(function(ch){
      const row = ch.closest('.toc-h1-row');
      const children = document.getElementById('tocChildren-' + ch.getAttribute('data-toc-toggle'));
      if(row) row.classList.toggle('collapsed', collapse);
      if(children) children.classList.toggle('collapsed', collapse);
    });
    syncLabel();
  });

  // Keep the label honest when sections are toggled one at a time
  toc.addEventListener('click', function(e){
    if(e.target.closest('.toc-chevron[data-toc-toggle]')) setTimeout(syncLabel, 0);
  });

  syncLabel();
});

// ===== Contact form (posts to Formspree without leaving the page) =====
document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('contactForm');
  if(!form) return;

  const status = document.getElementById('formStatus');
  const submit = document.getElementById('contactSubmit');

  function setStatus(text, kind){
    if(!status) return;
    status.textContent = text;
    status.style.color = kind === 'error' ? 'var(--red)'
      : kind === 'success' ? 'var(--green)'
      : 'var(--text-secondary)';
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    const endpoint = form.getAttribute('action') || '';
    if(endpoint.indexOf('YOUR_FORM_ID') !== -1){
      setStatus('This form is not connected yet. Paste your Formspree form ID into the action attribute in contact.html.', 'error');
      return;
    }

    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }

    const original = submit ? submit.textContent : '';
    if(submit){ submit.disabled = true; submit.textContent = 'Sending...'; }
    setStatus('Sending your message...');

    fetch(endpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
    .then(function(response){
      if(response.ok){
        form.reset();
        setStatus('Thanks — your message has been sent. I will get back to you by email.', 'success');
        return;
      }
      return response.json().then(function(data){
        const detail = data && data.errors
          ? data.errors.map(function(err){ return err.message; }).join(', ')
          : 'Something went wrong.';
        const tidy = /[.!?]$/.test(detail) ? detail : detail + '.';
        setStatus(tidy + ' Please try again, or email me directly.', 'error');
      }).catch(function(){
        setStatus('Something went wrong. Please try again, or email me directly.', 'error');
      });
    })
    .catch(function(){
      setStatus('Could not reach the mail service. Check your connection and try again.', 'error');
    })
    .then(function(){
      if(submit){ submit.disabled = false; submit.textContent = original; }
    });
  });
});
