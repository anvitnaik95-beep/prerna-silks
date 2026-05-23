import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>;
const WishIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>;
const CartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>;
const AdminIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>;
const MenuIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>;
const CloseIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
// const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.59 4.59A2 2 0 1 1 11 8H9m10.59 11.41A2 2 0 1 1 18 16h2M6 18H4a2 2 0 1 1 2-2v2zm12-8h2a2 2 0 1 1-2 2v-2zm-6 2v-2a2 2 0 1 1 2 2h-2zm-2 2H6m2-8H6a2 2 0 1 1 2-2v2zm-2 2v2" /></svg>;

export default function Header({ onSearch }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const active = document.body.classList.contains('dark-theme');
    setDarkMode(active);
  }, []);

  const handleSearch = (e) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
    setSettingsOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setSettingsOpen(false);
    setMenuOpen(false);
  };

  const go = (path) => { navigate(path); setMenuOpen(false); };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="logo-container" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div className="logo">
              PRERNA
              <small style={{ fontSize: '0.45em', letterSpacing: '3px', fontWeight: '400', color: 'var(--gold)', display: 'inline', marginLeft: '6px' }}>SILKS</small>
            </div>
          </Link>

          {/* Search */}
          <div className="search-bar">
            <span className="icon"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search sarees by name, category..."
              value={searchVal}
              onChange={handleSearch}
            />
          </div>

          {/* Desktop Nav */}
          <div className="header-actions header-desktop" style={{ position: 'relative' }}>
            {user && <Link to="/wishlist" className="header-btn"><WishIcon /><span>Wishlist</span></Link>}
            {user && <Link to="/cart" className="header-btn"><CartIcon /><span>Cart</span></Link>}
            {user && <Link to="/my-orders" className="header-btn"><UserIcon /><span>My Orders</span></Link>}
            {user ? (
              <>
                {isAdmin() && <Link to="/admin/dashboard" className="header-btn"><AdminIcon /><span>Admin</span></Link>}
                <button 
                  className={`header-btn ${settingsOpen ? 'active' : ''}`} 
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  style={{ gap: 6 }}
                >
                  <SettingsIcon /><span>Settings</span>
                </button>

                {/* Dropdown Menu */}
                {settingsOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 12,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.1))',
                    borderRadius: 12, width: 260, padding: 18, zIndex: 1100,
                    display: 'flex', flexDirection: 'column', gap: 14
                  }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Logged in as</span>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem', marginTop: 2 }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', wordBreak: 'break-all' }}>{user.email}</div>
                    </div>

                    {/* Dark/Light mode */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Dark Theme</span>
                      <button 
                        onClick={toggleTheme} 
                        style={{
                          background: darkMode ? 'var(--primary)' : '#e0e0e0',
                          border: 'none', borderRadius: 20, width: 44, height: 22,
                          position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, background: '#fff', borderRadius: '50%',
                          position: 'absolute', top: 3, left: darkMode ? 25 : 3,
                          transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>

                    <button 
                      onClick={handleSwitchAccount}
                      style={{
                        padding: '10px 14px', background: 'rgba(212,175,96,0.1)', border: '1px solid var(--gold)',
                        borderRadius: 8, color: 'var(--text)', fontSize: '0.88rem', fontWeight: 600,
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,96,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,96,0.1)'}
                    >
                      🔄 Switch Account
                    </button>

                    <button 
                      onClick={handleLogout}
                      style={{
                        padding: '10px 14px', background: 'var(--primary)', border: 'none',
                        borderRadius: 8, color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="header-btn" style={{ background: 'var(--primary)', color: '#fff', borderRadius: '4px', padding: '8px 18px' }}>
                <UserIcon /><span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text)' }}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '280px', height: '100%', background: 'var(--bg)', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              PRERNA <span style={{ color: 'var(--gold)', fontSize: '0.7em', letterSpacing: '2px' }}>SILKS</span>
            </div>
            {[
              { label: '🏠 Home', path: '/' },
              ...(user ? [
                { label: '♡ Wishlist', path: '/wishlist' },
                { label: '🛒 Cart', path: '/cart' },
                { label: '📦 My Orders', path: '/my-orders' },
                ...(isAdmin() ? [{ label: '📊 Admin Dashboard', path: '/admin/dashboard' }] : []),
              ] : [
                { label: '👤 Login', path: '/login' },
                { label: '📝 Register', path: '/register' },
              ]),
            ].map(({ label, path }) => (
              <button key={path} onClick={() => go(path)}
                style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: 'var(--text)', fontFamily: 'var(--font-body)', transition: 'background 0.2s' }}
                onMouseOver={e => e.target.style.background = 'var(--border)'}
                onMouseOut={e => e.target.style.background = 'transparent'}
              >{label}</button>
            ))}

            {user && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 15, paddingTop: 15, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', paddingLeft: 16 }}>⚙️ SYSTEM SETTINGS</span>
                
                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>🌓 {darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                </button>

                <button 
                  onClick={handleSwitchAccount}
                  style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: 'var(--text)' }}
                >
                  🔄 Switch Account
                </button>

                <button 
                  onClick={handleLogout}
                  style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: 'var(--danger)', marginTop: 20 }}
                >
                   Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global CSS Inject for Dark Theme */}
      <style>{`
        body.dark-theme {
          --bg: #121212 !important;
          --text: #f5f5f5 !important;
          --text-light: #cccccc !important;
          --text-muted: #888888 !important;
          --border: #2d2d2d !important;
          --shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
          background-color: var(--bg) !important;
          color: var(--text) !important;
        }
        body.dark-theme .admin-card, 
        body.dark-theme .auth-card, 
        body.dark-theme .site-header,
        body.dark-theme .my-order-card {
          background-color: #1e1e1e !important;
          color: #fff !important;
          border-color: #2d2d2d !important;
        }
        body.dark-theme input,
        body.dark-theme select,
        body.dark-theme textarea {
          background-color: #1e1e1e !important;
          color: #fff !important;
          border-color: #2d2d2d !important;
        }
        body.dark-theme .form-control {
          background-color: #1e1e1e !important;
          color: #fff !important;
          border-color: #2d2d2d !important;
        }
        body.dark-theme table,
        body.dark-theme tr,
        body.dark-theme td,
        body.dark-theme th {
          background-color: #1e1e1e !important;
          color: #fff !important;
          border-color: #2d2d2d !important;
        }
        @media (max-width: 768px) {
          .header-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .search-bar { max-width: 100%; order: 3; flex-basis: 100%; margin-top: 8px; }
          .header-inner { flex-wrap: wrap; padding: 12px 16px; }
        }
      `}</style>
    </>
  );
}
