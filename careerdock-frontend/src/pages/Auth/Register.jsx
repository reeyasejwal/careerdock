import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { RiUserLine, RiMailLine, RiPhoneLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      toast.success(`Welcome to CareerDock, ${data.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Helmet><title>Get Started | CareerDock</title></Helmet>
      <Toaster position="top-right" />
      <motion.div className="glass-card auth-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-logo">
          <div className="cd-monogram" style={{ width: 48, height: 48, fontSize: 18 }}>CD</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Career<span style={{ color: 'var(--accent)' }}>Dock</span></div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Track every application. Miss nothing.</div>
          </div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking your placement journey</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <RiUserLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Reeya Sejwal" style={{ paddingLeft: 36 }} autoFocus />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <RiMailLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="form-input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" style={{ paddingLeft: 36 }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <div style={{ position: 'relative' }}>
              <RiPhoneLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" style={{ paddingLeft: 36 }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <RiLockLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="form-input" type={showPwd ? 'text' : 'password'} required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" style={{ paddingLeft: 36, paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                {showPwd ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
