// Admin Products - Full manual add/edit/delete with modal form
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const empty = { name:'',category:'Silk',price:0,original_price:0,stock:0,rating:4,color:'',occasion:'Casual',pattern:'',description:'',image:'',featured:false,
  sareeDetails:{pattern:'',purity:'',color:'',fabric:'',length:'5.5 meters',work:'',border:''},
  blouseDetails:{border:'',work:'',fabric:'',length:'0.8 meters',pattern:'',color:''} };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({...empty});
  const [images, setImages] = useState([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => { try { setLoading(true); const { data } = await API.get('/products?basic=1'); setProducts(data.products||[]); } catch {} finally { setLoading(false); } };

  const set = (k,v) => setForm({...form,[k]:v});
  const setSaree = (k,v) => setForm({...form, sareeDetails:{...form.sareeDetails,[k]:v}});
  const setBlouse = (k,v) => setForm({...form, blouseDetails:{...form.blouseDetails,[k]:v}});

  const openAdd = () => { setEditId(null); setForm({...empty, sareeDetails:{...empty.sareeDetails}, blouseDetails:{...empty.blouseDetails}}); setImages([]); setShowModal(true); };
  const openEdit = async (p) => {
    setEditId(p.id);
    try {
      const { data } = await API.get(`/products/${p.id}`);
      const prod = data.product;
      setForm({ name:prod.name, category:prod.category, price:prod.price, original_price:prod.original_price, stock:prod.stock, rating:prod.rating, color:prod.color, occasion:prod.occasion, pattern:prod.pattern, description:prod.description||'', image:prod.image||'', featured:prod.featured,
        sareeDetails: {...empty.sareeDetails, ...(prod.sareeDetails||{})}, blouseDetails: {...empty.blouseDetails, ...(prod.blouseDetails||{})} });
      setImages(prod.images || []);
    } catch (e) {
      setImages([]);
      alert('Failed to load product details');
      setForm({...empty, sareeDetails:{...empty.sareeDetails}, blouseDetails:{...empty.blouseDetails}});
    }
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name||!form.category) { alert('Name & Category required'); return; }
    try {
      const body = {...form, price:Number(form.price)||0, original_price:Number(form.original_price)||0, stock:Number(form.stock)||0, rating:Number(form.rating)||0};
      if (editId) await API.put(`/products/${editId}`, body);
      else await API.post('/products', body);
      setShowModal(false); load();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed';
      console.error('Product save error:', e.response?.status, e.response?.data || e);
      alert(msg);
    }
  };

  const del = async (id, name) => { if (!confirm(`Delete "${name}"?`)) return; try { await API.delete(`/products/${id}`); load(); } catch {} };

  const handleImageUpload = async (e, isCover) => {
    const file = e.target.files[0];
    if (!file || !editId) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('is_cover', isCover);
    setUploading(true);
    try {
      await API.post(`/products/${editId}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data } = await API.get(`/products/${editId}`);
      setImages(data.product.images || []);
      setForm(prev => ({...prev, image: data.product.image}));
      load(); // refresh list
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId) => {
    if(!confirm('Delete this image?')) return;
    try {
      await API.delete(`/products/images/${imageId}`);
      const { data } = await API.get(`/products/${editId}`);
      setImages(data.product.images || []);
      setForm(prev => ({...prev, image: data.product.image}));
      load();
    } catch(err) {
      alert('Delete failed');
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5-Math.round(r));

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1>👗 Product Management</h1><button className="btn-buy" onClick={openAdd}>+ Add Product</button></div>

        <div className="admin-card">
          <div className="admin-card-header"><h3>All Products ({filtered.length})</h3>
            <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="form-control" style={{width:220}} />
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading products...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No products found</td></tr> :
                  filtered.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td><td>{p.category}</td>
                      <td>₹{Number(p.price).toLocaleString('en-IN')}</td>
                      <td style={{color:p.stock<=5?'var(--danger)':'var(--success)',fontWeight:600}}>{p.stock}</td>
                      <td style={{color:'var(--gold)'}}>{stars(p.rating)}</td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={()=>openEdit(p)}>✏️</button>
                        <button className="btn btn-outline-danger btn-sm" onClick={()=>del(p.id,p.name)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay" onClick={()=>setShowModal(false)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:680}}>
              <h2>{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <div className="row g-2">
                <div className="col-6"><label className="form-label fw-bold">Name *</label><input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} /></div>
                <div className="col-6"><label className="form-label fw-bold">Category *</label>
                  <select className="form-select" value={form.category} onChange={e=>set('category',e.target.value)}>
                    {['Silk','Cotton','Chiffon','Georgette','Organza','Linen'].map(c=><option key={c}>{c}</option>)}
                  </select></div>
                <div className="col-4"><label className="form-label">Price (₹)</label><input type="number" className="form-control" value={form.price} onChange={e=>set('price',e.target.value)} /></div>
                <div className="col-4"><label className="form-label">Original Price</label><input type="number" className="form-control" value={form.original_price} onChange={e=>set('original_price',e.target.value)} /></div>
                <div className="col-4"><label className="form-label">Stock</label><input type="number" className="form-control" value={form.stock} onChange={e=>set('stock',e.target.value)} /></div>
                <div className="col-4"><label className="form-label">Color</label><input className="form-control" value={form.color} onChange={e=>set('color',e.target.value)} /></div>
                <div className="col-4"><label className="form-label">Occasion</label>
                  <select className="form-select" value={form.occasion} onChange={e=>set('occasion',e.target.value)}>
                    {['Wedding','Festival','Party','Casual'].map(o=><option key={o}>{o}</option>)}
                  </select></div>
                <div className="col-4"><label className="form-label">Pattern</label><input className="form-control" value={form.pattern} onChange={e=>set('pattern',e.target.value)} /></div>
                <div className="col-12"><label className="form-label">Image URL</label><input className="form-control" placeholder="https://example.com/image.jpg" value={form.image} onChange={e=>set('image',e.target.value)} /></div>
                <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={e=>set('description',e.target.value)} /></div>
              </div>

              <h5 style={{color:'var(--primary)',marginTop:16}}>Saree Details</h5>
              <div className="row g-2">
                {[['Fabric','fabric'],['Purity','purity'],['Work','work'],['Border','border'],['Length','length'],['Color','color']].map(([l,k])=>
                  <div className="col-4" key={k}><label className="form-label">{l}</label><input className="form-control form-control-sm" value={form.sareeDetails[k]||''} onChange={e=>setSaree(k,e.target.value)} /></div>
                )}
              </div>

              <h5 style={{color:'var(--primary)',marginTop:16}}>Blouse Details</h5>
              <div className="row g-2">
                {[['Fabric','fabric'],['Work','work'],['Border','border'],['Length','length'],['Pattern','pattern'],['Color','color']].map(([l,k])=>
                  <div className="col-4" key={k}><label className="form-label">{l}</label><input className="form-control form-control-sm" value={form.blouseDetails[k]||''} onChange={e=>setBlouse(k,e.target.value)} /></div>
                )}
              </div>

              {editId ? (
                <div className="mt-4 pt-3 border-top">
                  <h5 style={{color:'var(--primary)'}}>Product Images</h5>
                  <div className="d-flex gap-3 mb-3">
                    <div>
                      <label className="btn btn-sm btn-outline-primary" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload Cover Image'}
                        <input type="file" hidden accept="image/*" onChange={e => handleImageUpload(e, true)} />
                      </label>
                    </div>
                    <div>
                      <label className="btn btn-sm btn-outline-secondary" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload Gallery Image'}
                        <input type="file" hidden accept="image/*" onChange={e => handleImageUpload(e, false)} />
                      </label>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {images.map(img => {
                      const imgId = img.id || img._id;
                      return (
                      <div key={imgId} style={{position:'relative', width:100, height:100, border:'1px solid #ccc', borderRadius:4, overflow:'hidden'}}>
                        <img src={img.image_url} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                        {img.is_cover ? <span className="badge bg-primary position-absolute top-0 start-0" style={{fontSize:'0.6rem'}}>Cover</span> : null}
                        <button className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0" style={{width:20,height:20,lineHeight:'10px'}} onClick={() => deleteImage(imgId)}>&times;</button>
                      </div>
                      );
                    })}
                    {images.length === 0 && <span className="text-muted small">No images uploaded yet.</span>}
                  </div>
                </div>
              ) : (
                <div className="alert alert-info mt-4 mb-0 py-2 small">Save the product first to upload images.</div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn-buy" onClick={save}>Save Product</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
