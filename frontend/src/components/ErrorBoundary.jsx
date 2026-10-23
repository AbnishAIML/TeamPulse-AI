import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught unhandled runtime error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#080c18",
            color: "#e8ebf5",
            padding: "24px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              background: "#111729",
              border: "1px solid #362947",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 20px 60px #0008",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "#4a2432",
                color: "#ff8c9c",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h1 style={{ fontSize: "20px", margin: "0 0 8px", color: "#fff" }}>
              Application Encountered an Error
            </h1>
            <p style={{ fontSize: "12px", color: "#9ca5bd", lineHeight: "1.5", margin: "0 0 20px" }}>
              An unexpected condition occurred in the user interface. We've captured the error state to prevent session loss.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: "#090d1a",
                  border: "1px solid #232c44",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "11px",
                  color: "#ff9ca9",
                  textAlign: "left",
                  marginBottom: "24px",
                  overflowX: "auto",
                  fontFamily: "monospace",
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                className="button-primary"
                onClick={this.handleReload}
                style={{ height: "36px", padding: "0 16px" }}
              >
                <RefreshCw size={14} /> Refresh Page
              </button>
              <button
                className="button-secondary"
                onClick={this.handleGoHome}
                style={{ height: "36px", padding: "0 16px" }}
              >
                <Home size={14} /> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
