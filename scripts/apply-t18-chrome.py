#!/usr/bin/env python3
"""Apply T-00018 shared header/chrome to /new/ marketing pages."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEADER = "\n".join(
    line
    for line in (ROOT / "new/includes/site-header.html").read_text().splitlines()
    if not line.strip().startswith("<!--")
).strip()

TAILWIND_INLINE = re.compile(
    r'<script src="https://cdn\.tailwindcss\.com"></script>\s*'
    r"<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?\};\s*</script>",
    re.MULTILINE,
)
TAILWIND_HEAD = (
    '<script src="https://cdn.tailwindcss.com"></script>\n'
    '    <script src="/new/js/tailwind-theme.js"></script>'
)
HEADER_BLOCK = re.compile(r"<header[\s\S]*?</header>", re.MULTILINE)

PAGES = {
    ROOT / "new/index.html": "home",
    ROOT / "new/contact.html": "contact",
    ROOT / "new/testimonials.html": "testimonials",
    ROOT / "new/projects/index.html": "projects",
}

SERVICES = """
      <section class="bg-secondary-light border-y-2 border-gray-800 py-16">
        <div class="max-w-6xl mx-auto px-4">
          <h2 class="font-display text-3xl text-primary mb-8 text-center">What we fix</h2>
          <motion.div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article class="card-block bg-white p-6 text-center">
              <p class="text-3xl mb-2" aria-hidden="true">🧸</p>
              <h3 class="font-display text-lg">Plush &amp; stuffed toys</h3>
              <p class="mt-2 text-sm text-gray-600">Cleaning, sewing, and soft-toy repairs</p>
            </article>
            <article class="card-block bg-white p-6 text-center">
              <p class="text-3xl mb-2" aria-hidden="true">🤖</p>
              <h3 class="font-display text-lg">Mechanical &amp; electronic</h3>
              <p class="mt-2 text-sm text-gray-600">Wind-ups, remotes, small appliances</p>
            </article>
            <article class="card-block bg-white p-6 text-center">
              <p class="text-3xl mb-2" aria-hidden="true">🎨</p>
              <h3 class="font-display text-lg">Figures &amp; hobby</h3>
              <p class="mt-2 text-sm text-gray-600">Anime figures, models, paint touch-ups</p>
            </article>
            <article class="card-block bg-primary-light p-6 text-center">
              <p class="text-3xl mb-2" aria-hidden="true">📷</p>
              <h3 class="font-display text-lg">Get a quote</h3>
              <p class="mt-2 text-sm text-gray-600">Email or SMS photos first — appointment only</p>
              <a href="/new/contact.html" class="btn-primary mt-4 text-sm">Contact us</a>
            </article>
          </div>
        </div>
      </section>
""".replace("motion.div", "div")


def patch_page(path: Path, page: str, extra_scripts: str = "") -> None:
    html = path.read_text()
    html = TAILWIND_INLINE.sub(TAILWIND_HEAD, html)
    if "/new/css/site.css" not in html:
        html = html.replace(
            '<link rel="icon"',
            '<link rel="stylesheet" href="/new/css/site.css" />\n    <link rel="icon"',
            1,
        )
    html = HEADER_BLOCK.sub(HEADER, html, count=1)
    if f'data-active-page="{page}"' not in html:
        html = re.sub(
            r'<body class="([^"]+)"',
            rf'<body class="\1" data-active-page="{page}"',
            html,
            count=1,
        )
    scripts = '<script src="/new/js/site-nav.js" defer></script>\n' + extra_scripts
    if "site-nav.js" not in html:
        html = html.replace("</body>", f"    {scripts}  </body>", 1)
    elif extra_scripts and "home-featured.js" not in html:
        html = html.replace(
            '<script src="/new/js/site-nav.js" defer></script>',
            scripts.rstrip() + "\n",
            1,
        )
    path.write_text(html)


for path, page in PAGES.items():
    extra = '    <script src="/new/js/home-featured.js" defer></script>\n' if page == "home" else ""
    patch_page(path, page, extra)

index = ROOT / "new/index.html"
html = index.read_text()

if "What we fix" not in html:
    html = html.replace(
        '      <section class="bg-white border-y-2 border-gray-800 py-16">\n        <div class="max-w-6xl mx-auto px-4">\n          <h2 class="font-display text-3xl text-primary mb-8 text-center">Our Doctors</h2>',
        SERVICES
        + '      <section class="bg-white border-y-2 border-gray-800 py-16">\n        <div class="max-w-6xl mx-auto px-4">\n          <h2 class="font-display text-3xl text-primary mb-8 text-center">Our Doctors</h2>',
        1,
    )

if 'id="featured-projects"' not in html:
    html = re.sub(
        r'(<h2 class="font-display text-3xl text-primary mb-8">Featured projects</h2>\s*)'
        r'<div class="grid gap-6 md:grid-cols-3">[\s\S]*?</div>(\s*</section>)',
        r'\1<div id="featured-projects" class="grid gap-6 md:grid-cols-3 min-h-[12rem]"></motion.div>\2',
        html,
        count=1,
    )
    html = html.replace('"></motion.div>', '"></motion.div>', 1)
    html = html.replace('id="featured-projects" class="grid gap-6 md:grid-cols-3 min-h-[12rem]"></motion.div>', 'id="featured-projects" class="grid gap-6 md:grid-cols-3 min-h-[12rem]"></div>')

html = html.replace(
    'class="inline-block bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg border-2 border-gray-800"',
    'class="btn-primary"',
)
html = html.replace(
    'class="inline-block bg-white hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg border-2 border-gray-800"',
    'class="btn-outline"',
)
html = html.replace(
    'class="text-center border-2 border-gray-800 rounded-xl p-6 bg-gray-50"',
    'class="card-block text-center p-6 bg-gray-50"',
)
index.write_text(html)

gallery = ROOT / "new/js/projects-gallery.js"
g = gallery.read_text()
if "focus:ring-primary" not in g:
    gallery.write_text(
        g.replace(
            'rounded-lg px-4 py-2 font-sans"',
            'rounded-lg px-4 py-2 font-sans focus:outline-none focus:ring-2 focus:ring-primary"',
        )
    )

print("Done")
