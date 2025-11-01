import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ [ErrorBoundary] Errore catturato:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-error-500 mb-4">
              ❌ Errore nell'Applicazione
            </h1>
            <div className="bg-gray-900 p-4 rounded mb-4 overflow-auto">
              <p className="text-sm text-gray-300 mb-2 font-bold">Errore:</p>
              <pre className="text-xs text-error-400">
                {this.state.error?.toString()}
              </pre>
            </div>
            {this.state.errorInfo && (
              <div className="bg-gray-900 p-4 rounded mb-4 overflow-auto max-h-96">
                <p className="text-sm text-gray-300 mb-2 font-bold">Stack Trace:</p>
                <pre className="text-xs text-gray-400">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
            >
              Ricarica Pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
