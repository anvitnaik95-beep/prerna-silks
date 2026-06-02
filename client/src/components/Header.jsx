import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import API from '../services/api';

const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const WishIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const CartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const AdminIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const MenuIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const ChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const CloseIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SwitchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>;
const LogoutIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

function Avatar({ name }) {
  const initial = (name || 'U').charAt(0).toUpperCase();
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: '0.95rem', letterSpacing: 0,
      flexShrink: 0, boxShadow: '0 2px 6px rgba(27,42,74,0.2)'
    }}>
      {initial}
    </div>
  );
}

export default function Header({ onSearch }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const notifModalRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifOpen && notifModalRef.current && !notifModalRef.current.contains(e.target) && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      API.get('/notifications/unread-count').then(({ data }) => {
        if (data.success) setNotifCount(data.count);
      }).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const openNotifications = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening) {
      try {
        const [notifData, countData] = await Promise.all([
          API.get('/notifications'),
          API.get('/notifications/unread-count')
        ]);
        if (notifData.data.success) setNotifications(notifData.data.notifications);
        if (countData.data.success) setNotifCount(countData.data.count);
      } catch {}
    }
  };

  const markAllRead = async () => {
    try {
      await API.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setNotifCount(0);
    } catch {}
  };

  const clearNotifications = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await API.delete('/notifications/clear');
      setNotifications([]);
      setNotifCount(0);
    } catch {}
  };

  const handleSearch = (e) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
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
            <Link to="/" className="header-btn">Catalogue</Link>
            <Link to="/partner-program" className="header-btn">Partners</Link>
            <Link to="/bulk-inquiry" className="header-btn">Bulk Order</Link>
            {user && <Link to="/wishlist" className="header-btn"><WishIcon />Wishlist</Link>}
            {user ? (
              <>
                {isAdmin() && <Link to="/admin/dashboard" className="header-btn"><AdminIcon />Admin</Link>}
                {!isAdmin() && <Link to="/my-payments" className="header-btn">Checkout</Link>}
                {/* Notification Bell for all logged-in users */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                  <button onClick={openNotifications} className="header-btn" style={{ position: 'relative', padding: '8px 10px' }}>
                    <BellIcon />
                    {notifCount > 0 && (
                      <span style={{
                        position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16,
                        borderRadius: 8, background: 'var(--danger)', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: '0 4px', lineHeight: 1
                      }}>
                        {notifCount > 9 ? '9+' : notifCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div ref={notifModalRef} style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 10,
                    background: 'var(--bg-card)', borderRadius: 12, width: 380,
                    maxHeight: '70vh', boxShadow: '0 12px 50px rgba(0,0,0,0.18)',
                    border: '1px solid var(--border)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', zIndex: 5000
                  }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>Notifications</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {notifCount > 0 && (
                          <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={clearNotifications} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                            Clear all
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} onClick={() => { navigate(n.link || '#'); setNotifOpen(false); }}
                            style={{
                              padding: '14px 18px', borderBottom: '1px solid var(--border)',
                              cursor: 'pointer', transition: 'background 0.15s',
                              background: n.read ? 'var(--bg-card)' : 'rgba(200,169,94,0.08)',
                              display: 'flex', alignItems: 'flex-start', gap: 10
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                            onMouseLeave={e => e.currentTarget.style.background = n.read ? 'var(--bg-card)' : 'rgba(200,169,94,0.08)'}
                          >
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                              background: n.read ? 'var(--text-muted)' : 'var(--gold)'
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', marginBottom: 2 }}>{n.title}</div>
                              {n.message && <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{n.message}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Profile Avatar */}
                <div ref={profileRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 12px 6px 6px', borderRadius: 30,
                      background: profileOpen ? 'rgba(27,42,74,0.06)' : 'transparent',
                      border: `1.5px solid ${profileOpen ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                      fontFamily: 'var(--font-body)', color: 'var(--text)'
                    }}
                    onMouseEnter={e => { if (!profileOpen) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(27,42,74,0.03)'; } }}
                    onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    <Avatar name={user.name} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                    <ChevronDown />
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                      <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 10,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      boxShadow: '0 12px 40px rgba(27,42,74,0.15)',
                      borderRadius: 12, width: 280, padding: 0, zIndex: 1100,
                      overflow: 'hidden'
                    }}>
                      <div style={{ padding: '20px 20px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <Avatar name={user.name} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>{user.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', wordBreak: 'break-all' }}>{user.email}</div>
                            {user.phone && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.phone}</div>}
                          </div>
                        </div>
                        <div style={{
                          display: 'inline-block', marginTop: 10, padding: '3px 10px',
                          background: 'rgba(200,169,94,0.12)', color: 'var(--gold)',
                          borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                          letterSpacing: '0.5px', textTransform: 'uppercase'
                        }}>
                          {isAdmin() ? 'Administrator' : 'Customer'}
                        </div>
                      </div>

                      <div style={{ padding: '12px' }}>
                        <button
                          onClick={handleSwitchAccount}
                          style={{
                            width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                            background: 'transparent', border: 'none', borderRadius: 8,
                            cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text)',
                            fontFamily: 'var(--font-body)', transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ color: 'var(--gold)' }}><SwitchIcon /></span>
                          Switch Account
                        </button>

                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                            background: 'transparent', border: 'none', borderRadius: 8,
                            cursor: 'pointer', fontSize: '0.88rem', color: 'var(--danger)',
                            fontFamily: 'var(--font-body)', transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,40,40,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <LogoutIcon />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="header-btn" style={{ background: 'var(--primary)', color: '#fff', borderRadius: '6px', padding: '8px 18px', fontWeight: 600 }}>
                <UserIcon />Login
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
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)', letterSpacing: '-0.3px' }}>
              PRERNA <span style={{ color: 'var(--gold)', fontSize: '0.7em', letterSpacing: '2px' }}>SILKS</span>
            </div>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <Avatar name={user.name} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
              </div>
            )}

            {[
              { label: 'Home', path: '/' },
              ...(user ? [
                { label: 'Wishlist', path: '/wishlist' },
                ...(!isAdmin() ? [{ label: 'My Payments', path: '/my-payments' }] : []),
                ...(isAdmin() ? [{ label: 'Admin Dashboard', path: '/admin/dashboard' }] : []),
              ] : [
                { label: 'Login', path: '/login' },
                { label: 'Register', path: '/register' },
              ]),
            ].map(({ label, path }) => (
              <button key={path} onClick={() => go(path)}
                style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: 'var(--text)', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'background 0.15s' }}
                onMouseOver={e => e.target.style.background = 'var(--border)'}
                onMouseOut={e => e.target.style.background = 'transparent'}
              >{label}</button>
            ))}

            {user && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 15, paddingTop: 15, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: 16, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Account</span>

                <button onClick={handleSwitchAccount}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: 'var(--text)', fontFamily: 'var(--font-body)' }}
                >
                  <span style={{ color: 'var(--gold)' }}><SwitchIcon /></span> Switch Account
                </button>

                <button onClick={handleLogout}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: 'var(--danger)', fontFamily: 'var(--font-body)', marginTop: 10 }}
                >
                  <LogoutIcon /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}