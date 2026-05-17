(function () {
  const root = document.getElementById('featured-projects');
  if (!root) return;

  const placeholder = (n) => `
    <div class="block-card block-card--static product-tile product-tile--placeholder">
      <div class="product-tile__img-wrap">Coming soon</div>
      <div class="product-tile__body">
        <h3 class="product-tile__title">Repair highlight ${n}</h3>
      </div>
    </div>`;

  function card(project) {
    const img = project.thumbnail || project.hero || '';
    const name = project.projectName || project.title || 'Project';
    const subtitle =
      project.title && project.projectName
        ? `<p class="product-tile__subtitle">${project.title}</p>`
        : '';
    return `
      <a href="${project.url}" class="block-card product-tile">
        <img class="product-tile__img" src="${img}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" />
        <div class="product-tile__body">
          <h3 class="product-tile__title">${name}</h3>
          ${subtitle}
        </div>
      </a>`;
  }

  fetch('/new/data/projects-index.json')
    .then((res) => res.json())
    .then((projects) => {
      const cards = [];
      for (let i = 0; i < 3; i += 1) {
        if (projects[i]) cards.push(card(projects[i]));
        else cards.push(placeholder(i + 1));
      }
      root.innerHTML = cards.join('');
    })
    .catch(() => {
      root.innerHTML = [1, 2, 3].map(placeholder).join('');
    });
})();
