import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    const formData = new FormData();
    formData.append('title', title);
    formData.append('billImage', file);

    try {
      await API.post('/bills/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTitle('');
      setFile(null);
      loadBills();
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

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>📄 Bills</h1>
          <input 
            type="text" 
            className="form-control" 
            style={{ width: 250 }} 
            placeholder="Search Bills..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <div className="row">
          <div className="col-md-4">
            <div className="admin-card mb-4">
              <h4>Upload New Bill</h4>
              {error && <div className="alert alert-danger p-2">{error}</div>}
              <form onSubmit={handleUpload}>
                <div className="mb-3">
                  <label className="form-label">Bill Title</label>
                  <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Bill Image (JPG/PNG)</label>
                  <input type="file" className="form-control" accept="image/png, image/jpeg, image/jpg" onChange={e => setFile(e.target.files[0])} required />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Uploading & Converting...' : 'Upload & Convert to PDF'}
                </button>
              </form>
            </div>
          </div>
          
          <div className="col-md-8">
            <div className="admin-card">
              <h4>Saved Bills (PDFs)</h4>
              <div className="table-responsive">
                <table className="table table-hover mt-3">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Date</th>
                      <th>View PDF</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-muted p-4">No bills found</td></tr>
                    ) : (
                      bills.map(b => (
                        <tr key={b.id}>
                          <td>{b.title}</td>
                          <td>{new Date(b.created_at).toLocaleDateString()}</td>
                          <td>
                            <a href={b.file_path} target="_blank" rel="noreferrer" className="btn btn-sm btn-info text-white">
                              View PDF
                            </a>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
