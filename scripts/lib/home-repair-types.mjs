/**
 * Home page "Repairs We Do" table: repair type, doctors required, example project.
 * Baked into index.html from data/projects-index.json. Each example must be a published
 * project whose skills include every doctor listed for that repair type.
 */

import fs from 'node:fs';
import path from 'node:path';

const START = '<!-- sync-home-repair-types:start -->';
const END = '<!-- sync-home-repair-types:end -->';

const DOCTORS = {
  needlework: { name: 'Dr. Fluffy', emoji: '🧸' },
  electronic: { name: 'Dr. Electronics', emoji: '⚡' },
  mechanical: { name: 'Dr. Mechanic', emoji: '🔧' },
  paintjob: { name: 'Dr. Hobby', emoji: '🖌️' },
};

/** Display order; each repair type lists the doctors it needs and an owner-chosen example. */
export const REPAIR_TYPES = [
  { type: 'Tears, holes and split seams', doctors: ['needlework'], example: '0078' },
  { type: 'Deep clean and restuff', doctors: ['needlework'], example: '0084' },
  { type: 'New eyes, noses and faces', doctors: ['needlework'], example: '0131' },
  { type: 'Fragile fabric reinforcement', doctors: ['needlework'], example: '0133' },
  { type: 'Heads and limbs reattached', doctors: ['needlework'], example: '0074' },
  { type: 'Custom parts and outfits', doctors: ['needlework'], example: '0126' },
  { type: 'Battery contacts and power faults', doctors: ['electronic'], example: '0120' },
  { type: 'Circuit board repair', doctors: ['electronic'], example: '0022' },
  { type: 'Talking and singing plush', doctors: ['needlework', 'electronic'], example: '0013' },
  { type: 'Motors, gears and gearboxes', doctors: ['mechanical'], example: '0129' },
  { type: 'Wind-ups and music boxes', doctors: ['mechanical'], example: '0003' },
  { type: 'Remote control toys', doctors: ['electronic', 'mechanical'], example: '0018' },
  { type: 'Motionettes and animatronic figures', doctors: ['electronic', 'mechanical'], example: '0116' },
  { type: 'Animatronic plush full rebuild', doctors: ['needlework', 'electronic', 'mechanical'], example: '0130' },
  { type: 'Action figure parts and joints', doctors: ['mechanical'], example: '0002' },
  { type: 'Remade parts with paint finish', doctors: ['mechanical', 'paintjob'], example: '0121' },
  { type: 'Paint matching and missing details', doctors: ['paintjob'], example: '0088' },
  { type: 'Model kit and miniature painting', doctors: ['paintjob'], example: '0134' },
];

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortTitle(project) {
  const title = String(project.title || '');
  const parts = title.split(/\s+[—-]\s+/);
  return parts.length > 1 ? parts[0] : project.projectName || title;
}

function doctorBadges(skills) {
  return skills
    .map((id) => {
      const d = DOCTORS[id];
      const name = escapeHtml(d.name);
      return `<span class="skill-badge skill-badge--icon-only skill-badge--${id}" title="${name}"><span class="skill-icon skill-icon--emoji" aria-hidden="true">${d.emoji}</span><span class="visually-hidden">${name}</span></span>`;
    })
    .join('');
}

export function buildRepairTypesHtml(projects) {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const rows = REPAIR_TYPES.map(({ type, doctors, example }) => {
    const project = byId.get(example);
    if (!project) throw new Error(`Example project ${example} for "${type}" is not in the published index`);
    const missing = doctors.filter((d) => !(project.skills || []).includes(d));
    if (missing.length) throw new Error(`Example ${example} for "${type}" lacks skills: ${missing.join(', ')}`);
    return `          <tr>
            <th scope="row">${escapeHtml(type)}</th>
            <td><div class="repair-types__doctors">${doctorBadges(doctors)}</div></td>
            <td><a href="${escapeHtml(project.url)}">${escapeHtml(shortTitle(project))}</a></td>
          </tr>`;
  }).join('\n');
  return `${START}
      <div class="repair-types">
        <table class="repair-types__table">
          <caption class="repair-types__caption">🧸 Dr. Fluffy, ⚡ Dr. Electronics, 🔧 Dr. Mechanic, 🖌️ Dr. Hobby.</caption>
          <thead>
            <tr>
              <th scope="col">Repair type</th>
              <th scope="col">Doctors required</th>
              <th scope="col">Example</th>
            </tr>
          </thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
      ${END}`;
}

export function patchHomeRepairTypes(repoRoot) {
  const indexPath = path.join(repoRoot, 'index.html');
  const projects = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'projects-index.json'), 'utf8'));
  const html = fs.readFileSync(indexPath, 'utf8');
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start < 0 || end < start) throw new Error('index.html is missing the sync-home-repair-types markers');
  const next = html.slice(0, start) + buildRepairTypesHtml(projects) + html.slice(end + END.length);
  if (next !== html) fs.writeFileSync(indexPath, next);
  return { changed: next !== html, total: projects.length };
}
