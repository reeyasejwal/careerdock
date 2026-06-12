import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { RiUserLine, RiMailLine, RiPhoneLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiAlertLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmaill.com': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',  'gmailcom': 'gmail.com', 'gmail.cmo': 'gmail.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'outloook.com': 'outlook.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
  'redifmail.com': 'rediffmail.com', 'redif.com': 'rediffmail.com',
};

function getTypoWarning(email) {
  if (!email.includes('@')) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  const fix = DOMAIN_TYPOS[domain];
  if (!fix) return null;
  return `Did you mean ${email.split('@')[0]}@${fix}?`;
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', confirmEmail: '', phone: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const typoWarning = getTypoWarning(form.email);
  const emailMismatch = form.confirmEmail && form.email !== form.confirmEmail;
  const emailMatch   = form.confirmEmail && form.email === form.confirmEmail;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.email !== form.confirmEmail) {
      toast.error('Email addresses do not match — please check both fields');
      return;
    }
    if (typoWarning) {
      toast.error(`Possible typo in email. ${typoWarning}`);
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
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
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <RiUserLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Reeya Sejwal" style={{ paddingLeft: 36 }} autoFocus />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <RiMailLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                className="form-input"
                type="email"
                required
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="you@gmail.com"
                style={{ paddingLeft: 36, borderColor: typoWarning ? '#C07810' : undefined }}
                autoComplete="off"
              />
            </div>
            {typoWarning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 12.5, color: '#C07810', fontWeight: 500 }}>
                <RiAlertLine size={13} /> {typoWarning}
              </div>
            )}
          </div>

          {/* Confirm Email */}
          <div className="form-group">
            <label className="form-label">Confirm Email</label>
            <div style={{ position: 'relative' }}>
              <RiMailLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: emailMismatch ? '#B71C1C' : emailMatch ? '#1A6634' : 'var(--muted)' }} />
              <input
                className="form-input"
                type="email"
                required
                value={form.confirmEmail}
                onChange={e => set('confirmEmail', e.target.value)}
                placeholder="Re-enter your email"
                style={{
                  paddingLeft: 36,
                  borderColor: emailMismatch ? '#B71C1C' : emailMatch ? '#1A6634' : undefined,
                }}
                autoComplete="off"
                onPaste={e => e.preventDefault()}
              />
            </div>
            {emailMismatch && (
              <p style={{ marginTop: 5, fontSize: 12.5, color: '#B71C1C', fontWeight: 500 }}>
                Emails do not match
              </p>
            )}
            {emailMatch && (
              <p style={{ marginTop: 5, fontSize: 12.5, color: '#1A6634', fontWeight: 500 }}>
                ✓ Emails match
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <div style={{ position: 'relative' }}>
              <RiPhoneLine size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" style={{ paddingLeft: 36 }} />
            </div>
          </div>

          {/* Password */}
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

          <button
            type="submit"
            className="btn btn-primary w-full justify-center btn-lg"
            disabled={loading || emailMismatch || !!typoWarning}
            style={{ marginTop: 8 }}
          >
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
