import { useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FeedbackPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '', rating: 5 });
  const [msg, setMsg] = useState('');

  // Hide feedback popup entirely if logged in user is an admin
  if (user && user.role === 'admin') {
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.message) return;
    try {
      const { data } = await API.post('/feedback', form);
      setMsg('Thank you for your feedback!');
      setForm({ name: '', email: '', message: '', rating: 5 });
      
      // Auto-open WhatsApp to send feedback to admin
      if (data.adminWhatsAppUrl) {
        window.open(data.adminWhatsAppUrl, '_blank');
      }
      
      setTimeout(() => { setMsg(''); setOpen(false); }, 3000);
    } catch { setMsg('Failed to submit'); }
  };

  return (
    <div className="feedback-float">
      {open && (
        <div className="feedback-form" style={{ borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px 0', fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '1rem', fontWeight: 600 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Share Feedback
          </h4>
          {msg && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: 8, fontWeight: 500 }}>{msg}</p>}
          <form onSubmit={submit}>
            <input placeholder="Name (optional)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input placeholder="Email (optional)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            
            {/* Star Rating Selector */}
            <div style={{ display: 'flex', gap: 6, margin: '8px 0', justifyContent: 'center' }}>
              {[1,2,3,4,5].map(star => (
                <span 
                  key={star}
                  onClick={() => setForm({...form, rating: star})}
                  style={{ 
                    fontSize: '1.6rem', cursor: 'pointer', 
                    color: star <= form.rating ? 'var(--gold, #D4AF37)' : '#ddd',
                    transition: 'transform 0.15s'
                  }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                >★</span>
              ))}
            </div>
            
            <textarea placeholder="Your feedback..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
            <button type="submit" className="btn-buy" style={{ width: '100%', marginTop: '6px' }}>Send Feedback</button>
          </form>
        </div>
      )}
      <button 
        className="feedback-toggle" 
        onClick={() => setOpen(!open)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          background: 'var(--primary)', 
          color: '#fff', 
          border: 'none', 
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(82, 18, 32, 0.3)'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
