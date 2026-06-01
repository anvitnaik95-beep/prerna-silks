import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const StarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data } = await API.get('/comments/admin/all');
      setReviews(data.comments || []);
    } catch (error) {
      console.error('Failed to load reviews', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await API.delete(`/comments/${id}`);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      alert('Failed to delete review');
    }
  };

  const filtered = reviews.filter(r => 
    r.user_name.toLowerCase().includes(search.toLowerCase()) || 
    r.product_name.toLowerCase().includes(search.toLowerCase()) ||
    r.comment.toLowerCase().includes(search.toLowerCase())
  );

  const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1><StarIcon /> Customer Reviews</h1>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Manage Reviews ({filtered.length})</h3>
            <input 
              placeholder="Search reviews..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="form-control" 
              style={{ width: 250 }} 
            />
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading reviews...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No reviews found</td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={r.product_image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{r.product_name}</span>
                        </div>
                      </td>
                      <td><strong>{r.user_name}</strong></td>
                      <td style={{ color: 'var(--gold)', whiteSpace: 'nowrap' }}>{stars(r.rating)}</td>
                      <td>
                        <div style={{ maxWidth: 300, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          {r.comment}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline-danger btn-sm" 
                          onClick={() => deleteReview(r.id)}
                          title="Delete Review"
                        >
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
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
