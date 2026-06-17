const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const SERVER_ROOT = path.join(__dirname, '../..');

const logActivity = async (userId, action, entityType, entityId) => {
  try {
    await pool.query('INSERT INTO activity_log (user_id, action, entity_type, entity_id) VALUES (?,?,?,?)',
      [userId, action, entityType, entityId]);
  } catch {}
};

exports.getAll = async (req, res) => {
  const { search, tech, role, minPkg, maxPkg, status, sort } = req.query;
  try {
    let q = 'SELECT * FROM applications WHERE user_id=?';
    const params = [req.user.id];
    if (search) { q += ' AND (company_name LIKE ? OR role LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role) { q += ' AND role LIKE ?'; params.push(`%${role}%`); }
    if (status) { q += ' AND overall_status=?'; params.push(status); }
    if (minPkg) { q += ' AND package_lpa >= ?'; params.push(minPkg); }
    if (maxPkg) { q += ' AND package_lpa <= ?'; params.push(maxPkg); }
    if (sort === 'pkg_desc') q += ' ORDER BY package_lpa DESC';
    else if (sort === 'pkg_asc') q += ' ORDER BY package_lpa ASC';
    else if (sort === 'alpha') q += ' ORDER BY company_name ASC';
    else q += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(q, params);
    const apps = rows.map(a => ({
      ...a,
      tech_stack: a.tech_stack ? (typeof a.tech_stack === 'string' ? JSON.parse(a.tech_stack) : a.tech_stack) : [],
    }));
    if (tech) {
      const t = tech.toLowerCase();
      return res.json(apps.filter(a => a.tech_stack.some(s => s.toLowerCase().includes(t))));
    }
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM applications WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    const a = rows[0];
    a.tech_stack = a.tech_stack ? (typeof a.tech_stack === 'string' ? JSON.parse(a.tech_stack) : a.tech_stack) : [];
    res.json(a);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  const { company_name, role, package_lpa, location, tech_stack, jd_text, applied_date } = req.body;
  if (!company_name) return res.status(400).json({ message: 'Company name required' });
  try {
    const jdFile = req.file ? req.file.path : null;
    const stackJson = JSON.stringify(tech_stack ? (typeof tech_stack === 'string' ? JSON.parse(tech_stack) : tech_stack) : []);
    const [r] = await pool.query(
      'INSERT INTO applications (user_id, company_name, role, package_lpa, location, tech_stack, jd_text, jd_file_url, applied_date) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.user.id, company_name, role || null, package_lpa || null, location || null, stackJson, jd_text || null, jdFile, applied_date || null]
    );
    await logActivity(req.user.id, `Applied to ${company_name}`, 'application', r.insertId);
    if (applied_date) {
      try {
        await pool.query(
          'INSERT INTO calendar_events (user_id, title, event_date, source, source_id) VALUES (?,?,?,?,?)',
          [req.user.id, `Applied to ${company_name}`, applied_date, 'tracker', r.insertId]
        );
      } catch {}
    }
    res.status(201).json({ id: r.insertId, message: 'Application added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  const { company_name, role, package_lpa, location, tech_stack, jd_text, applied_date } = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM applications WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!existing.length) return res.status(404).json({ message: 'Not found' });
    const stackJson = tech_stack !== undefined ? JSON.stringify(typeof tech_stack === 'string' ? JSON.parse(tech_stack) : tech_stack) : undefined;
    const jdFile = req.file ? req.file.path : undefined;
    const fields = ['company_name=?','role=?','package_lpa=?','location=?','applied_date=?'];
    const vals = [company_name, role || null, package_lpa || null, location || null, applied_date || null];
    if (jd_text !== undefined) { fields.push('jd_text=?'); vals.push(jd_text); }
    if (stackJson !== undefined) { fields.push('tech_stack=?'); vals.push(stackJson); }
    if (jdFile !== undefined) { fields.push('jd_file_url=?'); vals.push(jdFile); }
    vals.push(req.params.id);
    await pool.query(`UPDATE applications SET ${fields.join(',')} WHERE id=?`, vals);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM applications WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleImportant = async (req, res) => {
  try {
    await pool.query('UPDATE applications SET is_important = NOT is_important WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    const [rows] = await pool.query('SELECT is_important FROM applications WHERE id=?', [req.params.id]);
    res.json({ is_important: rows[0]?.is_important });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['applied', 'in-process', 'offered', 'rejected'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    await pool.query('UPDATE applications SET overall_status=? WHERE id=? AND user_id=?', [status, req.params.id, req.user.id]);
    await logActivity(req.user.id, `Status updated to ${status}`, 'application', req.params.id);
    res.json({ message: 'Status updated', status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getJdText = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT jd_text, jd_file_url FROM applications WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    const app = rows[0];
    if (app.jd_text) return res.json({ text: app.jd_text, source: 'text' });
    if (app.jd_file_url) {
      let dataBuffer;
      const url = app.jd_file_url;

      if (url.startsWith('http')) {
        try {
          const https = require('https');
          const httpModule = require('http');
          const protocol = url.startsWith('https') ? https : httpModule;
          dataBuffer = await new Promise((resolve, reject) => {
            protocol.get(url, (r) => {
              const chunks = [];
              r.on('data', c => chunks.push(c));
              r.on('end', () => resolve(Buffer.concat(chunks)));
              r.on('error', reject);
            }).on('error', reject);
          });
        } catch {
          return res.json({ text: '', source: 'file_missing' });
        }
      } else {
        const filePath = path.join(SERVER_ROOT, url.replace(/^\//, ''));
        if (!fs.existsSync(filePath)) {
          return res.json({ text: '', source: 'file_missing' });
        }
        dataBuffer = fs.readFileSync(filePath);
      }

      try {
        const pdfParse = require('pdf-parse');
        let text = '';
        try {
          const data = await pdfParse(dataBuffer);
          text = data.text?.trim() || '';
        } catch {}
        if (!text || text.length < 30) {
          try {
            const data = await pdfParse(dataBuffer, {
              pagerender: function(pageData) {
                return pageData.getTextContent().then(function(textContent) {
                  return textContent.items.map(i => i.str).join(' ');
                });
              }
            });
            if (data.text?.trim()) text = data.text.trim();
          } catch {}
        }
        if (text && text.length >= 30) {
          return res.json({ text, source: 'pdf' });
        }
        return res.json({ text: '', source: 'scanned_pdf' });
      } catch (e) {
        return res.json({ text: '', source: 'pdf_error' });
      }
    }
    res.json({ text: '', source: 'none' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveJdText = async (req, res) => {
  const { jd_text } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE applications SET jd_text=? WHERE id=? AND user_id=?',
      [jd_text || '', req.params.id, req.user.id]
    );
    if (!r.affectedRows) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'JD text saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
