import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildAuditContent, collectAuditSnapshot, runAudit, validateAuditContent } from '../scripts/branch-pr-audit.mjs';

test('collectAuditSnapshot parses branches and merged PR lines', () => {
  const responses: Record<string, { ok: boolean; out: string }> = {
    'git rev-parse --abbrev-ref HEAD': { ok: true, out: 'work' },
    "git for-each-ref --sort=refname --format='%(refname:short)' refs/heads": {
      ok: true,
      out: 'main\nwork',
    },
    'git remote': { ok: true, out: 'origin' },
    'git log --merges --oneline --decorate -n 30': {
      ok: true,
      out: 'abc Merge pull request #22 from x/y\ndef Merge branch dev',
    },
    'git ls-remote --heads origin': { ok: false, out: 'CONNECT tunnel failed, response 403' },
  };

  const run = (cmd: string) => responses[cmd] ?? { ok: false, out: '' };
  const snapshot = collectAuditSnapshot(run);

  assert.equal(snapshot.currentBranch, 'work');
  assert.deepEqual(snapshot.localBranches, ['main', 'work']);
  assert.deepEqual(snapshot.mergedPrLines, ['abc Merge pull request #22 from x/y']);
  assert.equal(snapshot.remoteProbe, 'FAILED: CONNECT tunnel failed, response 403');
});

test('buildAuditContent includes required sections and excludes volatile details', () => {
  const content = buildAuditContent({
    currentBranch: 'work',
    localBranches: ['main', 'work'],
    remotes: [],
    mergedPrLines: [],
    remoteProbe: 'Not attempted (no remote configured).',
  });

  assert.match(content, /### Local branches/);
  assert.doesNotMatch(content, /HEAD:/);
  assert.doesNotMatch(content, /Generated/);
  assert.doesNotMatch(content, /main\/work aligned/);
});

test('validateAuditContent checks required markers', () => {
  const valid = '# Branch & PR Audit Report\n## Local Git Snapshot\n### Local branches\n### Remotes\n### Recent merged PR commits (from local history)\n### Remote branch probe\n## Operational Decisions (Autonomous)\n## Status\n';
  const invalid = '# Branch & PR Audit Report\n## Status\n';
  assert.equal(validateAuditContent(valid), true);
  assert.equal(validateAuditContent(invalid), false);
});

test('runAudit writes/checks/validates a temporary report path', () => {
  const dir = mkdtempSync(join(tmpdir(), 'branch-audit-'));
  const outputPath = join(dir, 'audit.md');

  try {
    const writeMessage = runAudit({ outputPath });
    assert.equal(writeMessage, `Wrote ${outputPath}`);

    const checkMessage = runAudit({ check: true, outputPath });
    assert.equal(checkMessage, `${outputPath} is up to date.`);

    const validateMessage = runAudit({ validateOnly: true, outputPath });
    assert.equal(validateMessage, `${outputPath} is structurally valid.`);

    writeFileSync(outputPath, '# broken');
    assert.throws(() => runAudit({ validateOnly: true, outputPath }), /malformed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
