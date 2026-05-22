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
                          Delivery: {o.delivery_service || 'XpressBees'}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          {o.customer_phone ? (
                            <button
                              onClick={() => {
                                const orderId = String(o.id).slice(-8).toUpperCase();
                                const siteUrl = window.location.origin;
                                const trackUrl = `${siteUrl}/track-order?trackId=${o.tracking_id || ''}`;
                                
                                let messageText = '';
                                if (o.status === 'Confirmed' || o.status === 'Pending') {
                                  messageText = `Hello ${o.customer_name || 'Customer'}! Your order #${orderId} from Prerna Silks has been successfully confirmed. Total Amount: ${fmt(o.total_amount)}. It will be dispatched shortly via XpressBees.\n\nTrack your order here:\n${trackUrl}\n\nThank you for shopping with us!`;
                                } else if (o.status === 'Dispatched' || o.status === 'Shipped') {
                                  messageText = `Hello ${o.customer_name || 'Customer'}! Your order #${orderId} from Prerna Silks has been dispatched via XpressBees. Tracking ID: ${o.tracking_id || 'XB' + Date.now().toString(36).toUpperCase()}.\n\nTrack your shipment live here:\n${trackUrl}\n\nYour order is on the way!`;
                                } else if (o.status === 'Delivered') {
                                  messageText = `Hello ${o.customer_name || 'Customer'}! Good news! Your order #${orderId} from Prerna Silks has been successfully delivered. We hope you love your new saree!\n\nTrack history:\n${trackUrl}\n\nThank you for choosing Prerna Silks!`;
                                } else {
                                  messageText = `Hello ${o.customer_name || 'Customer'}! This is an update regarding your order #${orderId} at Prerna Silks. Current status: ${o.status}.\n\nTrack here:\n${trackUrl}`;
                                }
                                
                                // Format phone number
                                let rawPhone = String(o.customer_phone).replace(/[^0-9]/g, '');
                                if (rawPhone.length === 10) rawPhone = '91' + rawPhone;
                                
                                const whatsappUrl = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(messageText)}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                              className="btn btn-sm btn-success"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#25D366',
                                border: 'none',
                                color: '#fff',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.82rem'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#20ba5a'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.936 9.936 0 0 0 4.777 1.218h.004c5.505 0 9.989-4.478 9.99-9.985A9.984 9.984 0 0 0 12.012 2zm5.776 14.15c-.247.697-1.427 1.272-1.96 1.353-.483.073-.979.135-2.738-.574-2.247-.905-3.69-3.197-3.803-3.348-.112-.15-1.008-1.341-1.008-2.558 0-1.217.638-1.816.863-2.062.225-.246.491-.307.656-.307.164 0 .328.001.472.008.152.007.355-.057.555.426.2.49.684 1.662.743 1.782.059.12.098.261.018.421-.079.16-.118.259-.236.397-.118.137-.247.307-.354.412-.119.117-.243.245-.105.483.137.237.61 1.008 1.31 1.63.9.8 1.66 1.047 1.897 1.167.236.118.375.1.514-.06.137-.16.594-.693.754-.928.16-.235.319-.198.535-.118.217.079 1.372.648 1.61.766.237.118.396.177.455.277.06.1.06.579-.187 1.276z"/>
                              </svg>
                              Free WhatsApp Update
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No Phone Provided</span>
                          )}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Auto background job running</span>
                        </div>
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
