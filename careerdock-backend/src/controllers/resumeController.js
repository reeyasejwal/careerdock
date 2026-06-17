const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const SERVER_ROOT = path.join(__dirname, '../..');

// Ensure cloudinary_public_id column exists on resumes table
pool.query("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(500)").catch(() => {});

// Ensure ats_scores table has content_hash column
pool.query(`CREATE TABLE IF NOT EXISTS ats_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resume_id INT NOT NULL,
  content_hash VARCHAR(32) NOT NULL DEFAULT '',
  result_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_resume (resume_id)
)`).catch(() => {});
pool.query("ALTER TABLE ats_scores ADD COLUMN IF NOT EXISTS content_hash VARCHAR(32) NOT NULL DEFAULT ''").catch(() => {});

const fetchBuffer = (url) => new Promise((resolve, reject) => {
  const protocol = url.startsWith('https') ? https : http;
  protocol.get(url, (res) => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => resolve(Buffer.concat(chunks)));
    res.on('error', reject);
  }).on('error', reject);
});

const extractText = async (row) => {
  const fileUrl = row.file_url;
  let dataBuffer;

  if (fileUrl && fileUrl.startsWith('http')) {
    try {
      dataBuffer = await fetchBuffer(fileUrl);
    } catch (e) {
      console.error('[ATS] Failed to fetch from Cloudinary:', e.message);
      return '';
    }
  } else {
    const filePath = path.join(SERVER_ROOT, (fileUrl || '').replace(/^\//, ''));
    if (!fs.existsSync(filePath)) return '';
    dataBuffer = fs.readFileSync(filePath);
  }

  const ext = (row.file_type || path.extname(fileUrl).slice(1)).toLowerCase();
  if (ext !== 'pdf') return '';

  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(dataBuffer);
    return (data.text || '').trim();
  } catch (e) {
    console.error('[ATS] pdf-parse error:', e.message);
    return '';
  }
};

// ─── Rule-based ATS scoring ───────────────────────────────────────────────────
function ruleBasedAnalysis(resumeText) {
  const lower = resumeText.toLowerCase();
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;

  const SECTIONS = [
    ['education','university','college','b.tech','m.tech','degree','cgpa','gpa','bachelor','master'],
    ['experience','internship','intern','work experience','employment'],
    ['project','projects','built','developed','created','implemented'],
    ['skills','technologies','tech stack','frameworks','tools','proficient'],
    ['email','phone','linkedin','github','@','mobile','+91'],
    ['achievement','award','certificate','hackathon','leetcode','codeforces','codechef'],
    ['summary','objective','about me','profile','overview'],
  ];
  const sectionCount = SECTIONS.filter(pats => pats.some(p => lower.includes(p))).length;

  const ACTION_VERBS = ['led','built','developed','implemented','designed','created','managed','optimized','deployed','launched','improved','automated','reduced','increased','achieved','delivered','maintained','collaborated','analyzed','solved','wrote','tested','engineered','integrated','migrated','scaled','debugged','refactored','streamlined','spearheaded'];
  const verbCount = ACTION_VERBS.filter(v => lower.includes(v)).length;

  const TECH = ['react','angular','vue','node','express','python','java','javascript','typescript','c++','go','spring','django','flask','mysql','postgresql','mongodb','redis','aws','azure','gcp','docker','kubernetes','graphql','git','sql','api','rest','html','css','linux','data structures','algorithms'];
  const techCount = TECH.filter(k => lower.includes(k)).length;

  const metricCount = (resumeText.match(/\d+\s*(%|x\b|\+|\s*k\b|users|requests|ms\b|projects|teams?|members?)/gi) || []).length;

  const hasGithub   = lower.includes('github');
  const hasLinkedin = lower.includes('linkedin');
  const hasEmail    = /@[a-z0-9.]+\.[a-z]{2,}/i.test(resumeText);
  const hasPhone    = /(\+91|[0-9]{10})/.test(resumeText);
  const hasCgpa     = /cgpa|gpa|\d\.\d{1,2}\s*\/\s*10/i.test(resumeText);
  const hasLeetcode = /leetcode|codeforces|codechef/i.test(resumeText);
  const hasExp      = /internship|intern\b|work experience/i.test(resumeText);
  const hasAchiev   = /achievement|award|certificate|hackathon/i.test(resumeText);

  const sectionScore = sectionCount * 7;
  const verbScore    = verbCount === 0 ? 0 : Math.min(12, Math.round(Math.sqrt(verbCount) * 2.5));
  const techScore    = techCount  === 0 ? 0 : Math.min(10, Math.round(Math.log(techCount + 1) * 2.8));
  const metricScore  = Math.min(8, Math.round(metricCount * 1.5));
  const contactScore = (hasEmail?2:0) + (hasGithub?1:0) + (hasLinkedin?1:0) + (hasPhone?0.5:0);
  const extrasScore  = (hasCgpa?2:0) + (hasLeetcode?2:0) + (hasExp?2:0) + (hasAchiev?2:0);

  let wordScore = 0;
  if      (wordCount >= 420 && wordCount <= 680) wordScore = 4;
  else if (wordCount >= 320 && wordCount <= 800) wordScore = 2;
  else if (wordCount < 150)  wordScore = -8;
  else if (wordCount < 280)  wordScore = -4;

  const raw   = sectionScore + verbScore + techScore + metricScore + contactScore + extrasScore + wordScore;
  const score = Math.max(15, Math.min(95, Math.round(raw)));

  const grade = score >= 82 ? 'Strong' : score >= 68 ? 'Good' : score >= 50 ? 'Average' : 'Needs Work';
  const line1Parts = [];
  if (sectionCount >= 6) line1Parts.push(`all ${sectionCount}/7 sections present`);
  else line1Parts.push(`${sectionCount}/7 sections`);
  if (techCount >= 10) line1Parts.push(`${techCount} tech keywords`);
  if (verbCount >= 8)  line1Parts.push(`${verbCount} action verbs`);
  if (metricCount >= 3) line1Parts.push(`${metricCount} quantified achievements`);
  if (hasGithub && hasLinkedin) line1Parts.push('GitHub & LinkedIn linked');

  const improveParts = [];
  if (metricCount < 3) improveParts.push(`add more numbers to bullets (currently ${metricCount})`);
  if (verbCount < 8) improveParts.push(`use stronger action verbs (${verbCount} found)`);
  if (!hasCgpa) improveParts.push('include CGPA in education');
  if (!hasLeetcode) improveParts.push('mention LeetCode/CP profile');
  if (wordCount < 350) improveParts.push(`expand content (${wordCount} words is short)`);
  else if (wordCount > 800) improveParts.push(`trim to 1 page (${wordCount} words)`);

  const line1 = `${grade} resume — ${line1Parts.join(', ')}.`;
  const line2 = improveParts.length > 0
    ? `To improve: ${improveParts.slice(0,2).join(' and ')}.`
    : score >= 88 ? 'Near-perfect structure — tailor keywords to each specific job description for best results.'
    : 'Well-rounded resume — keep quantifying your project impact to stand out further.';

  const strengths = [];
  if (sectionCount >= 6) strengths.push(`Comprehensive structure — ${sectionCount}/7 key sections present`);
  if (techCount >= 10) strengths.push(`Strong technical depth — ${techCount} tech keywords found`);
  if (verbCount >= 8) strengths.push(`Good use of action verbs (${verbCount} found)`);
  if (metricCount >= 3) strengths.push(`Quantified impact — ${metricCount} metrics found`);
  if (hasGithub && hasLinkedin) strengths.push('GitHub & LinkedIn profiles both included');
  if (hasLeetcode) strengths.push('Competitive programming profile mentioned');
  if (hasExp) strengths.push('Internship / work experience present');
  if (strengths.length === 0) strengths.push('Resume has basic contact and education info');

  const weaknesses = [];
  if (metricCount < 2) weaknesses.push(`Lacks quantified achievements — only ${metricCount} metric(s) found`);
  if (verbCount < 5) weaknesses.push(`Weak action verbs — only ${verbCount} strong verbs found`);
  if (techCount < 5) weaknesses.push(`Few tech keywords (${techCount}) — may not pass ATS filters`);
  if (!hasEmail || !hasPhone) weaknesses.push('Contact information is incomplete');
  if (wordCount < 300) weaknesses.push(`Too short at ${wordCount} words — add more detail`);
  else if (wordCount > 850) weaknesses.push(`May exceed 1 page (${wordCount} words) — trim content`);
  if (sectionCount < 5) weaknesses.push(`Missing ${7 - sectionCount} standard resume sections`);

  const improvements = [];
  if (metricCount < 3) improvements.push('Add numbers to project bullets: users served, % improvement, time saved');
  if (!hasCgpa) improvements.push('Include CGPA / GPA in the Education section');
  if (!hasLeetcode) improvements.push('Add LeetCode / Codeforces link to contact section');
  if (verbCount < 8) improvements.push('Start each bullet with a strong verb: Led, Built, Optimized, Reduced…');
  if (!hasAchiev) improvements.push('Add an Achievements section (hackathons, awards, certifications)');
  if (!hasGithub) improvements.push('Include your GitHub profile URL');

  const missingSections = [];
  if (!lower.includes('education') && !lower.includes('university')) missingSections.push('Education');
  if (!lower.includes('experience') && !lower.includes('internship')) missingSections.push('Experience / Internship');
  if (!lower.includes('project') && !lower.includes('built')) missingSections.push('Projects');
  if (!lower.includes('skill') && !lower.includes('technologies')) missingSections.push('Skills / Tech Stack');
  if (!lower.includes('achievement') && !lower.includes('award') && !lower.includes('certificate')) missingSections.push('Achievements');

  return {
    overallScore: score,
    summary: `${line1} ${line2}`,
    wordCount,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 4),
    improvements: improvements.slice(0, 4),
    missingSections,
    spellingErrors: [],
  };
}

// ─── AI analysis via Groq ─────────────────────────────────────────────────────
async function aiAnalysis(resumeText, versionName) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey || resumeText.length < 80) return null;

  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: groqKey });

    const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
    const snippet = resumeText.slice(0, 5000);
    const prompt = `You are an expert resume reviewer for software engineering placements in India. Read this ACTUAL resume and give specific feedback based on what you actually see.

Resume: "${versionName}" (${wordCount} words)
Content:
${snippet}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "overallScore": <0-100, strong resumes score 78-92, weak ones 30-60>,
  "summary": "<2 specific sentences about THIS resume — mention actual skills/projects you see>",
  "wordCount": ${wordCount},
  "strengths": ["<specific strength visible in this resume>"],
  "weaknesses": ["<specific weakness found in this resume>"],
  "spellingErrors": ["<exact text with error> → <correction>"],
  "improvements": ["<specific actionable improvement for this resume>"],
  "missingSections": ["<section not found in this resume>"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 700,
    });
    const raw = completion.choices[0].message.content;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.overallScore !== 'number') throw new Error('Invalid score');
    return { ...parsed, ai_powered: true };
  } catch (e) {
    console.error('[ATS] Groq error:', e.message);
    return null;
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,version_name,file_url,file_type,is_active,uploaded_at FROM resumes WHERE user_id=? ORDER BY uploaded_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const { version_name } = req.body;
  try {
    const fileUrl = req.file.path;           // Cloudinary secure URL
    const publicId = req.file.filename;      // Cloudinary public_id
    const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
    const [r] = await pool.query(
      'INSERT INTO resumes (user_id, version_name, file_url, file_type, cloudinary_public_id) VALUES (?,?,?,?,?)',
      [req.user.id, version_name || req.file.originalname, fileUrl, ext, publicId]
    );
    res.status(201).json({ id: r.insertId, file_url: fileUrl, message: 'Uploaded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT file_url, cloudinary_public_id FROM resumes WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    const { file_url, cloudinary_public_id } = rows[0];

    if (cloudinary_public_id) {
      try {
        const cloudinary = require('cloudinary').v2;
        await cloudinary.uploader.destroy(cloudinary_public_id, { resource_type: 'raw' });
      } catch {}
    } else if (file_url && !file_url.startsWith('http')) {
      const filePath = path.join(SERVER_ROOT, file_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM resumes WHERE id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setActive = async (req, res) => {
  try {
    await pool.query('UPDATE resumes SET is_active=FALSE WHERE user_id=?', [req.user.id]);
    await pool.query('UPDATE resumes SET is_active=TRUE WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ message: 'Set as active' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.atsScore = async (req, res) => {
  const { resumeId } = req.body;
  if (!resumeId) return res.status(400).json({ message: 'resumeId required' });
  try {
    const [rows] = await pool.query('SELECT * FROM resumes WHERE id=? AND user_id=?', [resumeId, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Resume not found' });
    const resume = rows[0];

    const resumeText = await extractText(resume);

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        error: true,
        message: `Could not read this PDF (got ${resumeText.length} chars). It may be a scanned image. Try re-uploading a text-based PDF.`,
        summary: 'PDF extraction failed — cannot analyze a scanned or image-based PDF.',
      });
    }

    const contentHash = crypto.createHash('md5').update(resumeText).digest('hex');
    try {
      const [cached] = await pool.query(
        'SELECT result_json FROM ats_scores WHERE resume_id=? AND content_hash=?',
        [resumeId, contentHash]
      );
      if (cached.length) {
        return res.json({ ...JSON.parse(cached[0].result_json), cached: true });
      }
    } catch {}

    let analysis = await aiAnalysis(resumeText, resume.version_name);
    if (!analysis) {
      analysis = ruleBasedAnalysis(resumeText);
    }

    try {
      await pool.query(
        `INSERT INTO ats_scores (resume_id, content_hash, result_json)
         VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE content_hash=VALUES(content_hash), result_json=VALUES(result_json)`,
        [resumeId, contentHash, JSON.stringify(analysis)]
      );
    } catch {}

    res.json({ ...analysis, cached: false });
  } catch (err) {
    console.error('[ATS] atsScore error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getSuggestions = async (req, res) => {
  req.body = { resumeId: req.params.id };
  return exports.atsScore(req, res);
};

exports.extractTextDebug = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resumes WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Resume not found' });
    const resume = rows[0];
    const text = await extractText(resume);
    res.json({
      resume: resume.version_name,
      file_url: resume.file_url,
      textLength: text.length,
      preview: text.substring(0, 500),
      canAnalyze: text.length >= 50,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
