(function () {
  if (!window.SiteSkills) return;

  const { doctorBadgesHtml } = SiteSkills;

  document.querySelectorAll('[data-doctor-skills]').forEach((el) => {
    const raw = el.getAttribute('data-doctor-skills') || '';
    const skills = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    el.outerHTML = doctorBadgesHtml(skills);
  });
})();
