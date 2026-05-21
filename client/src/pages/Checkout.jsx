import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Checkout() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [orderResult, setOrderResult] = useState(null); // After successful order
  const navigate = useNavigate();

  const fmt = v => `₹${Number(v).toLocaleString('en-IN')}`;

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    try {
      const { data } = await API.get('/cart');
      if (!data.items || data.items.length === 0) { navigate('/cart'); return; }
      setItems(data.items);
    } catch { navigate('/cart'); }
    finally { setLoading(false); }
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const loadRazorpayScript = () => new Promise(resolve => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const placeOrder = async (paymentMethod, razorpayData = {}) => {
    const orderItems = items.map(i => ({ productId: i.id || i._id || i.productId, name: i.name, price: i.price, quantity: i.quantity }));
    const { data } = await API.post('/orders', {
      items: orderItems,
      totalAmount: total,
      paymentMethod,
      shippingAddress: address,
      customerPhone: phone,
      ...razorpayData
    });
    return data;
  };

  const validatePhone = (num) => {
    const regex = /^(?:\+?91|0)?[6-9]\d{9}$/;
    return regex.test(num.trim());
  };

  // Razorpay Payment Flow
  const handleRazorpayPayment = async () => {
    if (!address.trim()) { alert('Please enter your shipping address'); return; }
    if (!validatePhone(phone)) { alert('Please enter a valid 10-digit phone number'); return; }
    setPaying(true);
    try {
      const { data: orderData } = await API.post('/orders/razorpay/create', { amount: total, currency: 'INR' });
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert('Razorpay failed to load.'); setPaying(false); return; }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Prerna Silks',
        description: `Order of ${items.length} item(s)`,
        order_id: orderData.orderId,
        theme: { color: '#521220' },
        prefill: { contact: phone },
        handler: async (response) => {
          try {
            const result = await placeOrder('Razorpay', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setOrderResult(result);
          } catch { alert('Order failed after payment.'); }
        },
        modal: { ondismiss: () => setPaying(false) }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      alert('Payment initiation failed');
      setPaying(false);
    }
  };

  // COD Flow
  const handleCOD = async () => {
    if (!address.trim()) { alert('Please enter your shipping address'); return; }
    if (!validatePhone(phone)) { alert('Please enter a valid 10-digit phone number'); return; }
    setPaying(true);
    try {
      const result = await placeOrder('COD');
      setOrderResult(result);
    } catch { alert('Order failed'); }
    setPaying(false);
  };

  // Direct UPI Flow has been removed to ensure only programmatically verified payments are processed

  // ============================================================
  // ORDER CONFIRMATION SCREEN (shown after successful order)
  // ============================================================
  if (orderResult) {
    const isPaid = orderResult.paymentStatus === 'Paid';
    const summary = orderResult.orderSummary || {};
    return (
      <>
        <Header />
        <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            textAlign: 'center', border: `2px solid ${isPaid ? '#28a745' : 'var(--gold)'}`
          }}>
            {/* Status Icon */}
            <div style={{ fontSize: '4rem', marginBottom: 10 }}>
              {isPaid ? '✅' : '📦'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: isPaid ? '#28a745' : 'var(--primary)', marginBottom: 8 }}>
              {isPaid ? 'Payment Received!' : 'Order Placed!'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              {isPaid 
                ? 'Your payment has been verified successfully. Your order is confirmed!'
                : 'Your order has been placed. Please pay on delivery.'}
            </p>

            {/* Order Details Card */}
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 24, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                <div><small style={{ color: 'var(--text-muted)' }}>Order ID</small><br/><strong>{summary.id?.slice(-8).toUpperCase() || 'N/A'}</strong></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Payment</small><br/>
                  <strong style={{ color: isPaid ? '#28a745' : '#dc3545' }}>
                    {isPaid ? '✅ Paid' : '⏳ Unpaid (COD)'}
                  </strong>
                </div>
                <div><small style={{ color: 'var(--text-muted)' }}>Method</small><br/><strong>{summary.method || 'N/A'}</strong></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Total Amount</small><br/><strong style={{ color: 'var(--primary)' }}>{fmt(summary.total || 0)}</strong></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Estimated Delivery</small><br/><strong style={{ color: '#28a745' }}>🚚 {orderResult.estimatedDelivery || 'N/A'}</strong></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Shipping To</small><br/><strong>{(summary.address || '').substring(0, 50)}</strong></div>
              </div>

              {/* Items */}
              {summary.items && summary.items.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid #dee2e6', paddingTop: 12 }}>
                  <small style={{ color: 'var(--text-muted)' }}>Items Ordered:</small>
                  {summary.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: 6 }}>
                      <span>{it.product_name} × {it.quantity}</span>
                      <span>{fmt(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Download Receipt Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <button
                onClick={() => {
                  const orderForReceipt = {
                    id: summary.id,
                    created_at: new Date(),
                    payment_method: summary.method,
                    payment_status: isPaid ? 'Paid' : 'Unpaid',
                    status: 'Pending',
                    shipping_address: summary.address,
                    total_amount: summary.total,
                    items: summary.items || []
                  };
                  
                  const orderIdShort = summary.id?.slice(-8).toUpperCase() || 'N/A';
                  
                  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - Order #${orderIdShort}</title>
  <style>
    body { font-family: 'Outfit', 'Inter', -apple-system, sans-serif; color: #333; padding: 40px 20px; line-height: 1.6; background-color: #fcfcfc; }
    .receipt-container { max-width: 650px; margin: 0 auto; border: 1px solid #eaeaea; padding: 40px; border-radius: 16px; background-color: #ffffff; box-shadow: 0 8px 30px rgba(0,0,0,0.04); }
    .header { text-align: center; border-bottom: 2px solid #521220; padding-bottom: 20px; margin-bottom: 24px; }
    .brand-name { font-size: 28px; font-weight: 700; color: #521220; letter-spacing: 2px; }
    .brand-sub { font-size: 11px; color: #D4AF37; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px; }
    .title { font-size: 20px; margin-top: 15px; font-weight: 600; color: #333; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 14px; background: #fafafa; padding: 18px; border-radius: 8px; border: 1px solid #f0f0f0; }
    .grid-label { color: #666; font-weight: 500; }
    .grid-value { font-weight: 600; text-align: right; color: #111; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 25px; }
    .items-table th { background: #521220; color: #fff; padding: 12px; font-size: 14px; text-align: left; font-weight: 500; }
    .items-table td { padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #444; }
    .total-section { font-size: 20px; font-weight: 700; color: #521220; border-top: 2px dashed #eaeaea; padding-top: 15px; text-align: right; }
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
      <div class="grid-value">#${orderForReceipt.id?.toUpperCase()}</div>
      
      <div class="grid-label">Date</div>
      <div class="grid-value">${new Date(orderForReceipt.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      
      <div class="grid-label">Payment Method</div>
      <div class="grid-value">${orderForReceipt.payment_method}</div>
      
      <div class="grid-label">Payment Status</div>
      <div class="grid-value" style="color: ${isPaid ? '#28a745' : '#dc3545'}">${orderForReceipt.payment_status}</div>
      
      <div class="grid-label">Delivery Status</div>
      <div class="grid-value">Pending</div>

      <div class="grid-label">Shipping Address</div>
      <div class="grid-value" style="font-weight: normal; font-size: 13px; color: #444;">${orderForReceipt.shipping_address}</div>
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
        ${(orderForReceipt.items || []).map(it => `
          <tr>
            <td style="font-weight: 500;">${it.product_name || it.name}</td>
            <td style="text-align: center;">${it.quantity}</td>
            <td style="text-align: right;">₹${Number(it.price).toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-weight: 600;">₹${Number(it.price * it.quantity).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total-section">
      Total Paid: ₹${Number(orderForReceipt.total_amount).toLocaleString('en-IN')}
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
                }}
                style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                📄 Download Receipt
              </button>
            </div>

            {/* Continue Shopping */}
            <button
              onClick={() => navigate('/')}
              className="btn-buy"
              style={{ width: '100%', padding: 14, fontSize: '1rem' }}
            >
              🏠 Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // ============================================================
  // CHECKOUT FORM (before order is placed)
  // ============================================================
  if (loading) return (
    <>
      <Header />
      <div style={{ padding: '100px 0', textAlign: 'center' }}>Loading checkout...</div>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      <div className="pd-container" style={{ maxWidth: 900, margin: '40px auto' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', textAlign: 'center', marginBottom: 40 }}>Checkout</h2>
        
        <div className="pd-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
          {/* Left Side: Address & Payment */}
          <div>
            <div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 16 }}>1. Shipping Details</h4>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Full Name, House No, Street, Landmark, City, State, Pincode" 
                value={address} 
                onChange={e => setAddress(e.target.value)}
                style={{ resize: 'none', marginBottom: 12 }}
              />
              <input
                className="form-control"
                type="tel"
                placeholder="Phone Number (for delivery updates & WhatsApp)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: 'var(--shadow)' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 16 }}>2. Payment Method</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="razorpay-btn" onClick={handleRazorpayPayment} disabled={paying}>
                  💳 Pay Now (UPI / Cards / Net Banking / Wallet)
                </button>
                <button 
                  onClick={handleCOD}
                  disabled={paying}
                  style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 5, cursor: 'pointer' }}
                >
                  📦 Cash on Delivery
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Summary */}
          <div>
            <div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: 'var(--shadow)', position: 'sticky', top: 100 }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 16 }}>Order Summary</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                    <span>{item.name} x {item.quantity}</span>
                    <span>{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <hr />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Subtotal</span><span>{fmt(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--success)' }}>
                <span>Shipping</span><span>FREE</span>
              </div>
              <hr />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                <span>Total</span><span>{fmt(total)}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
                By placing the order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
