const pool = require('../config/db');

// Add new columns if they don't exist
pool.query('ALTER TABLE tasks ADD COLUMN start_time TIME NULL').catch(() => {});
pool.query('ALTER TABLE tasks ADD COLUMN end_time TIME NULL').catch(() => {});
pool.query('ALTER TABLE tasks ADD COLUMN task_date DATE NULL').catch(() => {});

const BADGE_MAP = { 1:'streak_1', 50:'streak_50', 100:'streak_100' };
const BADGE_NAMES = { streak_1:'First Day! 🌱', streak_50:'50 Day Legend! 🏆', streak_100:'100 Day Champion! 💎' };

const localDateStr = (d = new Date()) => {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const updateStreak = async (userId) => {
  // Use DATE_FORMAT so MySQL never returns a Date object — avoids timezone offset issues
  const [[user]] = await pool.query(
    'SELECT streak_count, DATE_FORMAT(last_active_date, "%Y-%m-%d") AS last_active_date FROM users WHERE id=?',
    [userId]
  );
  const today = localDateStr();
  const last = user.last_active_date || null;

  // Already updated today — do nothing
  if (last === today) return;

  const yesterday = localDateStr(new Date(Date.now() - 86400000));
  const newStreak = last === yesterday ? user.streak_count + 1 : 1;

  await pool.query('UPDATE users SET streak_count=?, last_active_date=? WHERE id=?', [newStreak, today, userId]);

  const badgeType = BADGE_MAP[newStreak];
  if (badgeType) {
    const [ex] = await pool.query('SELECT id FROM badges WHERE user_id=? AND badge_type=?', [userId, badgeType]);
    if (!ex.length) await pool.query('INSERT INTO badges (user_id, badge_type, badge_name) VALUES (?,?,?)', [userId, badgeType, BADGE_NAMES[badgeType]]);
  }
};

exports.getAll = async (req, res) => {
  const { status, category } = req.query;
  try {
    let q = 'SELECT * FROM tasks WHERE user_id=?';
    const p = [req.user.id];
    if (status) { q += ' AND status=?'; p.push(status); }
    if (category) { q += ' AND category=?'; p.push(category); }
    q += ' ORDER BY FIELD(status,"todo","missed","done"), FIELD(priority,"high","medium","low"), due_date ASC';
    const [rows] = await pool.query(q, p);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  const { title, description, category, priority, due_date, start_time, end_time, task_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  try {
    const [r] = await pool.query(
      'INSERT INTO tasks (user_id, title, description, category, priority, due_date, start_time, end_time, task_date) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.user.id, title, description || null, category || 'other', priority || 'medium', due_date || null, start_time || null, end_time || null, task_date || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  const { title, description, category, priority, due_date, status } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE tasks SET title=?, description=?, category=?, priority=?, due_date=?, status=? WHERE id=? AND user_id=?',
      [title, description || null, category || 'other', priority || 'medium', due_date || null, status || 'todo', req.params.id, req.user.id]
    );
    if (!r.affectedRows) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM tasks WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggle = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT status FROM tasks WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    const cur = rows[0].status;
    const newStatus = cur === 'done' ? 'todo' : 'done';
    await pool.query('UPDATE tasks SET status=? WHERE id=?', [newStatus, req.params.id]);
    if (newStatus === 'done') {
      try { await updateStreak(req.user.id); } catch {}
    }
    res.json({ status: newStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['todo', 'done', 'missed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    const [r] = await pool.query('UPDATE tasks SET status=? WHERE id=? AND user_id=?', [status, req.params.id, req.user.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Not found' });
    if (status === 'done') {
      try { await updateStreak(req.user.id); } catch {}
    }
    res.json({ status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetAll = async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE user_id=?', [req.user.id]);
    res.json({ message: 'All tasks cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
