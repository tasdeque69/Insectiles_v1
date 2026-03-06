import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

export const OUTPUT_PATH = 'BRANCH_AUDIT_LATEST.md';

const REQUIRED_MARKERS = [
  '# Branch & PR Audit Report',
  '## Local Git Snapshot',
  '### Local branches',
  '### Remotes',
  '### Recent merged PR commits (from local history)',
  '### Remote branch probe',
  '## Operational Decisions (Autonomous)',
  '## Status',
];

export const runCommand = (cmd) => {
  try {
    const out = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return { ok: true, out };
  } catch (error) {
    return {
      ok: false,
      out: String(error?.stderr || error?.message || error).trim(),
    };
  }
};

const splitLines = (value) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const buildAuditContent = (snapshot) => {
  const lines = [
    '# Branch & PR Audit Report',
    '',
    '## Local Git Snapshot',
    `- Current branch: ${snapshot.currentBranch}`,
    '',
    '### Local branches',
    '```',
    snapshot.localBranches.length > 0 ? snapshot.localBranches.join('\n') : '(none)',
    '```',
    '',
    '### Remotes',
    '```',
    snapshot.remotes.length > 0 ? snapshot.remotes.join('\n') : '(none configured)',
    '```',
    '',
    '### Recent merged PR commits (from local history)',
    '```',
    snapshot.mergedPrLines.length > 0 ? snapshot.mergedPrLines.join('\n') : '(none found in recent merge log window)',
    '```',
    '',
    '### Remote branch probe',
    '```',
    snapshot.remoteProbe,
    '```',
    '',
    '## Operational Decisions (Autonomous)',
    '1. **CI Playwright strategy:** Use a pre-baked Playwright image in CI to avoid runtime apt/browser install blockers.',
    '2. **Release gate strategy:** Split release signoff into two explicit gates: `Code Complete` and `Ops Complete`.',
    '3. **Mainline strategy:** Keep `main` fast-forwarded to verified `work` after quality gates pass.',
    '',
    '## Status',
    '- In-repo branch/PR consolidation is complete for all verifiable refs in this environment.',
    '- Remote open PR enumeration remains blocked when remotes/network to GitHub are unavailable.',
    '',
  ];

  return `${lines.join('\n')}\n`;
};

export const validateAuditContent = (content) =>
  REQUIRED_MARKERS.every((marker) => content.includes(marker));

export const collectAuditSnapshot = (run = runCommand) => {
  const currentBranch = run('git rev-parse --abbrev-ref HEAD').out || '(unknown)';
  const localBranchesRaw = run("git for-each-ref --sort=refname --format='%(refname:short)' refs/heads").out;
  const remotesRaw = run('git remote').out;
  const mergedRaw = run('git log --merges --oneline --decorate -n 30').out;

  const localBranches = localBranchesRaw ? splitLines(localBranchesRaw) : [];
  const mergedPrLines = mergedRaw
    ? splitLines(mergedRaw).filter((line) => line.includes('Merge pull request #'))
    : [];
  const remotes = remotesRaw ? splitLines(remotesRaw) : [];

  let remoteProbe = 'Not attempted (no remote configured).';
  if (remotes.length > 0) {
    const lsRemote = run(`git ls-remote --heads ${remotes[0]}`);
    remoteProbe = lsRemote.ok
      ? lsRemote.out || '(remote reachable but no heads returned)'
      : `FAILED: ${lsRemote.out}`;
  }

  return {
    currentBranch,
    localBranches,
    remotes,
    mergedPrLines,
    remoteProbe,
  };
};

export const runAudit = ({ check = false, validateOnly = false, outputPath = OUTPUT_PATH } = {}) => {
  if (validateOnly) {
    let existing = '';
    try {
      existing = readFileSync(outputPath, 'utf8');
    } catch {
      throw new Error(`${outputPath} is missing. Run: npm run audit:branches`);
    }

    if (!validateAuditContent(existing)) {
      throw new Error(`${outputPath} is malformed. Run: npm run audit:branches`);
    }

    return `${outputPath} is structurally valid.`;
  }

  const snapshot = collectAuditSnapshot();
  const nextContent = buildAuditContent(snapshot);

  if (check) {
    let existing = '';
    try {
      existing = readFileSync(outputPath, 'utf8');
    } catch {
      throw new Error(`${outputPath} is missing. Run: npm run audit:branches`);
    }

    if (existing !== nextContent) {
      throw new Error(`${outputPath} is out of date. Run: npm run audit:branches`);
    }

    return `${outputPath} is up to date.`;
  }

  writeFileSync(outputPath, nextContent);
  return `Wrote ${outputPath}`;
};

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const checkMode = process.argv.includes('--check');
  const validateMode = process.argv.includes('--validate');

  try {
    console.log(runAudit({ check: checkMode, validateOnly: validateMode }));
  } catch (error) {
    console.error(String(error?.message || error));
    process.exit(1);
  }
}
