import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetForm, setResetForm] = useState({ email: '', newPassword: '' });
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (new URLSearchParams(location.search).get('reason') === 'expired') {
      toast.error('Your session expired. Please sign in again.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      toast.success(`Welcome back, ${data.name}! 🌿`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      await api.post('/auth/reset-password', resetForm);
      toast.success('Password reset! You can now sign in.');
      setForgotMode(false);
      setForm(f => ({ ...f, email: resetForm.email }));
      setResetForm({ email: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="auth-page">
      <Helmet><title>Sign In | CareerDock</title></Helmet>
      <Toaster position="top-right" />
      <motion.div className="glass-card auth-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-logo">
          <div className="cd-monogram" style={{ width: 48, height: 48, fontSize: 18 }}>CD</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Career<span style={{ color: 'var(--accent)' }}>Dock</span></div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Track every application. Miss nothing.</div>
          </div>
        </div>

        {!forgotMode ? (
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your CareerDock account</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <RiMailLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input className="form-input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" style={{ paddingLeft: 36 }} autoFocus />
                </div>
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <button type="button" onClick={() => { setForgotMode(true); setResetForm(r => ({ ...r, email: form.email })); }} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <RiLockLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input className="form-input" type={showPwd ? 'text' : 'password'} required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Your password" style={{ paddingLeft: 36, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                    {showPwd ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">Enter your email and choose a new password</p>

            <form onSubmit={handleReset}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <RiMailLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input className="form-input" type="email" required value={resetForm.email} onChange={e => setResetForm(r => ({ ...r, email: e.target.value }))} placeholder="your-registered@email.com" style={{ paddingLeft: 36 }} autoFocus />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <RiLockLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input className="form-input" type={showNewPwd ? 'text' : 'password'} required minLength={6} value={resetForm.newPassword} onChange={e => setResetForm(r => ({ ...r, newPassword: e.target.value }))} placeholder="Min. 6 characters" style={{ paddingLeft: 36, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowNewPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                    {showNewPwd ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center btn-lg" disabled={resetting} style={{ marginTop: 8 }}>
                {resetting ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
              Remember it?{' '}
              <button onClick={() => setForgotMode(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Back to Sign In</button>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
