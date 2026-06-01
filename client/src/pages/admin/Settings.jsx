// Admin Settings
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const MailIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const ChatIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;
const PhoneIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const AlertIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const CrossIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

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
        <div className="admin-header"><h1><SettingsIcon /> Settings</h1></div>

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
          <h4 style={{fontFamily:'var(--font-heading)',marginBottom:18}}><BellIcon /> Notification Status</h4>
          <div style={{fontSize:'0.88rem'}}>
            {!notifStatus ? (
              <p style={{color:'var(--text-muted)'}}>Loading configuration...</p>
            ) : (
              <>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                  <span><MailIcon /> SendGrid Email</span>
                  <span style={{fontWeight:600,color:notifStatus.sendgrid?.configured?'#28a745':'#dc3545'}}>
                    {notifStatus.sendgrid?.configured ? <><CheckIcon /> Configured ({notifStatus.sendgrid?.maskedKey})</> : <><CrossIcon /> Not configured</>}
                  </span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                  <span><ChatIcon /> WhatsApp Cloud API</span>
                  <span style={{fontWeight:600,color:notifStatus.whatsapp?.configured?'#28a745':'#dc3545'}}>
                    {notifStatus.whatsapp?.configured ? <><CheckIcon /> Connected ({notifStatus.whatsapp?.maskedToken})</> : <><CrossIcon /> Not configured</>}
                  </span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                  <span><UserIcon /> Admin Email</span><span>{notifStatus.admin.email || 'Not set'}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0'}}>
                  <span><PhoneIcon /> Admin Phone</span><span>{notifStatus.admin.phone || 'Not set'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="admin-card mt-3" style={{ padding: 28, border: '1px solid #f5c6cb', background: '#fff5f5', borderRadius: 12 }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', color: '#721c24', marginBottom: 12 }}><AlertIcon /> RESET DETAILS</h4>
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

