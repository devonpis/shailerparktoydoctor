#!/usr/bin/env node
/**
 * T-00011: Import legacy repair stories from index.html into projects/.
 * Usage: node scripts/import-site-projects.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const IMAGES_DIR = path.join(REPO_ROOT, 'images');

const IMPORTS = [
  {
    id: '0004',
    folderName: 'Rocky Balboa',
    image: 'Rocky.png',
    imageRole: 'hero',
    tags: ['Figure restoration', 'Electronics', 'Vintage toy'],
    title: 'Rocky Balboa motion and sound figure',
    body: `The condition of Rocky was not good when we received him. Both his feet were broken off from the stage. He didn't move and sound even with new batteries. We opened Rocky up completely and found that the problem was due to several broken gears, moving parts and a faulty switch. We fixed the faulty switch, replaced and repaired several moving parts and gears. Another issue is the inadequate leg support in the original design. Rocky has a big heavy head and a heavy body truck which contains 4 motors. All these were only supported by two tiny pins inside the feet. No wonders the feets were so badly broken. To solve this problem, we re-attached Rocky back to his stage with larger and longer bolts. We also added a few screws for extra support of the heavy head and body. After lots of efforts, Rocky was finally brought back to life with its legendary sound and punching motion.`,
  },
  {
    id: '0005',
    folderName: 'Vintage Giant Smurf',
    image: 'smurf.png',
    imageRole: 'hero',
    tags: ['Plush restoration', 'Vintage toy'],
    title: 'Vintage giant Smurf — restuff and clean',
    body: `According to the owner, this giant smurf is 40 years old. The owner tried to clean him, but brown powdery material started to leak out after the wash. We found that the brown powdery substance was actually the old stuffing being decomposed and kept leaking out of the fabric. In order to rescue this smurf, we needed to thoroughly remove the old stuffing, which was not as easy as it sounded as the powdery substance all got stuck into the fabric and the fur. We opened up the smurf and turned it completely inside out. We did a thorough vacuuming, followed by cleaning, re-stuffing with new material and re-sealing. Finally this 40 years old smurf was back to his glory.`,
  },
  {
    id: '0006',
    folderName: 'Childhood Toy Train',
    image: 'train.png',
    imageRole: 'hero',
    tags: ['Vintage toy repair', 'Electronics'],
    title: 'Childhood toy train — motor and wiring',
    body: `This old toy train belongs to my client who would like to pass his childhood toy to his grandchildren. Somehow the train stopped working. My client tried to fix it but didn't succeed and asked for our help. After our inspection, we found that the motor was disconnected and some wires were missing. There were also heaps of hairs and (carpet) fibres got stuck among the gears, covered with excessive lubricating grease. First, we cleaned up all those wheel and gears axial. Then we re-soldered all those wires and re-connected the motor with the switch and the battery.`,
  },
  {
    id: '0007',
    folderName: 'Teddy Bear with Love',
    image: 'Bear.png',
    imageRole: 'hero',
    tags: ['Plush restoration', 'Vintage toy'],
    title: 'Teddy bear with love — head reattach and restuff',
    body: `This teddy bear was in quite a sad condition when we received him. His head was detached from his body, one of his eyes, nose and some of his fur was missing. My client asked me to bring this sad fellow back to life, which has a very special meaning to his wife. We started with removing the old stuffing material from the bear and patching up all the little holes in the fabric scattering all over the head and the body. Then we re-attached the eyes and nose with similar ones, re-attached the head to the body, and re-stuffed the bear with new stuffing material and added a ribbon around its neck.`,
  },
  {
    id: '0008',
    folderName: 'Fluffy Dog Toy',
    image: 'dog.jpg',
    imageRole: 'hero',
    tags: ['Plush restoration'],
    title: 'Fluffy dog toy',
    body: 'Fluffy dog toy repair (legacy site gallery — short caption only; expand story when details are available).',
    galleryOnly: true,
  },
  {
    id: '0009',
    folderName: 'Duggee Sound and Motion',
    image: 'duggee.jpg',
    imageRole: 'hero',
    tags: ['Electronics', 'Toy repair'],
    title: 'Duggee with sound and motion',
    body: 'Duggee with sound and motion (legacy site gallery — short caption only; expand story when details are available).',
    galleryOnly: true,
  },
  {
    id: '0010',
    folderName: 'Xbox Guitar Hero',
    image: 'guitar.jpg',
    imageRole: 'hero',
    tags: ['Electronics', 'Toy repair'],
    title: 'Xbox Guitar Hero console',
    body: 'X-box Guitar hero console (legacy site gallery — short caption only; expand story when details are available).',
    galleryOnly: true,
  },
  {
    id: '0011',
    folderName: 'Hilt Lightsabers',
    image: 'lightsaber.jpg',
    imageRole: 'hero',
    tags: ['Toy repair', 'Collectible'],
    title: 'Hilt lightsabers',
    body: 'Hilt lightsabers (legacy site gallery — short caption only; expand story when details are available).',
    galleryOnly: true,
  },
  {
    id: '0012',
    folderName: 'Giant Stormtrooper',
    image: 'stomtropper.jpg',
    imageRole: 'hero',
    tags: ['Figure restoration', 'Collectible'],
    title: 'Giant Stormtrooper',
    body: 'Giant Stormtrooper (legacy site gallery — short caption only; expand story when details are available).',
    galleryOnly: true,
  },
  {
    id: '0013',
    folderName: 'Vintage Talking Bear',
    image: 'vintage bear.jpg',
    imageRole: 'hero',
    tags: ['Plush restoration', 'Vintage toy', 'Electronics'],
    title: 'Vintage talking bear',
    body: 'Vintage talking bear (legacy site gallery — short caption only; expand story when details are available).',
    galleryOnly: true,
  },
  {
    id: '0014',
    folderName: 'Tomy Toy Car',
    image: 'Tomy1.jpg',
    extraImages: [{ file: 'Tomy2.jpg', role: 'after' }],
    imageRole: 'hero',
    tags: ['Vintage toy repair', 'Electronics'],
    title: 'Tomy toy car',
    body: 'Tomy toy car (legacy site gallery — two photos on homepage; expand story when details are available).',
    galleryOnly: true,
  },
  {
    id: '0015',
    folderName: 'Anpanman Reading Pen',
    image: 'readingpen.jpg',
    imageRole: 'hero',
    tags: ['Electronics', 'Toy repair'],
    title: 'Anpanman reading pen',
    body: 'Anpanman reading pen (legacy site gallery — short caption only; expand story when details are available).',
    galleryOnly: true,
  },
];

function socialDescription(text, maxLen = 480) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 200 ? cut.slice(0, lastSpace) : cut) + '…';
}

function copyImage(srcName, destDir, destStem) {
  const src = path.join(IMAGES_DIR, srcName);
  if (!fs.existsSync(src)) throw new Error(`Missing image: ${srcName}`);
  const ext = path.extname(srcName);
  const dest = path.join(destDir, `${destStem}${ext}`);
  fs.copyFileSync(src, dest);
  return path.basename(dest);
}

function writeConfig(dir, data) {
  const config = {
    isTemplate: false,
    projectName: data.projectName,
    title: data.title,
    startDate: '2024-01-01',
    endDate: '2024-01-01',
    status: 'WIP',
    webpageUrl: null,
    facebookUrl: null,
    instagramUrl: null,
    threadUrl: null,
    youtubeUrl: null,
    youtubeShortUrl: null,
    tags: data.tags,
    description: data.description,
    itemDetails: data.itemDetails,
    repairDetails: data.repairDetails,
  };
  fs.writeFileSync(path.join(dir, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const created = [];

  for (const item of IMPORTS) {
    const dirName = `${item.id} - ${item.folderName}`;
    const dir = path.join(PROJECTS_DIR, dirName);
    if (fs.existsSync(dir)) {
      console.log(`SKIP exists: ${dirName}`);
      continue;
    }

    const repairDetails = item.galleryOnly
      ? `${item.body}\n\nImported from legacy homepage (index.html) — ${new Date().toISOString().slice(0, 10)}.`
      : `${item.body}\n\nImported from legacy homepage patient story — ${new Date().toISOString().slice(0, 10)}.`;

    const description = socialDescription(
      item.galleryOnly
        ? `${item.title}. ${item.body.replace(/\(legacy site gallery[^)]*\)/i, '').trim()}`
        : item.body
    );

    const payload = {
      projectName: item.folderName,
      title: item.title,
      tags: item.tags,
      description,
      itemDetails: `Legacy site repair: ${item.title}. Source image: images/${item.image}.`,
      repairDetails,
    };

    if (dryRun) {
      console.log(`Would create: ${dirName} (+ ${item.image}${item.extraImages ? ', extra' : ''})`);
      created.push(dirName);
      continue;
    }

    fs.mkdirSync(dir, { recursive: true });
    copyImage(item.image, dir, item.imageRole);
    if (item.extraImages) {
      for (const extra of item.extraImages) {
        copyImage(extra.file, dir, extra.role);
      }
    }
    writeConfig(dir, payload);
    console.log(`Created: ${dirName}`);
    created.push(dirName);
  }

  console.log(`\n${dryRun ? 'Would create' : 'Created'} ${created.length} project(s).`);
  if (!dryRun && created.length) {
    console.log('Run: node scripts/validate-publish.mjs <id> for each when ready to publish.');
  }
}

main();
