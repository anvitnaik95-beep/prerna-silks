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


            {/* Live Animated Scooty Route Map */}
            {!isCancelled && (
              <div style={{ padding: '0 28px 28px' }}>
                <div style={{
                  background: '#0b132b',
                  borderRadius: 12,
                  border: '1.5px solid var(--gold, #d4af37)',
                  padding: '24px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Glowing background matrix effect */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0.04,
                    backgroundImage: 'radial-gradient(#d4af37 1px, transparent 0)',
                    backgroundSize: '16px 16px',
                    pointerEvents: 'none'
                  }} />

                  <h4 style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--gold, #d4af37)',
                    fontSize: '1rem',
                    margin: '0 0 16px',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    letterSpacing: '0.5px'
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#28a745',
                      boxShadow: '0 0 8px #28a745', animation: 'pulse 1.5s infinite alternate'
                    }} />
                    LIVE DELIVERY TRACKER (Hubli Post Office ➔ Address)
                  </h4>

                  {/* SVG Map Path & Animation */}
                  <div style={{ position: 'relative', width: '100%', height: 180 }}>
                    <svg width="100%" height="100%" viewBox="0 0 700 180" style={{ overflow: 'visible' }}>
                      {/* Grid Roads simulation */}
                      <path d="M 0,90 Q 175,140 350,90 T 700,90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
                      <path d="M 80,0 L 80,180" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                      <path d="M 230,0 L 230,180" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                      <path d="M 380,0 L 380,180" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                      <path d="M 530,0 L 530,180" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />

                      {/* Main Transit Route Line */}
                      <path 
                        id="route-path"
                        d="M 60,110 C 180,30 260,170 380,80 C 480,10 560,150 640,90" 
                        fill="none" 
                        stroke="#2a3b5c" 
                        strokeWidth="5" 
                        strokeLinecap="round" 
                      />

                      {/* Glowing Active Progress Path */}
                      <path 
                        d="M 60,110 C 180,30 260,170 380,80 C 480,10 560,150 640,90" 
                        fill="none" 
                        stroke="var(--gold, #d4af37)" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeDasharray="600"
                        strokeDashoffset={600 - (600 * (Math.max(0, currentStep) / (STATUS_STEPS.length - 1)))}
                        style={{
                          transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          filter: 'drop-shadow(0 0 3px #d4af37)'
                        }}
                      />

                      {/* Milestone Nodes */}
                      {[
                        { x: 60, y: 110, label: 'Hubli Post Office Hub', step: 0 },
                        { x: 200, y: 85, label: 'Confirmed', step: 1 },
                        { x: 350, y: 100, label: 'Dispatched (In Transit)', step: 2 },
                        { x: 500, y: 60, label: 'Out for Delivery', step: 3 },
                        { x: 640, y: 90, label: 'Your Doorstep', step: 4 }
                      ].map((node, idx) => {
                        const isReached = idx <= currentStep;
                        return (
                          <g key={idx}>
                            {/* Outer pulsing glow */}
                            {isReached && (
                              <circle 
                                cx={node.x} cy={node.y} r="10" 
                                fill={idx === currentStep ? '#28a745' : 'var(--gold, #d4af37)'}
                                opacity="0.4"
                                style={{ animation: 'ping 2s infinite' }}
                              />
                            )}
                            <circle 
                              cx={node.x} cy={node.y} 
                              r={idx === 0 || idx === 4 ? "7" : "5"} 
                              fill={isReached ? (idx === currentStep ? '#28a745' : 'var(--gold, #d4af37)') : '#1e293b'} 
                              stroke={isReached ? '#fff' : 'rgba(255,255,255,0.2)'}
                              strokeWidth="1.5"
                            />
                            {/* Label */}
                            <text 
                              x={node.x} y={node.y - 14} 
                              textAnchor="middle" 
                              fill={isReached ? '#ffffff' : 'rgba(255,255,255,0.4)'} 
                              style={{ 
                                fontSize: '0.68rem', 
                                fontWeight: idx === currentStep ? 600 : 400,
                                fontFamily: 'var(--font-body)',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                              }}
                            >
                              {node.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Dynamic Moving Scooty Marker using CSS Path offset */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none'
                    }}>
                      <div 
                        style={{
                          width: 36,
                          height: 36,
                          background: 'rgba(212, 175, 55, 0.15)',
                          border: '1.5px solid var(--gold, #d4af37)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'absolute',
                          offsetPath: 'path("M 60,110 C 180,30 260,170 380,80 C 480,10 560,150 640,90")',
                          offsetDistance: `${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}%`,
                          offsetRotate: 'auto 90deg',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                          transition: 'offset-distance 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          zIndex: 10
                        }}
                      >
                        {/* Custom Scooty SVG Icon */}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--gold, #d4af37)">
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="18" r="3" />
                          <path d="M6 15h12v-2a2 2 0 0 0-2-2H9.5a2.5 2.5 0 0 1-2.5-2.5V7a2 2 0 0 1 2-2h4" />
                          <path d="M12 9h3l3 4" />
                          <path d="M18 5v4" />
                          <path d="M17 5h2" />
                          <line x1="3" y1="18" x2="1" y2="18" stroke="var(--gold, #d4af37)" strokeWidth="1.5" />
                          <line x1="2" y1="15" x2="0" y2="15" stroke="var(--gold, #d4af37)" strokeWidth="1.5" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Address and Route Info banner */}
                  <div style={{
                    marginTop: 16,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Current Stage Address</span>
                      <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500, marginTop: 2 }}>
                        {currentStep === 0 && 'Hubli Post Office Center'}
                        {currentStep === 1 && 'Prerna Silks hubli HQ'}
                        {currentStep === 2 && 'State Highway transit node'}
                        {currentStep === 3 && 'Hubli Local Delivery Hub'}
                        {currentStep === 4 && (order.shippingAddress || 'Your home address')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Estimated Distance left</span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--gold, #d4af37)', fontWeight: 600, marginTop: 2 }}>
                        {currentStep === 0 && '12.4 km'}
                        {currentStep === 1 && '9.8 km'}
                        {currentStep === 2 && '4.2 km'}
                        {currentStep === 3 && '0.8 km'}
                        {currentStep === 4 && 'Arrived!'}
                      </div>
                    </div>
                  </div>
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
