// Admin sidebar navigation
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navItems = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/products', icon: '👗', label: 'Products' },

  { path: '/admin/orders', icon: '🧾', label: 'Orders' },
  { path: '/admin/enquiries', icon: '💬', label: 'Enquiries' },
  { path: '/admin/customers', icon: '👥', label: 'Customers' },
  { path: '/admin/suppliers', icon: '🚚', label: 'Suppliers' },
  'divider',
  { path: '/admin/reviews', icon: '⭐', label: 'Reviews' },
  { path: '/admin/feedback', icon: '📝', label: 'Feedback' },
  { path: '/admin/expenses', icon: '💸', label: 'Expenses' },
  { path: '/admin/bills', icon: '📄', label: 'Bills' },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },

];

export default function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

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
          <img src="/logo.png" alt="Prerna Silks" style={{ height: '40px', objectFit: 'contain', marginBottom: '10px' }} />
          <small style={{display: 'block', textAlign: 'center'}}>ADMIN PORTAL</small>
        </div>
        <nav>
          <ul className="admin-nav">
            {navItems.map((item, i) =>
              item === 'divider' ? <li key={i} className="divider" /> : (
                <li key={item.path}>
                  <Link to={item.path} className={location.pathname === item.path ? 'active' : ''} onClick={closeMobile}>
                    <span>{item.icon}</span> {item.label}
                  </Link>
                </li>
              )
            )}
            <li><a href="#" onClick={(e) => { e.preventDefault(); logout(); window.location.href = '/'; }}>
              <span>🚪</span> Logout
            </a></li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
