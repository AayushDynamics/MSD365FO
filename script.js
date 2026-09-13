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
