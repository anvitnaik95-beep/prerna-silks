// Admin Suppliers - Full CRUD with modal
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const empty = { name:'',contact_person:'',city:'',phone:'',email:'',gst:'',status:'Active' };

export default function Suppliers() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({...empty});

  useEffect(() => { load(); }, []);
  const load = async () => { try { const { data } = await API.get('/suppliers'); setItems(data.suppliers||[]); } catch {} };
  const set = (k,v) => setForm({...form,[k]:v});

  const openAdd = () => { setEditId(null); setForm({...empty}); setShowModal(true); };
  const openEdit = (s) => { setEditId(s.id); setForm({name:s.name,contact_person:s.contact_person||'',city:s.city,phone:s.phone,email:s.email||'',gst:s.gst||'',status:s.status}); setShowModal(true); };

  const save = async () => {
    if (!form.name||!form.city||!form.phone) { alert('Fill required fields'); return; }
    try {
      if (editId) await API.put(`/suppliers/${editId}`, form);
      else await API.post('/suppliers', form);
      setShowModal(false); load();
    } catch (e) { alert('Failed'); }
  };

  const del = async (id) => { if (!confirm('Delete?')) return; try { await API.delete(`/suppliers/${id}`); load(); } catch {} };

  return (
    <div className="admin-layout"><AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1>🚚 Suppliers</h1><button className="btn-buy" onClick={openAdd}>+ Add Supplier</button></div>
        <div className="admin-card">
          <table className="table table-hover mb-0">
            <thead><tr><th>Name</th><th>Contact</th><th>City</th><th>Phone</th><th>GST</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {items.length===0 ? <tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No suppliers. Add one to start.</td></tr> :
                items.map(s=>(
                  <tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.contact_person||'—'}</td><td>{s.city}</td><td>{s.phone}</td><td>{s.gst||'—'}</td>
                    <td><span className={`badge-status badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
                    <td><button className="btn btn-outline-primary btn-sm me-1" onClick={()=>openEdit(s)}>✏️</button><button className="btn btn-outline-danger btn-sm" onClick={()=>del(s.id)}>🗑️</button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={()=>setShowModal(false)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <h2>{editId?'Edit':'Add'} Supplier</h2>
              <div className="row g-2">
                <div className="col-6"><label className="form-label fw-bold">Name *</label><input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Contact Person</label><input className="form-control" value={form.contact_person} onChange={e=>set('contact_person',e.target.value)} /></div>
                <div className="col-6"><label className="form-label fw-bold">City *</label><input className="form-control" value={form.city} onChange={e=>set('city',e.target.value)} /></div>
                <div className="col-6"><label className="form-label fw-bold">Phone *</label><input className="form-control" value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Email</label><input className="form-control" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
                <div className="col-6"><label className="form-label">GST</label><input className="form-control" value={form.gst} onChange={e=>set('gst',e.target.value)} /></div>
                <div className="col-6"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e=>set('status',e.target.value)}><option>Active</option><option>Inactive</option><option>Blocked</option></select></div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn-buy" onClick={save}>Save</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
