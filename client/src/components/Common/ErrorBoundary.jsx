import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    // eslint-disable-next-line no-unused-vars
    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#343541] text-white p-6">
                    <div className="max-w-xl w-full bg-[#444654] rounded-lg p-8 shadow-2xl border border-red-500/20">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
                        <p className="text-gray-300 mb-6">The application crashed. Here are the details:</p>

                        <pre className="bg-black/50 p-4 rounded text-red-300 text-sm overflow-auto max-h-60 mb-6 font-mono">
                            {this.state.error && this.state.error.toString()}
                        </pre>

                        <button
                            onClick={() => window.location.reload()}
                            className="bg-[#10a37f] hover:bg-[#0e906f] text-white px-4 py-2 rounded transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
