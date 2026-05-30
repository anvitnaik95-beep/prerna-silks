import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const OrderListContext = createContext();

export function OrderListProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('prerna_orderlist');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (newItems) => {
    setItems(newItems);
    localStorage.setItem('prerna_orderlist', JSON.stringify(newItems));
  };

  const addItem = (product) => {
    const moq = product.moq || 5;
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      save(items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      save([...items, { id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, moq }]);
    }
    setOpen(true);
  };

  const updateQty = (id, qty) => {
    const item = items.find(i => i.id === id);
    const min = item?.moq ? 1 : 1;
    if (qty < 1) { removeItem(id); return; }
    save(items.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = (id) => {
    save(items.filter(i => i.id !== id));
  };

  const clearAll = () => save([]);

  const total = items.reduce((s, i) => s + Number(i.price) * (i.moq || 5) * i.quantity, 0);

  const submitEnquiry = (pincode, message) => {
    const customerName = user?.name || 'Website Visitor';
    const customerPhone = user?.phone || user?.phoneNumber || '';
    const itemText = items.map(i =>
      `${i.name} x${i.quantity} set(s) (${(i.moq || 5)} pcs/set) - Rs.${(Number(i.price) * (i.moq || 5) * i.quantity).toLocaleString('en-IN')}`
    ).join('\n');
    const text = `New Enquiry from ${customerName}\nPhone: ${customerPhone}\n\nItems:\n${itemText}\n\nTotal: Rs.${total.toLocaleString('en-IN')}\nPincode: ${pincode || 'Not provided'}\nMessage: ${message || 'N/A'}`;
    // Open WhatsApp first (synchronous, no popup blocker issue)
    window.location.href = `https://wa.me/917019461619?text=${encodeURIComponent(text)}`;
    // Then save enquiry asynchronously (fire-and-forget)
    API.post('/enquiry/submit', {
      name: customerName,
      phone: customerPhone || 'Not provided',
      pincode,
      message,
      items: items.map(i => ({ productId: i.id, name: i.name, price: Number(i.price), quantity: i.quantity * (i.moq || 5) }))
    }).catch(e => console.error('Failed to save enquiry:', e));
    return text;
  };

  return (
    <OrderListContext.Provider value={{ items, open, setOpen, addItem, updateQty, removeItem, clearAll, total, submitEnquiry, save }}>
      {children}
    </OrderListContext.Provider>
  );
}

export function useOrderList() {
  return useContext(OrderListContext);
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  backdropFilter: 'blur(3px)',
  zIndex: 9998,
  opacity: 0,
  visibility: 'hidden',
  transition: 'opacity 0.35s ease, visibility 0.35s ease',
};

const overlayVisible = {
  ...overlayStyle,
  opacity: 1,
  visibility: 'visible',
};

const panelBase = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: 400,
  maxWidth: '92vw',
  background: '#fff',
  zIndex: 9999,
  boxShadow: '-8px 0 40px rgba(82,18,32,0.15)',
  display: 'flex',
  flexDirection: 'column',
  transform: 'translateX(100%)',
  transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
};

const panelOpen = {
  ...panelBase,
  transform: 'translateX(0)',
};

const fabStyle = {
  position: 'fixed',
  bottom: 28,
  right: 28,
  zIndex: 9997,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 50,
  padding: '14px 24px',
  cursor: 'pointer',
  boxShadow: '0 6px 24px rgba(82,18,32,0.28)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  fontWeight: 500,
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
};

export default function OrderListPanel() {
  const { items, open, setOpen, updateQty, removeItem, clearAll, total, submitEnquiry } = useOrderList();
  const [pincode, setPincode] = useState('');
  const [message, setMessage] = useState('');
  const panelRef = useRef(null);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSubmit = () => {
    if (items.length === 0) return;
    submitEnquiry(pincode, message);
  };

  const hideOn = ['/login','/register','/cart','/checkout','/wishlist','/my-orders','/track-order','/faq'];
  if (!user || location.pathname.startsWith('/admin') || hideOn.includes(location.pathname)) return null;

  return (
    <>
      {items.length > 0 && (
        <button
          style={fabStyle}
          onClick={() => setOpen(true)}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(82,18,32,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(82,18,32,0.28)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Order List
          <span style={{
            background: 'var(--gold)',
            color: '#2A1016',
            borderRadius: '50%',
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            lineHeight: 1,
          }}>
            {items.length}
          </span>
        </button>
      )}

      <div
        style={open ? overlayVisible : overlayStyle}
        onClick={() => setOpen(false)}
      />

      <div ref={panelRef} style={open ? panelOpen : panelBase}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              color: 'var(--primary)',
              margin: 0,
              fontWeight: 400,
            }}>
              Order List
            </h3>
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.5px',
            }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-body)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(198,40,40,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'var(--bg)',
                border: 'none',
                width: 34,
                height: 34,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-light)',
                fontSize: '1.1rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-light)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}>
          {items.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
            }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <p style={{
                marginTop: 16,
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-body)',
              }}>
                Your order list is empty
              </p>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-body)',
              }}>
                Add products to send an enquiry
              </p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                gap: 14,
                padding: '14px 0',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}>
                <div style={{
                  width: 68,
                  height: 68,
                  borderRadius: 8,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#f5f0eb',
                  border: '1px solid var(--border)',
                }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={e => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="68" height="68" fill="%23EAE3DC"><rect width="68" height="68"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23999" font-size="10">No img</text></svg>'; }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '0.88rem',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.name}
                  </p>
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    margin: '2px 0 0',
                  }}>
                    {item.quantity} set{item.quantity !== 1 ? 's' : ''} x {item.moq || 5} pcs
                  </p>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'var(--primary)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    margin: '2px 0 0',
                  }}>
                    {'\u20B9'}{(Number(item.price) * (item.moq || 5) * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: '1.5px solid var(--border)',
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      color: 'var(--text)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  >
                    -
                  </button>
                  <span style={{
                    width: 30,
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: '1.5px solid var(--border)',
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      color: 'var(--text)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(198,40,40,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '18px 24px 24px',
            flexShrink: 0,
            background: '#fff',
          }}>
            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                  placeholder="Enter delivery pincode"
                value={pincode}
                onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  color: 'var(--text)',
                  background: 'var(--bg)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  color: 'var(--text)',
                  background: 'var(--bg)',
                  outline: 'none',
                  resize: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0 14px',
              borderTop: '1px solid var(--border)',
              marginBottom: 12,
            }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
              }}>
                Total ({items.reduce((s, i) => s + i.quantity * (i.moq || 5), 0)} pcs in {items.reduce((s, i) => s + i.quantity, 0)} sets)
              </span>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.3rem',
                color: 'var(--primary)',
                fontWeight: 600,
              }}>
                {'\u20B9'}{total.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                letterSpacing: '0.5px',
                boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,211,102,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.3)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Submit Enquiry via WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
}
