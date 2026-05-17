/**
 * T-00030: Product identities (USB scaffolds + all legacy projects).
 * Skip: 0000 template, 0001, 0002, 0003 Donald Duck.
 */

import { T30_0004_0035 } from './t30-identities-0004-0035.mjs';
import { T30_0036_0055 } from './t30-identities-0036-0055.mjs';
import { T30_0056_0077 } from './t30-identities-0056-0077.mjs';

/** USB-ingest scaffolds 0078–0092 (photo review 2026-05-17). */
export const T30_USB_IDENTITIES = [
  {
    id: '0078',
    projectName: 'Disney Pluto plush',
    description: 'repair - plush restuffing',
    skills: ['sewing', 'restuffing'],
    tags: ['plush', 'Disney', 'Pluto'],
    repairDetails:
      'Disney Pluto plush — leg/body seam open; restuff and resew.\n\nUSB folder was labelled Godfy (mislabel).\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0079',
    projectName: 'Shaggy bunny plush',
    description: 'repair - plush',
    skills: ['sewing', 'restuffing'],
    tags: ['plush', 'bunny'],
    repairDetails:
      'Large shaggy two-tone bunny (tan/cream). USB folder Brown_ribbon_dog was a mislabel (rabbit, not dog).\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0080',
    projectName: 'Capybara plush',
    description: 'repair - plush restuffing',
    skills: ['sewing', 'restuffing'],
    tags: ['plush', 'capybara'],
    repairDetails:
      'Capybara plush — head detached; restuff and reattach.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0081',
    projectName: 'Tan plush dog',
    description: 'repair - plush',
    skills: ['sewing'],
    tags: ['plush', 'dog'],
    repairDetails: 'Small tan plush dog (floppy ears).\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0082',
    projectName: 'Elephant baby lovey blanket',
    description: 'repair - plush textile',
    skills: ['sewing'],
    tags: ['plush', 'lovey', 'elephant'],
    repairDetails:
      'Pink baby security blanket with stuffed elephant head — satin border wear; textile repair.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0083',
    projectName: 'Teddy in pink pajamas',
    description: 'repair - plush eyes',
    skills: ['sewing'],
    tags: ['plush', 'teddy'],
    repairDetails:
      'Teddy bear in pink pajamas and nightcap — replace safety eyes.\n\nUSB folder PJ_Teddy (pajamas, not PJ Masks).\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0084',
    projectName: 'Paddington Bear',
    description: 'repair - plush',
    skills: ['sewing', 'cleaning'],
    tags: ['plush', 'Paddington'],
    repairDetails: 'Classic Paddington Bear plush (red coat, black hat).\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0085',
    projectName: 'Panda plush',
    description: 'repair - plush',
    skills: ['sewing', 'cleaning'],
    tags: ['plush', 'panda'],
    repairDetails: 'Small vintage panda plush.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0086',
    projectName: 'Disney Tigger plush',
    description: 'repair - plush',
    skills: ['sewing', 'cleaning'],
    tags: ['plush', 'Disney', 'Tigger'],
    repairDetails:
      'Disney Tigger plush (Winnie the Pooh). USB folder Tumbling_tiger.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0087',
    projectName: 'Yellow teddy bear',
    description: 'repair - plush',
    skills: ['sewing', 'cleaning'],
    tags: ['plush', 'teddy'],
    repairDetails: 'Vintage yellow/tan teddy with gold neck ribbon.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0088',
    projectName: 'Anime bunny girl figure',
    description: 'repair - figure',
    skills: ['figure repair', 'gluing'],
    tags: ['figure', 'anime'],
    repairDetails:
      'Anime bunny-girl scale figure — detached bunny ear; glue/repair.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0089',
    projectName: 'Curly teddy pink ribbon',
    description: 'repair - plush',
    skills: ['sewing', 'cleaning'],
    tags: ['plush', 'teddy'],
    repairDetails: 'Brown curly-fur teddy with pink satin neck ribbon.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0090',
    projectName: 'Vintage tan teddy bear',
    description: 'repair - plush restuffing',
    skills: ['sewing', 'restuffing'],
    tags: ['plush', 'teddy', 'vintage'],
    repairDetails:
      'Vintage tan teddy — neck seam open, restuff. USB folder polar_bear was a mislabel.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0091',
    projectName: 'Woody doll Toy Story',
    description: 'repair - plush and mechanism',
    skills: ['sewing', 'electronics'],
    tags: ['Toy Story', 'Woody', 'doll'],
    repairDetails:
      'Woody doll (Toy Story) — separate client/job from 0050. Pull-string / costume repair as needed.\n\nUSB folder Woody_2.\n\nIdentified T-00030 — 2026-05-17.',
  },
  {
    id: '0092',
    projectName: 'Buzz Lightyear figure',
    description: 'repair - figure',
    skills: ['figure repair', 'cleaning'],
    tags: ['Toy Story', 'Buzz Lightyear', 'figure'],
    repairDetails:
      'Buzz Lightyear action figure — cosmetic wear; separate client/job. USB folder Woody_n_Buzz (Buzz photos only).\n\nIdentified T-00030 — 2026-05-17.',
  },
];

export const T30_SKIP_IDS = new Set(['0000', '0001', '0002', '0003']);

export const T30_IDENTITIES = [
  ...T30_0004_0035,
  ...T30_0036_0055,
  ...T30_0056_0077,
  ...T30_USB_IDENTITIES,
];
