// Admin Feedback Management
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

export default function Feedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadFeedback(); }, []);

  const loadFeedback = async () => {
    try {
      const { data } = await API.get('/feedback');
      setFeedback(data.feedback || []);
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await API.delete(`/feedback/${id}`);
      setFeedback(prev => prev.filter(f => f.id !== id));
    } catch {
      alert('Failed to delete');
    }
  };

  const avgRating = feedback.length > 0 
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) 
    : '0.0';

  const filtered = filter === 'all' ? feedback 
    : filter === 'high' ? feedback.filter(f => f.rating >= 4) 
    : feedback.filter(f => f.rating < 4);

  return (
    <div className="admin-layout"><AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>📝 Customer Feedback</h1>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="admin-card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{feedback.length}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Feedback</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="admin-card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>⭐ {avgRating}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Average Rating</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="admin-card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#28a745' }}>{feedback.filter(f => f.rating >= 4).length}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Positive (4-5★)</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="admin-card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc3545' }}>{feedback.filter(f => f.rating < 4).length}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Needs Attention</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="admin-card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 10 }}>
          {[
            { key: 'all', label: `All (${feedback.length})` },
            { key: 'high', label: `Positive (${feedback.filter(f => f.rating >= 4).length})` },
            { key: 'low', label: `Low Rating (${feedback.filter(f => f.rating < 4).length})` }
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: filter === tab.key ? 'var(--primary)' : '#f0f0f0',
                color: filter === tab.key ? '#fff' : 'var(--text)',
                fontWeight: 500, fontSize: '0.85rem', transition: 'all 0.2s'
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Feedback List */}
        <div className="admin-card" style={{ padding: 24 }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading feedback...</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No feedback found.</p>
          ) : (
            filtered.map(fb => (
              <div key={fb.id} style={{
                background: '#FAFBFC', padding: 18, borderRadius: 10, marginBottom: 14,
                borderLeft: `4px solid ${fb.rating >= 4 ? '#28a745' : fb.rating >= 3 ? 'var(--gold)' : '#dc3545'}`,
                transition: 'transform 0.2s', position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{fb.name}</strong>
                    {fb.email && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 10 }}>({fb.email})</span>}
                    <div style={{ color: 'var(--gold)', fontSize: '1.1rem', margin: '4px 0' }}>{stars(fb.rating)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      onClick={() => deleteFeedback(fb.id)}
                      title="Delete feedback"
                      style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >🗑️</button>
                  </div>
                </div>
                <p style={{ marginTop: 8, marginBottom: 4, color: 'var(--text)', lineHeight: 1.5 }}>"{fb.message}"</p>
                <small style={{ color: 'var(--text-muted)' }}>{new Date(fb.created_at).toLocaleString('en-IN')}</small>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
