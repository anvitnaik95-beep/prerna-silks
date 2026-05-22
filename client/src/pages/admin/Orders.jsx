// Admin Orders
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  useEffect(() => { load(); }, [filter]);
  const load = async () => { 
    try { 
      const { data } = await API.get(`/orders${filter ? `?status=${filter}` : ''}`); 
      setOrders(data.orders || []); 
    } catch {} 
  };
  
  const updateStatus = async (id, status) => { 
    try { 
      await API.put(`/orders/${id}`, { status }); 
      load(); 
    } catch (err) {
      alert('Failed to update status');
    } 
  };
  
  const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  const statusList = ['Pending', 'Confirmed', 'Dispatched', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 400, color: 'var(--primary)', margin: 0 }}>Orders Portal</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Filter Status:</span>
            <select className="form-select" style={{ width: 180, padding: '8px 12px' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Orders</option>
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="admin-card" style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '16px 20px' }}>Order ID</th>
                  <th style={{ padding: '16px 20px' }}>Customer</th>
                  <th style={{ padding: '16px 20px' }}>Items & Tracking</th>
                  <th style={{ padding: '16px 20px' }}>Amount</th>
                  <th style={{ padding: '16px 20px' }}>Payment</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px' }}>Date</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id} style={{ verticalAlign: 'middle' }}>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                        #{String(o.id).slice(-8).toUpperCase()}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600 }}>{o.customer_name || '—'}</div>
                        <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>{o.customer_email || ''}</small>
                        {o.customer_phone && <small style={{ color: 'var(--text-light)', display: 'block', fontSize: '0.78rem' }}>Phone: {o.customer_phone}</small>}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 500 }}>{o.items ? o.items.length : 0} items</div>
                        <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>
                          Delivery: {o.delivery_service || 'India Post'}
                        </small>
                        {o.tracking_id && (
                          <span style={{ fontSize: '0.75rem', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4, fontFamily: 'monospace' }}>
                            ID: {o.tracking_id}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--primary)' }}>
                        {fmt(o.total_amount)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div>{o.payment_method}</div>
                        <small style={{ 
                          color: o.payment_status === 'Paid' ? 'var(--success)' : 'var(--danger)', 
                          fontWeight: 600, fontSize: '0.78rem' 
                        }}>
                          {o.payment_status}
                        </small>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`badge-status badge-${o.status.toLowerCase()}`} style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                          background: o.status === 'Delivered' ? '#d4edda' : o.status === 'Cancelled' ? '#f8d7da' : '#fff3cd',
                          color: o.status === 'Delivered' ? '#155724' : o.status === 'Cancelled' ? '#721c24' : '#856404'
                        }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Automated via background tracker</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
