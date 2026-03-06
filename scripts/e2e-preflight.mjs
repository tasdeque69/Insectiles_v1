import { execSync } from 'node:child_process';

try {
  execSync('npx playwright test --list', { stdio: 'pipe' });
  console.log('[e2e-preflight] Playwright is ready');
  process.exit(0);
} catch {
  console.error('[e2e-preflight] Playwright is not properly configured');
  console.error('[e2e-preflight] Try: npm run e2e:install');
  process.exit(1);
}
