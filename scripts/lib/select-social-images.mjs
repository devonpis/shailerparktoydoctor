import {
  listPublishImagePaths,
  selectImagesForSocial,
  SOCIAL_CAROUSEL_MAX,
} from './project-media.mjs';
import { selectImagesWithHeuristic } from './social-image-heuristic.mjs';
import { selectImagesWithVision } from './social-image-vision.mjs';

/**
 * Pick social carousel images when count may exceed the cap.
 *
 * pickMode:
 *   auto     — vision if OPENAI_API_KEY and > cap, else heuristic, else rules
 *   vision   — OpenAI vision (requires OPENAI_API_KEY)
 *   heuristic — local sharp scoring
 *   rules    — hero → before → after → WIP (T-00026 default)
 */
export async function selectImagesForSocialPublish(dir, config, options = {}) {
  const max = options.max ?? SOCIAL_CAROUSEL_MAX;
  const pickMode = options.pickMode ?? 'auto';
  const env = options.env ?? {};

  const apiKey = env.OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  const storyOrder = listPublishImagePaths(dir);

  if (storyOrder.length <= max) {
    return { included: storyOrder, omitted: [], method: 'all', summary: null, notes: {} };
  }

  let mode = pickMode;
  if (mode === 'auto') {
    mode = apiKey ? 'vision' : 'heuristic';
  }

  const visionOpts = {
    max,
    apiKey,
    apiBase: env.OPENAI_API_BASE?.trim() || process.env.OPENAI_API_BASE?.trim(),
    model: env.OPENAI_VISION_MODEL?.trim() || process.env.OPENAI_VISION_MODEL?.trim(),
  };

  try {
    if (mode === 'vision') {
      return await selectImagesWithVision(dir, config, visionOpts);
    }
    if (mode === 'heuristic') {
      return await selectImagesWithHeuristic(dir, max);
    }
    return { ...selectImagesForSocial(dir, max), method: 'rules', summary: null, notes: {} };
  } catch (err) {
    console.warn(`Image selection (${mode}) failed: ${err.message}`);
    console.warn('Falling back to rule-based selection (hero → before → after → WIP).');
    try {
      if (mode === 'vision') {
        return await selectImagesWithHeuristic(dir, max);
      }
    } catch {
      /* use rules below */
    }
    return {
      ...selectImagesForSocial(dir, max),
      method: 'rules-fallback',
      summary: null,
      notes: {},
    };
  }
}
