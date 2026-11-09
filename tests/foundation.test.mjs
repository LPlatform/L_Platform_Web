import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('web engineering and release policies are documented', () => {
  for (const path of ['AGENTS.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md', 'docs/release-process.md', 'docs/integration/api-contracts.md']) {
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `${path} exists`);
  }
  assert.match(read('AGENTS.md'), /strict TypeScript/i);
  assert.match(read('docs/integration/api-contracts.md'), /pinned version/i);
  assert.equal(read('.nvmrc').trim(), '24.22.1');
});

test('workflow actions use full commit SHAs', () => {
  for (const file of readdirSync(new URL('../.github/workflows/', import.meta.url))) {
    const contents = read(`.github/workflows/${file}`);
    for (const line of contents.split(/\r?\n/).filter((value) => /^\s+uses:/.test(value))) {
      assert.match(line, /@[a-f0-9]{40}(?:\s|$)/, `${file}: ${line.trim()}`);
    }
  }
});

test('product checks are separate from bootstrap smoke tests', () => {
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /name: bootstrap-smoke/);
  assert.match(ci, /name: web-product-ci/);
  assert.match(ci, /if: needs\.readiness\.outputs\.product-configured == 'true'/);
  assert.match(read('.github/workflows/release.yml'), /TAG: \$\{\{ github\.ref_name \}\}/);
  assert.match(read('.github/workflows/release.yml'), /web-production-\$\{\{ github\.sha \}\}/);
});
