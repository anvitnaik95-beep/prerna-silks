import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import API from '../services/api';

const CATEGORIES = ['Sarees', 'Suits', 'Dupattas', 'Lehengas', 'Fabric', 'Mixed Order'];
const FABRICS = ['Katan Silk', 'Cotton', 'Georgette', 'Zari', 'Chiffon', 'Organza', 'Linen', 'Velvet', 'Tissue', 'Raw Silk', 'Tussar', 'Pattu'];
const OCCASIONS = ['Wedding', 'Festival', 'Party', 'Casual', 'Corporate', 'Bridal', 'Pooja', 'Reception'];
const TIMELINES = ['Urgent', 'Within 7 days', 'Within 15 days', 'Flexible'];

const s = {
  page: { background: 'var(--bg)', minHeight: '100vh' },
  hero: {
    background: 'linear-gradient(135deg, var(--primary) 0%, #1a0a0e 100%)',
    padding: '80px 24px 72px', textAlign: 'center', position: 'relative',
    overflow: 'hidden'
  },
  heroOverlay: {
    position: 'absolute', inset: 0, opacity: 0.04,
    backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px)',
    backgroundSize: '40px 40px'
  },
  heroTitle: {
    fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
    color: '#fff', fontWeight: 400, position: 'relative', zIndex: 1,
    letterSpacing: '1px'
  },
  heroSub: {
    fontFamily: 'var(--font-body)', fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
    color: 'rgba(255,255,255,0.7)', marginTop: 10, position: 'relative', zIndex: 1,
    maxWidth: 600, margin: '10px auto 0'
  },
  heroBadge: {
    display: 'inline-block', padding: '6px 20px',
    background: 'rgba(211,177,96,0.18)', border: '1px solid rgba(211,177,96,0.35)',
    borderRadius: 30, color: 'var(--gold)', fontSize: '0.78rem',
    letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16,
    fontFamily: 'var(--font-body)', position: 'relative', zIndex: 1
  },
  layout: {
    display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32,
    maxWidth: 1200, margin: '0 auto', padding: '44px 24px 64px',
    alignItems: 'start'
  },
  formCard: {
    background: 'var(--bg-card)', borderRadius: 12, padding: 36,
    boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
  },
  sidebar: {
    background: 'var(--bg-card)', borderRadius: 12, padding: 28,
    boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
    position: 'sticky', top: 90
  },
  sectionTitle: {
    fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--primary)',
    fontWeight: 400, marginBottom: 20, paddingBottom: 10,
    borderBottom: '2px solid var(--gold)', display: 'flex', alignItems: 'center', gap: 10
  },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: 5 },
  input: {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
    borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: '0.9rem',
    color: 'var(--text)', background: 'var(--bg)', outline: 'none',
    transition: 'all 0.25s'
  },
  textarea: {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
    borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: '0.9rem',
    color: 'var(--text)', background: 'var(--bg)', outline: 'none',
    resize: 'vertical', minHeight: 110, transition: 'all 0.25s'
  },
  select: {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
    borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: '0.9rem',
    color: 'var(--text)', background: 'var(--bg)', outline: 'none', cursor: 'pointer'
  },
  checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
    fontSize: '0.85rem', color: 'var(--text)', padding: '6px 14px',
    borderRadius: 20, border: '1.5px solid var(--border)',
    transition: 'all 0.2s', userSelect: 'none'
  },
  checkboxLabelActive: {
    background: 'rgba(27,42,74,0.07)', borderColor: 'var(--primary)', color: 'var(--primary)'
  },
  radioGroup: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  radioLabel: {
    display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
    fontSize: '0.85rem', color: 'var(--text)', padding: '7px 16px',
    borderRadius: 20, border: '1.5px solid var(--border)',
    transition: 'all 0.2s', userSelect: 'none'
  },
  radioLabelActive: {
    background: 'rgba(27,42,74,0.07)', borderColor: 'var(--primary)', color: 'var(--primary)'
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  btn: {
    width: '100%', padding: '15px', background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    border: 'none', borderRadius: 8, color: '#fff', fontSize: '1.05rem',
    fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    transition: 'all 0.3s', letterSpacing: '0.5px', marginTop: 8,
    boxShadow: '0 4px 15px rgba(37,211,102,0.3)'
  },
  summaryItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem'
  },
  summaryLabel: { color: 'var(--text-muted)', fontWeight: 400 },
  summaryValue: { color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: '55%' },
  emptySummary: { color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }
};

export default function BulkInquiry() {
  const [form, setForm] = useState({
    name: '', businessName: '', phone: '', email: '', city: '', state: '',
    category: '', quantity: '', budget: '',
    occasion: [],
    pincode: '', timeline: '', requirementDetails: ''
  });
  const [sending, setSending] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleArray = (key, val) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val]
    }));
  };

  const summary = [
    { label: 'Name', value: form.name },
    { label: 'Business', value: form.businessName },
    { label: 'Phone', value: form.phone },
    { label: 'Email', value: form.email },
    { label: 'City', value: form.city },
    { label: 'State', value: form.state },
    { label: 'Category', value: form.category },
    { label: 'Quantity', value: form.quantity },
    { label: 'Budget', value: form.budget ? `₹${form.budget}` : '' },
    { label: 'Occasion', value: form.occasion.join(', ') },
    { label: 'Pincode', value: form.pincode },
    { label: 'Timeline', value: form.timeline },
  ].filter(item => item.value);

  const requiredFilled = form.name && form.phone && form.category && form.quantity;

  const composeWhatsApp = () => {
    const lines = [
      'New Bulk Inquiry from Prerna Silks Website',
      '',
      '--- Buyer Details ---',
      `Name: ${form.name}`,
      form.businessName ? `Business: ${form.businessName}` : null,
      `Phone: ${form.phone}`,
      form.email ? `Email: ${form.email}` : null,
      form.city ? `City: ${form.city}` : null,
      form.state ? `State: ${form.state}` : null,
      '',
      '--- Order Requirements ---',
      `Category: ${form.category}`,
      form.quantity ? `Quantity: ${form.quantity}` : null,
      form.budget ? `Budget: Rs.${form.budget}` : null,
      form.occasion.length ? `Occasion: ${form.occasion.join(', ')}` : null,
      '',
      '--- Delivery & Notes ---',
      form.pincode ? `Pincode: ${form.pincode}` : null,
      form.timeline ? `Timeline: ${form.timeline}` : null,
      form.requirementDetails ? `Details:\n${form.requirementDetails}` : null,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleSubmit = async () => {
    if (!requiredFilled) return alert('Please fill Name, Phone, Category & Quantity');

    const msg = composeWhatsApp();
    const whatsappUrl = `https://wa.me/917019461619?text=${encodeURIComponent(msg)}`;

    setSending(true);
    try {
      await API.post('/enquiry/submit', {
        name: form.name,
        phone: form.phone,
        pincode: form.pincode,
        message: form.requirementDetails,
        items: [{
          productId: 'bulk',
          name: form.category,
          quantity: Number(form.quantity) || 1
        }]
      });
    } catch (e) {
      alert('Failed to save enquiry, but WhatsApp will still open');
    }
    window.open(whatsappUrl, '_blank');
    setSending(false);
  };

  const inputStyle = (key) => ({
    ...s.input,
    borderColor: form[key] ? 'var(--primary)' : 'var(--border)'
  });

  return (
    <div style={s.page}>
      <Header />

      <section style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroBadge}>B2B Wholesale</div>
        <h1 style={s.heroTitle}>Wholesale Bulk Inquiry</h1>
        <p style={s.heroSub}>
          Partner with Prerna Silks for premium bulk orders. Share your requirements and our team will get back to you within 24 hours with the best pricing.
        </p>
      </section>

      <div style={s.layout}>
        <div style={s.formCard}>
          {/* Buyer Details */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={s.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              Buyer Details
            </h2>
            <div style={s.row}>
              <div><label style={s.label}>Full Name *</label><input style={inputStyle('name')} placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label style={s.label}>Business Name</label><input style={inputStyle('businessName')} placeholder="Business / store name" value={form.businessName} onChange={e => set('businessName', e.target.value)} /></div>
            </div>
            <div style={{ ...s.row, marginTop: 16 }}>
              <div><label style={s.label}>Phone *</label><input style={inputStyle('phone')} placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><label style={s.label}>Email</label><input style={inputStyle('email')} placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div style={{ ...s.row, marginTop: 16 }}>
              <div><label style={s.label}>City</label><input style={inputStyle('city')} placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} /></div>
              <div><label style={s.label}>State</label><input style={inputStyle('state')} placeholder="State" value={form.state} onChange={e => set('state', e.target.value)} /></div>
            </div>
          </div>

          {/* Order Requirements */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={s.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
              Order Requirements
            </h2>
            <div style={s.row}>
              <div>
                <label style={s.label}>Category *</label>
                <select style={s.select} value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Quantity *</label>
                <input style={inputStyle('quantity')} placeholder="e.g. 50 pieces" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Budget (₹)</label>
              <input style={inputStyle('budget')} placeholder="e.g. 50000" value={form.budget} onChange={e => set('budget', e.target.value)} />
            </div>
            <div style={{ marginTop: 18 }}>
              <label style={s.label}>Occasion</label>
              <div style={s.checkboxGroup}>
                {OCCASIONS.map(o => (
                  <label key={o} style={{ ...s.checkboxLabel, ...(form.occasion.includes(o) ? s.checkboxLabelActive : {}) }}
                    onClick={() => toggleArray('occasion', o)}>
                    <input type="checkbox" checked={form.occasion.includes(o)} onChange={() => {}}
                      style={{ accentColor: 'var(--primary)', width: 14, height: 14, margin: 0 }} />
                    {o}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery & Notes */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={s.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>
              Delivery & Notes
            </h2>
            <div style={s.row}>
              <div><label style={s.label}>Pincode</label><input style={inputStyle('pincode')} placeholder="6-digit pincode" value={form.pincode} onChange={e => set('pincode', e.target.value)} /></div>
              <div>
                <label style={s.label}>Timeline</label>
                <div style={s.radioGroup}>
                  {TIMELINES.map(t => (
                    <label key={t} style={{ ...s.radioLabel, ...(form.timeline === t ? s.radioLabelActive : {}) }}
                      onClick={() => set('timeline', t)}>
                      <input type="radio" name="timeline" checked={form.timeline === t} onChange={() => {}}
                        style={{ accentColor: 'var(--primary)', width: 14, height: 14, margin: 0 }} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Requirement Details</label>
              <textarea style={s.textarea} placeholder="Describe your requirements in detail — design preferences, color choices, quantity per design, delivery expectations, etc." value={form.requirementDetails} onChange={e => set('requirementDetails', e.target.value)} />
            </div>
          </div>

          <button style={s.btn} onClick={handleSubmit} disabled={sending}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(37,211,102,0.3)'; }}>
            {sending ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Sending...
              </span>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                Send Bulk Inquiry
              </>
            )}
          </button>
        </div>

        {/* Inquiry Summary Sidebar */}
        <div style={s.sidebar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--primary)' }}>Inquiry Summary</span>
          </div>

          {summary.length === 0 ? (
            <div style={s.emptySummary}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.4, marginBottom: 8 }}>
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
              <div>Fill in your requirements</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4 }}>to see the summary here</div>
            </div>
          ) : (
            <div>
              {summary.map((item, i) => (
                <div key={i} style={s.summaryItem}>
                  <span style={s.summaryLabel}>{item.label}</span>
                  <span style={s.summaryValue}>{item.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 18, padding: 14, background: 'rgba(211,177,96,0.08)', borderRadius: 8, border: '1px solid rgba(211,177,96,0.2)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>Fields filled</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)' }}>{summary.length} / 15</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Why Choose Us?</div>
            {[
              'Premium quality silk & handloom',
              'Pan-India delivery',
              'Best wholesale pricing',
              '24hr response time',
              'Custom bulk orders welcome'
            ].map((point, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '0.82rem', color: 'var(--text-light)' }}>
                <span style={{ color: 'var(--gold)', fontSize: '0.7rem' }}>◆</span> {point}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
