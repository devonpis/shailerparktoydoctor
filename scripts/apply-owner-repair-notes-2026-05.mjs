#!/usr/bin/env node
/**
 * Apply owner repair notes (May 2026). Skips any project already on site or social.
 *
 *   node scripts/apply-owner-repair-notes-2026-05.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeSkills } from './lib/normalize-skills.mjs';
import { polishRepairDetails } from './lib/polish-metadata.mjs';
import { listProjectImages } from './lib/project-media.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const dryRun = process.argv.includes('--dry-run');

/** DONE webpage and/or any social URL — do not edit. */
const PUBLISHED_IDS = new Set([
  '0001', '0003', '0004', '0005', '0006', '0007', '0008', '0009', '0010', '0011', '0012',
  '0013', '0014', '0015', '0016', '0018', '0019', '0020', '0021', '0022', '0025', '0027',
  '0030', '0031', '0032', '0034', '0035', '0036', '0037', '0038', '0039', '0040', '0041',
  '0042', '0043', '0044', '0051', '0053', '0055', '0066', '0088', '0093', '0094', '0098',
]);

/** Owner rows: id → { skills (raw), repair (two paragraphs or one block) } */
const NOTES = {
  '0045': {
    skills: ['needlework'],
    repair:
      'This Beanie Boo husky arrived with holes and tears around the nose and needed a full refresh.\n\nWe deep cleaned the plush, reattached the eyes, and repaired the damaged fabric around the nose so the face holds together again.',
    title: 'Beanie Boo husky — eyes back, nose tears mended',
    description:
      'This husky Beanie Boo came in with torn fabric around the nose and loose eyes. We deep cleaned the plush, secured the eyes, and repaired the nose area so it is cuddly and display-ready again.',
  },
  '0046': {
    skills: ['mechanical'],
    repair:
      'The Arcade Alley Laser Bowlercade would not reload bowling pins—the mechanism jammed and the motor could not overcome the load.\n\nThe design puts high torque on the plastic stud and rod. We modified those parts to reduce friction and torque demand so the pin reset cycles smoothly again.',
    title: 'Laser Bowlercade — pin reload running smoothly',
    description:
      'Pins on this Arcade Alley Laser Bowlercade were stuck and would not reload. We reworked the plastic stud and rod so the motor can drive the reset mechanism without jamming.',
  },
  '0050': {
    skills: ['mechanical'],
    repair:
      'This Toy Story Woody pull-string doll would not pull or trigger the sound box when the cord was drawn.\n\nWe repaired the spring mechanism inside the pull-string housing so the voice box triggers reliably again.',
    title: 'Woody pull-string — sound box springs back to life',
    description:
      'Woody’s pull string no longer fired the sound box. We repaired the spring mechanism inside the pull-string housing so phrases play when the cord is pulled.',
  },
  '0052': {
    skills: ['electronic'],
    repair:
      'This singing Elvis Christmas dog had power and playback faults tied to the battery path and board.\n\nWe replaced the battery contacts and repaired the internal circuit board so the figure sings again.',
    title: 'Singing Elvis dog — power path restored',
    description:
      'This Elvis Christmas plush would not run reliably on batteries. We replaced corroded contacts and repaired the internal circuit board so the singing mechanism works again.',
  },
  '0057': {
    skills: ['needlework'],
    repair:
      'This yellow Yoshi plush had holes and tears through the pile and stuffing showing through.\n\nWe deep cleaned the fabric, repaired the tears, and restuffed so Yoshi keeps a smooth shape.',
    title: 'Yellow Yoshi — tears patched and restuffed',
    description:
      'Yoshi arrived with holes and worn pile. We deep cleaned, closed the tears, and restuffed the body so the plush is firm and huggable again.',
  },
  '0058': {
    skills: ['electronic', 'mechanical'],
    repair:
      'This John Deere ride-on tractor had electronic faults that needed board-level work.\n\nWe partially disassembled the toy for access, repaired the circuit board, and reassembled so drive and features work again.',
    title: 'John Deere ride-on — electronics back on the job',
    description:
      'This ride-on tractor needed electronic repair. We opened the shell as required, fixed the circuit board, and put the unit back together for reliable play.',
  },
  '0059': {
    skills: ['needlework'],
    repair:
      'This brown kangaroo plush had significant wear, especially tears at the tail.\n\nWe deep cleaned the plush, repaired tears (with extra care at the tail), and restuffed for an even finish.',
    title: 'Kangaroo plush — tail tears mended and restuffed',
    description:
      'This kangaroo came in with tears, worst at the tail. We deep cleaned, patched the fabric, and restuffed so the plush sits upright and feels solid again.',
  },
  '0062': {
    skills: ['needlework', 'electronic', 'mechanical'],
    repair:
      'Two Bob the Builder plush mates came in together: Bob and Spud.\n\nOn Bob we repaired the hand switch. On Spud we repaired the electronic circuit board, replaced battery contacts and corroded wiring—the metal parts had been cleaned with vinegar earlier, which had accelerated corrosion. Both figures were cleaned and checked after electrical work.',
    title: 'Bob and Spud — switches, wiring, and plush refresh',
    description:
      'Bob needed a hand switch repair; Spud needed board work, new battery contacts, and wiring after vinegar cleaning had corroded the metal parts. We restored both Builder pals for play.',
  },
  '0067': {
    skills: ['needlework', 'mechanical'],
    repair:
      'This Dakin stroller huggers set includes a giraffe with a wind-up music box that had seized.\n\nWe lubricated and repaired the wind-up mechanism so the music plays smoothly again, and refreshed the plush as needed.',
    title: 'Dakin giraffe huggers — wind-up music box serviced',
    description:
      'The giraffe’s wind-up music box would not run properly. We lubricated and repaired the movement so the lullaby plays again on the stroller toy.',
  },
  '0074': {
    skills: ['needlework'],
    repair:
      'Two Jellycat Bashful bunnies—a yellow and a navy—needed fabric work and stuffing refresh.\n\nWe deep cleaned and restuffed both. The yellow bunny needed an arm reattached; the blue bunny needed a leg reattached so both sit and display correctly.',
    title: 'Jellycat Bashful bunnies — limbs reattached, restuffed',
    description:
      'A pair of Jellycat Bashful bunnies needed cleaning and new stuffing. We reattached the yellow bunny’s arm and the blue bunny’s leg, then restuffed both for a soft, even finish.',
  },
  '0076': {
    skills: ['electronic'],
    repair:
      'This sleeping tan teddy with blue pillow had intermittent power from corroded battery contacts.\n\nWe repaired and replaced the battery contacts so the sound or light feature runs reliably again.',
    title: 'Sleeping teddy — battery contacts renewed',
    description:
      'This bedtime teddy was not powering up consistently. We repaired the battery contacts so the electronic comfort feature works when batteries are fitted.',
  },
  '0078': {
    skills: ['needlework'],
    repair:
      'This Disney Pluto plush had holes and tears through the pile.\n\nWe deep cleaned the fabric, repaired the tears, and restuffed Pluto so he keeps his shape. Before and after photos in this folder show the condition on arrival and the finished plush.',
    title: 'Disney Pluto — tears closed and restuffed',
    description:
      'Pluto arrived with holes and flat stuffing. We deep cleaned, patched the tears, and restuffed so the plush is firm for display or play.',
  },
  '0079': {
    skills: ['needlework'],
    repair:
      'This tan shaggy dog with a brown ribbon needed a thorough refresh.\n\nWe deep cleaned the pile and ribbon area so the plush looks and smells clean again. The after photos show the refreshed finish ready for display.',
    title: 'Shaggy tan dog — deep clean refresh',
    description:
      'This shaggy plush dog needed a full deep clean. We washed and refreshed the pile and ribbon so the toy is ready to go back on the shelf.',
  },
  '0080': {
    skills: ['needlework'],
    repair:
      'This capybara plush arrived with the head detached, cuts in the fabric, and compacted stuffing.\n\nWe reattached the head, repaired all cuts and tears, deep cleaned, and restuffed for a round, even body.',
    title: 'Capybara plush — head on, stuffing restored',
    description:
      'The capybara came in with a loose head and torn fabric. We reattached the head, closed the cuts, deep cleaned, and restuffed for a plump finish.',
  },
  '0081': {
    skills: ['needlework'],
    repair:
      'This terry-cloth tan puppy was missing its eyes and had tired stuffing.\n\nWe replaced the eyes, deep cleaned the fabric, and restuffed so the face and body look correct again.',
    title: 'Terry-cloth puppy — new eyes and restuff',
    description:
      'This puppy plush was missing both eyes. We fitted replacement eyes, deep cleaned the terry cloth, and restuffed for a bright, even look.',
  },
  '0082': {
    skills: ['needlework'],
    repair:
      'This elephant baby lovey blanket needed structural fabric work as well as cleaning.\n\nWe deep cleaned the piece, remade trim, replaced worn fabric, machine-sewed new sections, and repaired holes and tears.',
    title: 'Elephant lovey — new trim, fabric, and stitches',
    description:
      'This elephant lovey blanket had worn trim and torn panels. We deep cleaned, remade trim, replaced fabric with machine sewing, and closed all holes and tears.',
  },
  '0083': {
    skills: ['needlework'],
    repair:
      'This teddy in pink pajamas had a damaged nose and flat stuffing.\n\nWe deep cleaned the plush, restuffed the body, and repaired the nose so the face looks right again.',
    title: 'Pink pajama teddy — nose repair and restuff',
    description:
      'This bedtime teddy needed nose work and new stuffing. We deep cleaned, restuffed, and repaired the nose for a neat, cuddly finish.',
  },
  '0084': {
    skills: ['needlework'],
    repair:
      'This Paddington Bear needed a full plush refresh.\n\nWe deep cleaned the fabric and restuffed the body so Paddington sits upright with even filling. Workshop photos document the plush before and after the restuff.',
    title: 'Paddington Bear — deep clean and restuff',
    description:
      'Paddington arrived tired and dusty. We deep cleaned the plush and restuffed so the bear holds his classic shape again.',
  },
  '0085': {
    skills: ['needlework'],
    repair:
      'This vintage giant panda plush needed cleaning and new stuffing.\n\nWe deep cleaned the pile and restuffed the body for a full, huggable shape. The giant scale makes even fill important for display stability.',
    title: 'Vintage giant panda — cleaned and restuffed',
    description:
      'This large vintage panda had compacted fill and grime in the pile. We deep cleaned and restuffed for a plump, even finish.',
  },
  '0086': {
    skills: ['needlework', 'electronic'],
    repair:
      'This Disney Tigger plush had both fabric damage and electronic faults.\n\nWe deep cleaned the plush, repaired internal circuit bad contacts, reinforced wiring and solder joints, and repaired cuts and tears in the fabric.',
    title: 'Disney Tigger — fabric and electronics restored',
    description:
      'Tigger needed plush repairs and electronic work. We fixed bad contacts and solder joints, reinforced wiring, and repaired cuts and tears after a deep clean.',
  },
  '0087': {
    skills: ['needlework'],
    repair:
      'This curly sherpa teddy with a gold organza bow needed cleaning, stuffing, and ribbon work.\n\nWe deep cleaned, restuffed, and replaced the ribbon so the gift look is restored.',
    title: 'Sherpa teddy — restuffed with a fresh bow',
    description:
      'This sherpa teddy needed a full refresh and a new organza bow. We deep cleaned, restuffed, and tied a replacement ribbon.',
  },
  '0089': {
    skills: ['needlework'],
    repair:
      'This brown sherpa teddy with a pink ribbon needed cleaning and ribbon replacement.\n\nWe deep cleaned the plush and fitted a new ribbon. The refreshed bow and clean pile are shown in the after photos.',
    title: 'Brown sherpa teddy — clean and new ribbon',
    description:
      'This sherpa teddy needed a deep clean and a fresh pink ribbon. We washed the pile and replaced the bow for display.',
  },
  '0090': {
    skills: ['needlework'],
    repair:
      'This cream teddy with a blue satin bow had worn fabric and flat stuffing.\n\nWe deep cleaned, restuffed, reinforced weak fabric areas, and added a new ribbon. Before and after photos show the improved shape and finish.',
    title: 'Cream teddy — reinforced, restuffed, new bow',
    description:
      'This cream teddy needed restuffing and fabric reinforcement. We deep cleaned, strengthened worn areas, restuffed, and added a new satin bow.',
  },
  '0091': {
    skills: ['mechanical', 'electronic'],
    repair:
      'This Woody pull-string doll would not trigger the sound box, and the battery path was corroded.\n\nWe repaired the spring mechanism in the pull-string housing and cleaned or replaced corroded battery contacts so voice and power work together again.',
    title: 'Woody doll — pull-string and contacts fixed',
    description:
      'Woody’s pull string and battery contacts both failed. We repaired the spring box mechanism and the corroded contacts so the doll speaks reliably again.',
  },
  '0092': {
    skills: ['mechanical', 'electronic', 'paintjob'],
    repair:
      'This Buzz Lightyear figure had corroded batteries, a failed board, and loose arm joints.\n\nWe repaired battery contacts, transplanted a replacement circuit board and arm from a donor unit, touched up paint, cleaned the shell, and secured the loosening arm joint.',
    title: 'Buzz Lightyear — board swap, joints, and touch-up',
    description:
      'Buzz arrived with corroded contacts and a dead board. We fitted a replacement board and arm from another unit, renewed contacts, tightened the arm joint, and touched up paint after cleaning.',
  },
};

function isPublished(cfg) {
  if (PUBLISHED_IDS.has(String(cfg._id))) return true;
  if (cfg.status === 'DONE' && cfg.webpageUrl) return true;
  return [cfg.facebookUrl, cfg.instagramUrl, cfg.threadUrl].some(Boolean);
}

function resolveFolder(id) {
  const prefix = `${id} - `;
  return fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(prefix));
}

const results = { updated: [], skippedPublished: [], skippedNoNotes: [], missing: [] };

for (const [id, note] of Object.entries(NOTES)) {
  if (PUBLISHED_IDS.has(id)) {
    results.skippedPublished.push(id);
    continue;
  }
  const folder = resolveFolder(id);
  if (!folder) {
    results.missing.push(id);
    continue;
  }
  const dir = path.join(PROJECTS_DIR, folder);
  const configPath = path.join(dir, 'config.json');
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (isPublished(cfg)) {
    results.skippedPublished.push(id);
    continue;
  }

  const hasPhotos = listProjectImages(dir).length > 0;
  const skills = normalizeSkills(note.skills);
  const repairDetails =
    note.repair.includes('\n\n') && note.repair.length >= 120
      ? note.repair
      : polishRepairDetails({ ...cfg, skills, repairDetails: note.repair }, hasPhotos, id);

  cfg.skills = skills;
  cfg.repairDetails = repairDetails;
  delete cfg._id;
  if (note.title) cfg.title = note.title;
  if (note.description) cfg.description = note.description;

  if (!dryRun) {
    fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`);
  }
  results.updated.push({ id, folder, name: cfg.projectName });
}

console.log(dryRun ? 'DRY RUN\n' : 'Applied.\n');
console.log('Updated:', results.updated.length);
results.updated.forEach((r) => console.log(`  ${r.id} ${r.name}`));
if (results.skippedPublished.length) {
  console.log('\nSkipped (published):', results.skippedPublished.join(', ') || 'none');
}
if (results.missing.length) console.log('\nMissing folders:', results.missing.join(', '));
