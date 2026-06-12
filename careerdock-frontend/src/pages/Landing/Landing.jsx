import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import {
  RiFileListLine, RiFocus3Line, RiFileTextLine, RiRobot2Line,
  RiCalendarLine, RiDashboardLine, RiArrowRightLine, RiCheckLine,
  RiStarLine, RiShieldLine, RiTimeLine,
} from 'react-icons/ri';

const FEATURES = [
  { icon: RiFileListLine,  title: 'Application Tracker',    desc: 'Log every company you apply to. Track status from Applied → Offer in one place.' },
  { icon: RiFocus3Line,    title: 'Round Manager',           desc: 'Add interview rounds, mark outcomes, attach notes. Never lose track of where you stand.' },
  { icon: RiFileTextLine,  title: 'Resume ATS Score',        desc: 'Upload your resume and get an instant ATS score with specific, actionable feedback.' },
  { icon: RiRobot2Line,    title: 'DockAI Co-Pilot',         desc: 'Ask anything — DSA, HR questions, system design, salary negotiation. Powered by Groq.' },
  { icon: RiCalendarLine,  title: 'Smart Planner',           desc: 'Schedule daily tasks with start/end times. Auto-marks missed tasks. View your schedule at a glance.' },
  { icon: RiDashboardLine, title: 'Placement Dashboard',     desc: 'See your streak, upcoming rounds, and placement stats all in one beautiful command center.' },
];

const STATS = [
  { value: '100%', label: 'Free to use' },
  { value: '6+',   label: 'Core features' },
  { value: 'AI',   label: 'Powered prep' },
  { value: '∞',    label: 'Applications to track' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}>
      <Helmet><title>CareerDock — Track Every Application. Miss Nothing.</title></Helmet>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 80px)', height: 64,
        background: 'rgba(var(--bgRaw,250,248,242),0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg,var(--primary),var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '-0.5px',
          }}>CD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            Career<span style={{ color: 'var(--accent)' }}>Dock</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
            color: 'var(--text)', textDecoration: 'none',
            border: '1px solid var(--border)', background: 'transparent',
            transition: 'background 0.2s',
          }}>Sign In</Link>
          <Link to="/register" style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
            color: '#fff', textDecoration: 'none',
            background: 'linear-gradient(135deg,var(--primary),var(--accent))',
            boxShadow: '0 2px 8px rgba(61,84,53,0.25)',
          }}>Get Started Free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        textAlign: 'center',
        padding: 'clamp(60px,10vh,100px) clamp(20px,5vw,80px) clamp(40px,6vh,80px)',
        maxWidth: 760, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(153,173,122,0.14)', border: '1px solid rgba(153,173,122,0.4)',
          borderRadius: 99, padding: '5px 14px', fontSize: 12.5, fontWeight: 600,
          color: 'var(--primary)', marginBottom: 28,
        }}>
          <RiStarLine size={12} /> Free for students · No credit card needed
        </div>

        <h1 style={{
          fontSize: 'clamp(36px,6vw,58px)', fontWeight: 800, lineHeight: 1.12,
          margin: '0 0 20px', color: 'var(--text)',
          letterSpacing: '-0.03em',
        }}>
          Track every application.<br />
          <span style={{ color: 'var(--accent)' }}>Miss nothing.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px,2vw,18px)', color: 'var(--muted)', lineHeight: 1.65,
          margin: '0 auto 36px', maxWidth: 540,
        }}>
          CareerDock is your placement command center — manage every company, every round,
          every resume, and prep smarter with AI. Built for students, by students.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700,
            color: '#fff', textDecoration: 'none',
            background: 'linear-gradient(135deg,var(--primary),var(--accent))',
            boxShadow: '0 4px 18px rgba(61,84,53,0.3)',
          }}>
            Get Started Free <RiArrowRightLine size={16} />
          </Link>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            color: 'var(--text)', textDecoration: 'none',
            background: 'var(--cardBg)', border: '1px solid var(--border)',
          }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{
        display: 'flex', justifyContent: 'center', gap: 'clamp(20px,4vw,60px)',
        flexWrap: 'wrap',
        padding: '32px clamp(20px,5vw,80px)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section style={{ padding: 'clamp(48px,8vh,80px) clamp(20px,5vw,80px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, margin: '0 0 12px', color: 'var(--text)' }}>
            Everything you need for placement season
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 480, margin: '0 auto' }}>
            Six powerful tools in one app — no juggling spreadsheets, Notion pages, and sticky notes anymore.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))',
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: '24px 22px',
              background: 'var(--cardBg)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              backdropFilter: 'blur(12px)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(61,84,53,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 10, marginBottom: 14,
                background: 'linear-gradient(135deg,rgba(153,173,122,0.25),rgba(61,84,53,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why CareerDock ── */}
      <section style={{
        padding: 'clamp(40px,7vh,72px) clamp(20px,5vw,80px)',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, margin: '0 0 32px', textAlign: 'center', color: 'var(--text)' }}>
            Why students love CareerDock
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: RiShieldLine, title: 'Private & secure',      desc: 'Your data stays yours. No ads, no selling your information.' },
              { icon: RiTimeLine,   title: 'Never miss a round',    desc: 'Notifications for upcoming interviews. Auto-tracks overdue tasks.' },
              { icon: RiCheckLine,  title: 'Free forever',          desc: 'All core features are 100% free. No paywalls, no trial periods.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
                padding: '18px 20px', borderRadius: 12,
                background: 'var(--cardBg)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg,rgba(153,173,122,0.25),rgba(61,84,53,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.icon size={17} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>{item.title}</p>
                  <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(48px,8vh,80px) clamp(20px,5vw,80px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, margin: '0 0 14px', color: 'var(--text)' }}>
          Ready to own your placement season?
        </h2>
        <p style={{ fontSize: 15.5, color: 'var(--muted)', margin: '0 auto 32px', maxWidth: 420, lineHeight: 1.6 }}>
          Sign up in 30 seconds. Add your first application in under a minute.
        </p>
        <Link to="/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 32px', borderRadius: 10, fontSize: 15.5, fontWeight: 700,
          color: '#fff', textDecoration: 'none',
          background: 'linear-gradient(135deg,var(--primary),var(--accent))',
          boxShadow: '0 4px 20px rgba(61,84,53,0.3)',
        }}>
          Start for free <RiArrowRightLine size={17} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '20px clamp(20px,5vw,80px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
        fontSize: 13, color: 'var(--muted)',
      }}>
        <span>© 2025 CareerDock — Track every application. Miss nothing.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/login"    style={{ color: 'var(--muted)', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
}
