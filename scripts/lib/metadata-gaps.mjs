import fs from 'node:fs';
import path from 'node:path';
import { listProjectImages } from './project-media.mjs';
import { isGenericRepairDetails } from './polish-metadata.mjs';
import { LEGACY_SITE_REPAIR_IDS } from './legacy-site-repair-details.mjs';
import { CANONICAL_SKILL_IDS } from './normalize-skills.mjs';

export const SKIP_EXPORT_IDS = new Set(['0000']);

/** On legacy homepage (T-00011 import): 0004–0015. */
export function isOnOldWebsite(id) {
  return LEGACY_SITE_REPAIR_IDS.has(id);
}

export function needsRepairDetailsFillIn(repairDetails) {
  const r = repairDetails == null ? '' : String(repairDetails).trim();
  if (!r) return true;
  if (isGenericRepairDetails(repairDetails)) return true;
  if (/legacy site gallery/i.test(r)) return true;
  if (/expand story when details are available/i.test(r)) return true;
  if (/Scaffolded for USB ingest|Photos pending copy from USB/i.test(r)) return true;
  return false;
}

export function needsSkillsFillIn(skills) {
  if (!Array.isArray(skills) || skills.length === 0) return true;
  return skills.some((s) => !CANONICAL_SKILL_IDS.includes(s));
}

export function escapeCsvCell(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowToCsvLine(cells) {
  return cells.map(escapeCsvCell).join(',');
}

export function collectMetadataGapRows(projectsDir) {
  const folders = fs
    .readdirSync(projectsDir)
    .filter((n) => /^\d{4} - /.test(n))
    .sort();

  const seenIds = new Set();
  const rows = [];

  for (const folder of folders) {
    const id = folder.slice(0, 4);
    if (SKIP_EXPORT_IDS.has(id) || seenIds.has(id)) continue;
    seenIds.add(id);

    const dir = path.join(projectsDir, folder);
    const configPath = path.join(dir, 'config.json');
    if (!fs.existsSync(configPath)) continue;

    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (cfg.isTemplate) continue;

    const needRepair = needsRepairDetailsFillIn(cfg.repairDetails);
    const needSkills = needsSkillsFillIn(cfg.skills);
    if (!needRepair && !needSkills) continue;

    const images = listProjectImages(dir);
    rows.push({
      id,
      folder,
      projectName: cfg.projectName || '',
      startDate: cfg.startDate || '',
      endDate: cfg.endDate || '',
      itemDetails: cfg.itemDetails == null ? '' : String(cfg.itemDetails),
      repairDetailsCurrent: cfg.repairDetails == null ? '' : String(cfg.repairDetails),
      skillsCurrent: Array.isArray(cfg.skills) ? cfg.skills.join(', ') : '',
      imageCount: images.length,
      onOldWebsite: isOnOldWebsite(id) ? 'Yes' : 'No',
      needsRepairDetails: needRepair ? 'Yes' : 'No',
      needsSkills: needSkills ? 'Yes' : 'No',
    });
  }

  return rows;
}

export const GAP_CSV_HEADERS = [
  'id',
  'projectName',
  'startDate',
  'endDate',
  'imageCount',
  'onOldWebsite',
  'needsRepairDetails',
  'needsSkills',
  'itemDetails',
  'repairDetails_current',
  'skills_current',
  'repairDetails_FILL_IN',
  'skills_FILL_IN',
];

export function rowsToCsv(rows) {
  const lines = [rowToCsvLine(GAP_CSV_HEADERS)];
  for (const r of rows) {
    lines.push(
      rowToCsvLine([
        r.id,
        r.projectName,
        r.startDate,
        r.endDate,
        r.imageCount,
        r.onOldWebsite,
        r.needsRepairDetails,
        r.needsSkills,
        r.itemDetails,
        r.repairDetailsCurrent,
        r.skillsCurrent,
        '',
        '',
      ])
    );
  }
  return `${lines.join('\n')}\n`;
}
