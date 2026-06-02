import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BoxIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const TruckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const DocIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fmt = v => `₹${Number(v).toLocaleString('en-IN')}`;

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (order) => {
    const orderIdShort = order.id?.slice(-8).toUpperCase() || 'N/A';
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - Order #${orderIdShort}</title>
  <style>
    body { font-family: 'Outfit', 'Inter', -apple-system, sans-serif; color: #333; padding: 40px 20px; line-height: 1.6; background-color: #fcfcfc; }
    .receipt-container { max-width: 650px; margin: 0 auto; border: 1px solid #eaeaea; padding: 40px; border-radius: 16px; background-color: #ffffff; box-shadow: 0 8px 30px rgba(0,0,0,0.04); }
    .header { text-align: center; border-bottom: 2px solid #1B2A4A; padding-bottom: 20px; margin-bottom: 24px; }
    .brand-name { font-size: 28px; font-weight: 700; color: #1B2A4A; letter-spacing: 2px; }
    .brand-sub { font-size: 11px; color: #C8A95E; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px; }
    .title { font-size: 20px; margin-top: 15px; font-weight: 600; color: #333; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 14px; background: #fafafa; padding: 18px; border-radius: 8px; border: 1px solid #f0f0f0; }
    .grid-label { color: #666; font-weight: 500; }
    .grid-value { font-weight: 600; text-align: right; color: #111; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 25px; }
    .items-table th { background: #1B2A4A; color: #fff; padding: 12px; font-size: 14px; text-align: left; font-weight: 500; }
    .items-table td { padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #444; }
    .total-section { font-size: 20px; font-weight: 700; color: #1B2A4A; border-top: 2px dashed #eaeaea; padding-top: 15px; text-align: right; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="brand-name">PRERNA SILKS</div>
      <div class="brand-sub">CBT HUBLI, KARNATAKA</div>
      <div class="title">PAYMENT RECEIPT</div>
    </div>
    
    <div class="grid">
      <div class="grid-label">Order ID</div>
      <div class="grid-value">#${order.id?.toUpperCase()}</div>
      
      <div class="grid-label">Date</div>
      <div class="grid-value">${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      
      <div class="grid-label">Payment Method</div>
      <div class="grid-value">${order.payment_method}</div>
      
      <div class="grid-label">Payment Status</div>
      <div class="grid-value" style="color: ${order.payment_status === 'Paid' ? '#28a745' : '#dc3545'}">${order.payment_status}</div>
      
      <div class="grid-label">Delivery Status</div>
      <div class="grid-value">${order.status}</div>

      <div class="grid-label">Shipping Address</div>
      <div class="grid-value" style="font-weight: normal; font-size: 13px; color: #444;">${order.shipping_address || order.address}</div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 100px;">Price</th>
          <th style="text-align: right; width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(order.items || []).map(it => `
          <tr>
            <td style="font-weight: 500;">${it.product_name}</td>
            <td style="text-align: center;">${it.quantity}</td>
            <td style="text-align: right;">₹${Number(it.price).toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-weight: 600;">₹${Number(it.price * it.quantity).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total-section">
      Total Paid: ₹${Number(order.total_amount).toLocaleString('en-IN')}
    </div>
    
    <div class="footer">
      Thank you for shopping at Prerna Silks!<br>
      For queries, reach out at CBT Hubli or call us.<br>
      This is a system generated e-receipt and requires no physical signature.
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${orderIdShort}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '2rem', marginBottom: 30, fontWeight: 400, display: 'flex', alignItems: 'center', gap: 12 }}>
          <BoxIcon /> My Order History
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: 10 }}>Loading your order history...</p>
          </div>
        ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--bg-card)', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 20, opacity: 0.4, color: 'var(--primary)' }}><BoxIcon /></div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', marginBottom: 8, fontWeight: 400 }}>No Orders Placed Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Explore our premium collections to place your first order!</p>
            <button className="btn-buy" style={{ padding: '12px 30px', fontSize: '1rem' }} onClick={() => navigate('/')}>
              Browse Sarees
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {orders.map(order => {
              const orderIdShort = order.id?.slice(-8).toUpperCase() || 'N/A';
              const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
              
              return (
                <div key={order.id} style={{ background: 'var(--bg-card)', borderRadius: 14, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {/* Top Bar of Order */}
                  <div style={{ background: '#fafafa', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Order ID</span>
                      <strong style={{ color: 'var(--primary)' }}>#{orderIdShort}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Date</span>
                      <strong>{dateStr}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Total</span>
                      <strong style={{ color: 'var(--primary)' }}>{fmt(order.total_amount)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Status</span>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                        background: order.status === 'Delivered' ? '#d4edda' : order.status === 'Cancelled' ? '#f8d7da' : '#fff3cd',
                        color: order.status === 'Delivered' ? '#155724' : order.status === 'Cancelled' ? '#721c24' : '#856404'
                      }}>{order.status}</span>
                    </div>
                  </div>

                  {/* Body details */}
                  <div style={{ padding: 24 }}>
                    <div className="myorders-detail-grid">
                      {/* Products detail */}
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 12 }}>Items Purchased</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {order.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem' }}>
                              <div>
                                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{it.product_name}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: 8 }}>× {it.quantity}</span>
                              </div>
                              <span style={{ fontWeight: 600 }}>{fmt(it.price * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address & Receipt download */}
                      <div style={{ borderLeft: '1px solid #eee', paddingLeft: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 12 }}>Delivery Details</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                            <strong>Address:</strong> {order.shipping_address || order.address}
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0 }}>
                            <strong>Payment Method:</strong> {order.payment_method} ({order.payment_status})
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {order.status !== 'Cancelled' && (
                            <button 
                              onClick={() => navigate(`/track-order?trackId=${order.tracking_id || ''}`)}
                              className="btn-buy"
                              style={{ 
                                padding: '10px 16px', fontSize: '0.88rem', width: '100%',
                                background: 'var(--gold)', color: '#1B2A4A', display: 'flex', 
                                alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: '600', border: 'none'
                              }}
                            ><TruckIcon /> Track Live Delivery
                            </button>
                          )}
                          <button 
                            onClick={() => downloadReceipt(order)}
                            className="btn-buy"
                            style={{ 
                              padding: '10px 16px', fontSize: '0.88rem', width: '100%',
                              background: 'var(--primary)', color: '#fff', display: 'flex', 
                              alignItems: 'center', justifyContent: 'center', gap: 6
                            }}
                          >
                            <DocIcon /> Download Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
