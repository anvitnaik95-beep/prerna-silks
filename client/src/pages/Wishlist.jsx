import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const HeartOutlineIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const CartPlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/></svg>;

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const { data } = await API.get('/wishlist'); setItems(data.items || []); } catch {}
    setLoading(false);
  };

  const remove = async (wishlistId, e) => {
    e.stopPropagation();
    try { await API.delete(`/wishlist/${wishlistId}`); load(); } catch {}
  };

  const addCart = async (productId, e) => {
    e.stopPropagation();
    try { await API.post('/cart/add', { productId, quantity: 1 }); alert('Added to cart!'); } catch {}
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 24px' }}>
        <div className="wishlist-header">
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '1.7rem', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 10 }}>
            <HeartOutlineIcon /> My Wishlist {items.length > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>({items.length} items)</span>}
          </h2>
          {items.length > 0 && (
            <button className="btn-buy" style={{ padding: '9px 20px' }} onClick={() => navigate('/')}>
              + Add More
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: 16, opacity: 0.5, color: 'var(--danger)' }}><HeartOutlineIcon /></div>
            <h3 style={{ marginBottom: 10, fontFamily: 'var(--font-heading)', color: 'var(--text)', fontWeight: 400 }}>Your wishlist is empty</h3>
            <p style={{ marginBottom: 24 }}>Save your favourite sarees here</p>
            <button className="btn-buy" style={{ padding: '12px 28px' }} onClick={() => navigate('/')}>Browse Collection</button>
          </div>
        ) : (
          <div className="product-grid">
            {items.map(p => {
              const disc = p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
              return (
                <div className="product-card" key={p.wishlist_id} onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="product-img">
                    {p.image
                      ? <img className="img-main" src={p.image} alt={p.name} />
                      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', opacity: 0.4 }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg></div>}
                    <button className="wish-btn active" title="Remove from wishlist"
                      style={{ opacity: 1, color: 'var(--danger)' }}
                      onClick={e => remove(p.wishlist_id, e)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                    </button>
                    <button className="quick-view-btn" onClick={e => { e.stopPropagation(); navigate(`/product/${p.id}`); }}>View Details</button>
                  </div>
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="product-rating">{stars(p.rating)}</div>
                    <div className="product-price">
                      <span className="current">₹{Number(p.price).toLocaleString('en-IN')}</span>
                      {p.original_price > p.price && <span className="original">₹{Number(p.original_price).toLocaleString('en-IN')}</span>}
                      {disc > 0 && <span className="discount">{disc}% OFF</span>}
                    </div>
                    <div className="product-actions">
                      <button className="btn-cart" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onClick={e => addCart(p.id, e)}><CartPlusIcon /> Add to Cart</button>
                      <button className="btn-buy" style={{ flex: 1 }}
                        onClick={e => { addCart(p.id, e); navigate('/cart'); }}>Buy Now</button>
                    </div>
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
