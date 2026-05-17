/**
 * Presentable wording for config.json — description, repairDetails, itemDetails cleanup.
 */

import { listProjectImages } from './project-media.mjs';
import {
  needsItemDetails,
  stripItemDetailsFooter,
  formatItemDetails,
} from './item-details-budget.mjs';
import { ITEM_DETAILS_BY_ID } from './item-details-catalog.mjs';

export const META_FOOTER_RE =
  /\n\n(?:Photo\/product ID T-00030|Identified T-00030|T-00030 \+|Item details —).*$/s;

export const USB_NOTE_RE = /\s*USB folder[:\s][^.]*\.?/gi;

const SKIP_ITEM_DETAILS_IDS = new Set(['0002', '0003']);

import { normalizeSkills, skillLabelPhrase as canonicalSkillLabelPhrase } from './normalize-skills.mjs';

const SKILL_PHRASES = {
  plush: 'plush and fabric repair',
  electronic: 'electronics repair',
  mechanical: 'mechanical repair',
  paintjob: 'paint and finish work',
};

export function stripMetaFooters(text) {
  return (text || '')
    .replace(META_FOOTER_RE, '')
    .replace(USB_NOTE_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function isGenericDescription(description) {
  const d = (description || '').trim();
  if (!d) return true;
  if (/^repair -/i.test(d)) return true;
  if (/^intake —/i.test(d)) return true;
  if (/^non-repairable$/i.test(d)) return true;
  return false;
}

function needsDescriptionPolish(description) {
  const d = (description || '').trim();
  if (isGenericDescription(d)) return true;
  return /fabric repair and|bonding and glue repair|figure restoration and/i.test(d);
}

function needsRepairRepolish(repairDetails) {
  const r = repairDetails || '';
  return (
    /came in for repair\.\s+[A-Z][^.]{5,90}\.\s*\n\nWork included/i.test(r) ||
    /Work included[\s\S]+\n\nThe job involved/i.test(r) ||
    /fabric repair and cleaning and refresh/i.test(r)
  );
}

function buildRepairFromPhotos(cfg) {
  const name = cfg.projectName || 'This item';
  const p1 = `This ${name} came in with the damage and wear shown in the before photos.`;
  const p2 = `The repair involved ${skillLabelPhrase(cfg.skills)}. The after photos show the finished result.`;
  return `${p1}\n\n${p2}`;
}

export function skillPhrase(skills = []) {
  const list = normalizeSkills(skills);
  if (!list.length) return 'workshop assessment and repair';
  const parts = list.map((s) => SKILL_PHRASES[s] || s);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function skillLabelPhrase(skills = []) {
  return canonicalSkillLabelPhrase(skills);
}

/** Website lead line (not social caption). */
export function polishDescription(cfg) {
  const d = (cfg.description || '').trim();
  if (!needsDescriptionPolish(d)) return null;

  const name = cfg.projectName || 'This item';
  if (/^non-repairable/i.test(d)) {
    return `${name} — assessed non-repairable for the reported fault.`;
  }
  if (/intake/i.test(d)) {
    return `${name} — intake; repair scope to be confirmed when the item is checked in.`;
  }
  return `${name} — ${skillLabelPhrase(cfg.skills)}.`;
}

const REPAIR_OVERRIDES = {
  '0001':
    'The wing mounting stud on this Saielle of the Willow Tree figure had snapped off completely, with the broken fragment wedged inside the back.\n\nWe drilled out the broken piece, embedded a metal screw in the wing base for strength, and rebuilt the outer peg with UV resin so the wing mounts securely again.',
  '0088':
    'This FREEing 1/4 scale Yui Yuigahama Bunny Ver figure arrived with a detached bunny ear.\n\nThe ear was re-bonded with appropriate adhesive for PVC figure parts. Before and after photos show the repair on the display piece.',
};

export function polishRepairDetails(cfg, hasPhotos, projectId = '') {
  if (REPAIR_OVERRIDES[projectId]) return REPAIR_OVERRIDES[projectId];

  if (hasPhotos && needsRepairRepolish(cfg.repairDetails)) {
    return buildRepairFromPhotos(cfg);
  }

  const name = cfg.projectName || 'This item';
  const raw = stripMetaFooters(cfg.repairDetails);
  const desc = cfg.description || '';

  if (!hasPhotos) {
    if (/non-repairable/i.test(raw + desc)) {
      return `${name} was assessed as non-repairable for the fault described on the job sheet. Workshop photos are not on file yet.`;
    }
    if (/intake|scope TBD|timesheet stub/i.test(raw + desc)) {
      return `${name} is on the intake list. Repair scope will be confirmed when the item is checked in and photographed.`;
    }
    if (raw.length > 80 && !/no photos/i.test(raw)) {
      return raw.includes('\n\n') ? raw : `${raw}\n\nWorkshop photos will be added when the item is documented in the shop.`;
    }
    return `${name} is scheduled for workshop assessment. A full repair write-up will be added once the item is photographed and inspected.`;
  }

  if (raw.length >= 160 && raw.includes('\n\n')) {
    return raw;
  }

  let main = raw
    .split(/\n+/)
    .filter(Boolean)[0]
    ?.replace(/\s*Lens\/web confirmed\.?/gi, '')
    .replace(/\s*;\s*/g, '; ')
    .trim() || '';

  if (main.includes(' — ')) {
    const idx = main.indexOf(' — ');
    const lead = main.slice(0, idx).trim();
    const work = main
      .slice(idx + 3)
      .trim()
      .replace(/\.$/, '');
    const p1 = /^This |^The |^When /i.test(lead)
      ? lead.endsWith('.')
        ? lead
        : `${lead}.`
      : `This ${name} came in with ${lead.charAt(0).toLowerCase()}${lead.slice(1)}.`;
    const p2 =
      work.length > 12
        ? `Work included ${work.replace(/\.+$/, '')}.`
        : 'Before and after photos in this project folder show the condition on arrival and the finished repair.';
    return `${p1}\n\n${p2}`;
  }

  let p1;
  if (/^(The |This |When |Inside |We )/i.test(main)) {
    p1 = main.endsWith('.') ? main : `${main}.`;
  } else if (main.length > 15) {
    const sentence = main.charAt(0).toUpperCase() + main.slice(1);
    p1 = `This ${name} came in for repair. ${sentence.endsWith('.') ? sentence : `${sentence}.`}`;
  } else {
    p1 = `This ${name} came in for repair work shown in the workshop photos.`;
  }

  const skills = cfg.skills || [];
  let p2 = '';
  if (skills.length && p1.length < 140) {
    p2 = `The job involved ${skillPhrase(skills)}.`;
  } else if (main.length < 100) {
    p2 = 'Before and after photos in this project folder show the condition on arrival and the finished repair.';
  }

  return p2 ? `${p1}\n\n${p2}` : p1;
}

export function pickItemDetailsTier(dir, cfg) {
  const hay = `${cfg.projectName} ${(cfg.tags || []).join(' ')}`.toLowerCase();
  if (
    /freeing|hot toys|gemmy|jellycat|paddington|he-man|transformers|jurassic|lego|ty beanie|anpanman|tomy|hallmark|playskool|tonka|kosen|astro wars|power rangers|pokemon|cocomelon|disney|toy story|figurine|scale|collectible|vintage.*(19|20)/i.test(
      hay
    )
  ) {
    return 'full';
  }
  return 'standard';
}

/**
 * null when no photos; catalog copy when stub; strip footers on existing good copy.
 */
export function resolveItemDetails(id, cfg, dir, { force = false } = {}) {
  const imgs = listProjectImages(dir);
  if (imgs.length === 0) return null;

  const existing = stripItemDetailsFooter(cfg.itemDetails);

  if (SKIP_ITEM_DETAILS_IDS.has(id)) {
    return existing || null;
  }

  const catalog = ITEM_DETAILS_BY_ID[id];

  if (!force && !needsItemDetails(cfg.itemDetails) && existing.length >= 150) {
    return existing;
  }

  if (catalog?.length) {
    return formatItemDetails(catalog, pickItemDetailsTier(dir, cfg));
  }

  return existing.length >= 80 ? existing : null;
}

export function isGenericRepairDetails(repairDetails) {
  const r = stripMetaFooters(repairDetails);
  if (!r) return true;
  if (/Identified T-00030|Photo\/product ID|Item details —/i.test(repairDetails || '')) return true;
  if (/scheduled for workshop assessment/i.test(r)) return false;
  if (/^This .+ came in for repair\. [A-Z][^.]{5,80}\.$/m.test(r) && r.length < 120) return true;
  return false;
}
