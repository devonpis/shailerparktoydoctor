/**
 * Projects gallery — skill filters and cards
 */
(function () {
  const root = document.getElementById('projects-root');
  if (!root || !window.SiteSkills) return;

  const { filterBarHtml, overlayBadgesHtml, projectHasSkill, withSkills, applyProjectTileImages } =
    SiteSkills;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  /** Match story pages (scaffold-project-story-html.mjs): endDate as AU long date. */
  function formatAuDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function loadConfig(project) {
    const folder = encodeURIComponent(project.folder || '');
    return fetch(`/projects/${folder}/config.json`)
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }

  function enrichProject(project, config) {
    const merged = withSkills(project, config);
    return {
      ...merged,
      endDate: merged.endDate || config.endDate || '',
    };
  }

  /** Latest repair date first; tie-break by project id/folder descending. */
  function sortLatestFirst(projects) {
    return [...projects].sort((a, b) => {
      const dateCmp = (b.endDate || '').localeCompare(a.endDate || '');
      if (dateCmp !== 0) return dateCmp;
      return String(b.id || b.folder || '').localeCompare(String(a.id || a.folder || ''), undefined, {
        numeric: true,
      });
    });
  }

  function renderCard(project) {
    const name = escapeHtml(project.projectName || project.title || 'Project');
    const img = escapeHtml(project.thumbnail || project.hero || '');
    const url = escapeHtml(project.url || '#');
    const dateLabel = formatAuDate(project.endDate);
    const date = dateLabel
      ? `<p class="project-card__meta project-card__date">${escapeHtml(dateLabel)}</p>`
      : '';
    const badges = overlayBadgesHtml(project.skills);
    return `
      <a href="${url}" class="project-card">
        <div class="project-card__media">
          <img src="${img}" alt="${name}" loading="lazy" />
          ${badges}
        </div>
        <div class="project-card__body">
          <h2 class="project-card__title" title="${name}">${name}</h2>
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
      applyProjectTileImages(grid);
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

  fetch('/data/projects-index.json')
    .then((res) => res.json())
    .then((projects) =>
      Promise.all(
        projects.map((project) => loadConfig(project).then((config) => enrichProject(project, config)))
      )
    )
    .then(sortLatestFirst)
    .then(mount)
    .catch(() => {
      root.innerHTML = '<p class="gallery-empty">Could not load projects.</p>';
    });
})();
