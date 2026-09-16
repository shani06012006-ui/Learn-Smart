import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../ui/Button";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production this is where you'd send to an error-tracking service.
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-100 p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-danger-500" strokeWidth={1.5} />
          <h1 className="text-lg font-semibold text-ink-900">Something went wrong</h1>
          <p className="max-w-sm text-sm text-ink-500">
            An unexpected error occurred. Reloading the page usually fixes this.
          </p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
