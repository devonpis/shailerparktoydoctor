/**
 * @deprecated Toy Doctor bold is baked at build time (sync-home-highlights, sync-project-story-brand, testimonials).
 * Kept for pages that still load this script (e.g. contact.html).
 */
(function (global) {
  const PHRASE = 'Toy Doctor';
  const SKIP_SELECTOR =
    '#site-header, #site-footer, .title-main, .title-slogan, h1, h2, h3, h4, h5, h6, strong, script, style';

  function shouldProcessTextNode(node) {
    const parent = node.parentElement;
    if (!parent) return false;
    if (!parent.closest('.page-main')) return false;
    if (parent.closest(SKIP_SELECTOR)) return false;
    return true;
  }

  function boldInTextNode(node) {
    if (!shouldProcessTextNode(node)) return;
    const text = node.textContent;
    if (!text.includes(PHRASE)) return;

    const parts = text.split(PHRASE);
    if (parts.length < 2) return;

    const frag = document.createDocumentFragment();
    parts.forEach((part, index) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (index < parts.length - 1) {
        const strong = document.createElement('strong');
        strong.textContent = PHRASE;
        frag.appendChild(strong);
      }
    });
    node.parentNode.replaceChild(frag, node);
  }

  function applyToyDoctorBold(scope) {
    const roots = scope
      ? typeof scope === 'string'
        ? document.querySelectorAll(scope)
        : [scope]
      : document.querySelectorAll('.page-main');

    roots.forEach((root) => {
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let current;
      while ((current = walker.nextNode())) textNodes.push(current);
      textNodes.forEach(boldInTextNode);
    });
  }

  global.applyToyDoctorBold = applyToyDoctorBold;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyToyDoctorBold());
  } else {
    applyToyDoctorBold();
  }
})(typeof window !== 'undefined' ? window : globalThis);
