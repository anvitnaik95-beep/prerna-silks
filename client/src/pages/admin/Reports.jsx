// Admin Reports
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const ChartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const RupeeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

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
        <div className="admin-header"><h1><ChartIcon /> Reports & Analysis</h1></div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(16,185,129,0.1)',color:'#10B981'}}><RupeeIcon /></div><div><h3>{fmt(totalRev)}</h3><p>Total Revenue</p></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(239,68,68,0.1)',color:'#EF4444'}}><RupeeIcon /></div><div><h3>{fmt(totalExp)}</h3><p>Total Expenses</p></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(27,42,74,0.1)',color:'var(--primary)'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div><div><h3 style={{color:profit>=0?'var(--success)':'var(--danger)'}}>{fmt(profit)}</h3><p>Profit</p></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(245,158,11,0.1)',color:'#F59E0B'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div><div><h3>{fmt(Math.round(totalRev*0.18))}</h3><p>Est. GST (18%)</p></div></div>
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
