import React, { ReactNode, Component, ErrorInfo } from 'react';
import { analytics } from '../utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    analytics.trackError(error.name, error.message);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-8">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Oops!</h1>
          <p className="text-xl mb-4">Something went wrong in the game.</p>
          {this.state.error && (
            <pre className="bg-zinc-900 p-4 rounded text-sm text-zinc-400 max-w-lg overflow-auto mb-6">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
