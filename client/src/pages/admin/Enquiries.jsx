import { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0 });
  const [filter, setFilter] = useState('');
  const [approving, setApproving] = useState(null);

  const load = useCallback(async () => {
    try {
      const [enqRes, statsRes] = await Promise.all([
        API.get('/enquiry'),
        API.get('/enquiry/stats')
      ]);
      setEnquiries(enqRes.data.enquiries || []);
      setStats(statsRes.data.stats || { total: 0, today: 0, pending: 0 });
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    }
  }, []);

  useEffect(() => { load(); }, [filter, load]);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/enquiry/${id}`, { status });
      load();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const deleteEnquiry = async (id) => {
    if (!confirm('Delete this enquiry?')) return;
    try {
      await API.delete(`/enquiry/${id}`);
      load();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const approveEnquiry = async (id) => {
    setApproving(id);
    try {
      const { data } = await API.post(`/enquiry/${id}/approve`);
      if (data.success) {
        const fullUrl = `${window.location.origin}${data.paymentUrl}`;
        await navigator.clipboard.writeText(fullUrl);
        alert(`Payment link copied to clipboard!\n\nShare this with the customer:\n${fullUrl}`);
        load();
      }
    } catch (err) {
      alert('Failed to approve enquiry');
    }
    setApproving(null);
  };

  const statusList = ['pending', 'contacted', 'approved', 'resolved', 'cancelled'];
  const statusColors = { pending: '#fff3cd', contacted: '#cce5ff', approved: '#d4edda', resolved: '#d4edda', cancelled: '#f8d7da' };
  const statusTextColors = { pending: '#856404', contacted: '#004085', approved: '#155724', resolved: '#155724', cancelled: '#721c24' };

  const filtered = filter ? enquiries.filter(e => e.status === filter) : enquiries;

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 400, color: 'var(--primary)', margin: 0 }}>B2B Enquiries</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <strong>{stats.pending}</strong> pending · <strong>{stats.today}</strong> today · <strong>{stats.total}</strong> total
            </span>
            <select className="form-select" style={{ width: 160, padding: '8px 12px' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Enquiries</option>
              {statusList.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="admin-card" style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '16px 20px' }}>Customer</th>
                  <th style={{ padding: '16px 20px' }}>Items</th>
                  <th style={{ padding: '16px 20px' }}>Pincode</th>
                  <th style={{ padding: '16px 20px' }}>Message</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px' }}>Date</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>
                      No enquiries found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(e => (
                    <tr key={e._id} style={{ verticalAlign: 'middle' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600 }}>{e.name}</div>
                        <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>{e.phone}</small>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {(e.items || []).map((item, i) => (
                          <div key={i} style={{ fontSize: '0.82rem', marginBottom: 2 }}>
                            • {item.name || item.product_name || 'Unknown'}
                            {item.quantity ? ` x${item.quantity}` : ''}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {e.pincode || '—'}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.message || '—'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <select
                          value={e.status}
                          onChange={e2 => updateStatus(e._id, e2.target.value)}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd',
                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                            background: statusColors[e.status] || '#fff',
                            color: statusTextColors[e.status] || '#333'
                          }}
                        >
                          {statusList.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {fmtDate(e.created_at)}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {e.status === 'pending' && (
                          <button className="btn btn-sm btn-outline-primary me-1" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => approveEnquiry(e._id)} disabled={approving === e._id}>
                            {approving === e._id ? '...' : '✅ Approve'}
                          </button>
                        )}
                        <a
                          href={`https://wa.me/917019461619?text=${encodeURIComponent(`Hi ${e.name}, this is Prerna Silks regarding your enquiry:\n${(e.items || []).map(i => `- ${i.product_name || i.productId}`).join('\n')}\n\nCan we assist you further?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-success me-1"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', textDecoration: 'none' }}
                        >
                          💬 WhatsApp
                        </a>
                        <button className="btn btn-sm btn-outline-danger" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => deleteEnquiry(e._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
