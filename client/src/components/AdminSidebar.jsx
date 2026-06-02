import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  products: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  orders: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  enquiries: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  customers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  suppliers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  reviews: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  feedback: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  expenses: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  bills: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
};

const navItems = [
  { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/products', icon: 'products', label: 'Products' },
  { path: '/admin/orders', icon: 'orders', label: 'Orders' },
  { path: '/admin/enquiries', icon: 'enquiries', label: 'Enquiries' },
  { path: '/admin/customers', icon: 'customers', label: 'Customers' },
  { path: '/admin/suppliers', icon: 'suppliers', label: 'Suppliers' },
  'divider',
  { path: '/admin/reviews', icon: 'reviews', label: 'Reviews' },
  { path: '/admin/feedback', icon: 'feedback', label: 'Feedback' },
  { path: '/admin/expenses', icon: 'expenses', label: 'Expenses' },
  { path: '/admin/bills', icon: 'bills', label: 'Bills' },
  { path: '/admin/settings', icon: 'settings', label: 'Settings' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const Avatar = ({ name }) => {
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
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
    setProfileOpen(false);
  };

  return (
    <>
      <button
        className="admin-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle admin menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mobileOpen ? (
            <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          ) : (
            <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
          )}
        </svg>
      </button>
      {mobileOpen && (
        <div className="admin-mobile-overlay" onClick={closeMobile} />
      )}
      <aside className={`admin-sidebar ${mobileOpen ? 'admin-sidebar-visible' : ''}`}>
        <div className="sidebar-brand">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',color:'var(--primary)',letterSpacing:'-0.3px',lineHeight:1.2}}>
                PRERNA <span style={{color:'var(--gold)',fontSize:'0.65em',letterSpacing:'2px'}}>SILKS</span>
              </div>
              <small style={{display:'block',letterSpacing:'1.5px',fontSize:'0.6rem'}}>ADMIN PORTAL</small>
            </div>
            <div style={{position:'relative'}}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display:'flex',alignItems:'center',justifyContent:'center',gap:0,
                  width:36,height:36,borderRadius:'50%',
                  background:'transparent',
                  border:`2px solid ${profileOpen ? 'var(--primary)' : 'var(--border)'}`,
                  cursor:'pointer',transition:'all 0.2s',
                  fontFamily:'var(--font-body)',color:'var(--text)',padding:0
                }}
                onMouseEnter={e => { if(!profileOpen){e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.background='rgba(27,42,74,0.03)'} }}
                onMouseLeave={e => { if(!profileOpen){e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='transparent'} }}
              >
                <Avatar name={user?.name} />
              </button>
              {profileOpen && (
                <div style={{
                  position:'absolute',top:'100%',right:0,marginTop:8,
                  background:'var(--bg-card)',border:'1px solid var(--border)',
                  boxShadow:'0 12px 40px rgba(27,42,74,0.15)',
                  borderRadius:12,width:220,padding:0,zIndex:1100,
                  overflow:'hidden'
                }}>
                  <div style={{padding:'16px 16px 12px',background:'var(--bg)',borderBottom:'1px solid var(--border)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <Avatar name={user?.name} />
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,color:'var(--text)',fontSize:'0.85rem'}}>{user?.name}</div>
                        <div style={{fontSize:'0.72rem',color:'var(--text-light)',wordBreak:'break-all'}}>{user?.email}</div>
                      </div>
                    </div>
                    <div style={{display:'inline-block',marginTop:8,padding:'2px 8px',background:'rgba(200,169,94,0.12)',color:'var(--gold)',borderRadius:20,fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.5px',textTransform:'uppercase'}}>Administrator</div>
                  </div>
                  <div style={{padding:'8px'}}>
                    <button onClick={handleSwitchAccount} style={{width:'100%',padding:'10px 12px',display:'flex',alignItems:'center',gap:10,background:'transparent',border:'none',borderRadius:6,cursor:'pointer',fontSize:'0.82rem',color:'var(--text)',fontFamily:'var(--font-body)',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <span style={{color:'var(--gold)'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></span>
                      Switch Account
                    </button>
                    <button onClick={handleLogout} style={{width:'100%',padding:'10px 12px',display:'flex',alignItems:'center',gap:10,background:'transparent',border:'none',borderRadius:6,cursor:'pointer',fontSize:'0.82rem',color:'var(--danger)',fontFamily:'var(--font-body)',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(198,40,40,0.05)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav>
          <ul className="admin-nav">
            {navItems.map((item, i) =>
              item === 'divider' ? <li key={i} style={{ height: 1, background: 'var(--border)', margin: '8px 16px' }} /> : (
                <li key={item.path}>
                  <Link to={item.path} className={location.pathname === item.path ? 'active' : ''} onClick={closeMobile}>
                    <span style={{ opacity: 0.8 }}>{icons[item.icon]}</span> {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}