import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-dark text-white text-center px-3">
          <i className="bi bi-exclamation-triangle-fill fs-1 text-danger mb-3"></i>
          <h4 className="fw-bold mb-2">Algo salió mal</h4>
          <p className="text-muted mb-4" style={{ maxWidth: 480 }}>
            {this.state.error?.message ?? 'Error inesperado. Por favor recargá la página.'}
          </p>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-light" onClick={this.handleReset}>
              Intentar nuevamente
            </button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
