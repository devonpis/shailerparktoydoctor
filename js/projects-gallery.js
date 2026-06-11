/**
 * Projects gallery — skill filters on pre-rendered cards (tiles baked into projects/index.html).
 */
(function () {
  const root = document.getElementById('projects-root');
  if (!root || !window.SiteSkills) return;

  const { filterBarHtml, projectHasSkill } = SiteSkills;

  const grid = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  if (!grid) return;

  let activeSkill = 'all';

  function cardSkills(card) {
    const raw = (card.dataset.skills || '').trim();
    return raw ? raw.split(/\s+/) : [];
  }

  function render() {
    const cards = grid.querySelectorAll('.project-card');
    let visible = 0;
    cards.forEach((card) => {
      const show = projectHasSkill({ skills: cardSkills(card) }, activeSkill);
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (empty) empty.hidden = visible > 0;
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
})();
