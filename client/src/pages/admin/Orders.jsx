// Admin Orders
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  useEffect(() => { load(); }, [filter]);
  const load = async () => { try { const { data } = await API.get(`/orders${filter?`?status=${filter}`:''}`); setOrders(data.orders||[]); } catch {} };
  const updateStatus = async (id, status) => { try { await API.put(`/orders/${id}`, { status }); load(); } catch {} };
  const fmt = (v) => `₹${Number(v||0).toLocaleString('en-IN')}`;

  return (
    <div className="admin-layout"><AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1>🧾 Orders</h1>
          <select className="form-select" style={{width:180}} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="">All Orders</option>
            {['Pending','Confirmed','Packed','Shipped','Delivered','Cancelled'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {orders.length===0 ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No orders</td></tr> :
                  orders.map(o=>(
                    <tr key={o.id}>
                      <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>#{String(o.id).padStart(4,'0')}</td>
                      <td>{o.customer_name||'—'}<br/><small style={{color:'var(--text-muted)'}}>{o.customer_email||''}</small></td>
                      <td>{o.items?o.items.length:0} items</td>
                      <td style={{fontWeight:600}}>{fmt(o.total_amount)}</td>
                      <td>{o.payment_method}</td>
                      <td><span className={`badge-status badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                      <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td><select className="form-select form-select-sm" value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} style={{width:130}}>
                        {['Pending','Confirmed','Packed','Shipped','Delivered','Cancelled'].map(s=><option key={s}>{s}</option>)}
                      </select></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
