const pool = require('../config/db');

pool.query(`
  CREATE TABLE IF NOT EXISTS company_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    info_json LONGTEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_app (application_id)
  )
`).catch(() => {});

exports.getAll = async (req, res) => {
  try {
    const [apps] = await pool.query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM rounds r WHERE r.application_id = a.id) AS round_count,
        (SELECT COUNT(*) FROM rounds r WHERE r.application_id = a.id AND r.status IN ('passed','completed')) AS rounds_done
       FROM applications a WHERE a.user_id=? ORDER BY a.is_important DESC, a.updated_at DESC`,
      [req.user.id]
    );
    const result = apps.map(a => ({
      ...a,
      tech_stack: a.tech_stack ? (typeof a.tech_stack === 'string' ? JSON.parse(a.tech_stack) : a.tech_stack) : [],
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  const appId = req.params.appId;
  try {
    const [apps] = await pool.query('SELECT * FROM applications WHERE id=? AND user_id=?', [appId, req.user.id]);
    if (!apps.length) return res.status(404).json({ message: 'Not found' });
    const app = apps[0];
    app.tech_stack = app.tech_stack ? (typeof app.tech_stack === 'string' ? JSON.parse(app.tech_stack) : app.tech_stack) : [];

    const [rounds] = await pool.query('SELECT * FROM rounds WHERE application_id=? ORDER BY round_number ASC', [appId]);
    const [noteRows] = await pool.query('SELECT content FROM tracker_notes WHERE application_id=?', [appId]);
    const [infoRows] = await pool.query('SELECT info_json, fetched_at FROM company_info WHERE application_id=? ORDER BY fetched_at DESC LIMIT 1', [appId]);

    res.json({
      ...app,
      rounds,
      notes: noteRows[0]?.content || '',
      companyInfo: infoRows[0] ? { data: JSON.parse(infoRows[0].info_json || '{}'), fetched_at: infoRows[0].fetched_at } : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveNote = async (req, res) => {
  const { application_id, content } = req.body;
  try {
    const [apps] = await pool.query('SELECT id FROM applications WHERE id=? AND user_id=?', [application_id, req.user.id]);
    if (!apps.length) return res.status(403).json({ message: 'Forbidden' });
    await pool.query(
      'INSERT INTO tracker_notes (application_id, user_id, content) VALUES (?,?,?) ON DUPLICATE KEY UPDATE content=?, updated_at=CURRENT_TIMESTAMP',
      [application_id, req.user.id, content, content]
    );
    res.json({ message: 'Saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNote = async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT id FROM applications WHERE id=? AND user_id=?', [req.params.appId, req.user.id]);
    if (!apps.length) return res.status(403).json({ message: 'Forbidden' });
    const [rows] = await pool.query('SELECT content, updated_at FROM tracker_notes WHERE application_id=?', [req.params.appId]);
    res.json({ content: rows[0]?.content || '', updated_at: rows[0]?.updated_at || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function fetchAICompanyInfo(companyName) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: groqKey });
    const prompt = `Give me a company profile for "${companyName}" for placement interview prep. Return ONLY a JSON object with no markdown, no code blocks, no extra text:
{"industry":"string","overview":"2-3 sentence overview of what this company does","products":["product1","product2","product3"],"culture":["culture point 1","culture point 2","culture point 3"],"tech_stack":["tech1","tech2","tech3","tech4"],"common_hr_questions":["question1","question2","question3","question4","question5"]}`;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 900,
    });
    const raw = completion.choices[0].message.content;
    // Extract JSON even if model wraps it in markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, company: companyName, ai_powered: true };
  } catch (e) {
    console.error('[CompanyInfo] Groq error:', e.message);
    return null;
  }
}

exports.getCompanyInfo = async (req, res) => {
  const appId = req.params.appId;
  const noKey = !process.env.GROQ_API_KEY;
  try {
    const [apps] = await pool.query('SELECT company_name FROM applications WHERE id=? AND user_id=?', [appId, req.user.id]);
    if (!apps.length) return res.status(403).json({ message: 'Forbidden' });
    if (noKey) return res.json({ data: generatePlaceholderInfo(apps[0].company_name), noKey: true });
    const [cached] = await pool.query('SELECT info_json, fetched_at FROM company_info WHERE application_id=? ORDER BY fetched_at DESC LIMIT 1', [appId]);
    if (cached.length) {
      const parsed = JSON.parse(cached[0].info_json || '{}');
      // Skip cache if it was placeholder data (no AI key at time of fetch)
      if (parsed.ai_powered !== false) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        if (new Date(cached[0].fetched_at) > sevenDaysAgo) {
          return res.json({ data: parsed, fetched_at: cached[0].fetched_at, cached: true, noKey: false });
        }
      }
      await pool.query('DELETE FROM company_info WHERE application_id=?', [appId]);
    }
    const aiInfo = await fetchAICompanyInfo(apps[0].company_name);
    const info = aiInfo || generatePlaceholderInfo(apps[0].company_name);
    await pool.query('INSERT INTO company_info (application_id, info_json) VALUES (?,?) ON DUPLICATE KEY UPDATE info_json=VALUES(info_json), fetched_at=CURRENT_TIMESTAMP', [appId, JSON.stringify(info)]);
    res.json({ data: info, cached: false, noKey: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.refreshCompanyInfo = async (req, res) => {
  const appId = req.params.appId;
  const noKey = !process.env.GROQ_API_KEY;
  try {
    const [apps] = await pool.query('SELECT company_name FROM applications WHERE id=? AND user_id=?', [appId, req.user.id]);
    if (!apps.length) return res.status(403).json({ message: 'Forbidden' });
    if (noKey) return res.json({ data: generatePlaceholderInfo(apps[0].company_name), noKey: true });
    await pool.query('DELETE FROM company_info WHERE application_id=?', [appId]);
    const aiInfo = await fetchAICompanyInfo(apps[0].company_name);
    const info = aiInfo || generatePlaceholderInfo(apps[0].company_name);
    await pool.query('INSERT INTO company_info (application_id, info_json) VALUES (?,?)', [appId, JSON.stringify(info)]);
    res.json({ data: info, noKey: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function generatePlaceholderInfo(companyName) {
  return {
    company: companyName,
    industry: 'Technology / Software',
    overview: `${companyName} is a technology company. Add your GROQ_API_KEY to .env to get AI-powered company insights.`,
    culture: ['Innovation-driven', 'Collaborative work environment', 'Focus on continuous learning'],
    common_hr_questions: [
      'Tell me about yourself.',
      `Why do you want to work at ${companyName}?`,
      'Where do you see yourself in 5 years?',
      'Describe a challenging project you worked on.',
      'What are your strengths and weaknesses?'
    ],
    ai_powered: false,
  };
}
