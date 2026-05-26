import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function MyEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const statusColors = {
    Pending: { bg: '#fff3cd', color: '#856404' },
    Quoted: { bg: '#cce5ff', color: '#004085' },
    Accepted: { bg: '#d1ecf1', color: '#0c5460' },
    Paid: { bg: '#d4edda', color: '#155724' },
    Completed: { bg: '#d4edda', color: '#155724' },
    Cancelled: { bg: '#f8d7da', color: '#721c24' }
  };

  useEffect(() => { loadEnquiries(); }, []);

  const loadEnquiries = async () => {
    try {
      const { data } = await API.get('/enquiries');
      setEnquiries(data.enquiries || []);
    } catch { setEnquiries([]); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 30, fontWeight: 400 }}>
          My Enquiries
        </h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</p>
        ) : enquiries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>📋</div>
            <h3 style={{ marginBottom: 8, fontWeight: 400, fontFamily: 'var(--font-heading)' }}>No Enquiries Yet</h3>
            <p style={{ marginBottom: 20 }}>Browse our products and make an enquiry to get started.</p>
            <button className="btn-buy" style={{ padding: '12px 28px', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate('/')}>Browse Products</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {enquiries.map(eq => {
              const sc = statusColors[eq.status] || { bg: '#e2e3e5', color: '#383d41' };
              return (
                <div key={eq._id || eq.id} style={{
                  background: '#fff', borderRadius: 10, padding: 20,
                  boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {eq.enquiryId || 'Enquiry'}
                      </strong>
                      <h4 style={{ fontFamily: 'var(--font-heading)', margin: '4px 0', fontWeight: 400 }}>
                        {eq.productName || 'Product Enquiry'}
                      </h4>
                      {eq.message && (
                        <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', marginTop: 4 }}>
                          {eq.message}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                        fontSize: '0.78rem', fontWeight: 600,
                        background: sc.bg, color: sc.color
                      }}>
                        {eq.status}
                      </span>
                      {eq.quotedAmount > 0 && (
                        <p style={{ marginTop: 8, fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                          ₹{Number(eq.quotedAmount).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {eq.status === 'Quoted' && eq.paymentLinkToken && eq.paymentStatus === 'unpaid' && (
                      <button className="btn-buy" style={{ padding: '8px 20px', border: 'none', cursor: 'pointer' }}
                        onClick={() => navigate(`/pay-enquiry/${eq.paymentLinkToken}`)}>
                        Pay Now
                      </button>
                    )}
                    <small style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>
                      {new Date(eq.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </small>
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
