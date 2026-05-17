#!/usr/bin/env node
/**
 * T-00032 / BR-026 — CSV for owner fill-in (repairDetails, skills).
 *
 * Usage:
 *   node scripts/export-project-metadata-gaps.mjs
 *   node scripts/export-project-metadata-gaps.mjs --output docs/reports/foo.csv
 * Default: write CSV only — attach and send manually (e.g. to sptoydoctor@gmail.com).
 *
 * Optional --email: Gmail SMTP only if GMAIL_APP_PASSWORD is in .env (Mail.app not used).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadEnv } from './lib/load-env.mjs';
import {
  collectMetadataGapRows,
  rowsToCsv,
  GAP_CSV_HEADERS,
} from './lib/metadata-gaps.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const REPORT_DIR = path.join(REPO_ROOT, 'docs', 'reports');

const SKILL_HINT = 'plush | electronic | mechanical | paintjob (one or more, comma-separated)';

function parseArgs() {
  const date = new Date().toISOString().slice(0, 10);
  const outIdx = process.argv.indexOf('--output');
  const defaultOut = path.join(REPORT_DIR, `project-metadata-gaps-${date}.csv`);
  const output = outIdx >= 0 ? path.resolve(process.argv[outIdx + 1]) : defaultOut;
  const email = process.argv.includes('--email');
  const toIdx = process.argv.indexOf('--to');
  const fromIdx = process.argv.indexOf('--from');
  return {
    output,
    email,
    to: toIdx >= 0 ? process.argv[toIdx + 1] : 'sptoydoctor@gmail.com',
    from: fromIdx >= 0 ? process.argv[fromIdx + 1] : 'devonpis@gmail.com',
  };
}

function writeMarkdownSummary(rows, mdPath, csvPath) {
  const needBoth = rows.filter((r) => r.needsRepairDetails === 'Yes' && r.needsSkills === 'Yes').length;
  const lines = [
    '# Project metadata gaps (T-00032)',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    `**Rows:** ${rows.length} (need **repairDetails** and/or **skills** fill-in)`,
    '',
    `- Need repair story: ${rows.filter((r) => r.needsRepairDetails === 'Yes').length}`,
    `- Need skills: ${rows.filter((r) => r.needsSkills === 'Yes').length}`,
    `- On old website (0004–0015): ${rows.filter((r) => r.onOldWebsite === 'Yes').length}`,
    `- Need both: ${needBoth}`,
    '',
    `CSV: \`${path.basename(csvPath)}\``,
    '',
    '**skills_FILL_IN:** ' + SKILL_HINT,
    '',
    '| ID | Project | Images | Old site | Need repair | Need skills |',
    '|----|---------|--------|----------|-------------|-------------|',
  ];
  for (const r of rows) {
    lines.push(
      `| ${r.id} | ${r.projectName.replace(/\|/g, '\\|')} | ${r.imageCount} | ${r.onOldWebsite} | ${r.needsRepairDetails} | ${r.needsSkills} |`
    );
  }
  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
}

function sendViaGmailSmtp({ csvPath, to, from, appPassword }) {
  const py = `
import os, smtplib, ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

csv_path = os.environ["CSV_PATH"]
to_addr = os.environ["TO_ADDR"]
from_addr = os.environ["FROM_ADDR"]
password = os.environ["GMAIL_APP_PASSWORD"]

msg = MIMEMultipart()
msg["From"] = from_addr
msg["To"] = to_addr
msg["Subject"] = "Toy Doctor — project repair details & skills worksheet"
body = """Hi,

Attached is the project worksheet for Shailer Park Toy Doctor.

Please fill in:
• repairDetails_FILL_IN — what we did on each repair (plain English, paragraphs OK)
• skills_FILL_IN — plush | electronic | mechanical | paintjob (comma-separated)

Existing item details and dates are in the sheet for reference.

Thanks,
Devon
"""
msg.attach(MIMEText(body, "plain"))

with open(csv_path, "rb") as f:
    part = MIMEBase("application", "octet-stream")
    part.set_payload(f.read())
encoders.encode_base64(part)
part.add_header("Content-Disposition", f'attachment; filename="{os.path.basename(csv_path)}"')
msg.attach(part)

ctx = ssl.create_default_context()
with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx) as server:
    server.login(from_addr, password)
    server.sendmail(from_addr, [to_addr], msg.as_string())
`;
  const r = spawnSync('python3', ['-c', py], {
    env: {
      ...process.env,
      CSV_PATH: csvPath,
      TO_ADDR: to,
      FROM_ADDR: from,
      GMAIL_APP_PASSWORD: appPassword,
    },
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || 'python3 SMTP failed');
  }
}

function sendEmail(opts) {
  loadEnv();
  const appPassword = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || opts.from;

  if (appPassword && smtpFrom) {
    try {
      sendViaGmailSmtp({ ...opts, from: smtpFrom, appPassword });
      console.log(`Emailed ${opts.to} via Gmail SMTP (${smtpFrom}).`);
      return;
    } catch (err) {
      console.warn('Gmail SMTP send failed:', err.message);
    }
  }

  console.error(
    'Email not configured. Attach the CSV and send manually, or set GMAIL_APP_PASSWORD in .env and re-run with --email.'
  );
  console.error(`CSV: ${opts.csvPath}`);
  process.exit(1);
}

async function main() {
  const { output, email, to, from } = parseArgs();
  const rows = collectMetadataGapRows(PROJECTS_DIR);
  const csv = rowsToCsv(rows);

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, csv);

  const mdPath = output.replace(/\.csv$/i, '.md');
  writeMarkdownSummary(rows, mdPath, output);

  console.log(`T-00032 — exported ${rows.length} row(s)`);
  console.log(`CSV: ${path.relative(REPO_ROOT, output)}`);
  console.log(`MD:  ${path.relative(REPO_ROOT, mdPath)}`);
  console.log(`Columns: ${GAP_CSV_HEADERS.join(', ')}`);

  if (email) {
    sendEmail({ csvPath: output, to, from });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
