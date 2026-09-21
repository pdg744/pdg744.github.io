// Stage the web export in the Astro public directory for GitHub Pages.
import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
const source = path.resolve(import.meta.dirname, '../dist');
const target = path.resolve(import.meta.dirname, '../../public/app');
// Retain older hashed assets so already-open clients can finish loading them.
// This also preserves the existing 404 fallback and the recovery archive.
await cp(source, target, { recursive: true });
// Pages has no SPA rewrite: give each app route a real entry document.
for (const route of ['practice-details', 'parent', 'topics', 'diffy-squares', 'factor-and-add']) {
  await mkdir(path.join(target, route), { recursive: true });
  await cp(path.join(source, 'index.html'), path.join(target, route, 'index.html'));
}
console.log('Staged app in public/app; commit and push to deploy through Pages.');
