// Admin Reports
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function Reports() {
  const [stats, setStats] = useState({});
  const [expenses, setExpenses] = useState([]);
  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const { data: d } = await API.get('/admin/dashboard');
      const { data: e } = await API.get('/expenses');
      setStats(d.stats||{});
      setExpenses(e.expenses||[]);
    } catch {}
  };
  const fmt = (v) => `₹${Number(v||0).toLocaleString('en-IN')}`;
  const totalExp = expenses.reduce((s,e)=>s+Number(e.amount),0);
  const totalRev = (stats.salesData||[]).reduce((s,d)=>s+Number(d.revenue),0);
  const profit = totalRev - totalExp;

  return (
    <div className="admin-layout"><AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1>📈 Reports & Analysis</h1></div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(16,185,129,0.1)',color:'#10B981'}}>💰</div><div><h3>{fmt(totalRev)}</h3><p>Total Revenue</p></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(239,68,68,0.1)',color:'#EF4444'}}>💸</div><div><h3>{fmt(totalExp)}</h3><p>Total Expenses</p></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(139,26,74,0.1)',color:'var(--primary)'}}>📊</div><div><h3 style={{color:profit>=0?'var(--success)':'var(--danger)'}}>{fmt(profit)}</h3><p>Profit</p></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(245,158,11,0.1)',color:'#F59E0B'}}>🧾</div><div><h3>{fmt(Math.round(totalRev*0.18))}</h3><p>Est. GST (18%)</p></div></div>
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="admin-card"><div className="admin-card-header"><h3>Monthly Revenue</h3></div>
              <div style={{padding:18}}>
                {(stats.salesData||[]).map((d,i)=>{
                  const max=Math.max(...(stats.salesData||[]).map(x=>x.revenue),1);
                  return <div key={i} className="d-flex align-items-center gap-2 mb-2">
                    <span style={{width:70,fontSize:'0.75rem',textAlign:'right'}}>{d.month}</span>
                    <div style={{height:22,borderRadius:4,background:'linear-gradient(90deg,var(--primary),var(--primary-light))',width:`${Math.max((d.revenue/max)*100,5)}%`}}></div>
                    <span style={{fontSize:'0.75rem',fontWeight:600}}>{fmt(d.revenue)}</span>
                  </div>;
                })}
                {(stats.salesData||[]).length===0 && <p style={{textAlign:'center',color:'var(--text-muted)',padding:30}}>No data yet</p>}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="admin-card"><div className="admin-card-header"><h3>Sales Report</h3></div>
              <table className="table table-sm mb-0">
                <thead><tr><th>Month</th><th>Orders</th><th>Revenue</th></tr></thead>
                <tbody>
                  {(stats.salesData||[]).map((d,i)=><tr key={i}><td>{d.month}</td><td>{d.orders}</td><td style={{fontWeight:600}}>{fmt(d.revenue)}</td></tr>)}
                  {(stats.salesData||[]).length===0 && <tr><td colSpan={3} style={{textAlign:'center',padding:20}}>Coming Soon</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
