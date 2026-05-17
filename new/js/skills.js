/**
 * Skill categories: needlework, electronic, mechanical, paintjob
 */
(function (global) {
  const SKILL_IDS = ['needlework', 'electronic', 'mechanical', 'paintjob'];

  const SKILLS = {
    needlework: { label: 'Needlework' },
    electronic: { label: 'Electronic' },
    mechanical: { label: 'Mechanical' },
    paintjob: { label: 'Paint' },
  };

  const SKILL_EMOJI = {
    needlework: '🧸',
    electronic: '⚡',
    mechanical: '🔧',
    paintjob: '🖌️',
  };

  const SKILL_ALIASES = {
    plush: 'needlework',
    electrical: 'electronic',
    electronics: 'electronic',
    sewing: 'needlework',
    restuffing: 'needlework',
    cleaning: 'needlework',
    paint: 'paintjob',
    gluing: 'paintjob',
    'figure repair': 'paintjob',
  };

  function normalizeSkills(skills) {
    if (!Array.isArray(skills)) return [];
    const out = [];
    for (const raw of skills) {
      const key = String(raw || '').trim().toLowerCase();
      const id = SKILL_ALIASES[key] || key;
      if (SKILL_IDS.includes(id) && !out.includes(id)) out.push(id);
    }
    return SKILL_IDS.filter((id) => out.includes(id));
  }

  function skillIconHtml(skillId) {
    const emoji = SKILL_EMOJI[skillId];
    if (!emoji) return '';
    return `<span class="skill-icon skill-icon--emoji" aria-hidden="true">${emoji}</span>`;
  }

  /** @deprecated use skillIconHtml */
  function iconSvg(skillId) {
    return skillIconHtml(skillId);
  }

  function skillToneClass(skillId) {
    return `skill-badge--${skillId}`;
  }

  function projectHasSkill(project, skillId) {
    const list = normalizeSkills(project.skills);
    if (skillId === 'all') return true;
    return list.includes(skillId);
  }

  function overlayBadgesHtml(skills) {
    const list = normalizeSkills(skills);
    if (!list.length) return '';
    const items = list
      .map(
        (id) =>
          `<span class="skill-badge skill-badge--icon-only ${skillToneClass(id)}" title="${SKILLS[id].label}">${skillIconHtml(id)}</span>`
      )
      .join('');
    return `<div class="skill-badges skill-badges--overlay">${items}</div>`;
  }

  function detailBadgesHtml(skills) {
    const list = normalizeSkills(skills);
    if (!list.length) return '';
    const items = list
      .map(
        (id) =>
          `<span class="skill-badge skill-badge--detail ${skillToneClass(id)}">${skillIconHtml(id)}<span class="skill-badge__label">${SKILLS[id].label}</span></span>`
      )
      .join('');
    return `<div class="project-skills" aria-label="Repair skills">${items}</div>`;
  }

  function doctorBadgesHtml(skills) {
    const list = normalizeSkills(skills);
    if (!list.length) return '';
    const items = list
      .map(
        (id) =>
          `<span class="skill-badge skill-badge--detail ${skillToneClass(id)}">${skillIconHtml(id)}<span class="skill-badge__label">${SKILLS[id].label}</span></span>`
      )
      .join('');
    return `<div class="doctor-skills" aria-label="Specialties">${items}</div>`;
  }

  function filterBarHtml(activeSkill) {
    const active = activeSkill || 'all';
    const allBtn = `<button type="button" class="skill-filter skill-filter--all${active === 'all' ? ' is-active' : ''}" data-skill="all" aria-pressed="${active === 'all'}">All</button>`;
    const skillBtns = SKILL_IDS.map((id) => {
      const on = active === id;
      return `<button type="button" class="skill-filter skill-filter--${id}${on ? ' is-active' : ''}" data-skill="${id}" aria-pressed="${on}">${skillIconHtml(id)}<span>${SKILLS[id].label}</span></button>`;
    }).join('');
    return `<div class="skill-filters" role="group" aria-label="Filter by skill">${allBtn}${skillBtns}</div>`;
  }

  function withSkills(project, config) {
    const fromConfig = config && config.skills;
    const fromProject = project && project.skills;
    return {
      ...project,
      skills: normalizeSkills(fromConfig || fromProject || []),
    };
  }

  global.SiteSkills = {
    SKILL_IDS,
    SKILLS,
    normalizeSkills,
    skillIconHtml,
    iconSvg,
    projectHasSkill,
    overlayBadgesHtml,
    detailBadgesHtml,
    doctorBadgesHtml,
    filterBarHtml,
    withSkills,
  };
})(typeof window !== 'undefined' ? window : globalThis);
