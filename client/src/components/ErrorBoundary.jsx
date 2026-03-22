import React from 'react';
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 overflow-hidden transform transition-all hover:scale-105 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto animate-bounce">
                <HiOutlineExclamationCircle className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-error">Oops! Something went wrong</h1>
                <p className="text-base-content/60 text-sm">
                  The application encountered an unexpected error. Don't worry, your data is safe.
                </p>
              </div>
              
              <div className="p-4 bg-base-200 rounded-xl text-left overflow-auto max-h-32">
                 <code className="text-xs text-error font-mono">{this.state.error?.message || "Unknown error"}</code>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-primary btn-block gap-2 shadow-lg"
                >
                  <HiOutlineRefresh className="w-5 h-5" /> Reload Application
                </button>
                <button 
                  onClick={() => this.setState({ hasError: false })} 
                  className="btn btn-ghost btn-sm"
                >
                  Try again
                </button>
              </div>
            </div>
            <div className="h-2 bg-error"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
