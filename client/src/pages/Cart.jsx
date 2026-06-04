import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const RAZORPAY_KEY = 'rzp_test_ShPCOm4skSBpB8';
const CartBagIcon = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const DressIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>;
const RemoveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const LockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const ArrowLeft = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [address, setAddress] = useState('');
  const [showUpiQR, setShowUpiQR] = useState(false);
  const navigate = useNavigate();
  const fmt = v => `₹${Number(v).toLocaleString('en-IN')}`;

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    try { const { data } = await API.get('/cart'); setItems(data.items || []); }
    catch { setItems([]); }
    setLoading(false);
  };

  const updateQty = async (cartItemId, qty) => {
    if (qty < 1) return removeItem(cartItemId);
    try { await API.put('/cart/update', { cartItemId, quantity: qty }); loadCart(); } catch { }
  };

  const removeItem = async (cartItemId) => {
    try { await API.delete(`/cart/remove/${cartItemId}`); loadCart(); } catch { }
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

  const handleRazorpayPayment = async () => {
    if (!address.trim()) { alert('Please enter your shipping address'); return; }
    setPaying(true);
    try {
      // Create Razorpay order on backend
      const { data: orderData } = await API.post('/orders/razorpay/create', {
        amount: total,
        currency: 'INR'
      });

      const loaded = await loadRazorpayScript();
      if (!loaded) { alert('Razorpay failed to load. Check internet connection.'); setPaying(false); return; }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Prerna Silks',
        description: `Order of ${items.length} item(s)`,
        order_id: orderData.orderId,
        prefill: { contact: '7019461619' },
        theme: { color: '#1B2A4A' },
        handler: async (response) => {
          // Verify and place order
          try {
            const orderItems = items.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity }));
            await API.post('/orders', {
              items: orderItems,
              totalAmount: total,
              paymentMethod: 'Razorpay',
              shippingAddress: address,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            alert('Payment successful! Order placed!');
            navigate('/');
          } catch { alert('Order failed after payment. Contact support.'); }
        },
        modal: { ondismiss: () => setPaying(false) }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { alert('Payment failed. Try again.'); setPaying(false); });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Could not initiate payment. Please try again.');
      setPaying(false);
    }
  };

  const handleCOD = async () => {
    if (!address.trim()) { alert('Please enter your shipping address'); return; }
    setPaying(true);
    try {
      const orderItems = items.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity }));
      await API.post('/orders', { items: orderItems, totalAmount: total, paymentMethod: 'COD', shippingAddress: address });
      alert('Order placed successfully! Cash on Delivery.');
      navigate('/');
    } catch { alert('Order failed'); }
    setPaying(false);
  };

  const handleDirectUPI = async () => {
    setPaying(true);
    try {
      const orderItems = items.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity }));
      await API.post('/orders', { items: orderItems, totalAmount: total, paymentMethod: 'Direct UPI', shippingAddress: address });
      alert('Order placed! We will process it once the payment is verified.');
      navigate('/');
    } catch { alert('Order failed'); }
    setPaying(false);
  };

  const upiUrl = `upi://pay?pa=7019461619@ptyes&pn=Prerna%20Silks&am=${total}&cu=INR`;

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1100, margin: '30px auto', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 22, fontSize: '1.7rem', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CartBagIcon /> Shopping Cart
          {items.length > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginLeft: 10 }}>({items.length} items)</span>}
        </h2>

        {loading ? <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading...</p>
          : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '4rem', marginBottom: 14, opacity: 0.6, color: 'var(--primary)' }}><CartBagIcon /></div>
              <h3 style={{ marginBottom: 8 }}>Your cart is empty</h3>
              <p style={{ marginBottom: 20 }}>Add some beautiful sarees to get started</p>
              <Link to="/" className="btn-buy" style={{ padding: '12px 28px', textDecoration: 'none', display: 'inline-block' }}>Continue Shopping</Link>
            </div>
          ) : (
            <div className="cart-container">
              {/* Items */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 10, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '1rem' }}>
                  Items in Cart
                </div>
                {items.map(item => (
                  <div key={item.cart_item_id} style={{ display: 'flex', gap: 16, padding: '18px 22px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div style={{ width: 88, height: 88, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5f0eb' }}>
                      {item.image
                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.parentNode.querySelector('svg') && (e.target.parentNode.querySelector('svg').style.display=''); }} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}><DressIcon /></div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h5 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4, fontSize: '1rem', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h5>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 4 }}>{item.category} • {item.color}</p>
                      <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>{fmt(item.price)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.cart_item_id, item.quantity - 1)}
                        style={{ width: 30, height: 30, border: '1.5px solid var(--border)', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: '1.1rem', fontFamily: 'var(--font-body)' }}>−</button>
                      <span style={{ fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.cart_item_id, item.quantity + 1)}
                        style={{ width: 30, height: 30, border: '1.5px solid var(--border)', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: '1.1rem', fontFamily: 'var(--font-body)' }}>+</button>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 90, flexShrink: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem' }}>{fmt(item.price * item.quantity)}</p>
                      <button style={{ color: 'var(--danger)', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', marginTop: 6, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => removeItem(item.cart_item_id)}><RemoveIcon /> Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 10, boxShadow: 'var(--shadow)', padding: 24, position: 'sticky', top: 80 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 18, fontSize: '1.2rem', fontWeight: 400 }}>Order Summary</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.9rem' }}>
                  <span>Subtotal ({items.length} items)</span><span style={{ fontWeight: 500 }}>{fmt(total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.9rem' }}>
                  <span>Shipping</span><span style={{ color: 'var(--success)', fontWeight: 500 }}>FREE</span>
                </div>
                <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '14px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                  <span>Total</span><span>{fmt(total)}</span>
                </div>

                <div style={{ marginTop: 24 }}>
                  <Link to="/checkout" className="btn-buy" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '14px' }}>
                    Proceed to Checkout
                  </Link>
                  <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                    <ArrowLeft /> Continue Shopping
                  </Link>
                </div>

                <div style={{ marginTop: 20, padding: '12px', background: 'var(--bg)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-light)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LockIcon /> Secure SSL Encrypted Checkout
                </div>
              </div>
            </div>
          )}
      </div>
      <Footer />
    </>

  );
}
