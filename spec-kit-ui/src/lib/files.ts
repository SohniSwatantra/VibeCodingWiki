import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const uiRoot = resolve(currentDir, '..', '..');
const workspaceRoot = resolve(uiRoot, '..');
const documentsRoot = resolve(workspaceRoot, 'spec-kit/001-vibecodingwiki');

function getDocumentPath(document: 'spec' | 'plan') {
  const filename = document === 'spec' ? 'spec.md' : 'plan.md';
  return resolve(documentsRoot, filename);
}

export async function readDocument(document: 'spec' | 'plan') {
  const path = getDocumentPath(document);
  return readFile(path, 'utf8');
}

export async function writeDocument(document: 'spec' | 'plan', content: string) {
  const path = getDocumentPath(document);
  const normalized = content.replace(/\r\n/g, '\n');
  await writeFile(path, normalized, 'utf8');
}

