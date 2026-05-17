/** Shared Tailwind CDN theme — load after https://cdn.tailwindcss.com */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#62c9d8', dark: '#46adbf', light: '#eaf8fb' },
        secondary: { DEFAULT: 'rgb(255, 140, 0)', light: '#fff3e6' },
        warning: '#da4444',
      },
      fontFamily: {
        /* Prepbox: Outfit (headings + body); Inter loaded for parity with template */
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
