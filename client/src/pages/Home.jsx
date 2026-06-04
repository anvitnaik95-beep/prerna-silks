import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useOrderList } from '../components/OrderList';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeedbackPopup from '../components/FeedbackPopup';

const categories = ['Silk','Cotton','Chiffon','Georgette','Organza','Linen'];
const colors = ['Red','Blue','Green','Maroon','Purple','Pink','White','Beige','Orange'];
const occasions = ['Wedding','Festival','Party','Casual'];
const patterns = ['Zari','Floral','Geometric','Plain','Ikat','Embroidered','Sequin','Striped','Painted'];
const fabrics = ['Katan Silk','Soft Silk','Organza','Georgette','Cotton','Chiffon','Linen','Mashru Silk','Tissue','Art Silk','Tussar Silk','Viscose'];

const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

const WishIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>;
const ShareIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/></svg>;
const EnquiryIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>;

const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&h=520&fit=crop',
    title: 'Timeless Silk Elegance',
    sub: 'Pure Kanjivaram & Banarasi collections'
  },
  {
    url: 'https://images.unsplash.com/photo-1610030470298-40b8a1c22d15?w=1400&h=520&fit=crop',
    title: 'Wedding Specials',
    sub: 'Curated bridal sarees for your big day'
  },
  {
    url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=1400&h=520&fit=crop',
    title: 'Festival Collection',
    sub: 'Celebrate every occasion in style'
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('');
  const [search, setSearch] = useState('');
  const [slide, setSlide] = useState(0);
  const [bannerSlides, setBannerSlides] = useState(HERO_SLIDES);
  const [cartItemIds, setCartItemIds] = useState([]);
  const [brokenImages, setBrokenImages] = useState({});
  const [brokenHoverImages, setBrokenHoverImages] = useState({});
  const timerRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useOrderList();
  const { search: urlSearch } = useLocation();

  const nextSlide = useCallback(() => setSlide(s => (s + 1) % bannerSlides.length), [bannerSlides.length]);
  const prevSlide = () => setSlide(s => (s - 1 + bannerSlides.length) % bannerSlides.length);

  useEffect(() => {
    timerRef.current = setInterval(nextSlide, 4500);
    return () => clearInterval(timerRef.current);
  }, [nextSlide]);

  useEffect(() => {
    const params = new URLSearchParams(urlSearch);
    const newFilters = {};
    if (params.get('category')) newFilters.category = params.get('category');
    if (params.get('occasion')) newFilters.occasion = params.get('occasion');
    if (Object.keys(newFilters).length > 0) setFilters(newFilters);
  }, [urlSearch]);

  useEffect(() => { fetchProducts(); }, [filters, sortBy, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('basic', 'true');
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (sortBy) params.set('sort', sortBy);
      if (search) params.set('search', search);
      const { data } = await API.get(`/products?${params.toString()}`);
      setProducts(data.products || []);
    } catch { setProducts([]); }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      API.get('/cart').then(({ data }) => {
        if (data.items) {
          setCartItemIds(data.items.map(item => item.productId || item.id || item._id));
        }
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    API.get('/settings/hero_banner').then(({ data }) => {
      if (data.success && data.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBannerSlides(parsed.map(url => ({ url, title: 'Prerna Silks', sub: 'Premium Saree Collection' })));
          } else {
            setBannerSlides([{ url: data.value, title: 'Prerna Silks', sub: 'Premium Saree Collection' }]);
          }
        } catch {
          setBannerSlides([{ url: data.value, title: 'Prerna Silks', sub: 'Premium Saree Collection' }, ...HERO_SLIDES.slice(1)]);
        }
      }
    }).catch(() => {});
  }, []);

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }));
  const clearFilters = () => { setFilters({}); setSortBy(''); setSearch(''); };

  const addToCart = async (e, productId) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (cartItemIds.includes(productId)) {
      return navigate('/cart');
    }
    try { 
      await API.post('/cart/add', { productId, quantity: 1 }); 
      setCartItemIds(prev => [...prev, productId]);
      alert('Added to cart!'); 
    } catch { alert('Failed'); }
  };

  const toggleWishlist = async (e, productId) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    try { const { data } = await API.post('/wishlist/add', { productId }); alert(data.message); } catch { alert('Failed'); }
  };

  const showHero = !search && Object.keys(filters).length === 0;

  return (
    <>
      <Header onSearch={setSearch} />

      {/* Hero Slider - Amazon style with bottom blur */}
      {showHero && (
        <section className="hero-slider">
          {bannerSlides.map((s, i) => (
            <div key={i} style={{ display: i === slide ? 'block' : 'none' }}>
              <div className="hero-slide-inner">
                <img 
                  src={s.url} 
                  alt={s.title} 
                  onError={(e) => {
                    if (e.target.src.includes('unsplash')) {
                      e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&h=520&fit=crop';
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
                <div className="hero-blur-bottom" />
                <div className="hero-text-overlay">
                  <div className="hero-label">Prerna Silks</div>
                  <div className="hero-title">{s.title}</div>
                  <div className="hero-sub">{s.sub}</div>
                  <button className="hero-btn" onClick={() => { const el = document.getElementById('shop'); const h = document.querySelector('.site-header'); const off = h ? h.offsetHeight : 0; if (el) { const top = el.getBoundingClientRect().top + window.pageYOffset - off; window.scrollTo({ top, behavior: 'smooth' }); } }}>Shop Now</button>
                </div>
              </div>
            </div>
          ))}
          <div className="hero-arrows">
            <button className="hero-prev" onClick={prevSlide}>‹</button>
            <button className="hero-next" onClick={nextSlide}>›</button>
          </div>
          <div className="hero-dots">
            {bannerSlides.map((_, i) => (
              <button key={i} className={`hero-dot${slide === i ? ' active' : ''}`} onClick={() => setSlide(i)} />
            ))}
          </div>
        </section>
      )}

      {/* Category Quick Links */}
      {showHero && (
        <div className="category-pills">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter('category', cat)}
              style={{ flexShrink:0, padding:'7px 18px', borderRadius:'20px', border:`1.5px solid ${filters.category===cat?'var(--primary)':'var(--border)'}`, background:filters.category===cat?'var(--primary)':'var(--bg-card)', color:filters.category===cat?'#fff':'var(--text)', cursor:'pointer', fontSize:'0.85rem', fontFamily:'var(--font-body)', transition:'all 0.25s' }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Shop Layout */}
      <div id="shop" className="shop-layout">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          <div className="filter-section">
            <h4>Price Range</h4>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input type="number" placeholder="Min" className="form-control" style={{ padding:'7px 10px' }} onChange={e => setFilter('minPrice', e.target.value)} />
              <input type="number" placeholder="Max" className="form-control" style={{ padding:'7px 10px' }} onChange={e => setFilter('maxPrice', e.target.value)} />
            </div>
            <button onClick={fetchProducts} className="btn-buy" style={{ width:'100%', padding:'9px' }}>Apply</button>
          </div>
          {[{title:'Categories',items:categories,key:'category'},{title:'Fabric',items:fabrics,key:'fabric'},
            {title:'Color',items:colors,key:'color'},
            {title:'Occasion',items:occasions,key:'occasion'},{title:'Pattern',items:patterns,key:'pattern'}].map(s => (
            <div className="filter-section" key={s.key}>
              <h4>{s.title}</h4>
              {s.items.map(item => (
                <label className="filter-option" key={item}>
                  <input type="checkbox" checked={filters[s.key]===item} onChange={() => setFilter(s.key, item)} /> {item}
                </label>
              ))}
            </div>
          ))}
          <div className="filter-section">
            <h4>Rating</h4>
            {[4,3,2].map(r => (
              <label className="filter-option" key={r}>
                <input type="radio" name="rating" checked={filters.rating===String(r)} onChange={() => setFilter('rating', String(r))} /> {r}★ & above
              </label>
            ))}
          </div>
          <button onClick={clearFilters} className="btn-cart" style={{ width:'100%', padding:'9px', marginTop:'8px' }}>Clear All</button>
        </aside>

        {/* Products */}
        <main style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
            <h2 style={{ fontFamily:'var(--font-heading)', color:'var(--primary)', fontSize:'1.5rem', fontWeight:400 }}>
              Our Collection <span style={{ fontSize:'0.85rem', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>({products.length} sarees)</span>
            </h2>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding:'8px 14px', border:'1.5px solid var(--border)', borderRadius:30, fontFamily:'var(--font-body)', outline:'none', background:'transparent', color:'var(--text)', fontSize:'0.88rem' }}>
              <option value="">Sort By</option>
              <option value="price_asc">Price: Low→High</option>
              <option value="price_desc">Price: High→Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'100px 0', color:'var(--text-muted)' }}>
              <div style={{
                width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)',
                borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite',
                display: 'inline-block'
              }} className="loading-spinner" />
              <p style={{ fontSize: '0.92rem', color: 'var(--text-light)' }}>Loading our collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{
              textAlign:'center', padding:'80px 20px', color:'var(--text-muted)',
              background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', marginBottom: 16, opacity: 0.8 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontWeight: 400, marginBottom: 8 }}>No Products Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 400, margin: '0 auto 20px' }}>
                We couldn't find any sarees matching your active filters. Try clearing your filters or widening your price range.
              </p>
              <button className="btn-buy" style={{ padding:'10px 28px', fontSize: '0.9rem' }} onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => {
                const disc = p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
                const imgs = p.images || [];
                const img1 = imgs[0]?.image_url || p.image || '';
                const img2 = imgs[1]?.image_url || '';
                const moq = p.moq || 5;
                const lotPrice = Number(p.price) * moq;
                const badgeColors = { 'New Arrival':'var(--success)', 'High Demand':'var(--danger)', 'Low MOQ':'var(--gold)', 'Pre-Order':'var(--primary)', 'Ready Stock':'#2ecc71', "Today's Deal":"#e67e22", 'Out of Stock':'#888' };
                const badge = p.badge || (p.stock === 0 ? 'Out of Stock' : '');
                const imgBroken = brokenImages[p.id];
                return (
                  <div className="product-card" key={p.id} onClick={() => navigate(`/product/${p.id}`)}>
                    <div className={`product-img${img2 && !brokenHoverImages[p.id] ? ' has-hover' : ''}`}>
                      {img1 && !imgBroken ? (
                        <>
                          <img className="img-main" src={img1} alt={p.name} onError={() => setBrokenImages(prev => ({...prev, [p.id]: true}))} />
                          {img2 && <img className="img-hover" src={img2} alt={p.name} onError={() => setBrokenHoverImages(prev => ({...prev, [p.id]: true}))} />}
                        </>
                      ) : (
                        <div style={{ display:'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center', height:'100%', background: '#fafafa', color: 'var(--text-light)' }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20.37 8.91l-8-1.7a2 2 0 0 0-1.71.4l-7 5.61A2 2 0 0 0 3 14.8v4.2A2 2 0 0 0 5 21h14a2 2 0 0 0 2-2v-8.2a2 2 0 0 0-.63-1.89z" />
                            <path d="M12 2v6" />
                            <path d="M9 4l6 4" />
                          </svg>
                          <span style={{ fontSize: '0.78rem', marginTop: 8 }}>No Image Available</span>
                        </div>
                      )}
                      {badge && <div style={{ position:'absolute', top:8, left:8, background:badgeColors[badge]||'var(--primary)', color:'#fff', padding:'2px 8px', borderRadius:3, fontSize:'0.7rem', fontWeight:600, zIndex:2 }}>{badge}</div>}
                      <button className="wish-btn" onClick={e => toggleWishlist(e, p.id)}><WishIcon /></button>
                      <button className="share-btn" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin+'/product/'+p.id); alert('Link copied!'); }}><ShareIcon /></button>
                      <button className="quick-view-btn" onClick={e => { e.stopPropagation(); navigate(`/product/${p.id}`); }}>View Details</button>
                    </div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-rating">{stars(p.rating)} <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>({p.rating})</span></div>
                      <div className="product-price">
                        <span className="current">₹{lotPrice.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize:'0.74rem', color:'var(--text-muted)', marginLeft:4 }}>/ {moq} pcs</span>
                        {p.original_price > p.price && <span className="original">₹{(Number(p.original_price)*moq).toLocaleString('en-IN')}</span>}
                        {disc > 0 && <span className="discount">{disc}% OFF</span>}
                      </div>
                      <div style={{ fontSize:'0.76rem', color:'var(--text-muted)', marginBottom:4 }}>₹{Number(p.price).toLocaleString('en-IN')}/pc · MOQ {moq} pcs</div>
                      {p.colorCount > 0 && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:6 }}>{p.colorCount} Colors</div>}
                      <div className="product-actions">
                        <button className="btn-buy" onClick={e => { e.stopPropagation(); addItem({ id:p.id, name:p.name, price:p.price, image:img1, moq }); }} style={{ display:'flex', alignItems:'center', gap:'5px', flex:1, justifyContent:'center' }}>
                          <EnquiryIcon /> Enquiry B2B Price
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />
      <FeedbackPopup />
    </>
  );
}
