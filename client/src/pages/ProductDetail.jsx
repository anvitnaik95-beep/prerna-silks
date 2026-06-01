import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useOrderList } from '../components/OrderList';
import Header from '../components/Header';
import Footer from '../components/Footer';

const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const ShareLinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const HeartIconPD = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const ChatIconPD = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const PaletteIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.5-8-10-8z"/></svg>;
const BoxIconPD = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const TruckIconPD = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const CheckIconPD = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const CrossIconPD = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SparkleIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.45 4.93L18 8.5l-3.72 2.73L16 16.5l-4-2.7-4 2.7 1.72-5.27L6 8.5l4.55-.57z"/></svg>;

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
  const [hasReviewed, setHasReviewed] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [reviewImage, setReviewImage] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const [lbZoom, setLbZoom] = useState(false);
  const { addItem } = useOrderList();

  useEffect(() => { loadProduct(); loadComments(); checkUserReview(); checkCart(); }, [id, user]);

  const checkCart = async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/cart');
      if (data.items && data.items.some(item => item.id === id || item.productId === id || item._id === id)) {
        setInCart(true);
      }
    } catch {}
  };

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

  const checkUserReview = async () => {
    if (!user || user.role === 'admin') return;
    try {
      const { data } = await API.get(`/comments/check/${id}`);
      if (data.success) {
        setHasReviewed(data.hasReviewed);
      }
    } catch {}
  };

  const addToCart = async () => {
    if (!user) return navigate('/login');
    if (inCart) return navigate('/cart');
    try {
      await API.post('/cart/add', { productId: id, quantity: 1 });
      setAdded(true);
      setInCart(true);
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
      const formData = new FormData();
      formData.append('productId', id);
      formData.append('comment', comment);
      formData.append('rating', rating);
      if (reviewImage) {
        formData.append('reviewImage', reviewImage);
      }

      await API.post('/comments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setComment('');
      setReviewImage(null);
      setHasReviewed(true);
      loadComments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post review');
    }
  };

  const allImages = product
    ? (product.images && product.images.length > 0 ? product.images.map(i => i.image_url) : [product.image].filter(Boolean))
    : [];

  const selectImage = (url, idx) => { setActiveImage(url); setActiveIdx(idx); };

  if (!product) return (
    <>
      <Header />
      <div style={{ textAlign:'center', padding:'100px 0', color:'var(--text-muted)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-muted)', opacity:0.4 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
        </div>
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
                onMouseEnter={() => setZoom(true)}
                onMouseMove={e => { const r=e.target.getBoundingClientRect(); setZoomPos({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 }); }}
                onMouseLeave={() => setZoom(false)}
                onClick={() => setLightbox(true)}
                style={{ transform:zoom?'scale(2)':'scale(1)', transformOrigin:`${zoomPos.x}% ${zoomPos.y}%`, transition:'transform 0.1s ease-out', cursor:'zoom-in' }}
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
                <ShareLinkIcon /> Share
              </button>
              <button onClick={() => { if(!user) return navigate('/login'); API.post('/wishlist/add', { productId: id }); alert('Added to wishlist!'); }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', border:'1px solid var(--border)', borderRadius:4, background:'transparent', cursor:'pointer', fontSize:'0.82rem', color:'var(--text-light)', fontFamily:'var(--font-body)' }}>
                <HeartIconPD /> Wishlist
              </button>
            </div>
          </div>

          {/* Lightbox */}
          {lightbox && (
            <div onClick={() => { setLightbox(false); setLbZoom(false); }} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', overflow:'auto' }}>
              <img src={activeImage} alt={product.name} onClick={e => { e.stopPropagation(); setLbZoom(!lbZoom); }} style={{ maxWidth:lbZoom?'none':'90%', maxHeight:lbZoom?'none':'90%', width:lbZoom?'auto':'auto', height:lbZoom?'auto':'auto', cursor:lbZoom?'zoom-out':'zoom-in', borderRadius:4, transition:'all 0.2s' }} />
            </div>
          )}

          {/* Right: Info */}
          <div className="pd-info">
            <div className="pd-badge">{product.category}</div>
            <h1>{product.name}</h1>
            <div className="pd-rating">
              <span style={{ color:'var(--gold)' }}>{stars(product.rating)}</span>
              <span style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginLeft:8 }}>({product.rating}/5)</span>
            </div>

            <div className="pd-price-box">
              <span className="price">₹{(Number(product.price) * (product.moq || 5)).toLocaleString('en-IN')}</span>
              <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginLeft:6 }}>/ {product.moq || 5} pcs lot</span>
              {product.original_price > product.price && <span className="orig">₹{(Number(product.original_price) * (product.moq || 5)).toLocaleString('en-IN')}</span>}
              {disc > 0 && <span className="disc">{disc}% OFF</span>}
            </div>
            <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:8 }}>₹{Number(product.price).toLocaleString('en-IN')}/pc · MOQ {product.moq || 5} pcs</div>

            <div className="pd-stock-badge">
              {product.stock > 0
                ? <span style={{ color:'var(--success)', fontWeight:500 }}>✓ Wholesale Available</span>
                : <span style={{ color:'var(--danger)', fontWeight:500 }}>✗ Currently Unavailable</span>}
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
              <button className="cta-buy" onClick={() => addItem({ id:product.id, name:product.name, price:product.price, image: activeImage, moq: product.moq })} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <ChatIconPD /> Enquire B2B Price
              </button>
            </div>

            {/* Colors available */}
            {product.colorCount > 0 && (
              <div style={{ marginTop:12, fontSize:'0.88rem', color:'var(--text-muted)' }}>
                <span style={{ fontWeight:600, color:'var(--text)' }}><PaletteIcon /> {product.colorCount} Colors</span> available
              </div>
            )}

            {/* Delivery info */}
            <div style={{ marginTop:18, padding:'14px 16px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.85rem' }}>
              <div style={{ marginBottom:6, display:'flex', alignItems:'center', gap:8 }}><BoxIconPD /> <b>Bulk Orders</b> — Flexible MOQ</div>
              <div style={{ marginBottom:6, display:'flex', alignItems:'center', gap:8 }}><TruckIconPD /> <b>Pan India Shipping</b> — Reliable delivery</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}><ChatIconPD /> <b>WhatsApp Enquiry</b> — Quick response</div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div style={{ marginTop:50, borderTop:'1px solid var(--border)', paddingTop:40 }}>
          <div style={{ background:'#fff', padding:30, borderRadius:12, boxShadow:'var(--shadow)', border:'1px solid var(--border)', maxWidth:800, margin:'0 auto' }}>
            <h2 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', marginBottom:20, fontSize:'1.4rem', fontWeight:400, marginTop:0 }}>Product Description</h2>
            <p style={{ color:'var(--text-light)', fontSize:'0.95rem', lineHeight:1.8, whiteSpace:'pre-line', marginBottom:25 }}>
              {product.description || 'No description available for this product.'}
            </p>
            
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:15 }}>
              <div style={{ padding:12, background:'var(--bg)', borderRadius:8 }}>
                <h4 style={{ fontSize:'0.85rem', color:'var(--primary)', marginBottom:4, marginTop:0, display:'flex', alignItems:'center', gap:6 }}><SparkleIcon /> Quality Assurance</h4>
                <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', margin:0 }}>Each saree is hand-inspected for quality and craftsmanship.</p>
              </div>
              <div style={{ padding:12, background:'var(--bg)', borderRadius:8 }}>
                <h4 style={{ fontSize:'0.85rem', color:'var(--primary)', marginBottom:4, marginTop:0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6}}><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.5-8-10-8z"/></svg> Authentic Designs</h4>
                <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', margin:0 }}>Traditional patterns sourced directly from master weavers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop:50 }}>
          <h2 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', marginBottom:20, fontSize:'1.5rem', fontWeight:400 }}>Customer Reviews</h2>
          
          {user && user.role !== 'admin' && (
            hasReviewed ? (
              <div style={{
                background: 'var(--bg)', border: '1.5px dashed var(--border)', borderRadius: 10,
                padding: '20px 24px', marginBottom: 22, textAlign: 'center', color: 'var(--text-light)'
              }}>
                <span style={{ fontSize: '1.2rem', marginRight: 8 }}>✓</span>
                You have already submitted a review for this product. Thank you for your feedback!
              </div>
            ) : (
              <form onSubmit={submitComment} style={{ background:'#fff', padding:22, borderRadius:10, marginBottom:22, boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
                <h4 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', marginBottom:14, fontSize:'1rem', fontWeight:400 }}>Write a Review</h4>
                <textarea className="form-control" placeholder="Share your experience with this product..." value={comment} onChange={e => setComment(e.target.value)} rows={3} style={{ marginBottom:12 }} />
                
                {/* Photo Attach Input */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 500, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Attach a Photo (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setReviewImage(e.target.files[0])} 
                    style={{ fontSize: '0.85rem' }} 
                  />
                  {reviewImage && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: 4 }}>
                      ✓ Selected: {reviewImage.name}
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  <select className="form-select" style={{ width:160 }} value={rating} onChange={e => setRating(Number(e.target.value))}>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r>1?'s':''}</option>)}
                  </select>
                  <button type="submit" className="btn-buy" style={{ padding:'9px 22px' }}>Post Review</button>
                </div>
              </form>
            )
          )}

          {!user && (
            <div style={{
              background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
              padding: '20px 24px', marginBottom: 22, textAlign: 'center', color: 'var(--text-muted)'
            }}>
              Please <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Login</Link> to write a review.
            </div>
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
              {c.image && (
                <div style={{ marginTop: 12 }}>
                  <img 
                    src={c.image} 
                    alt="Customer uploaded review" 
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover' }} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
