import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { RiSunLine, RiMoonLine, RiLogoutBoxLine, RiEditLine, RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEMES } from '../../context/ThemeContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Account() {
  const { user, logout } = useAuth();
  const { theme, dark, setTheme, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/auth/profile').then(r => setProfile({ name: r.data.name, phone: r.data.phone || '' })).catch(() => {});
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put('/auth/profile', profile);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleThemeChange = async (key) => {
    setTheme(key);
    try { await api.put('/auth/theme', { theme: key, darkMode: dark }); } catch {}
  };

  const handleDarkToggle = async () => {
    toggleDark();
    try { await api.put('/auth/theme', { theme, darkMode: !dark }); } catch {}
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully 👋');
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/auth/account');
      logout();
      toast.success('Account deleted.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Helmet><title>Account | CareerDock</title></Helmet>
      <div className="page-header">
        <div><h1 className="page-title">Account</h1><p className="page-subtitle">Manage your profile and preferences</p></div>
      </div>

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        <div>
          {/* Profile */}
          <motion.div className="glass-card" style={{ marginBottom: 16, padding: '20px' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-title"><RiEditLine style={{ marginRight: 8, verticalAlign: 'middle' }} />Profile</p>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" /></div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update Profile'}</button>
            </form>
          </motion.div>

        </div>

        <div>
          {/* Theme picker */}
          <motion.div className="glass-card" style={{ marginBottom: 16, padding: '20px' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="section-title" style={{ margin: 0 }}>Theme</p>
              <button onClick={handleDarkToggle} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {dark ? <RiSunLine size={15} /> : <RiMoonLine size={15} />}
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {Object.entries(THEMES).map(([key, t]) => (
                <div key={key} onClick={() => handleThemeChange(key)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${t.sidebar} 50%, ${t.accent} 50%)`, margin: '0 auto 4px', border: theme === key ? '3px solid var(--text)' : '3px solid transparent', transition: 'border 0.2s', boxShadow: theme === key ? '0 0 0 2px var(--accent)' : 'none' }} />
                  <p style={{ fontSize: 10.5, fontWeight: theme === key ? 700 : 400, color: theme === key ? 'var(--text)' : 'var(--muted)' }}>{t.name}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sign Out */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginBottom: 12 }}>
            <AnimatePresence>
              {showLogoutConfirm ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="glass-card"
                  style={{ padding: '16px 20px', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Sign out of CareerDock?</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>You'll need to log in again to access your data.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }} onClick={handleLogout}>
                      <RiLogoutBoxLine size={14} /> Yes, Sign Out
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="btn w-full"
                  style={{ justifyContent: 'center', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 16px' }}
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <RiLogoutBoxLine size={16} /> Sign Out
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Delete Account */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <AnimatePresence mode="wait">
              {showDeleteConfirm ? (
                <motion.div
                  key="del-confirm"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="glass-card"
                  style={{ padding: '16px 20px', border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.04)' }}
                >
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#ef4444', marginBottom: 4 }}>Delete account permanently?</p>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
                    This will erase all your applications, rounds, notes, resumes, and tasks. This cannot be undone.
                  </p>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>
                    Type <strong style={{ color: 'var(--text)' }}>DELETE</strong> to confirm:
                  </p>
                  <input
                    className="form-input"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder="DELETE"
                    style={{ marginBottom: 12, fontSize: 13 }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: deleteInput === 'DELETE' && !deleting ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13, opacity: deleteInput === 'DELETE' ? 1 : 0.45 }}
                      disabled={deleteInput !== 'DELETE' || deleting}
                      onClick={handleDeleteAccount}
                    >
                      <RiDeleteBin6Line size={13} /> {deleting ? 'Deleting…' : 'Delete My Account'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}>Cancel</button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="del-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="btn w-full"
                  style={{ justifyContent: 'center', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 16px' }}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <RiDeleteBin6Line size={16} /> Delete Account
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
