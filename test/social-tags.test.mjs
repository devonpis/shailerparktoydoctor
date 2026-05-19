import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickSocialTags, SOCIAL_HASHTAG_MAX } from '../scripts/lib/social-tags.mjs';

test('pickSocialTags returns at most three hashtags', () => {
  const tags = ['plush', 'CoComelon', 'vintage', 'Cece', 'repair', 'JJ'];
  const { picked } = pickSocialTags(tags, {
    projectName: 'CoComelon Cece plush',
    title: 'Cece is singing again',
  });
  assert.equal(picked.length, SOCIAL_HASHTAG_MAX);
  assert.ok(picked.includes('CoComelon') || picked.includes('Cece'));
  assert.ok(!picked.includes('repair') || picked.filter((t) => t === 'repair').length === 0);
});

test('pickSocialTags passes through when ≤3 tags', () => {
  const tags = ['Donald Duck', 'plush', 'Disney'];
  const { picked, omitted } = pickSocialTags(tags);
  assert.deepEqual(picked, tags);
  assert.deepEqual(omitted, []);
});
