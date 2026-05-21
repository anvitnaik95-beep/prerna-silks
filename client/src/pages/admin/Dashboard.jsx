// Admin Dashboard
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

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
        <div className="admin-header"><h1>📊 Dashboard</h1></div>

        <div className="stats-grid">
          {[
            { icon:'👗', val:s.totalProducts||0, label:'Total Sarees', bg:'rgba(139,26,74,0.1)', color:'var(--primary)' },
            { icon:'🧾', val:s.ordersToday||0, label:'Orders Today', bg:'rgba(59,130,246,0.1)', color:'#3B82F6' },
            { icon:'💰', val:fmt(s.monthlyRevenue), label:'Monthly Revenue', bg:'rgba(16,185,129,0.1)', color:'#10B981' },
            { icon:'👥', val:s.totalCustomers||0, label:'Customers', bg:'rgba(245,158,11,0.1)', color:'#F59E0B' },
            { icon:'⚠️', val:s.lowStock||0, label:'Low Stock', bg:'rgba(239,68,68,0.1)', color:'#EF4444' },
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
              <div className="admin-card-header"><h3>📈 Sales Trend</h3></div>
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
              <div className="admin-card-header"><h3>🏷️ Categories</h3></div>
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
              <div className="admin-card-header"><h3>🧾 Recent Orders</h3></div>
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
              <div className="admin-card-header"><h3>⚠️ Low Stock</h3></div>
              <table className="table table-sm mb-0">
                <thead><tr><th>Product</th><th>Stock</th><th>Category</th></tr></thead>
                <tbody>
                  {(s.lowStockProducts||[]).length === 0 ? <tr><td colSpan={3} style={{textAlign:'center',padding:20,color:'var(--text-muted)'}}>All stocked ✅</td></tr> :
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
