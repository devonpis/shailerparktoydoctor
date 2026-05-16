import React, { useMemo, useState } from 'https://esm.sh/react@18';
import { createRoot } from 'https://esm.sh/react-dom@18/client';
import htm from 'https://esm.sh/htm@3';

const html = htm.bind(React.createElement);

function Gallery({ repairs }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return repairs;
    return repairs.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [repairs, query]);

  return html`
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-500 mb-2" for="repair-search"
          >Search repairs</label
        >
        <input
          id="repair-search"
          type="search"
          placeholder="e.g. plush, Donald Duck, wind-up"
          className="w-full max-w-md border-2 border-gray-800 rounded-lg px-4 py-2 font-sans"
          value=${query}
          onInput=${(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${filtered.map(
          (r) => html`
            <a
              key=${r.id}
              href=${r.url}
              className="block border-2 border-gray-800 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow"
            >
              <img src=${r.hero} alt=${r.title} className="w-full h-48 object-cover" loading="lazy" />
              <div className="p-4">
                <h2 className="font-display text-xl text-primary">${r.title}</h2>
                <p className="text-sm text-gray-500 mt-1 font-sans">${r.endDate || ''}</p>
              </div>
            </a>
          `
        )}
      </div>
      ${filtered.length === 0 &&
      html`<p className="font-sans text-gray-500">No repairs match your search.</p>`}
    </div>
  `;
}

async function main() {
  const rootEl = document.getElementById('repairs-root');
  if (!rootEl) return;
  const res = await fetch('/new/data/repairs-index.json');
  const repairs = await res.json();
  createRoot(rootEl).render(html`<${Gallery} repairs=${repairs} />`);
}

main().catch(console.error);
