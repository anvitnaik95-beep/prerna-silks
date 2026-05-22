import Header from '../components/Header';
import Footer from '../components/Footer';

export default function FAQ() {
  return (
    <>
      <Header />
      <div className="pd-container" style={{ padding: '40px 20px', maxWidth: 800, margin: '0 auto', minHeight: '60vh' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 20 }}>Frequently Asked Questions</h1>
        
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>1. How long does delivery take?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Orders are usually dispatched within 1 hour. We use India Post for all our deliveries, which generally takes 3-10 days depending on your location.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>2. Do you offer Cash on Delivery (COD)?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Yes, we offer Cash on Delivery across most pin codes in India.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>3. What is your Exchange & Replacement policy?</h3>
          <p style={{ color: 'var(--text-muted)' }}>We accept replacements for defective or damaged items within 7 days of delivery. Please contact our support team at +91 7019461619 for assistance.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>4. How do I track my order?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Once your order is dispatched, you will receive a tracking link via SMS and WhatsApp. You can also track it from the 'My Orders' section or our public Track Order page.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}
