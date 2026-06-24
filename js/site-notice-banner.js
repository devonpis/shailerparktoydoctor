/**
 * Site-wide notice banner — content from /data/site-notice.json.
 * Set enabled to false (or remove endDate) after the closure ends.
 */
(function () {
  var CONFIG_URL = '/data/site-notice.json';

  function parseEndDate(isoDate) {
    var parts = String(isoDate || '').split('-');
    if (parts.length !== 3) return null;
    return new Date(+parts[0], +parts[1] - 1, +parts[2], 23, 59, 59, 999);
  }

  function shouldShow(config) {
    if (!config || !config.enabled) return false;
    if (!config.message) return false;
    if (!config.endDate) return true;
    var end = parseEndDate(config.endDate);
    if (!end) return true;
    return Date.now() <= end.getTime();
  }

  function renderBanner(config) {
    if (!shouldShow(config)) return;
    var banner = document.createElement('div');
    banner.className = 'site-notice-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');

    var p = document.createElement('p');
    p.textContent = config.message;
    banner.appendChild(p);

    document.body.insertBefore(banner, document.body.firstChild);
    document.body.classList.add('has-site-notice');
  }

  fetch(CONFIG_URL)
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .catch(function () {
      return null;
    })
    .then(renderBanner);
})();
