(function () {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.site-nav-toggle');
  const menu = document.getElementById('site-nav-menu');
  if (!header || !toggle || !menu) return;

  function setOpen(open) {
    header.classList.toggle('is-nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', () => setOpen(!header.classList.contains('is-nav-open')));

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  const page = document.body.dataset.activePage;
  if (page) {
    menu.querySelectorAll(`[data-nav="${page}"]`).forEach((link) => {
      link.setAttribute('aria-current', 'page');
    });
  }
})();
