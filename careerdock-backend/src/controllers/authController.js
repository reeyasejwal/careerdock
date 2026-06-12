const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const sign = (id, email) =>
  jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Invalid email address — please check for typos' });
  try {
    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const [r] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?,?,?,?)',
      [name, email, phone || null, hash]
    );
    const token = sign(r.insertId, email);
    res.status(201).json({ token, id: r.insertId, name, email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = sign(user.id, user.email);
    res.json({ token, id: user.id, name: user.name, email: user.email, theme: user.theme, darkMode: user.dark_mode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,name,email,phone,avatar_color,theme,dark_mode,streak_count,created_at FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  try {
    await pool.query('UPDATE users SET name=?, phone=? WHERE id=?', [name, phone || null, req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Leaf records that reference applications
    await pool.query('DELETE r FROM rounds r JOIN applications a ON r.application_id = a.id WHERE a.user_id = ?', [userId]);
    await pool.query('DELETE t FROM tracker_notes t WHERE t.application_id IN (SELECT id FROM applications WHERE user_id = ?)', [userId]);
    await pool.query('DELETE c FROM company_info c WHERE c.application_id IN (SELECT id FROM applications WHERE user_id = ?)', [userId]);

    // 2. ATS scores reference resumes — must go before resumes
    await pool.query('DELETE s FROM ats_scores s JOIN resumes r ON s.resume_id = r.id WHERE r.user_id = ?', [userId]).catch(() => {});

    // 3. Parent records
    await pool.query('DELETE FROM applications WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM resumes WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM tasks WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM chat_conversations WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM calendar_events WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM activity_log WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM badges WHERE user_id = ?', [userId]).catch(() => {});

    // 4. User row last
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('[deleteAccount] error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password required' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (!rows.length) return res.status(404).json({ message: 'No account found with that email' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=? WHERE id=?', [hash, rows[0].id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTheme = async (req, res) => {
  const { theme, darkMode } = req.body;
  try {
    await pool.query('UPDATE users SET theme=?, dark_mode=? WHERE id=?', [theme, darkMode ? 1 : 0, req.user.id]);
    res.json({ message: 'Theme updated', theme, darkMode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
