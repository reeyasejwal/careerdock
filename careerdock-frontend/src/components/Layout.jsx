import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import api from '../services/api';
import {
  RiDashboardLine, RiFileListLine, RiFocus3Line,
  RiFileTextLine, RiRobot2Line, RiCalendarLine,
  RiMenuLine, RiCloseLine, RiEditLine, RiLogoutBoxRLine,
  RiPaletteLine, RiSunLine, RiMoonLine, RiNotification3Line
} from 'react-icons/ri';

const NAV = [
  { section: 'MAIN', items: [
    { to: '/dashboard',     icon: RiDashboardLine, label: 'Dashboard' },
    { to: '/applications',  icon: RiFileListLine,  label: 'Applications' },
    { to: '/tracker',       icon: RiFocus3Line,    label: 'Tracker' },
  ]},
  { section: 'WORKSPACE', items: [
    { to: '/resumes',   icon: RiFileTextLine, label: 'Resumes' },
    { to: '/chat',      icon: RiRobot2Line,   label: 'DockAI' },
    { to: '/planner',   icon: RiCalendarLine, label: 'Planner' },
  ]},
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, dark, setTheme, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [urgentRounds, setUrgentRounds] = useState([]);
  const bellRef = useRef(null);
  const popupRef = useRef(null);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully 👋');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    api.get('/dashboard/upcoming').then(r => {
      const urgent = r.data.filter(round => {
        const diff = Math.ceil((new Date(round.scheduled_at) - Date.now()) / 86400000);
        return diff <= 2;
      });
      setUrgentRounds(urgent);
    }).catch(() => {});
  }, []);
  const closeSidebar = () => setSidebarOpen(false);
  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopupOpen(false);
        setShowThemePicker(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleThemeChange = async (key) => {
    setTheme(key);
    try { await api.put('/auth/theme', { theme: key, darkMode: dark }); } catch {}
  };

  const handleDarkToggle = async () => {
    toggleDark();
    try { await api.put('/auth/theme', { theme, darkMode: !dark }); } catch {}
  };

  return (
    <div className="layout">
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--cardBg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px', backdropFilter: 'blur(12px)' } }} />

      <button className="hamburger" onClick={() => setSidebarOpen(true)}>
        <RiMenuLine />
      </button>

      {sidebarOpen && <div className="sidebar-overlay open" onClick={closeSidebar} />}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="cd-monogram">CD</div>
          <div className="brand-text">
            <div className="brand-name">Career<span>Dock</span></div>
            <div className="brand-tagline">Track every application. Miss nothing.</div>
          </div>
          {sidebarOpen && (
            <button style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer' }} onClick={closeSidebar}>
              <RiCloseLine size={18}/>
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: 12 }}>
              <div className="nav-section-label">{section}</div>
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to} to={to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={closeSidebar}
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom" ref={popupRef} style={{ position: 'relative' }}>
          {popupOpen && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: 8,
              background: 'rgba(20,20,30,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
              zIndex: 200,
            }}>
              {!showThemePicker ? (
                <>
                  <MenuItem icon={RiEditLine} label="Edit Profile" onClick={() => { navigate('/account'); setPopupOpen(false); closeSidebar(); }} />
                  <MenuItem icon={RiPaletteLine} label="Select Theme" onClick={() => setShowThemePicker(true)} />
                  {showLogoutConfirm ? (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>Sign out of CareerDock?</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleLogout} style={{ flex: 1, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 7, padding: '6px 0', color: '#f87171', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
                          Sign Out
                        </button>
                        <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '6px 0', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12.5 }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MenuItem icon={RiLogoutBoxRLine} label="Sign Out" color="rgba(255,120,100,0.9)" onClick={() => setShowLogoutConfirm(true)} />
                  )}
                </>
              ) : (
                <div style={{ padding: 14 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:11.5, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.05em' }}>SELECT THEME</span>
                    <button onClick={() => setShowThemePicker(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13 }}>← Back</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
                    {Object.entries(THEMES).map(([key, t]) => (
                      <div key={key} onClick={() => handleThemeChange(key)} style={{ textAlign:'center', cursor:'pointer' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${t.sidebar} 50%, ${t.accent} 50%)`,
                          margin: '0 auto 4px',
                          border: theme === key ? '2.5px solid white' : '2.5px solid transparent',
                          transition: 'border 0.2s',
                          boxShadow: theme === key ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none'
                        }} />
                        <p style={{ fontSize: 9.5, color: theme === key ? 'white' : 'rgba(255,255,255,0.45)', fontWeight: theme === key ? 700 : 400 }}>{t.name}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleDarkToggle}
                    style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'8px 12px', color:'rgba(255,255,255,0.8)', cursor:'pointer', fontSize:12.5, fontWeight:500 }}
                  >
                    {dark ? <RiSunLine size={14}/> : <RiMoonLine size={14}/>}
                    {dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              className="user-card"
              onClick={() => { setPopupOpen(p => !p); setShowThemePicker(false); setShowLogoutConfirm(false); }}
              style={{ cursor: 'pointer', userSelect: 'none', flex: 1 }}
              title="Account options"
            >
              <div className="user-avatar">{initial}</div>
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => { setShowLogoutConfirm(true); setPopupOpen(true); setShowThemePicker(false); }}
              title="Sign Out"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px', borderRadius: 8, transition: 'color 0.2s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              <RiLogoutBoxRLine size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* Notification Bell */}
        <div ref={bellRef} style={{ position: 'fixed', top: 14, right: 16, zIndex: 300 }}>
          <button
            onClick={() => setBellOpen(b => !b)}
            style={{ position: 'relative', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 9px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', backdropFilter: 'blur(12px)' }}
            title="Upcoming rounds"
          >
            <RiNotification3Line size={18} />
            {urgentRounds.length > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {urgentRounds.length}
              </span>
            )}
          </button>
          {bellOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 280, background: 'var(--cardBg)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.25)', backdropFilter: 'blur(20px)', overflow: 'hidden', zIndex: 400 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Upcoming Rounds</p>
              </div>
              {urgentRounds.length === 0 ? (
                <p style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted)' }}>No urgent rounds in the next 2 days.</p>
              ) : urgentRounds.map(r => {
                const diff = Math.ceil((new Date(r.scheduled_at) - Date.now()) / 86400000);
                return (
                  <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.company_name}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--muted)' }}>Round {r.round_number} · {r.category}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: diff === 0 ? '#ef4444' : '#f97316' }}>
                      {diff === 0 ? 'TODAY' : 'TOMORROW'}
                    </span>
                  </div>
                );
              })}
              <div style={{ padding: '10px 16px' }}>
                <button className="btn btn-outline btn-sm w-full" style={{ fontSize: 12 }} onClick={() => { setBellOpen(false); navigate('/dashboard'); }}>View All on Dashboard</button>
              </div>
            </div>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '11px 16px',
        background: hovered ? 'rgba(255,255,255,0.07)' : 'none',
        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)',
        color: color || 'rgba(255,255,255,0.85)',
        cursor: 'pointer', fontSize: 13, fontWeight: 500,
        transition: 'background 0.15s',
        textAlign: 'left',
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
