import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PayOrder() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const [payMethod, setPayMethod] = useState('razorpay');
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [upiStatus, setUpiStatus] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [locating, setLocating] = useState(false);
  const receiptRef = useRef(null);

  useEffect(() => {
    API.get(`/orders/link/${token}`).then(({ data }) => {
      if (data.success) {
        if (data.paid) { setPaid(true); setOrder(data.order); }
        else {
          setOrder(data.order);
          if (data.order.shipping_address) {
            setShippingAddress(data.order.shipping_address);
          }
        }
      } else { setError('Order not found'); }
    }).catch(() => setError('Failed to load order')).finally(() => setLoading(false));
  }, [token]);

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await res.json();
          const a = data.address || {};
          const parts = [
            a.road || a.pedestrian || '',
            a.suburb || a.neighbourhood || '',
            a.city || a.town || a.village || a.county || '',
            a.state || '',
            a.postcode || ''
          ].filter(Boolean);
          const full = data.display_name ? data.display_name.split(', ').slice(0, 4).join(', ') : parts.join(', ');
          setShippingAddress(full);
        } catch {
          setShippingAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)} (auto-detected)`);
        }
        setLocating(false);
      },
      (err) => {
        alert('Could not detect location: ' + (err.message || 'Permission denied'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validateAddress = () => {
    if (!shippingAddress.trim()) {
      setAddressError('Shipping address is required');
      return false;
    }
    setAddressError('');
    return true;
  };

  const handleRazorpay = async () => {
    if (!validateAddress()) return;
    setPaying(true);
    try {
      await API.post(`/orders/link/${token}/update-address`, { shipping_address: shippingAddress.trim() }).catch(() => {});
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) { alert('Razorpay SDK failed to load. Please refresh and try again.'); setPaying(false); return; }
      const { data } = await API.post(`/orders/link/${token}/razorpay/create`);
      const options = {
        key: data.key, amount: data.amount, currency: 'INR', name: 'Prerna Silks',
        description: 'Order Payment', order_id: data.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await API.post(`/orders/link/${token}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyRes.data.verified) {
              const { data: updated } = await API.get(`/orders/link/${token}`).catch(() => ({}));
              if (updated?.order) setOrder(updated.order);
              setPaid(true);
            } else alert('Payment verification failed');
          } catch { alert('Payment verification error'); }
          setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: '#1B2A4A' },
        prefill: { contact: order?.customer_phone || '' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) { console.error('Razorpay error:', e); alert('Razorpay error: ' + (e.response?.data?.message || e.message)); setPaying(false); }
  };

  const handleUpi = async () => {
    if (!validateAddress()) return;
    setShowUpiQr(true);
    await API.post(`/orders/link/${token}/update-address`, { shipping_address: shippingAddress.trim() }).catch(() => {});
    setUpiStatus('Scan the QR code with any UPI app to pay');
    setTimeout(() => setUpiStatus('Waiting for payment...'), 3000);
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 3;
      if (elapsed >= 3) setUpiStatus('Initiating secure transaction channel...');
      if (elapsed >= 6) setUpiStatus('Connecting to UPI gateway...');
      if (elapsed >= 9) {
        setUpiStatus('Payment received. Verifying...');
        clearInterval(interval);
        setTimeout(async () => {
          try {
            await API.post(`/orders/link/${token}/verify`, {
              razorpay_order_id: '', razorpay_payment_id: `UPI_${Date.now()}`, razorpay_signature: 'upi_auto'
            });
            const { data: updated } = await API.get(`/orders/link/${token}`).catch(() => ({}));
            if (updated?.order) setOrder(updated.order);
            setPaid(true);
            setShowUpiQr(false);
          } catch { alert('Verification failed'); setShowUpiQr(false); }
        }, 2000);
      }
    }, 3000);
  };

  const handleCod = async () => {
    if (!validateAddress()) return;
    setPaying(true);
    try {
      const { data } = await API.post(`/orders/link/${token}/confirm-cod`, {
        shipping_address: shippingAddress.trim()
      });
      if (data.success) {
        setPaid(true);
        const updatedOrder = data.order || { ...order, payment_method: 'COD', payment_status: 'Unpaid', status: 'Confirmed' };
        setOrder(updatedOrder);
      } else {
        alert(data.message || 'Failed to confirm order');
      }
    } catch {
      alert('Failed to confirm order. Please try again.');
    }
    setPaying(false);
  };

  const handleDownloadReceipt = () => {
    const isCod = order?.payment_method === 'COD';
    const paymentLabel = isCod ? 'Cash on Delivery' : (order?.payment_method || 'Online');
    const dateStr = new Date(order?.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prerna Silks - Payment Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', 'Jost', sans-serif; background: #fff; color: #333; padding: 40px 20px; }
    .receipt { max-width: 520px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px dashed #EAE3DC; padding-bottom: 16px; }
    .header h1 { font-family: 'Georgia', 'Playfair Display', serif; color: #1B2A4A; font-weight: 400; margin: 0 0 4px; font-size: 1.4rem; }
    .header p { font-size: 0.78rem; color: #999; letter-spacing: 1px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.85rem; }
    .label { color: #999; font-size: 0.75rem; }
    .val { font-weight: 600; }
    .mono { font-family: monospace; }
    .section { margin-bottom: 16px; font-size: 0.85rem; }
    .section .label { margin-bottom: 4px; display: block; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.85rem; }
    th { text-align: left; padding: 8px 4px; color: #999; font-weight: 500; font-size: 0.78rem; border-bottom: 2px solid #EAE3DC; }
    th.qty, th.price, th.total { text-align: center; }
    th.price, th.total { text-align: right; }
    td { padding: 8px 4px; border-bottom: 1px solid #EAE3DC; }
    td.qty, td.price, td.total { text-align: center; }
    td.price, td.total { text-align: right; }
    td.total { font-weight: 500; }
    .total-row { border-top: 2px solid #1B2A4A; padding-top: 12px; display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 700; color: #1B2A4A; }
    .footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px dashed #EAE3DC; font-size: 0.82rem; color: #999; }
    .btn { display: inline-block; margin-top: 24px; padding: 14px 40px; background: #1B2A4A; color: #fff; text-decoration: none; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; }
    .btn:hover { background: #2C4066; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Prerna Silks</h1>
      <p>PAYMENT RECEIPT</p>
    </div>

    <div class="row">
      <div>
        <div class="label">Receipt No.</div>
        <div class="val mono">#${orderId}</div>
      </div>
      <div style="text-align:right">
        <div class="label">Date</div>
        <div class="val">${dateStr}</div>
      </div>
    </div>

    <div class="section">
      <span class="label">Customer</span>
      <div style="font-weight:500">${order?.customer_name || '---'}</div>
      <div style="color:#999">${order?.customer_phone || ''}</div>
    </div>

    ${order?.shipping_address ? `<div class="section">
      <span class="label">Shipping Address</span>
      <div style="line-height:1.5">${(order.shipping_address || '').replace(/\n/g, '<br>')}</div>
    </div>` : ''}

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="qty">Qty</th>
          <th class="price">Price</th>
          <th class="total">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(order?.items || []).map((item, i) => `
        <tr>
          <td>${item.product_name || 'Item'}</td>
          <td class="qty">${item.quantity || 1}</td>
          <td class="price">Rs.${(item.price || 0).toLocaleString('en-IN')}</td>
          <td class="total">Rs.${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="total-row">
      <span>Total</span>
      <span>Rs.${total.toLocaleString('en-IN')}</span>
    </div>

    <div class="footer">
      Payment: ${paymentLabel} | Status: ${order?.payment_status || 'Confirmed'}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrernaSilks_Receipt_${orderId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const total = order?.total_amount || 0;
  const orderId = order?.id?.slice(-8).toUpperCase() || '—';
  const upiLink = `upi://pay?pa=7019461619@ptyes&pn=Prerna%20Silks&am=${total}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;

  if (loading) {
    return (
      <><Header />
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>Loading order details...</div>
        <Footer /></>
    );
  }

  if (error) {
    return (
      <><Header />
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--danger)' }}>
          {error}<br />
          <Link to="/" style={{ color: 'var(--primary)' }}>Go to Home</Link>
        </div>
        <Footer /></>
    );
  }

  if (paid) {
    const isCod = order?.payment_method === 'COD';
    const paymentLabel = isCod ? 'Cash on Delivery' : (order?.payment_method || 'Online');
    return (
      <><Header />
        <div ref={receiptRef} style={{ maxWidth: 520, margin: '40px auto', padding: '0 24px' }}>
          <div style={{
            background: '#fff', borderRadius: 12, border: '2px solid var(--primary)',
            padding: 32, marginBottom: 24
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px dashed var(--border)', paddingBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontWeight: 400, margin: '0 0 4px', fontSize: '1.4rem' }}>
                Prerna Silks
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, letterSpacing: 1 }}>PAYMENT RECEIPT</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Receipt No.</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{orderId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Date</div>
                <div style={{ fontWeight: 600 }}>
                  {new Date(order?.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16, fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Customer</div>
              <div style={{ fontWeight: 500 }}>{order?.customer_name || '—'}</div>
              <div style={{ color: 'var(--text-muted)' }}>{order?.customer_phone || ''}</div>
            </div>

            {order?.shipping_address && (
              <div style={{ marginBottom: 16, fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Shipping Address</div>
                <div style={{ lineHeight: 1.5 }}>{order.shipping_address}</div>
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(order?.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 4px' }}>{item.product_name || 'Item'}</td>
                    <td style={{ textAlign: 'center', padding: '8px 4px' }}>{item.quantity || 1}</td>
                    <td style={{ textAlign: 'right', padding: '8px 4px' }}>{(item.price || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 500 }}>
                      {((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px solid var(--primary)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
              <span>Total</span>
              <span>Rs.{total.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Payment: {paymentLabel} | Status: {order?.payment_status || 'Confirmed'}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <button onClick={handleDownloadReceipt} className="btn-buy" style={{ padding: '14px 40px', fontSize: '1rem', cursor: 'pointer', marginRight: 12, border: 'none' }}>
              Download Receipt
            </button>
            <Link to="/" style={{ display: 'inline-block', padding: '12px 32px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer /></>
    );
  }

  return (
    <><Header />
      {showUpiQr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowUpiQr(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 380, width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--primary)', fontFamily: 'var(--font-heading)', fontWeight: 400 }}>Scan to Pay</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>Pay Rs.{total.toLocaleString('en-IN')} via any UPI app</p>
            <img src={qrUrl} alt="UPI QR" style={{ width: 220, height: 220, borderRadius: 8, border: '2px solid var(--border)' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 12, minHeight: 40 }}>{upiStatus}</div>
            <button className="btn-buy" style={{ marginTop: 12, width: '100%' }}
              onClick={() => window.open(`https://wa.me/917019461619?text=${encodeURIComponent(`I have paid Rs.${total.toLocaleString('en-IN')} via UPI for my order. Please confirm.`)}`, '_blank')}>
              Contact Support
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 400, marginBottom: 4 }}>Checkout</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
          Order for {order?.customer_name || 'Prerna Silks'}
        </p>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 20, marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600, margin: '0 0 12px' }}>Order Summary</h4>
          {(order?.items || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
              <span>{item.product_name || 'Item'} x{item.quantity || 1}</span>
              <span style={{ fontWeight: 500 }}>Rs.{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
            <span>Total</span>
            <span>Rs.{total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 20, marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600, margin: '0 0 12px' }}>Shipping Address</h4>
          <textarea
            value={shippingAddress}
            onChange={e => { setShippingAddress(e.target.value); setAddressError(''); }}
            placeholder="Enter full shipping address (street, city, state, pincode)"
            rows={3}
            style={{
              width: '100%', padding: 12, borderRadius: 8,
              border: `1.5px solid ${addressError ? 'var(--danger)' : 'var(--border)'}`,
              fontFamily: 'var(--font-body)', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box'
            }}
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={locating}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', marginTop: 8,
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem',
              color: 'var(--text)', fontFamily: 'var(--font-body)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(27,42,74,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
          >
            {locating ? (
              <><span className="loading-spinner" style={{ width:14, height:14, border:'2px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', display:'inline-block' }} /> Detecting...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg> Use Current Location</>
            )}
          </button>
          {addressError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4 }}>{addressError}</div>}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 20, marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600, margin: '0 0 12px' }}>Payment Method</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'razorpay', label: 'Credit/Debit Card, Net Banking, UPI' },
              { key: 'upi', label: 'UPI QR Code' },
              { key: 'cod', label: 'Cash on Delivery' }
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setPayMethod(m.key)}
                style={{
                  flex: 1, minWidth: 140, padding: '14px 12px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '0.85rem', lineHeight: 1.3,
                  border: payMethod === m.key ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: payMethod === m.key ? 'var(--bg)' : '#fff',
                  fontWeight: payMethod === m.key ? 600 : 400,
                  color: 'var(--text)'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {payMethod === 'cod' ? (
          <button onClick={handleCod} disabled={paying} className="btn-buy" style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}>
            {paying ? 'Processing...' : 'Confirm Order (Cash on Delivery)'}
          </button>
        ) : payMethod === 'upi' ? (
          <button onClick={handleUpi} disabled={paying} className="btn-buy" style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}>
            {paying ? 'Processing...' : `Pay Rs.${total.toLocaleString('en-IN')} via UPI`}
          </button>
        ) : (
          <button onClick={handleRazorpay} disabled={paying} className="btn-buy" style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}>
            {paying ? 'Processing...' : `Pay Rs.${total.toLocaleString('en-IN')} via Razorpay`}
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 40 }}>
          <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Back to Home</Link>
        </div>
      </div>
      <Footer /></>
  );
}
