import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [quotedAmount, setQuotedAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const statusColors = {
    Pending: { bg: '#fff3cd', color: '#856404' },
    Quoted: { bg: '#cce5ff', color: '#004085' },
    Accepted: { bg: '#d1ecf1', color: '#0c5460' },
    Paid: { bg: '#d4edda', color: '#155724' },
    Completed: { bg: '#d4edda', color: '#155724' },
    Cancelled: { bg: '#f8d7da', color: '#721c24' }
  };

  const loadEnquiries = async (statusFilter = '') => {
    try {
      const url = statusFilter ? `/enquiries?status=${statusFilter}` : '/enquiries';
      const { data } = await API.get(url);
      setEnquiries(data.enquiries || []);
    } catch { setEnquiries([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEnquiries(filter); }, [filter]);

  const openEnquiry = (eq) => {
    setSelected(eq);
    setQuotedAmount(eq.quotedAmount ? eq.quotedAmount.toString() : '');
    setAdminNotes(eq.adminNotes || '');
    setStatus(eq.status || '');
    setPaymentUrl('');
    setCopied(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body = {};
      if (quotedAmount) body.quotedAmount = parseFloat(quotedAmount);
      if (adminNotes !== undefined) body.adminNotes = adminNotes;
      if (status) body.status = status;
      const { data } = await API.put(`/enquiries/${selected._id || selected.id}`, body);
      if (data.success) {
        setSelected(data.enquiry);
        loadEnquiries(filter);
      }
    } catch (err) { alert('Failed to update: ' + (err?.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const generatePaymentLink = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const { data } = await API.post(`/enquiries/${selected._id || selected.id}/generate-payment`);
      if (data.success) {
        setPaymentUrl(data.paymentUrl);
        setSelected(data.enquiry);
        loadEnquiries(filter);
      } else { alert(data.message || 'Failed to generate payment link'); }
    } catch (err) { alert('Error: ' + (err?.response?.data?.message || err.message)); }
    finally { setGenerating(false); }
  };

  const copyToClipboard = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Enquiries</h1>
          <select className="form-select" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Quoted">Quoted</option>
            <option value="Paid">Paid</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Enquiries List */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>{filter ? `${filter} Enquiries` : 'All Enquiries'} ({enquiries.length})</h3>
            </div>
            {loading ? (
              <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p>
            ) : enquiries.length === 0 ? (
              <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No enquiries found</p>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {enquiries.map(eq => {
                  const sc = statusColors[eq.status] || { bg: '#e2e3e5', color: '#383d41' };
                  return (
                    <div key={eq._id || eq.id} onClick={() => openEnquiry(eq)}
                      style={{
                        padding: '14px 18px', borderBottom: '1px solid var(--border)',
                        cursor: 'pointer', transition: 'background 0.2s',
                        background: selected?._id === eq._id ? 'var(--bg)' : '#fff'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = selected?._id === eq._id ? 'var(--bg)' : '#fff'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {eq.enquiryId || 'N/A'}
                        </strong>
                        <span style={{
                          padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600,
                          background: sc.bg, color: sc.color
                        }}>{eq.status}</span>
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {eq.customerName} {eq.quotedAmount > 0 && `- ₹${Number(eq.quotedAmount).toLocaleString('en-IN')}`}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {eq.productName || 'No product'} • {eq.customerPhone}
                      </p>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatDate(eq.createdAt)}</small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enquiry Details */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>{selected ? `Enquiry ${selected.enquiryId || ''}` : 'Select an Enquiry'}</h3>
            </div>
            {!selected ? (
              <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                Click on an enquiry to view details
              </p>
            ) : (
              <div style={{ padding: 20 }}>
                {/* Customer Details */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    Customer Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Name:</span><span style={{ fontWeight: 600 }}>{selected.customerName}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span><span style={{ fontWeight: 600 }}>{selected.customerPhone}</span>
                    {selected.customerEmail && <><span style={{ color: 'var(--text-muted)' }}>Email:</span><span style={{ fontWeight: 600 }}>{selected.customerEmail}</span></>}
                    {selected.customerAddress && <><span style={{ color: 'var(--text-muted)' }}>Address:</span><span style={{ fontWeight: 600 }}>{selected.customerAddress}</span></>}
                  </div>
                </div>

                {/* Product Details */}
                {selected.productName && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                      Product Details
                    </h4>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selected.productName}</p>
                    {selected.productDescription && <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{selected.productDescription}</p>}
                  </div>
                )}

                {/* Customer Message */}
                {selected.message && (
                  <div style={{ marginBottom: 20, background: 'var(--bg)', padding: 12, borderRadius: 8, fontSize: '0.88rem', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 4 }}>Message from customer:</p>
                    <p>{selected.message}</p>
                  </div>
                )}

                {/* Payment Status */}
                {selected.razorpayPaymentId && (
                  <div style={{ marginBottom: 20, background: '#d4edda', padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 600, color: '#155724' }}>
                      ✅ Payment Received (Ref: {selected.razorpayPaymentId})
                    </p>
                    {selected.orderId && <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
                      Order ID: {selected.orderId.toString()}
                    </p>}
                  </div>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

                {/* Admin Controls */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Quoted Amount (₹)</label>
                  <input className="form-control" type="number" min="0" step="0.01"
                    value={quotedAmount} onChange={e => setQuotedAmount(e.target.value)}
                    placeholder="Enter amount" />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">Keep current</option>
                    <option value="Pending">Pending</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Admin Notes</label>
                  <textarea className="form-control" rows={3} value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes..." />
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  <button className="btn-buy" style={{ padding: '8px 20px', border: 'none', cursor: 'pointer' }}
                    onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button style={{
                    padding: '8px 20px', border: 'none', borderRadius: 3, cursor: 'pointer',
                    background: copied ? 'var(--success)' : 'var(--gold)', color: '#fff', fontWeight: 600,
                    fontSize: '0.85rem'
                  }} onClick={generatePaymentLink} disabled={generating || !quotedAmount || parseFloat(quotedAmount) <= 0}>
                    {generating ? 'Generating...' : 'Generate Payment Link'}
                  </button>
                </div>

                {/* Payment Link Result */}
                {paymentUrl && (
                  <div style={{
                    background: '#d4edda', padding: 12, borderRadius: 8,
                    border: '1px solid #28a745', marginBottom: 16
                  }}>
                    <p style={{ fontWeight: 600, color: '#155724', marginBottom: 8 }}>Payment Link Generated</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-control" value={paymentUrl} readOnly
                        style={{ fontSize: '0.78rem', background: '#fff' }} />
                      <button style={{
                        padding: '8px 14px', background: 'var(--primary)', color: '#fff',
                        border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.82rem',
                        whiteSpace: 'nowrap'
                      }} onClick={copyToClipboard}>
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#155724', marginTop: 6 }}>
                      Share this link with the customer via WhatsApp or SMS.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
