(function () {
  const root = document.getElementById('patient-stories-root');
  if (!root) return;

  const TILE_COUNT = 6;
  const skillsApi = window.SiteSkills;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function linkifyDescription(text) {
    const safe = escapeHtml(text || '').replace(/\n/g, ' ');
    return safe.replace(
      /(https?:\/\/[^\s<]+?)(?=[\s.,;:!?"')\]}]*(?:\s|$|<))/gi,
      (url) =>
        `<a href="${escapeAttr(url)}" rel="noopener noreferrer" target="_blank">${url}</a>`
    );
  }

  function loadConfig(project) {
    const folder = encodeURIComponent(project.folder || '');
    return fetch(`/projects/${folder}/config.json`)
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }

  function overlayBadges(project) {
    if (!skillsApi) return '';
    return skillsApi.overlayBadgesHtml(project.skills);
  }

  function hasImportance(importance) {
    return typeof importance === 'number' && !Number.isNaN(importance);
  }

  function readImportance(config) {
    const v = config.importance;
    return v !== undefined && v !== null ? v : null;
  }

  function compareHighlights(a, b) {
    if (b.importance !== a.importance) return b.importance - a.importance;
    const da = a.endDate || '';
    const db = b.endDate || '';
    if (db !== da) return db.localeCompare(da);
    return (a.id || '').localeCompare(b.id || '');
  }

  function leadStoryBlock(project, description) {
    const name = escapeHtml(project.projectName || project.title || 'Project');
    const img = escapeHtml(project.thumbnail || '');
    const url = escapeHtml(project.url || '#');
    const body = linkifyDescription(description);
    const badges = overlayBadges(project);
    return `
      <div class="jw-element-imagetext-text patient-story patient-story--lead">
        <div class="patient-stories">
          <div class="patient-stories__media">
            <img src="${img}" alt="${name}" loading="lazy" />
            ${badges}
          </div>
        </div>
        <h3 class="patient-story__title project-subtitle"><a href="${url}">${name}</a></h3>
        <p>${body}</p>
        <p><a href="${url}">Read the full repair story →</a></p>
      </div>`;
  }

  function tileCard(project) {
    const name = escapeHtml(project.projectName || project.title || 'Project');
    const img = escapeHtml(project.thumbnail || '');
    const url = escapeHtml(project.url || '#');
    const badges = overlayBadges(project);
    return `
      <a href="${url}" class="project-card">
        <div class="project-card__media">
          <img src="${img}" alt="${name}" loading="lazy" />
          ${badges}
        </div>
        <div class="project-card__body">
          <h3 class="project-card__title" title="${name}">${name}</h3>
        </div>
      </a>`;
  }

  function tilePlaceholder(n) {
    return `
      <div class="project-card project-card--placeholder" aria-hidden="true">
        <div class="project-card__img-placeholder">Coming soon</div>
        <div class="project-card__body">
          <h3 class="project-card__title">Repair highlight ${n}</h3>
        </div>
      </div>`;
  }

  function renderLayout(leadRow, tileHtml) {
    return `<div class="patient-stories-layout">${leadRow}<hr class="patient-stories-divider" /><div class="highlight-tiles">${tileHtml}</div></div>`;
  }

  function enrich(project) {
    return loadConfig(project).then((config) => {
      const merged = skillsApi ? skillsApi.withSkills(project, config) : { ...project };
      return {
        ...merged,
        storyDescription: config.description || '',
        importance: readImportance(config),
      };
    });
  }

  fetch('/new/data/projects-index.json')
    .then((res) => res.json())
    .then((projects) => Promise.all(projects.map(enrich)))
    .then((enriched) => {
      const highlights = enriched.filter((p) => hasImportance(p.importance)).sort(compareHighlights);

      if (!highlights.length) {
        root.innerHTML =
          '<p>Repair stories will appear here when projects have an <code>importance</code> set in their config.</p>';
        return;
      }

      const lead = highlights[0];
      const tileProjects = highlights.slice(1, 1 + TILE_COUNT);
      const leadHtml = leadStoryBlock(lead, lead.storyDescription || '');
      const tileHtml = Array.from({ length: TILE_COUNT }, (_, i) => {
        const project = tileProjects[i];
        return project ? tileCard(project) : tilePlaceholder(i + 2);
      }).join('');
      root.innerHTML = renderLayout(leadHtml, tileHtml);
      if (skillsApi?.applyProjectTileImages) skillsApi.applyProjectTileImages(root);
      if (window.applyToyDoctorBold) window.applyToyDoctorBold(root);
    })
    .catch(() => {
      root.innerHTML = '<p>Could not load patient stories.</p>';
    });
})();
