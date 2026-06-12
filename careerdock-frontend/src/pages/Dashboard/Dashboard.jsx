import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RiFileListLine, RiFocus3Line, RiTrophyLine, RiCloseCircleLine, RiCheckLine, RiTimeLine, RiAddLine, RiRobot2Line, RiCalendarLine, RiDoubleQuotesL } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const QUOTES = [
  { text: "Your preparation today is your confidence tomorrow.", author: "Unknown" },
  { text: "Every application is practice. The right one will land.", author: "Unknown" },
  { text: "Rejection is not failure — it's just redirection.", author: "Unknown" },
  { text: "The interview you're most nervous about changes your life.", author: "Unknown" },
  { text: "Build skills quietly. Let the offer letter speak.", author: "Unknown" },
  { text: "Consistency beats talent when talent doesn't show up.", author: "Unknown" },
  { text: "One round at a time. One day at a time.", author: "Unknown" },
  { text: "Track every application. Miss nothing.", author: "CareerDock" },
  { text: "Your dream company is waiting for the version of you that never gives up.", author: "Unknown" },
  { text: "Each problem you solve is a step toward the offer.", author: "Unknown" },
  { text: "Don't count the rejections. Count the lessons.", author: "Unknown" },
  { text: "Apply. Track. Improve. Repeat.", author: "CareerDock" },
  { text: "The best time to start preparing was yesterday. The second best time is now.", author: "Unknown" },
  { text: "Hard work beats luck when luck doesn't practice.", author: "Unknown" },
  { text: "Your resume tells your story. Your interview proves it.", author: "Unknown" },
  { text: "Show up every day. Your streak will show up for you.", author: "Unknown" },
  { text: "One yes is all it takes. Keep applying.", author: "Unknown" },
  { text: "You are not competing with others. You are competing with yesterday's version of yourself.", author: "Unknown" },
  { text: "A placed student was once exactly where you are now.", author: "Unknown" },
  { text: "The grind you put in now is the salary you'll negotiate later.", author: "Unknown" },
  { text: "Prepare like it matters. Because it does.", author: "Unknown" },
  { text: "Companies don't hire potential. They hire demonstrated effort.", author: "Unknown" },
  { text: "One more application never hurt anyone.", author: "Unknown" },
  { text: "The offer is for those who show up consistently.", author: "Unknown" },
  { text: "Your setback is the setup for your comeback.", author: "Unknown" },
  { text: "Interview season is temporary. Skills are permanent.", author: "Unknown" },
  { text: "Dream big. Apply bigger.", author: "Unknown" },
  { text: "The placement season rewards preparation over perfection.", author: "Unknown" },
  { text: "Every round you clear is proof of what you're capable of.", author: "Unknown" },
  { text: "Success is the sum of small efforts repeated every single day.", author: "R. Collier" },
];

const getDailyQuote = () => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const stored = JSON.parse(localStorage.getItem('cd_quote') || '{}');
    if (stored.date === today) return stored.quote;
    const prevText = stored.quote?.text;
    const pool = prevText ? QUOTES.filter(q => q.text !== prevText) : QUOTES;
    const q = pool[Math.floor(Math.random() * pool.length)];
    localStorage.setItem('cd_quote', JSON.stringify({ date: today, quote: q }));
    return q;
  } catch {
    return QUOTES[0];
  }
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const STREAK_MSG = s => {
  if (s >= 100) return '💎 100 DAY BADGE UNLOCKED! Absolute champion!';
  if (s >= 50)  return `🥇 ${s} day streak! You're incredible!`;
  if (s === 30) return '30 days! Legend! 🏆';
  if (s === 14) return 'Two weeks! Unstoppable! 🚀';
  if (s === 7)  return "One week streak! You're on fire! 🔥";
  if (s >= 3)   return `${s} days strong! Building momentum! 🔥`;
  if (s === 2)  return '2 days in a row! Keep going! 💪';
  if (s === 1)  return 'Great start! Day 1 begins! 🌱';
  if (s > 0)    return `${s} day streak! Stay consistent! 💪`;
  return 'Complete tasks in Planner to build your streak!';
};

function StatCard({ icon: Icon, value, label, delay }) {
  return (
    <motion.div className="glass-card stat-card card-hover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState({ streak: 0, badges: [] });
  const [upcoming, setUpcoming] = useState([]);
  const quote = getDailyQuote();

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/dashboard/streak').then(r => setStreak(r.data)).catch(() => {});
    api.get('/dashboard/upcoming').then(r => {
      setUpcoming(r.data);
      // Toast for rounds happening in ≤2 days
      const urgent = r.data.filter(round => {
        const diff = Math.ceil((new Date(round.scheduled_at) - Date.now()) / 86400000);
        return diff <= 2;
      });
      urgent.slice(0, 3).forEach(round => {
        const diff = Math.ceil((new Date(round.scheduled_at) - Date.now()) / 86400000);
        const when = diff === 0 ? 'TODAY' : diff === 1 ? 'TOMORROW' : `in ${diff} days`;
        toast(`⏰ ${round.company_name} Round ${round.round_number} — ${when}!`, {
          duration: 5000,
          style: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--text)' },
        });
      });
    }).catch(() => {});
    // Ask for browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fmtDate = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    const diff = Math.ceil((d - Date.now()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 0) return `in ${diff} days`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const fmtFullDate = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const urgencyColor = (dt) => {
    if (!dt) return 'var(--primary)';
    const diff = Math.ceil((new Date(dt) - Date.now()) / 86400000);
    if (diff <= 2) return '#ef4444';
    if (diff <= 5) return '#f97316';
    return '#22c55e';
  };

  return (
    <div>
      <Helmet><title>Dashboard | CareerDock</title></Helmet>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 28 }}>
        <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 🌿</h1>
        <p className="page-subtitle">Here's your placement overview</p>
      </motion.div>

      {/* Stat cards */}
      <div className="stat-grid">
        {stats === null ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card skeleton-stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="skeleton skel-icon" />
              <div className="skeleton skel-value" />
              <div className="skeleton skel-label" />
            </div>
          ))
        ) : (
          <>
            <StatCard icon={RiFileListLine}    value={stats.total}            label="Total Applications" delay={0.05} />
            <StatCard icon={RiFocus3Line}      value={stats.in_process}       label="In Process"         delay={0.1}  />
            <StatCard icon={RiTrophyLine}      value={stats.offered}          label="Offers"             delay={0.15} />
            <StatCard icon={RiCloseCircleLine} value={stats.rejected}         label="Rejections"         delay={0.2}  />
            <StatCard icon={RiCheckLine}       value={stats.rounds_completed} label="Rounds Completed"   delay={0.25} />
            <StatCard icon={RiTimeLine}        value={stats.pending_tasks}    label="Pending Tasks"      delay={0.3}  />
          </>
        )}
      </div>

      {/* Streak */}
      <motion.div className="glass-card streak-card card-hover" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }} style={{ marginBottom: 24 }}>
        <span className="streak-fire">🔥</span>
        <div className="streak-count">{streak.streak}</div>
        <div className="streak-label">Day Streak</div>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--primary)', fontWeight: 500 }}>{STREAK_MSG(streak.streak)}</p>
        {streak.badges?.length > 0 && (
          <div className="badge-grid">
            {streak.badges.map(b => (
              <div key={b.id} className="badge-item">
                <span className="badge-icon">
                  {b.badge_type.includes('100') ? '💎' : b.badge_type.includes('50') ? '🏆' : b.badge_type.includes('25') ? '🚀' : b.badge_type.includes('10') ? '💪' : '🔥'}
                </span>
                <span>{b.badge_name}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="two-col">
        {/* Upcoming rounds */}
        <motion.div className="glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ padding: '20px' }}>
          <p className="section-title">Upcoming Rounds (7 days)</p>
          {upcoming.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>No upcoming rounds in the next 7 days. Add rounds with scheduled dates in the Tracker.</p>
            </div>
          ) : upcoming.map(r => (
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderBottom:'1px solid var(--border)', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  {r.round_number}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13.5 }}>{r.company_name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{r.category}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{fmtFullDate(r.scheduled_at)}</p>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: urgencyColor(r.scheduled_at), whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDate(r.scheduled_at)}</span>
            </div>
          ))}
        </motion.div>

        {/* Quote of the Day */}
        <motion.div className="glass-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }} style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'20px' }}>
          <p className="section-title">Quote of the Day</p>
          <div style={{ padding: '12px 0' }}>
            <RiDoubleQuotesL size={28} style={{ color: 'var(--accent)', marginBottom: 12, opacity: 0.7 }} />
            <p style={{ fontSize: 15.5, fontWeight: 500, color: 'var(--text)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 14 }}>
              "{quote.text}"
            </p>
            {quote.author !== 'Unknown' && (
              <p style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>— {quote.author}</p>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            New quote every 24 hours
          </p>
        </motion.div>
      </div>

      {/* Quick links */}
      <motion.div style={{ display:'flex', gap:12, marginTop:24, flexWrap:'wrap' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Link to="/applications" className="btn btn-primary"><RiAddLine /> Add Application</Link>
        <Link to="/chat" className="btn btn-outline"><RiRobot2Line /> Start AI Chat</Link>
        <Link to="/planner" className="btn btn-outline"><RiCalendarLine /> View Calendar</Link>
      </motion.div>
    </div>
  );
}
