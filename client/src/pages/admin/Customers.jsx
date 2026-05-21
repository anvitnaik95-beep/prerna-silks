// Admin Customers
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { load(); }, []);
  const load = async () => { try { const { data } = await API.get('/admin/customers'); setCustomers(data.customers||[]); } catch {} };

  return (
    <div className="admin-layout"><AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1>👥 Customers</h1></div>
        <div className="admin-card">
          <table className="table table-hover mb-0">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead>
            <tbody>
              {customers.length===0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No customers</td></tr> :
                customers.map(c=><tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.email}</td><td>{c.phone||'—'}</td><td>{new Date(c.created_at).toLocaleDateString()}</td></tr>)
              }
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
