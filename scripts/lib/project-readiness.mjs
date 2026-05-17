/**
 * Gates for DONE status, webpage publish, and social publish (BR-003, BR-012).
 */

import fs from 'node:fs';
import path from 'node:path';
import { listProjectImages } from './project-media.mjs';
import { CANONICAL_SKILL_IDS, normalizeSkills } from './normalize-skills.mjs';
import { stripMetaFooters, isGenericDescription, isGenericRepairDetails } from './polish-metadata.mjs';
import { needsItemDetails, stripItemDetailsFooter } from './item-details-budget.mjs';
import { needsRepairDetailsFillIn } from './metadata-gaps.mjs';
import {
  isGenericTitle,
  isProperDescription,
  isProperTitle,
} from './title-description-quality.mjs';

const DEBUGGING_PATTERNS = [
  /\bT-000\d{2}\b/i,
  /Photo\/product ID/i,
  /Identified T-/i,
  /Item details —/i,
  /legacy site gallery/i,
  /expand story when details are available/i,
  /Scaffolded for USB ingest/i,
  /Photos pending copy from USB/i,
  /timesheet import/i,
  /Repair photos in repo/i,
  /timesheet stub/i,
  /scope TBD/i,
  /workshop photos are not on file yet/i,
  /will be added once the item is photographed/i,
  /\bTODO\b/,
  /\bFIXME\b/,
  /\bDEBUG\b/,
  /lorem ipsum/i,
  /placeholder/i,
];

export function containsDebuggingContent(text) {
  const t = String(text || '');
  if (!t.trim()) return false;
  return DEBUGGING_PATTERNS.some((re) => re.test(t));
}

export function isPresentableProjectName(projectName) {
  const n = (projectName || '').trim();
  if (n.length < 3) return false;
  if (/^\d{4}$/.test(n)) return false;
  if (containsDebuggingContent(n)) return false;
  return true;
}

export function isPresentableItemDetails(itemDetails) {
  const body = stripItemDetailsFooter(itemDetails);
  if (needsItemDetails(itemDetails)) return false;
  if (body.length < 150) return false;
  if (containsDebuggingContent(body)) return false;
  return true;
}

export function isPresentableRepairDetails(repairDetails) {
  if (needsRepairDetailsFillIn(repairDetails)) return false;
  if (isGenericRepairDetails(repairDetails)) return false;
  const body = stripMetaFooters(repairDetails);
  if (body.length < 120) return false;
  if (!body.includes('\n\n') && body.length < 160) return false;
  if (containsDebuggingContent(body)) return false;
  return true;
}

export function isPresentableDescription(description, projectName) {
  const d = (description || '').trim();
  if (!d || isGenericDescription(d)) return false;
  if (containsDebuggingContent(d)) return false;
  if (isProperDescription(d)) return true;
  return d.length >= 100 && /[.!?]/.test(d) && d !== `${projectName} —`;
}

export function validateSkills(config) {
  const errors = [];
  if (!Array.isArray(config.skills) || config.skills.length === 0) {
    errors.push('skills must be a non-empty array (needlework, electronic, mechanical, paintjob).');
    return errors;
  }
  for (let i = 0; i < config.skills.length; i++) {
    const s = config.skills[i];
    if (!CANONICAL_SKILL_IDS.includes(s)) {
      errors.push(
        `skills[${i}] must be one of: ${CANONICAL_SKILL_IDS.join(', ')} (got ${JSON.stringify(s)}).`
      );
    }
  }
  const normalized = normalizeSkills(config.skills);
  if (JSON.stringify(config.skills) !== JSON.stringify(normalized)) {
    errors.push(
      `skills must use canonical IDs only; run: node scripts/normalize-project-skills.mjs — would be ${JSON.stringify(normalized)}.`
    );
  }
  return errors;
}

/** Content + media required before setting status to DONE (does not check status). */
export function validateDoneReadiness(config, dir) {
  const errors = [];
  const projectName = config.projectName || '';

  if (config.isTemplate === true) {
    errors.push('isTemplate is true — not a publishable repair project.');
  }

  const images = listProjectImages(dir);
  if (images.length === 0) {
    errors.push('At least one project image is required (before, after, hero, or WIP-###).');
  }

  errors.push(...validateSkills(config));

  if (!isPresentableProjectName(projectName)) {
    errors.push('projectName must be a real product name (not empty, not just a project id).');
  }

  const title = typeof config.title === 'string' ? config.title.trim() : '';
  if (!isProperTitle(title, projectName)) {
    errors.push(
      'title must be a presentable headline (not empty, not identical to projectName only — use a repair angle, e.g. "Name — what was fixed").'
    );
  }

  if (!isPresentableDescription(config.description, projectName)) {
    errors.push(
      'description must be a presentable repair lead (not a skill-list stub, intake line, or placeholder).'
    );
  }

  if (!isPresentableItemDetails(config.itemDetails)) {
    errors.push(
      'itemDetails must be presentable product copy (≥150 chars, real paragraphs — not timesheet/USB/debug stubs).'
    );
  }

  if (!isPresentableRepairDetails(config.repairDetails)) {
    errors.push(
      'repairDetails must be presentable repair story (≥2 paragraphs, not legacy gallery stub or debug text).'
    );
  }

  return { errors, images };
}

export function assertStatusDone(config) {
  if (config.status !== 'DONE') {
    return [
      `status must be "DONE" before webpage or social publish (current: ${JSON.stringify(config.status)}).`,
      'Run: node scripts/validate-done-readiness.mjs <id> — fix content, then set status to DONE.',
    ];
  }
  return [];
}

export function validateWebpagePublishGate(config, dir) {
  const errors = [...assertStatusDone(config), ...validateDoneReadiness(config, dir).errors];
  return errors;
}

/** Story page must exist before social (call after validateWebpagePublishGate or validateProject). */
export function validateStoryPagePublished(config, dir) {
  const errors = [];
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    errors.push(
      'index.html is missing — publish the repair story to the website first (see docs/website-go-live.md).'
    );
  }
  const url = (config.webpageUrl || '').trim();
  if (!url) {
    errors.push(
      'webpageUrl is empty — publish the story page and set webpageUrl in config.json before social publish.'
    );
  } else if (!/^https:\/\//i.test(url)) {
    errors.push('webpageUrl must be an https:// story URL on sptoydoctor.com.au.');
  }
  return errors;
}

export function validateSocialPublishGate(config, dir) {
  return [...validateWebpagePublishGate(config, dir), ...validateStoryPagePublished(config, dir)];
}
