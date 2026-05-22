import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => { loadProduct(); loadComments(); }, [id]);

  const loadProduct = async () => {
    try {
      const { data } = await API.get(`/products/${id}`);
      setProduct(data.product);
      const imgs = data.product.images || [];
      setActiveImage(imgs.length > 0 ? imgs[0].image_url : data.product.image);
      setActiveIdx(0);
    } catch { setProduct(null); }
  };

  const loadComments = async () => {
    try { const { data } = await API.get(`/comments/${id}`); setComments(data.comments || []); } catch {}
  };

  const addToCart = async () => {
    if (!user) return navigate('/login');
    try {
      await API.post('/cart/add', { productId: id, quantity: 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch { alert('Failed to add to cart'); }
  };

  const buyNow = async () => {
    if (!user) return navigate('/login');
    setBuying(true);
    try {
      await API.post('/cart/add', { productId: id, quantity: 1 });
      navigate('/cart');
    } catch { alert('Failed'); }
    setBuying(false);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await API.post('/comments', { productId: id, comment, rating });
      setComment(''); loadComments();
    } catch { alert('Failed to post review'); }
  };

  const allImages = product
    ? (product.images && product.images.length > 0 ? product.images.map(i => i.image_url) : [product.image].filter(Boolean))
    : [];

  const selectImage = (url, idx) => { setActiveImage(url); setActiveIdx(idx); };

  if (!product) return (
    <>
      <Header />
      <div style={{ textAlign:'center', padding:'100px 0', color:'var(--text-muted)' }}>
        <div style={{ fontSize:'3rem', marginBottom:'12px' }}>👗</div>
        <p>Loading product...</p>
      </div>
    </>
  );

  const sd = product.sareeDetails || {};
  const bd = product.blouseDetails || {};
  const disc = product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <>
      <Header />
      <div className="pd-container">
        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <Link to="/">Home</Link> › <Link to="/">Collection</Link> › {product.category} › <span style={{ color:'var(--text)' }}>{product.name}</span>
        </div>

        {/* Main Grid */}
        <div className="pd-grid">
          {/* Left: Gallery */}
          <div className="pd-gallery">
            <div style={{ position:'relative', borderRadius:'8px', overflow:'hidden', background:'#f5f0eb' }}>
              <img
                className="pd-main-img"
                src={activeImage || ''}
                alt={product.name}
                onError={e => { e.target.style.display='none'; }}
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => { const i = (activeIdx - 1 + allImages.length) % allImages.length; selectImage(allImages[i], i); }}
                    style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.85)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:'1.2rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>‹</button>
                  <button
                    onClick={() => { const i = (activeIdx + 1) % allImages.length; selectImage(allImages[i], i); }}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.85)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:'1.2rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>›</button>
                </>
              )}
              {disc > 0 && (
                <div style={{ position:'absolute', top:14, left:14, background:'var(--danger)', color:'#fff', padding:'4px 10px', borderRadius:'3px', fontSize:'0.8rem', fontWeight:600 }}>{disc}% OFF</div>
              )}
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="pd-thumbs">
                {allImages.map((url, i) => (
                  <div key={i} className={`pd-thumb${activeIdx === i ? ' active' : ''}`} onClick={() => selectImage(url, i)}>
                    <img src={url} alt={`View ${i+1}`} />
                  </div>
                ))}
              </div>
            )}
            {/* Share row */}
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'center' }}>
              <button onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.name,
                    text: `Check out this beautiful ${product.name} at Prerna Silks!`,
                    url: window.location.href
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', border:'1px solid var(--border)', borderRadius:4, background:'transparent', cursor:'pointer', fontSize:'0.82rem', color:'var(--text-light)', fontFamily:'var(--font-body)' }}>
                🔗 Share
              </button>
              <button onClick={() => { if(!user) return navigate('/login'); API.post('/wishlist/add', { productId: id }); alert('Added to wishlist!'); }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', border:'1px solid var(--border)', borderRadius:4, background:'transparent', cursor:'pointer', fontSize:'0.82rem', color:'var(--text-light)', fontFamily:'var(--font-body)' }}>
                ♡ Wishlist
              </button>
            </div>
          </div>

          {/* Right: Info */}
          <div className="pd-info">
            <div className="pd-badge">{product.category}</div>
            <h1>{product.name}</h1>
            <div className="pd-rating">
              <span style={{ color:'var(--gold)' }}>{stars(product.rating)}</span>
              <span style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginLeft:8 }}>({product.rating}/5)</span>
            </div>

            <div className="pd-price-box">
              <span className="price">₹{Number(product.price).toLocaleString('en-IN')}</span>
              {product.original_price > product.price && <span className="orig">₹{Number(product.original_price).toLocaleString('en-IN')}</span>}
              {disc > 0 && <span className="disc">{disc}% OFF</span>}
            </div>

            <div className="pd-stock-badge">
              {product.stock > 0
                ? <span style={{ color:'var(--success)', fontWeight:500 }}>✓ In Stock ({product.stock} available)</span>
                : <span style={{ color:'var(--danger)', fontWeight:500 }}>✗ Out of Stock</span>}
            </div>

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              {[['Color', product.color], ['Occasion', product.occasion], ['Pattern', product.pattern]].map(([k,v]) => v && (
                <span key={k} style={{ padding:'4px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:20, fontSize:'0.82rem', color:'var(--text)' }}>
                  <b>{k}:</b> {v}
                </span>
              ))}
            </div>

            <hr className="pd-divider" />

            {/* Saree Specifications */}
            <h3 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', fontSize:'1.1rem', marginBottom:10, fontWeight:400 }}>Saree Specifications</h3>
            <table className="pd-spec-table">
              <tbody>
                {[['Pattern',sd.pattern],['Purity',sd.purity],['Color',sd.color||product.color],['Fabric',sd.fabric],['Length',sd.length],['Work',sd.work],['Border',sd.border]]
                  .filter(([,v]) => v).map(([k,v]) => (
                  <tr key={k}><td>{k}</td><td>{v}</td></tr>
                ))}
              </tbody>
            </table>

            {/* Blouse Specifications */}
            {(bd.fabric || bd.work || bd.border) && (
              <>
                <h3 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', fontSize:'1.1rem', marginBottom:10, fontWeight:400, marginTop:16 }}>Blouse Specifications</h3>
                <table className="pd-spec-table">
                  <tbody>
                    {[['Fabric',bd.fabric],['Work',bd.work],['Border',bd.border],['Length',bd.length],['Pattern',bd.pattern],['Color',bd.color]]
                      .filter(([,v]) => v).map(([k,v]) => (
                      <tr key={k}><td>{k}</td><td>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <hr className="pd-divider" />

            {/* CTA Buttons */}
            <div className="pd-cta">
              <button className="cta-cart" onClick={addToCart} disabled={product.stock === 0}>
                {added ? '✓ Added!' : '🛒 Add to Cart'}
              </button>
              <button className="cta-buy" onClick={buyNow} disabled={product.stock === 0 || buying}>
                {buying ? 'Processing...' : '⚡ Buy Now'}
              </button>
            </div>

            {/* Delivery info */}
            <div style={{ marginTop:18, padding:'14px 16px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.85rem' }}>
              <div style={{ marginBottom:6 }}>🚚 <b>Free Delivery</b> on orders above ₹999</div>
              <div style={{ marginBottom:6 }}>↩️ <b>Easy Returns</b> within 7 days</div>
              <div>🔒 <b>Secure Payment</b> via Razorpay UPI/Card</div>
            </div>
          </div>
        </div>

        {/* Product Description & Specifications Grid */}
        <div style={{ marginTop:50, borderTop:'1px solid var(--border)', paddingTop:40 }}>
          <div className="pd-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30 }}>
            {/* Left: Description */}
            <div style={{ background:'#fff', padding:30, borderRadius:12, boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
              <h2 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', marginBottom:20, fontSize:'1.4rem', fontWeight:400, marginTop:0 }}>Product Description</h2>
              <p style={{ color:'var(--text-light)', fontSize:'0.95rem', lineHeight:1.8, whiteSpace:'pre-line', marginBottom:25 }}>
                {product.description || 'No description available for this product.'}
              </p>
              
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:15 }}>
                <div style={{ padding:12, background:'var(--bg)', borderRadius:8 }}>
                  <h4 style={{ fontSize:'0.85rem', color:'var(--primary)', marginBottom:4, marginTop:0 }}>✨ Quality Assurance</h4>
                  <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', margin:0 }}>Each saree is hand-inspected for quality and craftsmanship.</p>
                </div>
                <div style={{ padding:12, background:'var(--bg)', borderRadius:8 }}>
                  <h4 style={{ fontSize:'0.85rem', color:'var(--primary)', marginBottom:4, marginTop:0 }}>🎨 Authentic Designs</h4>
                  <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', margin:0 }}>Traditional patterns sourced directly from master weavers.</p>
                </div>
              </div>
            </div>

            {/* Right: Technical Specifications Table (Saree & Blouse details) */}
            <div style={{ background:'#fff', padding:30, borderRadius:12, boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
              <h2 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', marginBottom:20, fontSize:'1.4rem', fontWeight:400, marginTop:0 }}>Product Specifications</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Saree Spec Table */}
                <div>
                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 10, fontSize: '0.95rem', fontWeight: 600 }}>Saree Details</h4>
                  <table className="pd-spec-table" style={{ margin: 0 }}>
                    <tbody>
                      {[['Fabric', sd.fabric], ['Purity', sd.purity], ['Work', sd.work], ['Border', sd.border], ['Length', sd.length], ['Color', sd.color || product.color]]
                        .map(([k, v]) => (
                          <tr key={k}><td style={{ width: '40%', fontWeight: 600 }}>{k}</td><td>{v || 'N/A'}</td></tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Blouse Spec Table */}
                <div>
                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 10, fontSize: '0.95rem', fontWeight: 600 }}>Blouse Details</h4>
                  <table className="pd-spec-table" style={{ margin: 0 }}>
                    <tbody>
                      {[['Fabric', bd.fabric], ['Work', bd.work], ['Border', bd.border], ['Length', bd.length], ['Pattern', bd.pattern], ['Color', bd.color || product.color]]
                        .map(([k, v]) => (
                          <tr key={k}><td style={{ width: '40%', fontWeight: 600 }}>{k}</td><td>{v || 'N/A'}</td></tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop:50 }}>
          <h2 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', marginBottom:20, fontSize:'1.5rem', fontWeight:400 }}>Customer Reviews</h2>
          {user && user.role !== 'admin' && (
            <form onSubmit={submitComment} style={{ background:'#fff', padding:22, borderRadius:10, marginBottom:22, boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
              <h4 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', marginBottom:14, fontSize:'1rem', fontWeight:400 }}>Write a Review</h4>
              <textarea className="form-control" placeholder="Share your experience with this product..." value={comment} onChange={e => setComment(e.target.value)} rows={3} style={{ marginBottom:12 }} />
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                <select className="form-select" style={{ width:160 }} value={rating} onChange={e => setRating(Number(e.target.value))}>
                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r>1?'s':''}</option>)}
                </select>
                <button type="submit" className="btn-buy" style={{ padding:'9px 22px' }}>Post Review</button>
              </div>
            </form>
          )}
          {comments.length === 0 ? (
            <p style={{ color:'var(--text-muted)', fontStyle:'italic' }}>No reviews yet. Be the first to review!</p>
          ) : comments.map(c => (
            <div key={c.id} style={{ background:'#fff', padding:18, borderRadius:8, marginBottom:12, border:'1px solid var(--border)', boxShadow:'var(--shadow)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontWeight:600, color:'var(--primary)', fontSize:'0.9rem' }}>{c.user_name}</span>
                <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              <div style={{ color:'var(--gold)', marginBottom:6, fontSize:'0.9rem' }}>{stars(c.rating)}</div>
              <p style={{ color:'var(--text-light)', fontSize:'0.9rem', margin:0 }}>{c.comment}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
