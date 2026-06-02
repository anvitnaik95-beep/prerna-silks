import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const fmt = v => `₹${Number(v).toLocaleString('en-IN')}`;

export default function MyPayments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/orders/my-payments').then(({ data }) => {
      setOrders(data.orders || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const deletePayment = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await API.delete(`/orders/my-payments/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch {}
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '1.8rem', marginBottom: 8, fontWeight: 400 }}>
          My Payments
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 30, fontSize: '0.95rem' }}>
          Complete payment for your approved enquiries.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div className="spinner-border text-primary" role="status" />
            <p style={{ marginTop: 10 }}>Loading...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--bg-card)', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontWeight: 400, marginBottom: 8 }}>No pending payments</h3>
            <p style={{ color: 'var(--text-muted)' }}>When your enquiry is approved, you will see your payment link here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order.id} style={{ background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    {(order.items || []).map(i => i.product_name).join(', ')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Order #{order.id?.slice(-8).toUpperCase()} · {fmt(order.total_amount)}
                    <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: order.payment_status === 'Paid' ? '#d4edda' : '#fff3cd', color: order.payment_status === 'Paid' ? '#155724' : '#856404' }}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {order.payment_status !== 'Paid' && (
                    <button className="btn-buy" style={{ padding: '10px 24px', fontSize: '0.9rem' }} onClick={() => navigate(`/pay-order/${order.payment_token}`)}>
                      Pay Now
                    </button>
                  )}
                  <button onClick={() => deletePayment(order.id)} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--danger)', borderRadius: 6, color: 'var(--danger)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}