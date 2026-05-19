import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rewriteForThreads,
  THREADS_CAPTION_MAX,
  cleanThreadsSource,
} from '../scripts/lib/threads-caption-rewrite.mjs';

test('rewriteForThreads fits within max and does not end with ellipsis', () => {
  const long =
    'This beloved plush arrived with a torn seam and missing button eye. ' +
    'We matched thread, reinforced the stuffing cavity, and restored the smile ' +
    'so it could rejoin bedtime stories. Visit https://example.com for more.';
  const out = rewriteForThreads(long);
  assert.ok(out.length <= THREADS_CAPTION_MAX);
  assert.ok(!out.endsWith('…'));
  assert.ok(!out.includes('https://'));
});

test('cleanThreadsSource strips URLs', () => {
  assert.equal(cleanThreadsSource('Hello https://x.test/y world'), 'Hello world');
});
