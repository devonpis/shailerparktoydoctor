import path from 'node:path';
import { listProjectImages } from './project-media.mjs';
import { getImageCaptureTimeWithSource, toIsoDate } from './image-capture-time.mjs';

/** Repo ingest / optimize window — mtime-only single-hero dates in this range are not repair dates. */
const INGEST_MTIME_START = '2026-05-14';
const INGEST_MTIME_END = '2026-05-18';

/** Legacy site import / scaffold default — always replace from EXIF when images exist. */
export const PLACEHOLDER_DATES = new Set(['2024-01-01']);

/** Owner-verified or legacy homepage imports — skip unless `--force`. */
export const PROTECTED_DATE_IDS = new Set([
  '0001',
  '0002',
  '0003',
  ...Array.from({ length: 11 }, (_, i) => String(4 + i).padStart(4, '0')), // 0004–0014
]);

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(v) {
  return typeof v === 'string' && ISO_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

export function isPlaceholderDate(v) {
  return !v || !isValidIsoDate(v) || PLACEHOLDER_DATES.has(v);
}

/** True when config dates should be derived from images (not trusted timesheet). */
export function needsDateFromImages(cfg, { force = false } = {}) {
  if (force) return true;
  const { startDate, endDate } = cfg;
  if (!startDate || !endDate) return true;
  if (isPlaceholderDate(startDate) || isPlaceholderDate(endDate)) return true;
  if (startDate === endDate && isPlaceholderDate(startDate)) return true;
  return false;
}

function inIngestMtimeWindow(iso) {
  return iso >= INGEST_MTIME_START && iso <= INGEST_MTIME_END;
}

export async function captureRangeFromDir(dir) {
  const names = listProjectImages(dir);
  if (!names.length) return null;

  const captured = await Promise.all(
    names.map(async (name) => {
      const { date, source } = await getImageCaptureTimeWithSource(path.join(dir, name), name);
      return { name, date, source };
    })
  );

  const trusted = captured.filter((c) => c.source !== 'mtime');
  const pool = trusted.length ? trusted : captured;
  const ms = pool.map((c) => c.date.getTime());
  const min = new Date(Math.min(...ms));
  const max = new Date(Math.max(...ms));
  const startDate = toIsoDate(min);
  const endDate = toIsoDate(max);
  const mtimeOnly = trusted.length === 0;
  const singleDay = startDate === endDate;

  return {
    imageCount: names.length,
    trustedCount: trusted.length,
    oldest: min,
    newest: max,
    startDate,
    endDate,
    mtimeOnly,
    lowConfidence: mtimeOnly && singleDay && inIngestMtimeWindow(startDate),
  };
}

export function proposeDates(cfg, range, { force = false } = {}) {
  if (!range) return { action: 'no-images', startDate: cfg.startDate, endDate: cfg.endDate };

  const next = { startDate: range.startDate, endDate: range.endDate };
  if (!needsDateFromImages(cfg, { force })) {
    return { action: 'skip-trusted', ...next, current: { startDate: cfg.startDate, endDate: cfg.endDate }, range };
  }

  if (!force && range.lowConfidence) {
    return {
      action: 'skip-mtime-only',
      ...next,
      current: { startDate: cfg.startDate, endDate: cfg.endDate },
      range,
    };
  }

  const changed = cfg.startDate !== next.startDate || cfg.endDate !== next.endDate;
  return {
    action: changed ? 'update' : 'unchanged',
    ...next,
    current: { startDate: cfg.startDate, endDate: cfg.endDate },
    range,
  };
}
