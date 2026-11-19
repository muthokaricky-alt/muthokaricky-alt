#!/usr/bin/env node
// Builds every card in assets/ from live GitHub data.
//
//   node scripts/generate.mjs            fetch, then render (uses GH_TOKEN / GITHUB_TOKEN if set)
//   node scripts/generate.mjs --cache    render from the last fetch in scripts/.cache (no network)
//
// Without a token it falls back to public REST calls (60/hour limit) and the public contributions page.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROFILE, FEATURED, MORE } from './config.mjs';
import { fetchData } from './data.mjs';
import { THEMES, LANG_COLORS, hero, terminal, stats, languages, projectCard, moreCard, button } from './render.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const CACHE = join(ROOT, 'scripts', '.cache', 'raw.json');
const HISTORY = join(ROOT, 'data', 'history.json');
const MAX_BYTES = 100 * 1024;

const now = new Date();
const today = now.toISOString().slice(0, 10);

// ---------- load ----------

let raw;
if (process.argv.includes('--cache')) {
  raw = JSON.parse(await readFile(CACHE, 'utf8'));
  console.log(`Using cached data from ${raw.fetchedAt} (${raw.source})`);
} else {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  console.log(token ? 'Fetching via GraphQL (token found)' : 'Fetching via public REST (no token)');
  raw = await fetchData(PROFILE.login, token);
  raw.fetchedAt = now.toISOString();
  await mkdir(dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(raw, null, 2));
}

// ---------- derive ----------

const original = raw.repos.filter((r) => !r.fork && !r.empty && Object.keys(r.languages).length);
const stars = raw.repos.filter((r) => !r.fork).reduce((s, r) => s + r.stars, 0);

// Daily contributions drive the total, the weekly sparkline and the streaks.
const days = raw.days;

let longest = 0;
let run = 0;
for (const d of days) {
  run = d.count ? run + 1 : 0;
  longest = Math.max(longest, run);
}
// Current streak: today may still be empty, so start from yesterday in that case.
let current = 0;
const back = [...days].reverse();
for (let i = back[0]?.count ? 0 : 1; i < back.length && back[i].count; i++) current++;
const best = Math.max(0, ...days.map((d) => d.count));

const weekly = [];
for (let i = 0; i < days.length; i += 7) weekly.push(days.slice(i, i + 7).reduce((s, d) => s + d.count, 0));

// Monthly samples from account creation to today, for cumulative series.
const created = new Date(raw.createdAt);
const samples = [];
for (let d = new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth() + 1, 1)); d < now; d.setUTCMonth(d.getUTCMonth() + 1)) samples.push(new Date(d));
samples.push(now);
const cumulative = (dates) => samples.map((s) => dates.filter((d) => new Date(d) <= s).length);

const repoSeries = cumulative(raw.repos.map((r) => r.createdAt));
// Star timestamps come from GraphQL; without a token they're unknown, so fall back to the tracked history.
const starTimes = raw.repos.every((r) => Array.isArray(r.starredAt)) ? raw.repos.filter((r) => !r.fork).flatMap((r) => r.starredAt) : null;

// Followers have no history in the API, so the workflow keeps its own. A row is added only when a number changes.
const history = existsSync(HISTORY) ? JSON.parse(await readFile(HISTORY, 'utf8')) : [];
const last = history[history.length - 1];
if (!last || last.followers !== raw.followers || last.stars !== stars) history.push({ date: today, followers: raw.followers, stars });
await mkdir(dirname(HISTORY), { recursive: true });
await writeFile(HISTORY, JSON.stringify(history, null, 2) + '\n');
const followerSeries = history.map((h) => h.followers);
const starSeries = starTimes ? cumulative(starTimes) : history.map((h) => h.stars);
const firstFollowers = history[0];
const nice = (iso) => new Date(iso + 'T00:00:00Z').toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Languages: each original repo contributes its own byte shares, so one huge repo can't drown out the rest.
const share = {};
for (const r of original) {
  const total = Object.values(r.languages).reduce((a, b) => a + b, 0);
  for (const [lang, bytes] of Object.entries(r.languages)) share[lang] = (share[lang] || 0) + bytes / total / original.length;
}
let langs = Object.entries(share)
  .map(([name, pct]) => ({ name, pct }))
  .sort((a, b) => b.pct - a.pct);
// Top five plus "Other": six rows fill the card's two columns evenly and stay legible on a phone.
if (langs.length > 6) {
  const rest = langs.slice(5).reduce((s, l) => s + l.pct, 0);
  langs = [...langs.slice(0, 5), { name: 'Other', pct: rest }];
}
langs = langs.map((l) => ({ ...l, color: LANG_COLORS[l.name] || LANG_COLORS.Other }));

const b = raw.breakdown;
const activityTotal = b ? b.commits + b.prs + b.issues : 0;
const pct = (n) => `${Math.round((n / activityTotal) * 100)}%`;
const months = Math.max(1, Math.round((now - created) / (30.44 * 86400000)));
const uptime = months >= 12 ? `${Math.floor(months / 12)}y${months % 12 ? ` ${months % 12}mo` : ''}` : `${months}mo`;

const info = {
  subject: PROFILE.name,
  handle: `@${PROFILE.login}`,
  role: PROFILE.title,
  status: PROFILE.status,
  stack: PROFILE.stack,
  uptime: `${uptime} on GitHub (since ${created.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })})`,
  activity:
    b && activityTotal
      ? `${raw.totalContributions.toLocaleString('en-US')} contribs · ${pct(b.commits)} commits · ${pct(b.prs)} PRs · ${pct(b.issues)} issues`
      : `${raw.totalContributions.toLocaleString('en-US')} contributions in the last year`,
  streaks: `longest ${longest}d · current ${current}d · best day ${best}`,
  repos: `${raw.publicRepos} public · ${stars} stars · ${raw.followers} followers`,
  contact: PROFILE.email && !PROFILE.email.startsWith('{{') ? PROFILE.email : `github.com/${PROFILE.login}`,
};

const tiles = [
  { label: 'Contributions', value: raw.totalContributions, caption: 'last 12 months, weekly', series: weekly },
  { label: 'Public repos', value: raw.publicRepos, caption: `${original.length} original, rest forks`, series: repoSeries },
  { label: 'Stars', value: stars, caption: 'on my original repos', series: starSeries },
  {
    label: 'Followers',
    value: raw.followers,
    caption:
      followerSeries.length > 1
        ? `${raw.followers - firstFollowers.followers >= 0 ? '+' : ''}${raw.followers - firstFollowers.followers} since ${nice(firstFollowers.date)}`
        : `tracking since ${nice(firstFollowers.date)}`,
    series: followerSeries,
  },
];

const byName = Object.fromEntries(raw.repos.map((r) => [r.name, r]));
const projects = FEATURED.map((p) => {
  const r = byName[p.repo];
  if (!r) throw new Error(`Featured repo "${p.repo}" not found among public repos`);
  return { ...p, stars: r.stars, pushedAt: r.pushedAt };
});
const pretty = { 'Schedulix-': 'Schedulix', 'QR-Studio': 'QR Studio', 'budget-tracker': 'Budget Tracker' };
const more = { count: raw.publicRepos, original: original.length, names: MORE.filter((n) => byName[n]).map((n) => pretty[n] || n) };

// ---------- write ----------

await mkdir(ASSETS, { recursive: true });
const written = [];
async function out(name, theme, content) {
  const file = `${name}${theme === 'light' ? '-light' : ''}.svg`;
  await writeFile(join(ASSETS, file), content);
  written.push([file, Buffer.byteLength(content)]);
}

for (const [key, t] of Object.entries(THEMES)) {
  await out('hero', key, hero(t, PROFILE));
  await out('terminal', key, terminal(t, info));
  await out('stats', key, stats(t, tiles));
  await out('languages', key, languages(t, langs, original.length));
  for (const p of projects) await out(`project-${p.repo.toLowerCase()}`, key, projectCard(t, p, now));
  await out('project-more', key, moreCard(t, more));
  for (const k of ['email', 'linkedin', 'github']) await out(`btn-${k}`, key, button(t, k));
}

let tooBig = false;
for (const [file, bytes] of written) {
  const flag = bytes > MAX_BYTES ? '  <-- over 100 KB' : '';
  if (flag) tooBig = true;
  console.log(`${file.padEnd(30)} ${(bytes / 1024).toFixed(1).padStart(6)} KB${flag}`);
}
console.log(`\n${raw.totalContributions} contributions · ${raw.publicRepos} repos · ${stars} stars · ${raw.followers} followers`);
console.log('Languages:', langs.map((l) => `${l.name} ${(l.pct * 100).toFixed(1)}%`).join(', '));
if (tooBig) process.exit(1);
