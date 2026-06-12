const pool = require('../config/db');

exports.getStats = async (req, res) => {
  const uid = req.user.id;
  try {
    const [[statusCounts]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(overall_status='applied') AS applied,
        SUM(overall_status='in-process') AS in_process,
        SUM(overall_status='offered') AS offered,
        SUM(overall_status='rejected') AS rejected
      FROM applications WHERE user_id=?`, [uid]);
    const [[roundsDone]] = await pool.query(
      `SELECT COUNT(*) AS completed FROM rounds r JOIN applications a ON r.application_id=a.id
       WHERE a.user_id=? AND r.status IN ('completed','passed')`, [uid]);
    const [[pendingTasks]] = await pool.query(
      `SELECT COUNT(*) AS pending FROM tasks WHERE user_id=? AND status='todo'`, [uid]);
    res.json({
      total: statusCounts.total || 0,
      applied: statusCounts.applied || 0,
      in_process: statusCounts.in_process || 0,
      offered: statusCounts.offered || 0,
      rejected: statusCounts.rejected || 0,
      rounds_completed: roundsDone.completed || 0,
      pending_tasks: pendingTasks.pending || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStreak = async (req, res) => {
  const uid = req.user.id;
  try {
    const [[user]] = await pool.query('SELECT streak_count, last_active_date FROM users WHERE id=?', [uid]);
    const [badges] = await pool.query('SELECT * FROM badges WHERE user_id=? ORDER BY earned_at DESC', [uid]);
    res.json({ streak: user.streak_count || 0, last_active: user.last_active_date, badges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkin = async (req, res) => {
  const uid = req.user.id;
  try {
    const [[user]] = await pool.query('SELECT streak_count, last_active_date FROM users WHERE id=?', [uid]);
    const today = new Date().toISOString().slice(0, 10);
    const last = user.last_active_date ? user.last_active_date.toISOString?.().slice(0, 10) || String(user.last_active_date).slice(0, 10) : null;
    if (last === today) return res.json({ streak: user.streak_count, message: 'Already checked in today' });
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = last === yesterday ? user.streak_count + 1 : 1;
    await pool.query('UPDATE users SET streak_count=?, last_active_date=? WHERE id=?', [newStreak, today, uid]);
    const milestones = [1, 5, 10, 25, 50, 100];
    const badgeMap = { 1: 'First Day!', 5: '5 Day Streak 🔥', 10: 'Double Digits! 💪', 25: '25 Day Badge 🚀', 50: '50 Day Legend! 🏆', 100: '100 Day Champion! 💎' };
    if (milestones.includes(newStreak)) {
      const [existing] = await pool.query('SELECT id FROM badges WHERE user_id=? AND badge_type=?', [uid, `streak_${newStreak}`]);
      if (!existing.length) {
        await pool.query('INSERT INTO badges (user_id, badge_type, badge_name) VALUES (?,?,?)', [uid, `streak_${newStreak}`, badgeMap[newStreak]]);
      }
    }
    res.json({ streak: newStreak, message: 'Checked in!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUpcoming = async (req, res) => {
  const uid = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT r.*, a.company_name, a.role
       FROM rounds r
       JOIN applications a ON r.application_id = a.id
       WHERE a.user_id = ?
         AND r.scheduled_at IS NOT NULL
         AND r.scheduled_at >= NOW()
         AND r.scheduled_at <= DATE_ADD(NOW(), INTERVAL 7 DAY)
         AND r.status NOT IN ('completed','passed','failed')
       ORDER BY r.scheduled_at ASC
       LIMIT 10`, [uid]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUrgentCount = async (req, res) => {
  const uid = req.user.id;
  try {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM rounds r JOIN applications a ON r.application_id = a.id
       WHERE a.user_id = ?
         AND r.scheduled_at IS NOT NULL
         AND r.scheduled_at >= NOW()
         AND r.scheduled_at <= DATE_ADD(NOW(), INTERVAL 2 DAY)
         AND r.status NOT IN ('completed','passed','failed')`, [uid]);
    res.json({ count: row.count || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActivity = async (req, res) => {
  const uid = req.user.id;
  try {
    const [rows] = await pool.query('SELECT * FROM activity_log WHERE user_id=? ORDER BY created_at DESC LIMIT 10', [uid]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
