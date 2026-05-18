/**
 * Tone down itemDetails: focus on features, history, origin — not resale/value.
 * Used when refreshing catalog copy and project config.json itemDetails.
 */

const VALUE_SENTENCE_RE =
  /\b(market value|resale value|resale\b|secondary-market|secondary market|buyer interest|collector demand|collector value|collector pricing|collector interest|commanding stronger|commanding the|premium resale|modest prices|affordable collector|sentimental-market|sentimental value exceeds|trade mainly as|key value drivers|pricing range|stronger prices|outperforming individual|selling better than|demand-led rather than|utility-based and tied|value here is the custom|value improves when|value depends heavily|value varies widely|value is strongest|value is usually|value is generally|value is typically|value is highly|value is mostly|value is mainly|value can range|market demand is strongest|market pricing|market:\s|on eBay|eBay sold|memorabilia buyers|retro electronics buyers|holiday collector interest|niche but meaningful for vintage nursery buyers|original retail roughly|USD \d|AUD \d|improve value|working movement and original box improve)\b/i;

const VALUE_PHRASE_INLINE_RE =
  /\s*[;,]?\s*(?:with|and)\s+(?:boxed|tag-intact|working)[^.]*(?:commanding|attracting the strongest buyer|preferred by memorabilia buyers)[^.]*\./gi;

/** Drop or replace sentences that centre money, resale, or collector pricing. */
export function toneDownParagraph(paragraph, { isSecond = false, firstParagraph = '' } = {}) {
  let p = (paragraph || '').trim();
  if (!p) return p;

  p = p.replace(VALUE_PHRASE_INLINE_RE, '.').replace(/\s{2,}/g, ' ').trim();

  const parts = p.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [p];
  const kept = parts
    .map((s) => s.trim())
    .filter((s) => s.length > 4 && !VALUE_SENTENCE_RE.test(s));

  if (kept.length > 0) {
    return kept.join(' ').replace(/\s+/g, ' ').trim();
  }

  if (!isSecond) return p;

  return featureFallbackSecondParagraph(firstParagraph || paragraph);
}

export function toneDownItemDetails(text) {
  const body = (text || '').trim();
  if (!body) return body;
  const paras = body.split(/\n\n+/).filter(Boolean);
  const first = paras[0] || '';
  const toned = paras.map((p, i) =>
    toneDownParagraph(p, { isSecond: i > 0, firstParagraph: first })
  );
  return toned.join('\n\n').trim();
}

/** Short construction / ID line when a value-focused closing paragraph was removed. */
function featureFallbackSecondParagraph(first) {
  const hay = first.toLowerCase();
  if (/wind-up|clockwork|spring|gear|mechanism/.test(hay)) {
    return 'Plastic or metal shells often hide a spring motor, cams, and linkages; underside stamps or “Made in Japan/Hong Kong” marks help date the maker.';
  }
  if (/lightsaber|electronic|battery|sound board|rc |radio-control|interactive|animatronic|speak|singing|pull-string|voice/.test(hay)) {
    return 'Battery compartments, speaker grilles, and wiring harnesses are the usual service points; label the voltage on the door before testing.';
  }
  if (/action figure|transformer|lego|tonka|vehicle|truck|megazord|figure|pvc|abs/.test(hay)) {
    return 'Molded ABS/PVC parts, decals, and joint pins define the build; keep screws, battery covers, and accessories together for reassembly.';
  }
  if (/plush|teddy|bunny|bear|doll|stuffed|sherpa|mohair|jellycat|paddington/.test(hay)) {
    return 'Polyester pile or sherpa over fiber fill is typical; sewn tags, tush labels, and embroidered safety eyes help identify the maker and era.';
  }
  if (/resin|figurine|faerie|display figure|freeing|scale/.test(hay)) {
    return 'Cast resin or PVC with hand-painted detail is common; box art and base stamps note series and sculptor when present.';
  }
  if (/costume|mascot|wearable|fur shell/.test(hay)) {
    return 'Foam head forms, mesh vision panels, and separate mittens or foot covers are standard; ventilation runs through the mouth or crown opening.';
  }
  if (/game|handheld|vfd|astro/.test(hay)) {
    return 'Dedicated logic boards and displays (often VFD on 1980s handhelds) need clean battery contacts and intact button membranes.';
  }
  if (/book|board page/.test(hay)) {
    return 'Thick laminated board pages mount small speaker modules behind plastic buttons; keep pages dry and buttons unobstructed.';
  }
  if (/ride-on|tractor|hoverboard|scooter/.test(hay)) {
    return 'Molded body panels over a steel or plastic frame; powered versions use sealed battery packs and motor controllers worth inspecting for corrosion.';
  }
  return 'Maker marks, license stamps, or original packaging help confirm origin and release era when photos of labels are available.';
}

export function paragraphHasValueTone(text) {
  return VALUE_SENTENCE_RE.test(text || '');
}
