import React, { Component, ReactNode, ErrorInfo } from 'react';

interface WebGLErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): WebGLErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'WebGL context error',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log gracefully as a warning instead of uncaught exception
    console.warn('[WebGLErrorBoundary] WebGL rendering error intercepted gracefully:', error.message);
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default WebGLErrorBoundary;
