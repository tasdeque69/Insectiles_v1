import React from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    logger.error('Unhandled UI error in game shell', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-zinc-950 text-white flex items-center justify-center p-6">
          <div className="max-w-sm text-center space-y-3">
            <h1 className="text-3xl font-black">PINIK PIPRA</h1>
            <p className="text-white/80">The game crashed unexpectedly.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-full bg-white text-black font-bold"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
