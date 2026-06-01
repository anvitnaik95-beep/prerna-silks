// Admin Customers
import { useState, useEffect } from 'react';
import API from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

const UsersIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { load(); }, []);
  const load = async () => { try { const { data } = await API.get('/admin/customers'); setCustomers(data.customers||[]); } catch {} };

  return (
    <div className="admin-layout"><AdminSidebar />
      <main className="admin-main">
        <div className="admin-header"><h1><UsersIcon /> Customers</h1></div>
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
