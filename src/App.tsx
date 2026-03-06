/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

const Game = lazy(() => import('./components/Game'));

export default function App() {
  return (
    <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
      <ErrorBoundary>
        <Suspense fallback={<div className="text-white font-mono">Loading game shell…</div>}>
          <Game />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
