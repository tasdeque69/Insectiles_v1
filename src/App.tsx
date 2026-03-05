/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Game from './components/Game';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
      <ErrorBoundary>
        <Game />
      </ErrorBoundary>
    </div>
  );
}
