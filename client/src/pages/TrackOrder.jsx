import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Dispatched', 'Shipped', 'Delivered'];

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [trackId, setTrackId] = useState(searchParams.get('trackId') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = v => `₹${Number(v).toLocaleString('en-IN')}`;

  useEffect(() => {
    const id = searchParams.get('trackId');
    if (id) {
      setTrackId(id);
      handleTrack(id);
    }
  }, [searchParams]);

  const handleTrack = async (id) => {
    const searchId = (id || trackId).trim();
    if (!searchId) { setError('Please enter a tracking ID'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const { data } = await API.get(`/orders/track/${searchId}`);
      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Order not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found with this tracking ID');
    }
    setLoading(false);
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'Cancelled';

  return (
    <>
      <Header />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '1.8rem', marginBottom: 8, fontWeight: 400, textAlign: 'center' }}>
          Track Your Order
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.92rem' }}>
          Enter your tracking ID to check delivery status
        </p>

        {/* Search Box */}
        <div style={{ display: 'flex', gap: 12, maxWidth: 500, margin: '0 auto 40px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Tracking ID (e.g. PS1A2B3C4D)"
            value={trackId}
            onChange={e => setTrackId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            style={{ flex: 1, padding: '12px 16px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', minWidth: 200 }}
          />
          <button
            className="btn-buy"
            onClick={() => handleTrack()}
            disabled={loading}
            style={{ padding: '12px 28px', fontSize: '0.95rem', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </div>

        {error && (
          <div style={{
            textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12,
            boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontWeight: 400, marginBottom: 8 }}>{error}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Please check the tracking ID and try again.</p>
          </div>
        )}

        {/* Order Tracking Result */}
        {order && (
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: isCancelled ? '#f8d7da' : '#f0fdf4', padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Status</span>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 400, margin: '4px 0 0',
                    color: isCancelled ? '#721c24' : order.status === 'Delivered' ? '#155724' : 'var(--primary)'
                  }}>
                    {isCancelled ? 'Order Cancelled' : order.status}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Tracking ID</span>
                  <strong style={{ fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--primary)' }}>{order.trackingId}</strong>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            {!isCancelled && (
              <div style={{ padding: '28px 28px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 20 }}>
                  {/* Progress Line */}
                  <div style={{
                    position: 'absolute', top: 14, left: '10%', right: '10%', height: 3,
                    background: 'var(--border)', borderRadius: 2
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: 'linear-gradient(90deg, var(--primary), var(--gold))',
                      width: `${Math.max(0, currentStep) / (STATUS_STEPS.length - 1) * 100}%`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>

                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i <= currentStep ? 'var(--primary)' : '#fff',
                        border: `2px solid ${i <= currentStep ? 'var(--primary)' : 'var(--border)'}`,
                        color: i <= currentStep ? '#fff' : 'var(--text-muted)',
                        fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.3s'
                      }}>
                        {i <= currentStep ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (i + 1)}
                      </div>
                      <span style={{
                        fontSize: '0.72rem', marginTop: 8, color: i <= currentStep ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: i === currentStep ? 600 : 400, textAlign: 'center'
                      }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Details */}
            <div style={{ padding: '0 28px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px 24px', background: '#fafafa', padding: 20, borderRadius: 10 }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order ID</span>
                  <div style={{ fontWeight: 600 }}>#{order.orderId}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Service</span>
                  <div style={{ fontWeight: 600 }}>{order.deliveryService}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Delivery</span>
                  <div style={{ fontWeight: 600, color: '#28a745' }}>{order.estimatedDelivery}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount</span>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmt(order.totalAmount)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment</span>
                  <div style={{ fontWeight: 600 }}>{order.paymentMethod} ({order.paymentStatus})</div>
                </div>
                {order.dispatchedAt && (
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dispatched On</span>
                    <div style={{ fontWeight: 600 }}>{order.dispatchedAt}</div>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shipping Address</span>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{order.shippingAddress}</div>
                </div>
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Items</h4>
                  {order.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                      <span>{it.product_name} x {it.quantity}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
