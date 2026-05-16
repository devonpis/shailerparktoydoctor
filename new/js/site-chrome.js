(function () {
  const headerSlot = document.getElementById('site-header');
  const footerSlot = document.getElementById('site-footer');
  if (!headerSlot && !footerSlot) return;

  const page = document.body.dataset.activePage;

  function markCurrent(scope) {
    if (!page || !scope) return;
    scope.querySelectorAll(`a[data-nav="${page}"]`).forEach((link) => {
      link.setAttribute('aria-current', 'page');
      const item = link.closest('.jw-menu-item');
      if (item) item.classList.add('jw-menu-is-active');
    });
  }

  function injectSocialIcons() {
    return fetch('/new/includes/social-icons.html')
      .then((res) => (res.ok ? res.text() : ''))
      .then((html) => {
        if (!html) return;
        document.querySelectorAll('[data-social-slot]').forEach((slot) => {
          slot.outerHTML = html;
        });
      })
      .catch(() => {});
  }

  Promise.all([
    headerSlot
      ? fetch('/new/includes/site-header.html')
          .then((res) => res.text())
          .catch(() => '')
      : Promise.resolve(''),
    footerSlot
      ? fetch('/new/includes/site-footer.html')
          .then((res) => res.text())
          .catch(() => '')
      : Promise.resolve(''),
  ])
    .then(([headerHtml, footerHtml]) => {
      if (headerSlot && headerHtml) {
        headerSlot.innerHTML = headerHtml;
        markCurrent(headerSlot);
      }
      if (footerSlot && footerHtml) {
        footerSlot.innerHTML = footerHtml;
        markCurrent(footerSlot);
      }
      return injectSocialIcons();
    })
    .then(() => {
      if (headerSlot) markCurrent(headerSlot);
      if (footerSlot) markCurrent(footerSlot);
    });
})();
