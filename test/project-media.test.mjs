import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  listPublishImagePaths,
  listStoryGalleryImageNames,
  selectImagesForSocial,
  SOCIAL_CAROUSEL_MAX,
} from '../scripts/lib/project-media.mjs';

function withTempProject(files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sptd-media-'));
  try {
    for (const name of files) {
      fs.writeFileSync(path.join(dir, name), 'x');
    }
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('listPublishImagePaths: social order hero → after → before → WIP', () => {
  withTempProject(
    ['WIP-002.jpeg', 'before.jpeg', 'after.jpeg', 'hero.jpeg', 'WIP-001.jpeg'],
    (dir) => {
      const names = listPublishImagePaths(dir).map((p) => path.basename(p));
      assert.deepEqual(names, [
        'hero.jpeg',
        'after.jpeg',
        'before.jpeg',
        'WIP-001.jpeg',
        'WIP-002.jpeg',
      ]);
    }
  );
});

test('listStoryGalleryImageNames: webpage gallery before → WIP → after (no hero)', () => {
  withTempProject(
    ['hero.jpeg', 'WIP-002.jpeg', 'before.jpeg', 'after.jpeg', 'WIP-001.jpeg'],
    (dir) => {
      assert.deepEqual(listStoryGalleryImageNames(dir), [
        'before.jpeg',
        'WIP-001.jpeg',
        'WIP-002.jpeg',
        'after.jpeg',
      ]);
    }
  );
});

test('selectImagesForSocial: cap 10, priority hero after before then WIPs in order', () => {
  const wips = Array.from({ length: 12 }, (_, i) => `WIP-${String(i + 1).padStart(3, '0')}.jpeg`);
  withTempProject(['hero.jpeg', 'after.jpeg', 'before.jpeg', ...wips], (dir) => {
    const { included, omitted } = selectImagesForSocial(dir, 10);
    assert.equal(included.length, SOCIAL_CAROUSEL_MAX);
    const basenames = included.map((p) => path.basename(p));
    assert.deepEqual(basenames.slice(0, 3), ['hero.jpeg', 'after.jpeg', 'before.jpeg']);
    assert.equal(basenames[3], 'WIP-001.jpeg');
    assert.equal(basenames[9], 'WIP-007.jpeg');
    assert.ok(omitted.some((p) => path.basename(p) === 'WIP-012.jpeg'));
  });
});
