// FastTab collapse/expand (used on post pages)
document.addEventListener('click', function(e){
  const header = e.target.closest('.fasttab-header');
  if(header){
    header.classList.toggle('collapsed');
    const body = header.nextElementSibling;
    if(body) body.classList.toggle('hidden');
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

// Contact form (static demo)
document.addEventListener('DOMContentLoaded', function(){
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      document.getElementById('formStatus').textContent = 'This is a static demo form — connect it to Formspree or a mail-to link to make it live.';
    });
  }
});
