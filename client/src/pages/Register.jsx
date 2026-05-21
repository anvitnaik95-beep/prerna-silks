// Register Page
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const set = (k,v) => setForm({...form, [k]:v});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be 6+ chars'); return; }
    try {
      const { data } = await API.post('/auth/register', form);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="subtitle">Join Prerna Silks</p>
        {error && <div className="alert alert-danger py-2" style={{fontSize:'0.85rem'}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3"><label className="form-label">Full Name</label><input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} required /></div>
          <div className="mb-3"><label className="form-label">Email</label><input type="email" className="form-control" value={form.email} onChange={e=>set('email',e.target.value)} required /></div>
          <div className="mb-3"><label className="form-label">Password</label><input type="password" className="form-control" value={form.password} onChange={e=>set('password',e.target.value)} required /></div>
          <div className="mb-3"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
          <button type="submit" className="btn-buy" style={{width:'100%',padding:12,fontSize:'1rem'}}>Register</button>
        </form>
        <p style={{textAlign:'center',marginTop:16,fontSize:'0.9rem'}}>
          Have an account? <Link to="/login" style={{color:'var(--primary)',fontWeight:600}}>Login</Link>
        </p>
      </div>
    </div>
  );
}
