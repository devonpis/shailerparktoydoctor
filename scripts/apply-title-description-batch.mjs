#!/usr/bin/env node
/** One-off batch: T-00034 title + description for 0004–0015 and 0093 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'projects');

const UPDATES = {
  '0004': {
    title: 'Gemmy Rocky Balboa — gears, switch and stage mount',
    description:
      'Gemmy Rocky Balboa arrived silent with both feet snapped off the ring. We replaced broken gears, fixed the faulty switch, and bolted the heavy body to the stage with stronger mounts — boxing motion and movie phrases are back.',
  },
  '0005': {
    title: 'Peyo giant Smurf plush — restuff and deep clean',
    description:
      'This forty-year-old giant Smurf leaked brown dust after a home wash — decomposed foam had stuck in the pile. We turned him inside out, vacuumed and cleaned the shell, restuffed with fresh fill, and resealed the seams.',
  },
  '0006': {
    title: 'Tomy Plarail Edward — motor rewire and gearbox clean',
    description:
      'Childhood Plarail Edward would not run for the grandchildren — the motor had come loose, wires were missing, and fibres clogged the gears. We cleaned the axles, re-soldered the harness, and Edward runs on the track again.',
  },
  '0007': {
    title: 'Patchwork teddy — head reattach, restuff and refresh',
    description:
      'Sentimental patchwork teddy arrived headless with a missing eye and worn fur. We patched the fabric, fitted new eyes and nose, reattached the head, restuffed the body, and added a ribbon — ready for his owner again.',
  },
  '0008': {
    title: 'Floppy brown and cream dog plush — clean and mend',
    description:
      'Large floppy brown-and-cream dog plush — professional clean and fabric repair to refresh worn pile and seams so this lying pose companion is display-ready and cuddly again.',
  },
  '0009': {
    title: 'Hey Duggee interactive plush — sound, lights and plush',
    description:
      'BBC Hey Duggee interactive plush lost sound and chest lights — battery corrosion and loose wiring in the voice module. We serviced the electronics, repaired the plush shell, and Duggee responds with songs and badges again.',
    repairDetails:
      'This large interactive Hey Duggee plush arrived with no sound or light response when the chest badges were pressed. After opening the body we found corroded battery contacts and fractured wiring to the speaker and LED board.\n\nWe cleaned the battery compartment, repaired and re-routed the harness, tested each badge switch, and closed the plush with new stitching along the access seam. Duggee now plays theme music and show phrases again.',
  },
  '0010': {
    title: 'Guitar Hero World Tour guitar — wireless controller repair',
    description:
      'Red Octane Guitar Hero World Tour wireless guitar for Xbox 360 — electronics and mechanical work on the fret board, strum bar, and wireless link so the controller registers cleanly in game again.',
  },
  '0011': {
    title: 'Ahsoka Legacy lightsaber set — hilt electronics',
    description:
      'Disney Parks Ahsoka Tano Legacy lightsaber pair — contact and LED chain work on both curved hilts so the blades light and sound correctly when assembled for display or cosplay.',
  },
  '0012': {
    title: 'Jakks 48 in Stormtrooper Battle Buddy — electronics',
    description:
      'Jakks Pacific giant First Order Stormtrooper Battle Buddy — motion-sensor voice box cleaned and repaired so this 48-inch figure responds with movie lines when you walk past again.',
  },
  '0013': {
    title: 'Vintage Press-heart talking bear — voice module',
    description:
      'Vintage press-the-heart talking teddy — foot-switch voice box diagnosed and repaired plus plush touch-up so the bear speaks clearly when you press the embroidered red heart.',
    repairDetails:
      'This vintage brown talking bear with a Press heart on the foot arrived silent when the switch was pressed. We opened the battery box, cleaned corrosion from the contacts, repaired the trigger harness, and replaced tired wiring to the speaker.\n\nThe plush received a light clean and minor stitching at the access seam. The heart module now plays phrases reliably again.',
  },
  '0014': {
    title: 'Tomy Big Loader blue power unit — motor and gearbox',
    description:
      'Tomy Big Loader blue motorized chassis stopped driving the loop — we cleared lint from the gearbox, renewed battery contacts and motor wiring, and the power unit pulls loaders around the track again.',
    repairDetails:
      'The blue Tomy Big Loader power unit would not drive on the track — a common failure on these 1970s–90s sets when hair and grit pack the gearbox and battery tabs oxidize.\n\nWe disassembled the chassis, cleaned the wheels and reversing gearbox, refreshed the motor leads and switch, and bench-tested forward travel before reassembly.',
  },
  '0015': {
    title: 'Anpanman Kotoba Zukan DX — talking pen and book',
    description:
      'Sega Toys Anpanman Kotoba Zukan DX word book — electronic repair on the touch pen and case so vocabulary prompts and sounds play when children tap the illustrated pages.',
  },
  '0093': {
    title: 'Tomy Big Loader white shells (pair) — body restoration',
    description:
      'Pair of Tomy Big Loader white shell bodies — cracked clip tabs and seam repairs so both units mount securely on the shared blue power chassis used in our Big Loader track set (see project 0014).',
    repairDetails:
      'Two white Tomy Big Loader shell bodies from the same system as the blue motorized chassis (project 0014). Both had stress cracks at the mounting clips and loose upper/lower shell seams that prevented a firm fit on the power unit.\n\nWe plastic-welded and reinforced the clip points, aligned the arrow markers for travel direction, and test-fitted each shell on the restored blue chassis so they couple and run without rattling.',
  },
};

for (const [id, patch] of Object.entries(UPDATES)) {
  const folder = fs.readdirSync(PROJECTS_DIR).find((n) => n.startsWith(`${id} -`));
  if (!folder) throw new Error(`Missing project ${id}`);
  const cfgPath = path.join(PROJECTS_DIR, folder, 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  if (patch.title) cfg.title = patch.title;
  if (patch.description) cfg.description = patch.description;
  if (patch.repairDetails) cfg.repairDetails = patch.repairDetails;
  for (const [k, v] of Object.entries({ title: patch.title, description: patch.description })) {
    if (v && v.length > 500) throw new Error(`${id} ${k} too long: ${v.length}`);
  }
  fs.writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);
  console.log(`Updated ${id} — ${folder}`);
}
