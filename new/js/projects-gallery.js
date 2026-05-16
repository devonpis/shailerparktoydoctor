/**
 * Projects gallery — skill filters and cards
 */
(function () {
  const root = document.getElementById('projects-root');
  if (!root || !window.SiteSkills) return;

  const { filterBarHtml, overlayBadgesHtml, projectHasSkill, withSkills } = SiteSkills;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function loadConfig(project) {
    const folder = encodeURIComponent(project.folder || '');
    return fetch(`/projects/${folder}/config.json`)
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }

  function renderCard(project) {
    const name = escapeHtml(project.projectName || project.title || 'Project');
    const img = escapeHtml(project.thumbnail || project.hero || '');
    const url = escapeHtml(project.url || '#');
    const subtitle =
      project.title && project.projectName
        ? `<p class="project-card__meta">${escapeHtml(project.title)}</p>`
        : '';
    const date = project.endDate ? `<p class="project-card__meta">${escapeHtml(project.endDate)}</p>` : '';
    const badges = overlayBadgesHtml(project.skills);
    return `
      <a href="${url}" class="project-card">
        <div class="project-card__media">
          <img src="${img}" alt="${name}" loading="lazy" />
          ${badges}
        </div>
        <div class="project-card__body">
          <h2 class="project-card__title">${name}</h2>
          ${subtitle}
          ${date}
        </div>
      </a>`;
  }

  function mount(projects) {
    let activeSkill = 'all';

    root.innerHTML = `
      <div class="gallery-toolbar">${filterBarHtml(activeSkill)}</div>
      <div id="gallery-grid" class="project-grid"></div>
      <p id="gallery-empty" class="gallery-empty" hidden>No projects match this skill.</p>
    `;

    const grid = document.getElementById('gallery-grid');
    const empty = document.getElementById('gallery-empty');

    function render() {
      const list = projects.filter((p) => projectHasSkill(p, activeSkill));
      grid.innerHTML = list.map(renderCard).join('');
      empty.hidden = list.length > 0;
    }

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.skill-filter');
      if (!btn || !root.contains(btn)) return;
      activeSkill = btn.dataset.skill || 'all';
      const toolbar = root.querySelector('.gallery-toolbar');
      if (toolbar) toolbar.innerHTML = filterBarHtml(activeSkill);
      render();
    });

    render();
  }

  fetch('/new/data/projects-index.json')
    .then((res) => res.json())
    .then((projects) =>
      Promise.all(
        projects.map((project) =>
          loadConfig(project).then((config) => withSkills(project, config))
        )
      )
    )
    .then(mount)
    .catch(() => {
      root.innerHTML = '<p class="gallery-empty">Could not load projects.</p>';
    });
})();
