// Admin sidebar navigation
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/products', icon: '👗', label: 'Products' },
  { path: '/admin/orders', icon: '🧾', label: 'Orders' },
  { path: '/admin/customers', icon: '👥', label: 'Customers' },
  { path: '/admin/suppliers', icon: '🚚', label: 'Suppliers' },
  'divider',
  { path: '/admin/reports', icon: '📈', label: 'Reports' },
  { path: '/admin/reviews', icon: '⭐', label: 'Reviews' },
  { path: '/admin/feedback', icon: '📝', label: 'Feedback' },
  { path: '/admin/expenses', icon: '💸', label: 'Expenses' },
  { path: '/admin/bills', icon: '📄', label: 'Bills' },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  'divider',
  { path: '/', icon: '🏠', label: 'View Store' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Prerna Silks" style={{ height: '40px', objectFit: 'contain', marginBottom: '10px' }} />
        <small style={{display: 'block', textAlign: 'center'}}>ADMIN PORTAL</small>
      </div>
      <nav>
        <ul className="admin-nav">
          {navItems.map((item, i) =>
            item === 'divider' ? <li key={i} className="divider" /> : (
              <li key={item.path}>
                <Link to={item.path} className={location.pathname === item.path ? 'active' : ''}>
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
  );
}
