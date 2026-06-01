// Admin Dashboard
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const IconBox = ({ icon, ...props }) => <span {...props}>{icon}</span>;
const SareeIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>;
const OrderIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const RevenueIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const UsersIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const AlertIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ChartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;

const fmt = (v) => `₹${Number(v||0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const { data } = await API.get('/admin/dashboard'); setStats(data.stats); } catch {}
  };

  const s = stats || {};
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ChartIcon /> Dashboard</h1></div>

        <div className="stats-grid">
          {[
            { icon:<SareeIcon />, val:s.totalProducts||0, label:'Total Sarees', bg:'rgba(27,42,74,0.1)', color:'var(--primary)' },
            { icon:<OrderIcon />, val:s.ordersToday||0, label:'Orders Today', bg:'rgba(59,130,246,0.1)', color:'#3B82F6' },
            { icon:<RevenueIcon />, val:fmt(s.monthlyRevenue), label:'Monthly Revenue', bg:'rgba(16,185,129,0.1)', color:'#10B981' },
            { icon:<UsersIcon />, val:s.totalCustomers||0, label:'Customers', bg:'rgba(245,158,11,0.1)', color:'#F59E0B' },
            { icon:<AlertIcon />, val:s.lowStock||0, label:'Low Stock', bg:'rgba(239,68,68,0.1)', color:'#EF4444' },
          ].map((c,i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon" style={{ background:c.bg, color:c.color }}>{c.icon}</div>
              <div><h3>{c.val}</h3><p>{c.label}</p></div>
            </div>
          ))}
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="admin-card">
              <div className="admin-card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ChartIcon /> Sales Trend</h3></div>
              <div style={{ padding:18 }}>
                {(s.salesData||[]).length === 0 ? <p style={{color:'var(--text-muted)',textAlign:'center',padding:30}}>No sales data yet</p> :
                  (s.salesData||[]).map((d,i) => {
                    const max = Math.max(...(s.salesData||[]).map(x=>x.revenue),1);
                    return (
                      <div key={i} className="d-flex align-items-center gap-2 mb-2">
                        <span style={{width:60,fontSize:'0.75rem',color:'var(--text-muted)',textAlign:'right'}}>{d.month}</span>
                        <div style={{height:24,borderRadius:4,background:'linear-gradient(90deg,var(--primary),var(--primary-light))',width:`${Math.max((d.revenue/max)*100,5)}%`,minWidth:20}}></div>
                        <span style={{fontSize:'0.75rem',fontWeight:600}}>{fmt(d.revenue)}</span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="admin-card">
              <div className="admin-card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> Categories</h3></div>
              <div style={{ padding:18 }}>
                {(s.categories||[]).map((c,i) => {
                  const max = Math.max(...(s.categories||[]).map(x=>x.count),1);
                  return (
                    <div key={i} className="d-flex align-items-center gap-2 mb-2">
                      <span style={{width:70,fontSize:'0.75rem',textAlign:'right'}}>{c.category||'Other'}</span>
                      <div style={{height:22,borderRadius:4,background:'linear-gradient(90deg,var(--gold),var(--gold-light))',width:`${Math.max((c.count/max)*100,10)}%`}}></div>
                      <span style={{fontSize:'0.75rem',fontWeight:600}}>{c.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="admin-card">
              <div className="admin-card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Recent Orders</h3></div>
              <table className="table table-sm mb-0">
                <thead><tr><th>ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {(s.recentOrders||[]).length === 0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:20,color:'var(--text-muted)'}}>No orders</td></tr> :
                    (s.recentOrders||[]).map(o => (
                      <tr key={o.id}><td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>#{String(o.id).padStart(4,'0')}</td><td>{o.customer_name}</td><td>{fmt(o.total_amount)}</td>
                        <td><span className={`badge-status badge-${o.status.toLowerCase()}`}>{o.status}</span></td></tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-md-6">
            <div className="admin-card">
              <div className="admin-card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Low Stock</h3></div>
              <table className="table table-sm mb-0">
                <thead><tr><th>Product</th><th>Stock</th><th>Category</th></tr></thead>
                <tbody>
                  {(s.lowStockProducts||[]).length === 0 ? <tr><td colSpan={3} style={{textAlign:'center',padding:20,color:'var(--text-muted)'}}>All stocked</td></tr> :
                    (s.lowStockProducts||[]).map(p => (
                      <tr key={p.id}><td>{p.name}</td><td style={{color:p.stock<=2?'var(--danger)':'var(--warning)',fontWeight:700}}>{p.stock}</td><td>{p.category}</td></tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
