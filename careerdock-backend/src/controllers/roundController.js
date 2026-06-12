const pool = require('../config/db');

const ownsApp = async (userId, appId) => {
  const [r] = await pool.query('SELECT id FROM applications WHERE id=? AND user_id=?', [appId, userId]);
  return r.length > 0;
};

exports.getByApplication = async (req, res) => {
  const appId = req.params.appId;
  try {
    if (!await ownsApp(req.user.id, appId)) return res.status(403).json({ message: 'Forbidden' });
    const [rows] = await pool.query('SELECT * FROM rounds WHERE application_id=? ORDER BY round_number ASC', [appId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  const { application_id, category, scheduled_at, status, notes } = req.body;
  if (!application_id || !category) return res.status(400).json({ message: 'application_id and category required' });
  try {
    if (!await ownsApp(req.user.id, application_id)) return res.status(403).json({ message: 'Forbidden' });
    const [countRows] = await pool.query('SELECT COUNT(*) AS c FROM rounds WHERE application_id=?', [application_id]);
    const roundNum = countRows[0].c + 1;
    const [r] = await pool.query(
      'INSERT INTO rounds (application_id, round_number, category, scheduled_at, status, notes) VALUES (?,?,?,?,?,?)',
      [application_id, roundNum, category, scheduled_at || null, status || 'upcoming', notes || null]
    );
    // Auto-create calendar event if scheduled (non-blocking)
    if (scheduled_at) {
      try {
        const [app] = await pool.query('SELECT company_name FROM applications WHERE id=?', [application_id]);
        const title = `${app[0]?.company_name || 'Company'} — Round ${roundNum} (${category})`;
        const evDate = scheduled_at.split('T')[0];
        const evTime = scheduled_at.includes('T') ? scheduled_at.split('T')[1].slice(0, 5) : null;
        await pool.query(
          'INSERT INTO calendar_events (user_id, title, event_date, event_time, source, source_id) VALUES (?,?,?,?,?,?)',
          [req.user.id, title, evDate, evTime, 'tracker', r.insertId]
        );
      } catch (calErr) {
        console.warn('Calendar event creation failed (non-fatal):', calErr.message);
      }
    }
    res.status(201).json({ id: r.insertId, round_number: roundNum });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  const { category, scheduled_at, status, notes } = req.body;
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.round_number, a.company_name, a.user_id FROM rounds r
       JOIN applications a ON r.application_id=a.id WHERE r.id=? AND a.user_id=?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    await pool.query(
      'UPDATE rounds SET category=?, scheduled_at=?, status=?, notes=? WHERE id=?',
      [category, scheduled_at || null, status, notes || null, req.params.id]
    );
    // Sync calendar event
    try {
      if (scheduled_at) {
        const evDate = scheduled_at.split('T')[0];
        const evTime = scheduled_at.includes('T') ? scheduled_at.split('T')[1].slice(0, 5) : null;
        const title = `${rows[0].company_name} — Round ${rows[0].round_number} (${category})`;
        const [existing] = await pool.query('SELECT id FROM calendar_events WHERE source="tracker" AND source_id=?', [req.params.id]);
        if (existing.length) {
          await pool.query('UPDATE calendar_events SET title=?, event_date=?, event_time=? WHERE source="tracker" AND source_id=?', [title, evDate, evTime, req.params.id]);
        } else {
          await pool.query('INSERT INTO calendar_events (user_id, title, event_date, event_time, source, source_id) VALUES (?,?,?,?,?,?)', [rows[0].user_id, title, evDate, evTime, 'tracker', req.params.id]);
        }
      } else {
        await pool.query('DELETE FROM calendar_events WHERE source="tracker" AND source_id=?', [req.params.id]);
      }
    } catch (calErr) {
      console.warn('Calendar sync failed (non-fatal):', calErr.message);
    }
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT r.id FROM rounds r JOIN applications a ON r.application_id=a.id WHERE r.id=? AND a.user_id=?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    await pool.query('DELETE FROM rounds WHERE id=?', [req.params.id]);
    await pool.query('DELETE FROM calendar_events WHERE source="tracker" AND source_id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
