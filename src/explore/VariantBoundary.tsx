import { Component, type ErrorInfo, type ReactNode } from "react";

// These are rough sketches, and a throw in one layout shouldn't blank the
// whole route — without a boundary the error takes the page down and the
// only symptom is an empty document.

type Props = { children: ReactNode; variantName: string };
type State = { message: string | null };

export class VariantBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Variant crashed:", error, info.componentStack);
  }

  // Reset happens via the `key` on this boundary in Explore — switching
  // variants remounts it, which clears the error without a setState in an
  // update lifecycle.
  render() {
    if (this.state.message) {
      return (
        <div className="variant-error" role="alert">
          <strong>{this.props.variantName} failed to render</strong>
          <code>{this.state.message}</code>
        </div>
      );
    }
    return this.props.children;
  }
}
