(function () {
  const slot = document.getElementById('project-skills-root');
  const folder = document.body.dataset.projectFolder;
  if (!slot || !folder || !window.SiteSkills) return;

  fetch(`/projects/${encodeURIComponent(folder)}/config.json`)
    .then((res) => (res.ok ? res.json() : {}))
    .then((config) => {
      slot.innerHTML = SiteSkills.detailBadgesHtml(config.skills) || '';
    })
    .catch(() => {
      slot.innerHTML = '';
    });
})();
