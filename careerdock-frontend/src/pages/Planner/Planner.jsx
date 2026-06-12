import { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfDay } from 'date-fns';
import { RiAddLine, RiDeleteBinLine, RiCheckLine, RiArrowLeftLine, RiArrowRightLine, RiGithubLine, RiExternalLinkLine, RiStickyNoteLine, RiTimeLine } from 'react-icons/ri';
import api from '../../services/api';
import { useConfirm } from '../../components/ConfirmDialog';

function fmt12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${suffix}`;
}

function TaskModal({ onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ title: '', description: '', task_date: today, start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);
  const [timeError, setTimeError] = useState('');
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (k === 'end_time' || k === 'start_time') setTimeError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      setTimeError('End time must be after start time');
      return;
    }
    setSaving(true);
    try {
      await api.post('/tasks', {
        title: form.title,
        description: form.description || null,
        category: 'other',
        priority: 'medium',
        task_date: form.task_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        due_date: form.task_date || null,
      });
      toast.success('Task added!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <p className="modal-title">Add Task</p>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task *</label>
            <input className="form-input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Review resume, Solve 5 problems…" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.task_date} onChange={e => set('task_date', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Time</label>
              <input className="form-input" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Time</label>
              <input className="form-input" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>
          {timeError && <p style={{ color: '#EF5350', fontSize: 12, marginTop: 6 }}>{timeError}</p>}
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Any additional details…" style={{ minHeight: 60 }} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StickyNote({ repoName, username, note, onSave, onDelete }) {
  const isNew = note === '__new__';
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(isNew ? '' : note);
  const [hovered, setHovered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/planner/integrations/github/notes', { username, repoName, note: draft });
      localStorage.setItem(`gh_note_${username}_${repoName}`, draft);
      onSave(draft);
      setEditing(false);
      toast.success('Note saved!');
    } catch { toast.error('Failed to save note'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete('/planner/integrations/github/notes', { data: { username, repoName } });
      localStorage.removeItem(`gh_note_${username}_${repoName}`);
      onDelete();
      toast.success('Note deleted');
    } catch { toast.error('Failed to delete note'); }
    setConfirmDelete(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      style={{ marginTop: 10, padding: '10px 12px', background: '#FEFCE8', border: '1px solid rgba(200,160,60,0.35)', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📌</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <>
              <textarea
                value={draft} onChange={e => setDraft(e.target.value)} autoFocus
                style={{ width: '100%', minHeight: 80, padding: '6px 8px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(200,160,60,0.5)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#4A3800' }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { if (isNew) { onDelete(); } else { setEditing(false); setDraft(note); } }}>Cancel</button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#4A3800', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{note}</p>
          )}
        </div>
        {!editing && (
          <div style={{ display: 'flex', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
            {confirmDelete ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#fff', border: '1px solid #EF5350', borderRadius: 6, padding: '2px 6px' }}>
                <span style={{ fontSize: 11, color: '#B71C1C', fontWeight: 600 }}>Delete?</span>
                <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B71C1C', fontWeight: 700, fontSize: 12 }}>Yes</button>
                <button onClick={() => setConfirmDelete(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 12 }}>No</button>
              </div>
            ) : (
              <>
                <button onClick={() => setEditing(true)} title="Edit note" style={{ background: 'rgba(200,160,60,0.15)', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, fontSize: 13 }}>✏️</button>
                <button onClick={() => setConfirmDelete(true)} title="Delete note" style={{ background: 'rgba(239,83,80,0.1)', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, fontSize: 13 }}>🗑️</button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  const isDone = task.status === 'done';
  const isMissed = task.status === 'missed';

  let timeDisplay = null;
  if (task.start_time) {
    timeDisplay = task.end_time
      ? `${fmt12(task.start_time)} – ${fmt12(task.end_time)}`
      : fmt12(task.start_time);
  } else if (task.due_date) {
    try { timeDisplay = format(new Date(task.due_date), 'h:mm a'); } catch {}
  }

  return (
    <motion.div
      className={`task-item${isDone ? ' done' : ''}`}
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
    >
      <div
        onClick={() => onToggle(task.id)}
        style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
          border: `2px solid ${isDone ? 'var(--primary)' : isMissed ? '#EF5350' : 'var(--accent)'}`,
          background: isDone ? 'var(--primary)' : isMissed ? 'rgba(239,83,80,0.12)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', color: isDone ? '#fff' : '#EF5350',
        }}
        title="Mark as done"
      >
        {isDone && <RiCheckLine size={14} />}
        {isMissed && <span style={{ fontSize: 9, fontWeight: 800 }}>✕</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13.5, fontWeight: 500,
          color: isMissed ? '#EF5350' : 'var(--text)',
          textDecoration: isDone ? 'line-through' : 'none',
          opacity: isDone ? 0.6 : 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{task.title}</p>
        {timeDisplay && (
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
            <RiTimeLine size={10} />{timeDisplay}
          </p>
        )}
      </div>

      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDelete(task.id)} style={{ flexShrink: 0 }}>
        <RiDeleteBinLine size={13} />
      </button>
    </motion.div>
  );
}

export default function Planner() {
  const { confirm, dialog } = useConfirm();
  const [mainTab, setMainTab] = useState('tasks');
  const [taskTab, setTaskTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calData, setCalData] = useState({ events: [], rounds: [] });
  const [selectedDay, setSelectedDay] = useState(null);
  const [ghUsername, setGhUsername] = useState('');
  const [ghRepos, setGhRepos] = useState([]);
  const [ghError, setGhError] = useState('');
  const [ghLoading, setGhLoading] = useState(false);
  const [ghNotes, setGhNotes] = useState({});

  const loadTasks = () => {
    setLoading(true);
    api.get('/tasks').then(r => setTasks(r.data)).finally(() => setLoading(false));
  };

  const loadCalendar = () => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth() + 1;
    api.get(`/planner/calendar/${y}/${m}`).then(r => setCalData(r.data)).catch(() => {});
  };

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { if (mainTab === 'calendar') loadCalendar(); }, [mainTab, currentMonth]);

  // Auto-move overdue tasks to "missed" — checks every 30 seconds using proper Date comparison
  const checkOverdueTasks = useCallback(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    tasks.forEach(async (task) => {
      if (task.status !== 'todo') return;
      if (!task.end_time) return;
      const taskDate = task.task_date ? String(task.task_date).slice(0, 10) : null;
      if (taskDate && taskDate !== todayStr) return;
      const [hours, minutes] = task.end_time.split(':').map(Number);
      const endDateTime = new Date();
      endDateTime.setHours(hours, minutes, 59, 999); // end of that minute — not one second before
      if (now > endDateTime) {
        try {
          await api.patch(`/tasks/${task.id}/status`, { status: 'missed' });
          loadTasks();
          toast(`⏰ "${task.title}" moved to Not Done`, { icon: '⏰', duration: 3000 });
        } catch (e) {
          console.error('Failed to mark task missed:', e);
        }
      }
    });
  }, [tasks]);

  useEffect(() => {
    checkOverdueTasks();
    const interval = setInterval(checkOverdueTasks, 30000);
    return () => clearInterval(interval);
  }, [checkOverdueTasks]);

  const toggle = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try {
      if (task.status === 'missed') {
        await api.patch(`/tasks/${id}/status`, { status: 'done' });
      } else {
        await api.patch(`/tasks/${id}/toggle`);
      }
      if (newStatus === 'done') toast.success('Task completed! 🎉');
    } catch {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: task.status } : t));
      toast.error('Failed to update task');
    }
  };

  const del = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete task');
      loadTasks();
    }
  };

  const resetAll = async () => {
    const ok = await confirm({ title: 'Clear All Tasks', message: 'This will permanently delete every task. This cannot be undone.', confirmLabel: 'Clear All', cancelLabel: 'Keep Tasks' });
    if (!ok) return;
    await api.delete('/tasks/reset');
    toast.success('All tasks cleared');
    loadTasks();
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const getDate = (t) => {
    const d = t.task_date ? String(t.task_date).slice(0, 10) : t.due_date ? String(t.due_date).slice(0, 10) : null;
    return d;
  };

  // All tasks for today regardless of status — done/missed stay visible in Tasks tab
  const todayTasks = tasks.filter(t => {
    const d = getDate(t);
    return !d || d === todayStr;
  });

  const completedTasks = tasks.filter(t => t.status === 'done');

  // Not Done = only tasks the system explicitly marked missed (end_time passed)
  const missedTasks = tasks.filter(t => t.status === 'missed');

  // Build schedule from today's tasks sorted by start_time
  const buildSchedule = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    const todayAll = tasks.filter(t => {
      const taskDate = t.task_date ? String(t.task_date).slice(0, 10) : null;
      const dueDate = t.due_date ? String(t.due_date).slice(0, 10) : null;
      const date = taskDate || dueDate;
      return !date || date === todayStr;
    });

    const timed = todayAll.filter(t => t.start_time).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const untimed = todayAll.filter(t => !t.start_time);

    const isOngoing = (t) => t.start_time && t.end_time && t.start_time <= currentTime && t.end_time >= currentTime;

    return [
      ...timed.map(t => ({
        ...t,
        timeDisplay: t.end_time ? `${fmt12(t.start_time)} – ${fmt12(t.end_time)}` : fmt12(t.start_time),
        isOngoing: isOngoing(t),
      })),
      ...untimed.map(t => ({ ...t, timeDisplay: null, isOngoing: false })),
    ];
  };

  const fetchGitHub = async () => {
    if (!ghUsername.trim()) return;
    setGhLoading(true); setGhError(''); setGhRepos([]);
    try {
      const res = await fetch(`https://api.github.com/users/${ghUsername.trim()}/repos?sort=updated&per_page=30`);
      if (!res.ok) {
        if (res.status === 404) throw new Error(`User "${ghUsername}" not found on GitHub`);
        if (res.status === 403) throw new Error('GitHub rate limit reached. Try again in a minute.');
        throw new Error('GitHub API error');
      }
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Unexpected response from GitHub');
      setGhRepos(data);
      const notes = {};
      data.forEach(r => { const n = localStorage.getItem(`gh_note_${ghUsername.trim()}_${r.name}`); if (n) notes[r.name] = n; });
      setGhNotes(notes);
      if (data.length === 0) setGhError('No public repositories found.');
    } catch (err) {
      setGhError(err.message); toast.error(err.message);
    } finally { setGhLoading(false); }
  };

  const calDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startOffset = getDay(startOfMonth(currentMonth));
  const getRoundsForDay = (day) => calData.rounds.filter(r => r.scheduled_at && isSameDay(new Date(r.scheduled_at), day));
  const getEventsForDay = (day) => calData.events.filter(e => isSameDay(new Date(e.event_date), day));

  const schedule = buildSchedule();
  const doneTodayCount = schedule.filter(t => t.status === 'done').length;
  const totalTodayCount = schedule.length;
  const progressPct = totalTodayCount > 0 ? Math.round((doneTodayCount / totalTodayCount) * 100) : 0;

  return (
    <div>
      <Helmet><title>Planner | CareerDock</title></Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Planner</h1>
          <p className="page-subtitle">Tasks · Schedule · Calendar · GitHub</p>
        </div>
        {mainTab === 'tasks' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={resetAll} style={{ color: '#B71C1C' }}>Reset All</button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><RiAddLine /> Add Task</button>
          </div>
        )}
      </div>

      <div className="tabs">
        {[['tasks', 'Tasks'], ['schedule', 'Auto Schedule'], ['calendar', 'Calendar'], ['github', 'GitHub']].map(([v, l]) => (
          <button key={v} className={`tab-btn${mainTab === v ? ' active' : ''}`} onClick={() => setMainTab(v)}>{l}</button>
        ))}
      </div>

      {/* ── TASKS ── */}
      {mainTab === 'tasks' && (
        <div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn${taskTab === 'today' ? ' active' : ''}`} onClick={() => setTaskTab('today')}>
              Today's Tasks {todayTasks.length > 0 && <span className="nav-badge" style={{ marginLeft: 4 }}>{todayTasks.length}</span>}
            </button>
            <button className={`tab-btn${taskTab === 'completed' ? ' active' : ''}`} onClick={() => setTaskTab('completed')}>
              Completed {completedTasks.length > 0 && <span className="nav-badge" style={{ marginLeft: 4, background: '#4CAF50' }}>{completedTasks.length}</span>}
            </button>
            <button className={`tab-btn${taskTab === 'pending' ? ' active' : ''}`} onClick={() => setTaskTab('pending')}>
              Not Done {missedTasks.length > 0 && <span className="nav-badge" style={{ marginLeft: 4, background: '#EF5350' }}>{missedTasks.length}</span>}
            </button>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner-ring" /></div>
          ) : taskTab === 'today' ? (
            todayTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No tasks for today yet</h3>
                <p>Add tasks to plan your day.</p>
                <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowModal(true)}><RiAddLine /> Add Task</button>
              </div>
            ) : (
              <AnimatePresence>
                {todayTasks.map(t => <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={del} />)}
              </AnimatePresence>
            )
          ) : taskTab === 'completed' ? (
            completedTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏆</div>
                <h3>No completed tasks yet</h3>
                <p>Mark tasks done to see them here. Keep going!</p>
              </div>
            ) : (
              <AnimatePresence>
                {completedTasks.map(t => <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={del} />)}
              </AnimatePresence>
            )
          ) : (
            missedTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <h3>All caught up!</h3>
                <p>No overdue or missed tasks. You're on track!</p>
              </div>
            ) : (
              <AnimatePresence>
                {missedTasks.map(t => <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={del} />)}
              </AnimatePresence>
            )
          )}
        </div>
      )}

      {/* ── AUTO SCHEDULE ── */}
      {mainTab === 'schedule' && (
        <div>
          <div className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <p className="section-title" style={{ margin: 0 }}>Today's Schedule</p>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · All tasks shown — timed tasks sorted first. Status tag shown for each.
            </p>

            {schedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13.5 }}>
                No tasks added yet. Add tasks to generate your schedule.
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--accent)' }}>
                        <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--primary)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface)', borderRadius: '8px 0 0 0' }}>Time</th>
                        <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--primary)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface)' }}>Task</th>
                        <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--primary)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface)', borderRadius: '0 8px 0 0' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row, i) => {
                        const bgBase = row.isOngoing
                          ? 'rgba(var(--accentRgb, 153,173,122), 0.13)'
                          : i % 2 === 0 ? 'transparent' : 'var(--surface)';
                        const statusIcon = row.status === 'done'
                          ? { icon: '✅', label: 'Done', color: '#1A6634', bg: 'rgba(76,175,80,0.12)' }
                          : row.status === 'missed'
                          ? { icon: '❌', label: 'Not Done', color: '#B71C1C', bg: 'rgba(239,83,80,0.12)' }
                          : row.isOngoing
                          ? { icon: '🔵', label: 'In Progress', color: '#1565C0', bg: 'rgba(74,108,247,0.12)' }
                          : { icon: '⏳', label: 'Pending', color: 'var(--primary)', bg: 'rgba(153,173,122,0.15)' };
                        return (
                          <tr key={row.id} style={{ borderBottom: '1px solid var(--border)', background: bgBase, transition: 'background 0.15s' }}>
                            <td style={{ padding: '12px 14px', color: row.isOngoing ? 'var(--accent)' : 'var(--primary)', fontWeight: row.isOngoing ? 700 : 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                              {row.timeDisplay || <span style={{ color: 'var(--muted)', fontWeight: 400, fontStyle: 'italic' }}>No time set</span>}
                              {row.isOngoing && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>NOW</span>}
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 500 }}>{row.title}</td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: statusIcon.bg, color: statusIcon.color }}>
                                {statusIcon.icon} {statusIcon.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--surface)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      Today's Targets: {doneTodayCount}/{totalTodayCount} tasks completed
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{progressPct}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CALENDAR ── */}
      {mainTab === 'calendar' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><RiArrowLeftLine /></button>
            <span style={{ fontWeight: 600, fontSize: 16, minWidth: 140, textAlign: 'center' }}>{format(currentMonth, 'MMMM yyyy')}</span>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><RiArrowRightLine /></button>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={loadCalendar}>↻ Refresh</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {Array(startOffset).fill(null).map((_, i) => <div key={`e-${i}`} />)}
            {calDays.map(day => {
              const dayRounds = getRoundsForDay(day);
              const dayEvents = getEventsForDay(day);
              const allItems = [
                ...dayRounds.map(r => ({ type: 'round', label: `${r.company_name} R${r.round_number}`, detail: r })),
                ...dayEvents.map(e => ({ type: e.source === 'tracker' ? 'tracker' : 'manual', label: e.title, detail: e })),
              ];
              const visible = allItems.slice(0, 2);
              const overflow = allItems.length - 2;
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const chipStyle = (type) => ({
                display: 'block', fontSize: 10, fontWeight: 600, padding: '2px 5px',
                borderRadius: 4, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                ...(type === 'round'   ? { background: 'rgba(153,173,122,0.35)', color: '#2A4A20' } :
                    type === 'tracker' ? { background: 'rgba(74,108,247,0.18)', color: '#2A3D80' } :
                                         { background: 'rgba(74,103,65,0.15)', color: 'var(--primary)' }),
              });
              return (
                <div
                  key={day.toISOString()}
                  className={`cal-day${isToday(day) ? ' today' : ''}${!isSameMonth(day, currentMonth) ? ' other-month' : ''}`}
                  style={isSelected ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 2px var(--primary)30' } : {}}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                >
                  <div style={{ marginBottom: 4 }}>
                    {isToday(day) ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                        {format(day, 'd')}
                      </span>
                    ) : (
                      <span className="cal-day-num">{format(day, 'd')}</span>
                    )}
                  </div>
                  {visible.map((item, i) => (
                    <div key={i} style={chipStyle(item.type)} title={item.label}>
                      {item.label.length > 14 ? item.label.slice(0, 14) + '…' : item.label}
                    </div>
                  ))}
                  {overflow > 0 && <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>+{overflow} more</div>}
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedDay && (() => {
              const dayRounds = getRoundsForDay(selectedDay);
              const dayEvents = getEventsForDay(selectedDay);
              if (!dayRounds.length && !dayEvents.length) return null;
              return (
                <motion.div className="glass-card" key="day-popup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ marginTop: 16, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{format(selectedDay, 'EEEE, MMMM d')}</p>
                    <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                  {dayRounds.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ background: 'rgba(153,173,122,0.3)', color: '#2A4A20', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, flexShrink: 0, marginTop: 1 }}>ROUND</span>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600 }}>{r.company_name}</p>
                        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{r.category} · Round {r.round_number} · <span className={`badge badge-${r.status}`} style={{ fontSize: 10 }}>{r.status}</span></p>
                        {r.scheduled_at && <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 3 }}>🕐 {format(new Date(r.scheduled_at), 'h:mm a')}</p>}
                      </div>
                    </div>
                  ))}
                  {dayEvents.map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ background: e.source === 'tracker' ? 'rgba(74,108,247,0.15)' : 'rgba(74,103,65,0.12)', color: e.source === 'tracker' ? '#2A3D80' : 'var(--primary)', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, flexShrink: 0, marginTop: 1, textTransform: 'uppercase' }}>{e.source === 'tracker' ? 'APPLIED' : 'EVENT'}</span>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</p>
                        {e.source && <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{e.source === 'tracker' ? 'Application added' : 'Calendar event'}</p>}
                      </div>
                    </div>
                  ))}
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <div style={{ display: 'flex', gap: 14, marginTop: 16, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap', padding: '10px 14px', background: 'var(--surface)', borderRadius: 10 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 11.5 }}>Legend:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(153,173,122,0.5)', display: 'inline-block' }} /> Round scheduled</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(74,108,247,0.3)', display: 'inline-block' }} /> Application added</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(74,103,65,0.2)', display: 'inline-block' }} /> Manual event</span>
          </div>
        </div>
      )}

      {/* ── GITHUB ── */}
      {mainTab === 'github' && (
        <div>
          <div className="glass-card" style={{ marginBottom: 16, padding: '20px' }}>
            <p className="section-title">Connect GitHub</p>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>Enter your GitHub username to view your public repositories.</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="form-input" value={ghUsername} onChange={e => { setGhUsername(e.target.value); setGhError(''); }} placeholder="e.g. torvalds" onKeyDown={e => e.key === 'Enter' && fetchGitHub()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={fetchGitHub} disabled={ghLoading || !ghUsername.trim()}>
                <RiGithubLine />{ghLoading ? 'Loading…' : 'Fetch Repos'}
              </button>
            </div>
            {ghError && <p style={{ color: '#C05A30', fontSize: 12.5, marginTop: 8 }}>{ghError}</p>}
          </div>

          {ghRepos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>{ghRepos.length} PUBLIC REPOSITORIES</p>
              {ghRepos.map(repo => (
                <motion.div key={repo.id} className="glass-card card-hover" style={{ padding: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <a href={repo.html_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {repo.name} <RiExternalLinkLine size={12} />
                        </a>
                        {repo.fork && <span className="badge badge-applied" style={{ fontSize: 10 }}>fork</span>}
                      </div>
                      {repo.description && <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.description}</p>}
                      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
                        {repo.language && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />{repo.language}</span>}
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🍴 {repo.forks_count}</span>
                        <span>Updated {new Date(repo.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                      </div>
                      <AnimatePresence>
                        {ghNotes[repo.name] && (
                          <StickyNote
                            repoName={repo.name} username={ghUsername} note={ghNotes[repo.name]}
                            onSave={(newNote) => setGhNotes(prev => ({ ...prev, [repo.name]: newNote }))}
                            onDelete={() => setGhNotes(prev => { const n = { ...prev }; delete n[repo.name]; return n; })}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    {!ghNotes[repo.name] && (
                      <button className="btn btn-ghost btn-icon btn-sm" title="Add sticky note" onClick={() => setGhNotes(prev => ({ ...prev, [repo.name]: '__new__' }))} style={{ color: 'var(--muted)', flexShrink: 0 }}>
                        <RiStickyNoteLine size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSaved={loadTasks} />}
      {dialog}
    </div>
  );
}
