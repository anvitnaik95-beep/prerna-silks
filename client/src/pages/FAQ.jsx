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
          <p style={{ color: 'var(--text-muted)' }}>Orders are usually dispatched within 1 hour. We use XpressBees for all our deliveries, which generally takes 3-7 days depending on your location.</p>
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
          <p style={{ color: 'var(--text-muted)' }}>Once your order is dispatched, you will receive a tracking link via SMS and WhatsApp. You can also track it from the 'My Orders' section or our public Track Order page using your tracking ID.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>5. How do I create an account and log in?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Click on "Login" in the header. New users can click "Register" to create an account with your name, email, and password. You can check "Remember Me" to stay logged in for 7 days.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>6. How do I search and filter products?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Use the search bar in the header to find products by name. On the home page, you can filter by Category, Color, Occasion, Pattern, Price Range, and Rating. You can also sort results by Price (low to high / high to low), Rating, or Name.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>7. What payment methods do you accept?</h3>
          <p style={{ color: 'var(--text-muted)' }}>We accept three payment methods: Razorpay (credit/debit card, net banking, UPI), Direct UPI payment via QR code, and Cash on Delivery (COD) across most Indian pin codes.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>8. How do I save items to my wishlist?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Click the heart icon on any product card or on the product detail page to add it to your wishlist. You can view all saved items from the Wishlist page. From there, you can move items directly to your cart.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>9. What is the free shipping policy?</h3>
          <p style={{ color: 'var(--text-muted)' }}>We offer free shipping on all orders above Rs 999. Orders below that amount will have a standard shipping charge applied at checkout.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>10. How do I leave a product review?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Go to the product detail page and scroll to the Reviews section. You can rate the product with stars, write a review, and optionally upload a photo. Your review will appear after admin approval.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>11. How do I download my order receipt?</h3>
          <p style={{ color: 'var(--text-muted)' }}>After a successful order, you can download the receipt from the order confirmation page. You can also access and download receipts anytime from the 'My Orders' section.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>12. How do I submit feedback?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Click the "Feedback" floating button on the bottom-right corner of any page. You can rate your experience with stars and leave a comment. All feedback helps us improve our service.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>13. How do I switch between dark and light mode?</h3>
          <p style={{ color: 'var(--text-muted)' }}>Click the sun/moon toggle icon in the header to switch between light and dark themes. Your preference will be saved for future visits.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>14. How do I contact customer support?</h3>
          <p style={{ color: 'var(--text-muted)' }}>You can reach us by phone at +91 7019461619 or WhatsApp at +91 7019461619. Our support team is available to assist you with orders, returns, or any other queries.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}
