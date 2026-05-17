import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/** `IMG_YYYYMMDD_HHMMSS` → Date (UTC components). */
export function parseImgFilenameDate(name) {
  const m = name.match(/IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i);
  if (!m) return null;
  return new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]))
  );
}

/** EXIF substring in sharp buffer → Date (UTC); else filename; else mtime. */
export async function getImageCaptureTime(absPath, name = path.basename(absPath)) {
  return (await getImageCaptureTimeWithSource(absPath, name)).date;
}

/** Same as getImageCaptureTime but tags provenance for range filtering. */
export async function getImageCaptureTimeWithSource(absPath, name = path.basename(absPath)) {
  const fromName = parseImgFilenameDate(name);
  if (fromName && !Number.isNaN(fromName.getTime())) {
    return { date: fromName, source: 'filename' };
  }
  try {
    const meta = await sharp(absPath).metadata();
    if (meta.exif) {
      const text = meta.exif.toString('latin1');
      const dm = text.match(/(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
      if (dm) {
        const d = new Date(
          Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(dm[4]), Number(dm[5]), Number(dm[6]))
        );
        if (!Number.isNaN(d.getTime())) return { date: d, source: 'exif' };
      }
    }
  } catch {
    /* fall through */
  }
  return { date: fs.statSync(absPath).mtime, source: 'mtime' };
}

export function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}
