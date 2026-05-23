import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Dispatched', 'Shipped', 'Delivered'];

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [trackId, setTrackId] = useState(searchParams.get('trackId') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [destCoords, setDestCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [realDistance, setRealDistance] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const scootyMarkerRef = useRef(null);

  const fmt = v => `₹${Number(v).toLocaleString('en-IN')}`;

  useEffect(() => {
    const id = searchParams.get('trackId');
    if (id) {
      setTrackId(id);
      handleTrack(id);
    }
  }, [searchParams]);

  // Load Leaflet CDN script & stylesheet
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  const handleTrack = async (id) => {
    const searchId = (id || trackId).trim();
    if (!searchId) { setError('Please enter a tracking ID'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const { data } = await API.get(`/orders/track/${searchId}`);
      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Order not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found with this tracking ID');
    }
    setLoading(false);
  };

  // Live Polling order status to auto-animate map
  useEffect(() => {
    if (!order || order.status === 'Delivered' || order.status === 'Cancelled') return;

    const interval = setInterval(() => {
      API.get(`/orders/track/${order.trackingId}`)
        .then(({ data }) => {
          if (data.success) {
            setOrder(data.order);
          }
        })
        .catch(err => console.error("Error polling order status:", err));
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.trackingId, order?.status]);

  // Geocode address when order details are loaded
  useEffect(() => {
    if (!order || !order.shippingAddress) return;

    setDestCoords(null);
    setRouteCoords([]);
    setRealDistance(null);

    const address = order.shippingAddress;
    let query = address;
    if (!query.toLowerCase().includes('karnataka') && !query.toLowerCase().includes('india')) {
      query += ', Karnataka, India';
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setDestCoords([lat, lon]);
        } else {
          // Fallback coordinate offset from Hubli Post Office
          setDestCoords([15.3489 + 0.015, 75.1394 + 0.015]);
        }
      })
      .catch(err => {
        console.error('Geocoding error:', err);
        setDestCoords([15.3489 + 0.015, 75.1394 + 0.015]);
      });
  }, [order]);

  // Calculate direct distance as backup using Haversine Formula
  function calculateDirectDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Get road-by-road route using OSRM Routing Engine
  useEffect(() => {
    if (!destCoords) return;

    const start = [15.3489, 75.1394]; // Hubli Post Office Center
    const end = destCoords;

    fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(pt => [pt[1], pt[0]]);
          setRouteCoords(coords);
          setRealDistance((route.distance / 1000).toFixed(1));
        } else {
          setRouteCoords([start, end]);
          const d = calculateDirectDistance(start[0], start[1], end[0], end[1]);
          setRealDistance(d.toFixed(1));
        }
      })
      .catch(err => {
        console.error('OSRM route error:', err);
        setRouteCoords([start, end]);
        const d = calculateDirectDistance(start[0], start[1], end[0], end[1]);
        setRealDistance(d.toFixed(1));
      });
  }, [destCoords]);

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'Cancelled';

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !order || routeCoords.length === 0 || !mapContainerRef.current) return;

    const L = window.L;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const start = [15.3489, 75.1394];
    const end = destCoords || start;

    const map = L.map(mapContainerRef.current, {
      center: start,
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    const polyline = L.polyline(routeCoords, {
      color: '#d4af37',
      weight: 4,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    routePolylineRef.current = polyline;

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `<div style="width: 14px; height: 14px; background: #28a745; border: 2.5px solid #fff; border-radius: 50%; box-shadow: 0 0 10px #28a745;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const endIcon = L.divIcon({
      className: 'custom-end-marker',
      html: `<div style="width: 16px; height: 16px; background: #dc3545; border: 2.5px solid #fff; border-radius: 50%; box-shadow: 0 0 10px #dc3545;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const scootyIcon = L.divIcon({
      className: 'custom-scooty-marker',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: rgba(212, 175, 55, 0.15);
          border: 1.5px solid #d4af37;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
          transition: all 0.5s ease;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#d4af37">
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path d="M6 15h12v-2a2 2 0 0 0-2-2H9.5a2.5 2.5 0 0 1-2.5-2.5V7a2 2 0 0 1 2-2h4" />
            <path d="M12 9h3l3 4" />
            <path d="M18 5v4" />
            <path d="M17 5h2" />
            <line x1="3" y1="18" x2="1" y2="18" stroke="#d4af37" strokeWidth="1.5" />
            <line x1="2" y1="15" x2="0" y2="15" stroke="#d4af37" strokeWidth="1.5" />
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    L.marker(start, { icon: startIcon }).addTo(map).bindPopup('<b>Hubli Post Office Hub</b>');
    L.marker(end, { icon: endIcon }).addTo(map).bindPopup(`<b>Your Doorstep</b><br/>${order.shippingAddress}`);

    const percentage = Math.max(0, currentStep) / (STATUS_STEPS.length - 1);
    const pointIdx = Math.round(percentage * (routeCoords.length - 1));
    const scootyPosition = routeCoords[pointIdx] || start;

    const scooty = L.marker(scootyPosition, { icon: scootyIcon }).addTo(map);
    scootyMarkerRef.current = scooty;

    map.panTo(scootyPosition);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, routeCoords]);

  // Animate Scooty on step/status update
  useEffect(() => {
    if (!mapInstanceRef.current || !scootyMarkerRef.current || routeCoords.length === 0) return;

    const percentage = Math.max(0, currentStep) / (STATUS_STEPS.length - 1);
    const pointIdx = Math.round(percentage * (routeCoords.length - 1));
    const scootyPosition = routeCoords[pointIdx] || [15.3489, 75.1394];

    scootyMarkerRef.current.setLatLng(scootyPosition);
    mapInstanceRef.current.panTo(scootyPosition);
  }, [currentStep, routeCoords]);

  // Compute remaining distance based on route distance and current phase progress
  const getRemainingDistance = () => {
    if (!realDistance) return 'Calculating...';
    const distNum = parseFloat(realDistance);
    if (isNaN(distNum)) return 'Calculating...';

    if (currentStep <= 0) return `${distNum.toFixed(1)} km`;
    if (currentStep === 1) return `${(distNum * 0.75).toFixed(1)} km`;
    if (currentStep === 2) return `${(distNum * 0.50).toFixed(1)} km`;
    if (currentStep === 3) return `${(distNum * 0.25).toFixed(1)} km`;
    return 'Arrived!';
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '1.8rem', marginBottom: 8, fontWeight: 400, textAlign: 'center' }}>
          Track Your Order
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.92rem' }}>
          Enter your tracking ID to check delivery status
        </p>

        {/* Search Box */}
        <div style={{ display: 'flex', gap: 12, maxWidth: 500, margin: '0 auto 40px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Tracking ID (e.g. PS1A2B3C4D)"
            value={trackId}
            onChange={e => setTrackId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            style={{ flex: 1, padding: '12px 16px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', minWidth: 200 }}
          />
          <button
            className="btn-buy"
            onClick={() => handleTrack()}
            disabled={loading}
            style={{ padding: '12px 28px', fontSize: '0.95rem', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </div>

        {error && (
          <div style={{
            textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12,
            boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontWeight: 400, marginBottom: 8 }}>{error}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Please check the tracking ID and try again.</p>
          </div>
        )}

        {/* Order Tracking Result */}
        {order && (
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: isCancelled ? '#f8d7da' : '#f0fdf4', padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Status</span>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 400, margin: '4px 0 0',
                    color: isCancelled ? '#721c24' : order.status === 'Delivered' ? '#155724' : 'var(--primary)'
                  }}>
                    {isCancelled ? 'Order Cancelled' : order.status}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Tracking ID</span>
                  <strong style={{ fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--primary)' }}>{order.trackingId}</strong>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            {!isCancelled && (
              <div style={{ padding: '28px 28px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 20 }}>
                  {/* Progress Line */}
                  <div style={{
                    position: 'absolute', top: 14, left: '10%', right: '10%', height: 3,
                    background: 'var(--border)', borderRadius: 2
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: 'linear-gradient(90deg, var(--primary), var(--gold))',
                      width: `${Math.max(0, currentStep) / (STATUS_STEPS.length - 1) * 100}%`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>

                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i <= currentStep ? 'var(--primary)' : '#fff',
                        border: `2px solid ${i <= currentStep ? 'var(--primary)' : 'var(--border)'}`,
                        color: i <= currentStep ? '#fff' : 'var(--text-muted)',
                        fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.3s'
                      }}>
                        {i <= currentStep ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (i + 1)}
                      </div>
                      <span style={{
                        fontSize: '0.72rem', marginTop: 8, color: i <= currentStep ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: i === currentStep ? 600 : 400, textAlign: 'center'
                      }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Interactive Leaflet Route Map */}
            {!isCancelled && (
              <div style={{ padding: '0 28px 28px' }}>
                <div style={{
                  background: '#0b132b',
                  borderRadius: 12,
                  border: '1.5px solid var(--gold, #d4af37)',
                  padding: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  position: 'relative'
                }}>
                  <h4 style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--gold, #d4af37)',
                    fontSize: '0.98rem',
                    margin: '0 0 16px',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    letterSpacing: '0.5px'
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#28a745',
                      boxShadow: '0 0 8px #28a745', animation: 'ping 1.5s infinite alternate'
                    }} />
                    REAL-TIME DELIVERIES MAP
                  </h4>

                  {/* Leaflet Container */}
                  <div ref={mapContainerRef} style={{ height: 350, width: '100%', borderRadius: 8, zIndex: 1 }} />

                  {/* Real-time Address and Route Info banner */}
                  <div style={{
                    marginTop: 16,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Current Stage Location</span>
                      <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500, marginTop: 2 }}>
                        {currentStep === 0 && 'Hubli Post Office Center'}
                        {currentStep === 1 && 'Prerna Silks hubli HQ'}
                        {currentStep === 2 && 'State Highway transit node'}
                        {currentStep === 3 && 'Hubli Local Delivery Hub'}
                        {currentStep === 4 && (order.shippingAddress || 'Your home address')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Estimated Distance Left</span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--gold, #d4af37)', fontWeight: 600, marginTop: 2 }}>
                        {getRemainingDistance()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div style={{ padding: '0 28px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px 24px', background: '#fafafa', padding: 20, borderRadius: 10 }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order ID</span>
                  <div style={{ fontWeight: 600 }}>#{order.orderId}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Service</span>
                  <div style={{ fontWeight: 600 }}>{order.deliveryService}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Delivery</span>
                  <div style={{ fontWeight: 600, color: '#28a745' }}>{order.estimatedDelivery}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount</span>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmt(order.totalAmount)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment</span>
                  <div style={{ fontWeight: 600 }}>{order.paymentMethod} ({order.paymentStatus})</div>
                </div>
                {order.dispatchedAt && (
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dispatched On</span>
                    <div style={{ fontWeight: 600 }}>{order.dispatchedAt}</div>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shipping Address</span>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{order.shippingAddress}</div>
                </div>
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Items</h4>
                  {order.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                      <span>{it.product_name} x {it.quantity}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
