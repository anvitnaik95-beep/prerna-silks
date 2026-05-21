// Admin Expenses - Full CRUD
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', category:'Other', amount:0, expense_date:'', payment_method:'Cash', notes:'' });

  useEffect(() => { load(); }, []);
  const load = async () => { try { const { data } = await API.get('/expenses'); setItems(data.expenses||[]); } catch {} };
  const set = (k,v) => setForm({...form,[k]:v});
  const fmt = (v) => `₹${Number(v||0).toLocaleString('en-IN')}`;
  const total = items.reduce((s,e)=>s+Number(e.amount),0);

  const save = async () => {
    if (!form.title||!form.amount) { alert('Title & Amount required'); return; }
    try { await API.post('/expenses', {...form, amount:Number(form.amount)}); setShowModal(false); load(); } catch { alert('Failed'); }
  };
  const del = async (id) => { if(!confirm('Delete?'))return; try{await API.delete(`/expenses/${id}`);load();}catch{} };

  return (
    <div className="admin-layout"><AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1>💸 Expenses</h1><button className="btn-buy" onClick={()=>{setForm({title:'',category:'Other',amount:0,expense_date:new Date().toISOString().split('T')[0],payment_method:'Cash',notes:''});setShowModal(true);}}>+ Add Expense</button></div>

        <div className="stats-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(239,68,68,0.1)',color:'#EF4444'}}>💸</div><div><h3>{fmt(total)}</h3><p>Total Expenses</p></div></div>
          <div className="stat-card"><div className="stat-icon" style={{background:'rgba(59,130,246,0.1)',color:'#3B82F6'}}>📊</div><div><h3>{items.length}</h3><p>Total Entries</p></div></div>
        </div>

        <div className="admin-card">
          <table className="table table-hover mb-0">
            <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Payment</th><th>Actions</th></tr></thead>
            <tbody>
              {items.length===0 ? <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No expenses</td></tr> :
                items.map(e=><tr key={e.id}><td><strong>{e.title}</strong></td><td>{e.category}</td><td style={{fontWeight:600,color:'var(--danger)'}}>{fmt(e.amount)}</td><td>{new Date(e.expense_date).toLocaleDateString()}</td><td>{e.payment_method}</td>
                  <td><button className="btn btn-outline-danger btn-sm" onClick={()=>del(e.id)}>🗑️</button></td></tr>)
              }
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={()=>setShowModal(false)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <h2>Add Expense</h2>
              <div className="mb-2"><label className="form-label fw-bold">Title *</label><input className="form-control" value={form.title} onChange={e=>set('title',e.target.value)} /></div>
              <div className="row g-2 mb-2">
                <div className="col-6"><label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e=>set('category',e.target.value)}>
                    {['Rent','Salary','Electricity','Transport','Marketing','Packaging','Maintenance','Other'].map(c=><option key={c}>{c}</option>)}
                  </select></div>
                <div className="col-6"><label className="form-label fw-bold">Amount *</label><input type="number" className="form-control" value={form.amount} onChange={e=>set('amount',e.target.value)} /></div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6"><label className="form-label">Date</label><input type="date" className="form-control" value={form.expense_date} onChange={e=>set('expense_date',e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Payment Method</label><input className="form-control" value={form.payment_method} onChange={e=>set('payment_method',e.target.value)} /></div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn-buy" onClick={save}>Save</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
