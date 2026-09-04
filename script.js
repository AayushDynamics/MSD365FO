// FastTab collapse/expand
document.addEventListener('click', function(e){
  const header = e.target.closest('.fasttab-header');
  if(header){
    header.classList.toggle('collapsed');
    const body = header.nextElementSibling;
    if(body) body.classList.toggle('hidden');
  }
});

// Category filter on home page grid
function filterByModule(module){
  const rows = document.querySelectorAll('#postGrid tbody tr');
  let visible = 0;
  rows.forEach(row => {
    const rowModule = row.getAttribute('data-module');
    if(module === 'all' || rowModule === module){
      row.classList.remove('hidden');
      visible++;
    } else {
      row.classList.add('hidden');
    }
  });
  const counter = document.getElementById('gridCount');
  if(counter) counter.textContent = visible + ' of ' + rows.length + ' posts';

  document.querySelectorAll('.nav-item[data-module]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-module') === module);
  });
}

// Wire up module nav clicks on index page
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.nav-item[data-module]').forEach(item => {
    item.addEventListener('click', function(){
      filterByModule(this.getAttribute('data-module'));
    });
  });

  const moduleSelect = document.getElementById('moduleSelect');
  if(moduleSelect){
    moduleSelect.addEventListener('change', function(){
      filterByModule(this.value);
    });
  }

  // Simple search box filter (title + excerpt)
  const searchBox = document.getElementById('searchBox');
  if(searchBox){
    searchBox.addEventListener('input', function(){
      const q = this.value.toLowerCase();
      const rows = document.querySelectorAll('#postGrid tbody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.classList.toggle('hidden', q.length > 0 && !text.includes(q));
      });
    });
  }

  // Contact form: no backend, so just show a confirmation
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      document.getElementById('formStatus').textContent = 'This is a static demo form — connect it to Formspree or a mail-to link to make it live.';
    });
  }
});
