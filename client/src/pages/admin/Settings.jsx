// Admin Settings
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5-Math.round(r));

export default function Settings() {
  const [feedback, setFeedback] = useState([]);
  const [bannerUrls, setBannerUrls] = useState(['']);
  const [notifStatus, setNotifStatus] = useState(null);

  useEffect(() => { loadFeedback(); loadSettings(); loadNotifStatus(); }, []);
  
  const loadNotifStatus = async () => {
    try { const { data } = await API.get('/admin/notification-status'); setNotifStatus(data); } catch {}
  };

  const loadFeedback = async () => { try { const { data } = await API.get('/feedback'); setFeedback(data.feedback||[]); } catch {} };
  
  const loadSettings = async () => { 
    try { 
      const { data } = await API.get('/settings/hero_banner'); 
      if (data.success && data.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed)) setBannerUrls(parsed.length ? parsed : ['']);
          else setBannerUrls([data.value]);
        } catch {
          setBannerUrls([data.value]);
        }
      } 
    } catch {} 
  };

  const handleSaveBanner = async () => {
    try {
      const validUrls = bannerUrls.filter(u => u.trim() !== '');
      await API.post('/admin/settings/hero_banner', { value: JSON.stringify(validUrls) });
      alert('Banners updated successfully! They will appear on the homepage slider.');
    } catch (error) {
      alert('Failed to update banner');
    }
  };

  const updateBanner = (index, value) => {
    const newBanners = [...bannerUrls];
    newBanners[index] = value;
    setBannerUrls(newBanners);
  };

  const addBanner = () => setBannerUrls([...bannerUrls, '']);
  const removeBanner = (index) => setBannerUrls(bannerUrls.filter((_, i) => i !== index));

  return (
    <div className="admin-layout"><AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1>⚙️ Settings</h1></div>

        <div className="admin-card" style={{padding:28}}>
          <h4 style={{fontFamily:'var(--font-heading)',marginBottom:18}}>Homepage Banners</h4>
          <p className="text-muted small">Add multiple image URLs to create a scrolling hero banner on the home page.</p>
          
          {bannerUrls.map((url, i) => (
            <div key={i} className="row g-2 align-items-center mb-3">
              <div className="col-md-9">
                <input className="form-control" placeholder="https://..." value={url} onChange={e => updateBanner(i, e.target.value)} />
              </div>
              <div className="col-md-3 d-flex gap-2">
                {bannerUrls.length > 1 && <button className="btn btn-outline-danger btn-sm" onClick={() => removeBanner(i)}>Remove</button>}
              </div>
              {url && (
                <div className="col-12 mt-2">
                  <img src={url} alt={`Preview ${i+1}`} style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>
          ))}
          
          <div className="d-flex gap-2 mt-3 pt-3 border-top">
            <button className="btn btn-outline-secondary" onClick={addBanner}>+ Add Another Banner</button>
            <button className="btn-buy" onClick={handleSaveBanner}>Save All Banners</button>
          </div>
        </div>

        <div className="admin-card mt-3" style={{padding:28}}>
          <h4 style={{fontFamily:'var(--font-heading)',marginBottom:18}}>Store Information</h4>
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label">Store Name</label><input className="form-control" defaultValue="Prerna Silks" /></div>
            <div className="col-md-6"><label className="form-label">Owner Name</label><input className="form-control" defaultValue="Prerna" /></div>
            <div className="col-md-6"><label className="form-label">Location</label><input className="form-control" defaultValue="CBT Hubli, Karnataka" /></div>
            <div className="col-md-6"><label className="form-label">Phone</label><input className="form-control" defaultValue="+91 98765 43210" /></div>
            <div className="col-md-6"><label className="form-label">Business Hours</label><input className="form-control" defaultValue="10 AM - 9 PM" /></div>
          </div>
          <button className="btn-buy mt-3" onClick={()=>alert('Settings saved!')}>Save Information</button>
        </div>

        {/* <div className="admin-card mt-3" style={{padding:28}}>
          <h4 style={{fontFamily:'var(--font-heading)',marginBottom:18}}>Customer Feedback ({feedback.length})</h4>
          {feedback.length===0 ? <p style={{color:'var(--text-muted)'}}>No feedback yet</p> :
            feedback.map(f=>(
              <div key={f.id} style={{background:'#F9FAFB',padding:14,borderRadius:8,marginBottom:10,borderLeft:'4px solid var(--gold)'}}>
                <strong>{f.name}</strong> <span style={{color:'var(--gold)'}}>{stars(f.rating)}</span>
                <p style={{marginTop:5,marginBottom:3}}>{f.message}</p>
                <small style={{color:'var(--text-muted)'}}>{new Date(f.created_at).toLocaleDateString()}</small>
              </div>
            ))
          }
        </div> */}

        <div className="admin-card mt-3" style={{padding:28}}>
          <h4 style={{fontFamily:'var(--font-heading)',marginBottom:18}}>🔔 Notification Status</h4>
          <div style={{fontSize:'0.88rem'}}>
            {!notifStatus ? (
              <p style={{color:'var(--text-muted)'}}>Loading configuration...</p>
            ) : (
              <>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>📧 SMTP Email</span>
                  <span style={{fontWeight:600,color:notifStatus.smtp.configured?'#28a745':'#dc3545'}}>
                    {notifStatus.smtp.configured ? '✅ Configured ('+notifStatus.smtp.user+')' : '❌ Not configured'}
                  </span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>💬 WhatsApp Cloud API</span>
                  <span style={{fontWeight:600,color:notifStatus.whatsapp?.configured?'#28a745':'#ffc107'}}>
                    {notifStatus.whatsapp?.configured ? '✅ Connected' : '⏳ Pending setup'}
                  </span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>👤 Admin Email</span><span>{notifStatus.admin.email || 'Not set'}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0'}}>
                  <span>📞 Admin Phone</span><span>{notifStatus.admin.phone || 'Not set'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="admin-card mt-3" style={{ padding: 28, border: '1px solid #f5c6cb', background: '#fff5f5', borderRadius: 12 }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', color: '#721c24', marginBottom: 12 }}>⚠️ RESET DETAILS</h4>
          <p style={{ fontSize: '0.88rem', color: '#721c24', marginBottom: 20 }}>
            Wipe entire database tables (Orders, Reviews, feedback, Expenses, Bills) from the admin portal. 
            This action is irreversible and requires double password authentication.
          </p>
          <button 
            onClick={async () => {
              const p1 = prompt('⚠️ALERT: This will wipe all orders, comments, bills, feedback, and expenses.\nEnter your password to verify:');
              if (p1 === null || p1.trim() === '') return;

              const p2 = prompt('CONFIRMATION REQUIRED: Please re-enter your password to proceed with deletion:');
              if (p2 === null || p2.trim() === '') return;

              if (p1 !== p2) {
                alert('Passwords do not match. Operation cancelled.');
                return;
              }

              try {
                const { data } = await API.post('/admin/delete-all-data', { password: p1 });
                if (data.success) {
                  alert(`Success! Wiped:\n- ${data.counts.orders} Orders\n- ${data.counts.comments} Comments\n- ${data.counts.expenses} Expenses\n- ${data.counts.feedback} Feedback\n- ${data.counts.bills} Bills`);
                  window.location.reload();
                }
              } catch (err) {
                alert(err.response?.data?.message || 'Verification failed. Password may be incorrect.');
              }
            }}
            className="btn btn-danger" 
            style={{ padding: '10px 24px', fontWeight: 600, background: '#c62828', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer' }}
          >
            Wipe Portal Database
          </button>
        </div>
      </main>
    </div>
  );
}

