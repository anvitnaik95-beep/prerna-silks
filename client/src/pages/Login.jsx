import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data.user, data.token, rememberMe);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--primary)', lineHeight: 1 }}>
              PRERNA
              <small style={{ display: 'block', fontSize: '0.4em', letterSpacing: '4px', fontWeight: 400, color: 'var(--gold)', marginTop: 4, fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>SILKS</small>
            </div>
          </Link>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', textAlign: 'center', marginBottom: 8, fontSize: '1.6rem', fontWeight: 400 }}>Welcome Back</h2>
        <p className="subtitle" style={{ color: 'var(--text-light)', marginBottom: 28, fontSize: '0.9rem' }}>Please login to your account</p>

        {error && <div style={{ background: 'rgba(198,40,40,0.1)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 4, fontSize: '0.88rem', marginBottom: 20, border: '1px solid rgba(198,40,40,0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label className="form-label" style={{ fontWeight: 500, color: 'var(--text)' }}>Email Address</label>
            <input type="email" className="form-control" style={{ padding: '10px 14px' }} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 500, color: 'var(--text)' }}>Password</label>
            <input type="password" className="form-control" style={{ padding: '10px 14px' }} value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              id="rememberMe"
              checked={rememberMe} 
              onChange={e => setRememberMe(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: '0.88rem', color: 'var(--text-light)', cursor: 'pointer', userSelect: 'none' }}>
              Remember me for 7 days
            </label>
          </div>
          <button type="submit" className="btn-buy" style={{ width: '100%', padding: '12px', fontSize: '0.95rem', letterSpacing: '1px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-light)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Create one</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
