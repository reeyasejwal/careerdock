const pool = require('../config/db');

exports.getCalendar = async (req, res) => {
  const { month, year } = req.params;
  const uid = req.user.id;
  try {
    const [manualEvents] = await pool.query(
      'SELECT * FROM calendar_events WHERE user_id=? AND MONTH(event_date)=? AND YEAR(event_date)=?',
      [uid, month, year]
    );
    const [rounds] = await pool.query(
      `SELECT r.id, a.company_name, r.category, r.scheduled_at, r.status, r.round_number
       FROM rounds r JOIN applications a ON r.application_id=a.id
       WHERE a.user_id=? AND MONTH(r.scheduled_at)=? AND YEAR(r.scheduled_at)=? AND r.scheduled_at IS NOT NULL`,
      [uid, month, year]
    );
    res.json({ events: manualEvents, rounds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addEvent = async (req, res) => {
  const { title, event_date, event_time, color } = req.body;
  if (!title || !event_date) return res.status(400).json({ message: 'title and event_date required' });
  try {
    const [r] = await pool.query(
      'INSERT INTO calendar_events (user_id, title, event_date, event_time, color) VALUES (?,?,?,?,?)',
      [req.user.id, title, event_date, event_time || null, color || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeEvent = async (req, res) => {
  try {
    await pool.query('DELETE FROM calendar_events WHERE id=? AND user_id=? AND source="manual"', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLeetcodeStats = async (req, res) => {
  const { username } = req.params;
  try {
    const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch LeetCode stats', error: err.message });
  }
};

exports.getGithubRepos = async (req, res) => {
  const { username } = req.params;
  try {
    const headers = process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {};
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=50`, { headers });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch GitHub repos', error: err.message });
  }
};

exports.saveGithubNote = async (req, res) => {
  const { username, repoName, note } = req.body;
  if (!username || !repoName) return res.status(400).json({ message: 'username and repoName required' });
  try {
    await pool.query(
      'INSERT INTO github_notes (user_id, username, repo_name, note) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE note=?, updated_at=CURRENT_TIMESTAMP',
      [req.user.id, username, repoName, note || '', note || '']
    );
    res.json({ message: 'Note saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGithubNotes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT repo_name, note FROM github_notes WHERE user_id=? AND username=?', [req.user.id, req.params.username]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGithubNote = async (req, res) => {
  const { username, repoName } = req.body;
  if (!username || !repoName) return res.status(400).json({ message: 'username and repoName required' });
  try {
    await pool.query('DELETE FROM github_notes WHERE user_id=? AND username=? AND repo_name=?', [req.user.id, username, repoName]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveIntegration = async (req, res) => {
  const { platform, username } = req.body;
  if (!platform || !username) return res.status(400).json({ message: 'platform and username required' });
  try {
    await pool.query(
      'INSERT INTO integrations (user_id, platform, username) VALUES (?,?,?) ON DUPLICATE KEY UPDATE username=?',
      [req.user.id, platform, username, username]
    );
    res.json({ message: 'Integration saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getIntegrations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT platform, username FROM integrations WHERE user_id=?', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveLeetcodeNote = async (req, res) => {
  const { question_id, question_title, difficulty, note_content } = req.body;
  try {
    await pool.query(
      `INSERT INTO leetcode_notes (user_id, question_id, question_title, difficulty, note_content)
       VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE note_content=?, updated_at=CURRENT_TIMESTAMP`,
      [req.user.id, question_id, question_title, difficulty, note_content, note_content]
    );
    res.json({ message: 'Note saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLeetcodeNotes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leetcode_notes WHERE user_id=? ORDER BY updated_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
