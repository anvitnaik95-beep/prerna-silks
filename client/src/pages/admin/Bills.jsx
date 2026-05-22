import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanMessage, setScanMessage] = useState('');

  const fmt = v => `₹${Number(v).toLocaleString('en-IN')}`;

  useEffect(() => { loadBills(); }, [search]);

  const loadBills = async () => {
    try {
      const { data } = await API.get(`/bills${search ? `?search=${search}` : ''}`);
      setBills(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please provide title and an image file.');
      return;
    }
    setLoading(true);
    setError('');
    setScanMessage('');
    const formData = new FormData();
    formData.append('title', title);
    if (amount) {
      formData.append('amount', amount);
    }
    formData.append('billImage', file);

    try {
      const { data } = await API.post('/bills/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTitle('');
      setAmount('');
      setFile(null);
      setScanMessage(data.message || 'Bill uploaded successfully!');
      loadBills();
      setTimeout(() => setScanMessage(''), 6000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading bill.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await API.delete(`/bills/${id}`);
      loadBills();
    } catch (err) {
      console.error(err);
    }
  };

  // Group bills by Month and Year
  const getGroupedBills = () => {
    const groups = {};
    bills.forEach(bill => {
      const date = new Date(bill.created_at);
      const year = date.getFullYear();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const groupKey = `${month} ${year}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          month,
          year,
          bills: [],
          subtotal: 0
        };
      }
      groups[groupKey].bills.push(bill);
      groups[groupKey].subtotal += (bill.amount || 0);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
  };

  const grandTotal = bills.reduce((s, b) => s + (b.amount || 0), 0);
  const groupedData = getGroupedBills();

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontWeight: 400 }}>Expense Bills</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>Upload image receipts to automatically parse, scan, and catalog bills by date</p>
          </div>
          <input 
            type="text" 
            className="form-control" 
            style={{ width: 250, border: '1.5px solid var(--border)', borderRadius: 8 }} 
            placeholder="Search Bills..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        {/* Stats Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderLeft: '4px solid var(--primary)' }}>
              <div>
                <span style={{ textTransform: 'uppercase', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Cataloged Bills</span>
                <h3 style={{ fontSize: '2rem', color: 'var(--primary)', margin: '4px 0 0 0', fontWeight: 500 }}>{bills.length} Bills</h3>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderLeft: '4px solid var(--gold)' }}>
              <div>
                <span style={{ textTransform: 'uppercase', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Grand Total Expenses</span>
                <h3 style={{ fontSize: '2rem', color: 'var(--gold)', margin: '4px 0 0 0', fontWeight: 600 }}>{fmt(grandTotal)}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <div className="admin-card mb-4" style={{ padding: 24 }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 18, fontSize: '1.15rem' }}>Upload & Scan Bill</h4>
              
              {error && <div className="alert alert-danger p-2" style={{ fontSize: '0.85rem' }}>{error}</div>}
              {scanMessage && <div className="alert alert-success p-2" style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{scanMessage}</div>}
              
              <form onSubmit={handleUpload}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: 500, fontSize: '0.88rem' }}>Bill Title / Description</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Rent, Electricity 4500" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    Tip: Include the amount in the title (e.g. "Electric 2300") to let our scanner auto-detect it instantly!
                  </small>
                </div>
                
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: 500, fontSize: '0.88rem' }}>Amount (Optional)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Leave empty for auto-scan" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    If left blank, our AI invoice parser scans the document image to extract the total amount automatically.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: 500, fontSize: '0.88rem' }}>Bill Receipt File (PNG/JPG)</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={e => setFile(e.target.files[0])} 
                    required 
                  />
                </div>
                
                <button type="submit" className="btn-buy" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }} disabled={loading}>
                  {loading ? 'Scanning Document...' : 'Upload & Scan Bill'}
                </button>
              </form>
            </div>
          </div>
          
          <div className="col-md-8">
            <div className="admin-card" style={{ padding: 24 }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: 20, fontSize: '1.15rem' }}>Grouped Expenses Ledger</h4>
              
              {groupedData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>Document</div>
                  <p>No scanned bills found in your ledger.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {groupedData.map(group => (
                    <div key={group.groupKey} style={{ background: '#fafafa', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      {/* Group Header showing Month, Year, and Subtotal */}
                      <div style={{ background: '#f0f2f5', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.98rem' }}>
                          {group.month} {group.year}
                        </span>
                        <span style={{ background: 'var(--primary)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                          Subtotal: {fmt(group.subtotal)}
                        </span>
                      </div>

                      {/* Group Table */}
                      <div className="table-responsive" style={{ padding: '8px 16px' }}>
                        <table className="table table-hover align-middle" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: 'none' }}>Description</th>
                              <th style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: 'none' }}>Date Added</th>
                              <th style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: 'none', textAlign: 'right' }}>Scanned Amount</th>
                              <th style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: 'none', textAlign: 'center' }}>PDF</th>
                              <th style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: 'none', textAlign: 'center' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.bills.map(b => (
                              <tr key={b.id}>
                                <td style={{ fontWeight: 500, color: 'var(--text)' }}>{b.title}</td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                  {new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: '#28a745' }}>
                                  {fmt(b.amount || 0)}
                                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Auto-scanned</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <a href={b.file_path} target="_blank" rel="noreferrer" className="btn btn-sm btn-info text-white" style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: 6 }}>
                                    View PDF
                                  </a>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button className="btn btn-sm btn-danger" style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: 6 }} onClick={() => handleDelete(b.id)}>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
