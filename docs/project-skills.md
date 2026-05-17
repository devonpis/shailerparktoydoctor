# Project skill categories (`config.json` → `skills`)

**BR-028.** Every repair project’s `skills` array must use **only** the four IDs that match the public site (gallery filters and project page badges).

## Allowed values

| ID | Site label | Typical work |
|----|------------|--------------|
| `plush` | Plush | Sewing, restuffing, cleaning, fabric, teddy/plush repair |
| `electronic` | Electronic | Wiring, batteries, sound modules, controllers, soldering |
| `mechanical` | Mechanical | Gears, motors, wind-ups, joints, structural/mechanical fix |
| `paintjob` | Paint | Figure touch-up, glue/bond, resin sculpt, paint and finish |

- **One or more** per project (e.g. talking plush → `["plush", "electronic"]`).
- **Order in JSON** does not matter; scripts and the site sort as: plush → electronic → mechanical → paintjob.
- **Empty array** `[]` is allowed (e.g. intake / non-repairable); no legacy granular strings (`sewing`, `electronics`, `cleaning`, etc.).

## Source of truth in code

- Canonical list: [`scripts/lib/normalize-skills.mjs`](../scripts/lib/normalize-skills.mjs) — `CANONICAL_SKILL_IDS`, `normalizeSkills()`.
- Site UI: [`new/js/skills.js`](../new/js/skills.js) — badges, filters, `SiteSkills.normalizeSkills()`.

## Normalize existing projects

```bash
node scripts/normalize-project-skills.mjs          # apply
node scripts/normalize-project-skills.mjs --dry-run
```

[`scripts/apply-project-identities.mjs`](../scripts/apply-project-identities.mjs) normalizes skills when applying T-00030 identity maps.

## Validation

[`scripts/validate-publish.mjs`](../scripts/validate-publish.mjs) **errors** if any `skills` entry is not one of the four IDs.

## Do not

- Add new skill IDs without updating **both** `normalize-skills.mjs` and `new/js/skills.js` (and this doc).
- Use synonyms in JSON (`electronics`, `paint`, `sewing`) — map via `normalizeSkills()` before commit.
