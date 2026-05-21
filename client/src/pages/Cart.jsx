import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const RAZORPAY_KEY = 'rzp_test_ShPCOm4skSBpB8'; // Replace with actual key

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
        theme: { color: '#521220' },
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
            alert('🎉 Payment successful! Order placed!');
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
      alert('✅ Order placed successfully! Cash on Delivery.');
      navigate('/');
    } catch { alert('Order failed'); }
    setPaying(false);
  };

  const handleDirectUPI = async () => {
    setPaying(true);
    try {
      const orderItems = items.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity }));
      await API.post('/orders', { items: orderItems, totalAmount: total, paymentMethod: 'Direct UPI', shippingAddress: address });
      alert('✅ Order placed! We will process it once the payment is verified.');
      navigate('/');
    } catch { alert('Order failed'); }
    setPaying(false);
  };

  const upiUrl = `upi://pay?pa=7019461619@ptyes&pn=Prerna%20Silks&am=${total}&cu=INR`;

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1100, margin: '30px auto', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 22, fontSize: '1.7rem', fontWeight: 400 }}>
          🛒 Shopping Cart
          {items.length > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginLeft: 10 }}>({items.length} items)</span>}
        </h2>

        {loading ? <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading...</p>
          : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '4rem', marginBottom: 14 }}>🛒</div>
              <h3 style={{ marginBottom: 8 }}>Your cart is empty</h3>
              <p style={{ marginBottom: 20 }}>Add some beautiful sarees to get started</p>
              <Link to="/" className="btn-buy" style={{ padding: '12px 28px', textDecoration: 'none', display: 'inline-block' }}>Continue Shopping</Link>
            </div>
          ) : (
            <div className="cart-container" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>
              {/* Items */}
              <div style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '1rem' }}>
                  Items in Cart
                </div>
                {items.map(item => (
                  <div key={item.cart_item_id} style={{ display: 'flex', gap: 16, padding: '18px 22px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div style={{ width: 88, height: 88, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5f0eb' }}>
                      {item.image
                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem' }}>👗</div>}
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
                      <button style={{ color: 'var(--danger)', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', marginTop: 6, fontFamily: 'var(--font-body)' }} onClick={() => removeItem(item.cart_item_id)}>✕ Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow)', padding: 24, position: 'sticky', top: 80 }}>
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
                  <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: 14, color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                    ← Continue Shopping
                  </Link>
                </div>

                <div style={{ marginTop: 20, padding: '12px', background: 'var(--bg)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-light)', border: '1px solid var(--border)' }}>
                   🔒 Secure SSL Encrypted Checkout
                </div>
              </div>
            </div>
          )}
      </div>
      <Footer />
    </>

  );
}
