import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PayEnquiry() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');

  const fmt = v => `₹${Number(v).toLocaleString('en-IN')}`;

  useEffect(() => { loadEnquiry(); }, [token]);

  const loadEnquiry = async () => {
    try {
      const { data } = await API.get(`/enquiries/pay/${token}`);
      if (!data.success) { setError(data.message || 'Invalid payment link'); return; }
      if (data.alreadyPaid) { setPaid(true); setEnquiry(data.enquiry); return; }
      setEnquiry(data.enquiry);
      setRazorpayKeyId(data.razorpayKeyId || 'rzp_test_ShPCOm4skSBpB8');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load payment details');
    } finally { setLoading(false); }
  };

  const loadRazorpayScript = () => new Promise(resolve => {
    if (document.getElementById('rzp-enquiry-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'rzp-enquiry-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePayment = async () => {
    if (!enquiry?.razorpayOrderId) { alert('Payment link is not ready yet. Contact the seller.'); return; }
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert('Payment gateway failed to load.'); setPaying(false); return; }

      const options = {
        key: razorpayKeyId,
        amount: Math.round(enquiry.quotedAmount * 100),
        currency: 'INR',
        name: 'Prerna Silks',
        description: `Enquiry ${enquiry.enquiryId}`,
        order_id: enquiry.razorpayOrderId,
        theme: { color: '#521220' },
        prefill: { contact: enquiry.customerPhone || '' },
        handler: async (response) => {
          try {
            const { data: result } = await API.post(`/enquiries/pay/${token}`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            if (result.success) {
              setPaid(true);
            } else { alert('Payment verification failed.'); }
          } catch { alert('Payment confirmation failed. Contact support.'); }
          setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        console.error('Payment failed:', resp.error);
        alert('Payment failed: ' + (resp.error?.description || 'Please try again.'));
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      alert('Could not initiate payment. Please try again or contact support.');
      setPaying(false);
    }
  };

  if (loading) return (<><Header /><div style={{ padding: '100px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading payment details...</div><Footer /></>);

  if (error) return (<><Header /><div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
    <div style={{ background: '#fff3cd', padding: 40, borderRadius: 16, border: '1px solid #ffc107' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#856404', fontWeight: 400, marginBottom: 8 }}>Payment Link Issue</h3>
      <p style={{ color: 'var(--text-light)' }}>{error}</p>
    </div>
  </div><Footer /></>);

  if (paid) return (<><Header /><div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
    <div style={{ background: '#d4edda', padding: 40, borderRadius: 16, border: '2px solid #28a745' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#155724', fontWeight: 400, marginBottom: 8 }}>Payment Successful!</h3>
      <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>Your payment has been received. Thank you for your purchase!</p>
      <button className="btn-buy" style={{ padding: '12px 28px', border: 'none', cursor: 'pointer' }}
        onClick={() => navigate('/')}>Continue Shopping</button>
    </div>
  </div><Footer /></>);

  return (
    <>
      <Header />
      <div style={{ maxWidth: 500, margin: '60px auto', padding: '0 20px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '1.8rem'
            }}>📋</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontWeight: 400, marginBottom: 4 }}>
              Payment for Enquiry
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {enquiry?.enquiryId || ''}
            </p>
          </div>

          {enquiry?.productName && (
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 2 }}>Product</p>
              <p style={{ fontWeight: 600 }}>{enquiry.productName}</p>
            </div>
          )}

          {enquiry?.customerName && (
            <div style={{ marginBottom: 20, fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Customer: <strong style={{ color: 'var(--text)' }}>{enquiry.customerName}</strong>
            </div>
          )}

          <div style={{
            background: 'linear-gradient(135deg, var(--primary), #7A2234)',
            borderRadius: 12, padding: '20px', marginBottom: 24, color: '#fff'
          }}>
            <p style={{ fontSize: '0.82rem', opacity: 0.8, marginBottom: 4 }}>Amount to Pay</p>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>
              {fmt(enquiry?.quotedAmount || 0)}
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={paying}
            className="razorpay-btn"
            style={{ marginTop: 0 }}
          >
            {paying ? 'Processing...' : 'Pay Now with Razorpay'}
          </button>

          <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            🔒 Secure payment via Razorpay
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
