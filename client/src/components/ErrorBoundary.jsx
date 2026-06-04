import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:40, textAlign:'center', color:'var(--text-muted)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:16, opacity:0.5 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2 style={{ fontFamily:'var(--font-heading)', fontWeight:400, color:'var(--text)' }}>Something went wrong</h2>
          <p style={{ marginBottom:20 }}>An unexpected error occurred. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()} style={{ padding:'12px 28px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)' }}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
