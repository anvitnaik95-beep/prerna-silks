import Header from '../components/Header';
import Footer from '../components/Footer';

const styles = {
  page: {
    background: 'var(--bg)',
    fontFamily: 'var(--font-body)',
    color: 'var(--text)',
  },
  section: {
    padding: '70px 20px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  sectionAlt: {
    padding: '70px 20px',
    background: 'var(--bg-card)',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '2.2rem',
    color: 'var(--primary)',
    textAlign: 'center',
    fontWeight: 400,
    marginBottom: 12,
  },
  subheading: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '1rem',
    maxWidth: 600,
    margin: '0 auto 50px',
    lineHeight: 1.7,
  },
  stepCard: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '32px 22px',
    textAlign: 'center',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--border)',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 18px',
    fontSize: '1.4rem',
  },
  stepTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    color: 'var(--text)',
    marginBottom: 8,
    fontWeight: 500,
  },
  stepDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  benefitCard: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '28px 22px',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--border)',
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  benefitIcon: {
    flexShrink: 0,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(200, 169, 94, 0.12)',
    color: 'var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.05rem',
    color: 'var(--text)',
    marginBottom: 5,
    fontWeight: 500,
  },
  benefitDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },

  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 42px',
    background: 'var(--gold)',
    color: '#1a0a0e',
    border: 'none',
    borderRadius: 6,
    fontSize: '1.05rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'transform 0.25s, box-shadow 0.25s',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textDecoration: 'none',
  },
};

const benefits = [
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, title: 'Zero Inventory Risk', desc: 'No need to stock products. We ship directly to your customers.' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: 'Control Your Margins', desc: 'Add your own profit margin on every product. You decide the final price.' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, title: 'Seamless Sharing', desc: 'Share products in one tap via WhatsApp, Instagram, Facebook & Telegram.' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: 'Start Immediately', desc: 'Get certified and start selling the same day with no upfront investment.' },
  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: 'Build Trust', desc: 'Partner with a brand that has 1,000+ verified 5-star reviews.' },
];

const WHATSAPP_NUMBER = '917019461619';
const REGISTER_MSG = encodeURIComponent('Hi! I want to register as a partner with Prerna Silks. Please share the next steps.');

export default function PartnerProgram() {
  const handleRegister = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${REGISTER_MSG}`, '_blank');
  };

  return (
    <>
      <Header />
      <div style={styles.page}>
        <section style={{
          textAlign: 'center',
          padding: '90px 20px 70px',
          background: 'linear-gradient(135deg, #f5f0eb 0%, var(--bg) 60%, #f0e8df 100%)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ maxWidth: 750, margin: '0 auto' }}>
            <span style={{
              display: 'inline-block',
              padding: '5px 18px',
              background: 'rgba(211, 177, 96, 0.15)',
              color: 'var(--gold)',
              borderRadius: 30,
              fontSize: '0.78rem',
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 20,
            }}>
              B2B Partner Program
            </span>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.8rem',
              color: 'var(--primary)',
              fontWeight: 400,
              lineHeight: 1.2,
              marginBottom: 16,
            }}>
              Grow Your Business as a<br />Certified Partner
            </h1>
            <p style={{
              color: 'var(--text-light)',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              maxWidth: 580,
              margin: '0 auto 30px',
            }}>
              Join the Prerna Silks partner network and start earning by reselling premium silk sarees. 
              No inventory, no investment — just share and earn.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleRegister} style={{
                ...styles.ctaBtn,
                position: 'static',
                transform: 'none',
              }}>
                Register as Partner
              </button>
            </div>
          </div>
        </section>

        <section style={styles.sectionAlt}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
            <h2 style={styles.heading}>Partner Benefits</h2>
            <p style={styles.subheading}>
              We handle the hard parts — logistics, inventory, production — so you can focus on selling and growing your business.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 20,
            }}>
              {benefits.map((b, i) => (
                <div key={i} style={{
                  ...styles.benefitCard,
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                >
                  <div style={styles.benefitIcon}>{b.icon}</div>
                  <div>
                    <h3 style={styles.benefitTitle}>{b.title}</h3>
                    <p style={styles.benefitDesc}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


      </div>
      <Footer />
    </>
  );
}
