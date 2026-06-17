import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { RiUploadLine, RiDeleteBinLine, RiFileTextLine, RiCheckLine, RiSearchLine, RiLightbulbLine } from 'react-icons/ri';
import api from '../../services/api';
import { useConfirm } from '../../components/ConfirmDialog';

// ─── Animated circular score ──────────────────────────────────────────────────
function ScoreCircle({ score }) {
  const color = score >= 82 ? '#1A6634' : score >= 60 ? '#C07810' : '#B71C1C';
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={136} height={136} viewBox="0 0 136 136">
      <circle cx={68} cy={68} r={r} fill="none" stroke="var(--surface)" strokeWidth={11} />
      <circle
        cx={68} cy={68} r={r} fill="none" stroke={color} strokeWidth={11}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 68 68)"
        style={{ transition: 'stroke-dasharray 1.2s ease' }}
      />
      <text x={68} y={63} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 30, fontWeight: 800, fill: color, fontFamily: 'Inter,sans-serif' }}>{score}</text>
      <text x={68} y={85} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 12, fill: 'var(--muted)', fontFamily: 'Inter,sans-serif' }}>/ 100</text>
    </svg>
  );
}

// ─── ATS Analysis Modal ────────────────────────────────────────────────────────
function AtsModal({ resumes, defaultResumeId, onClose }) {
  const [resumeId, setResumeId] = useState(defaultResumeId || resumes[0]?.id || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!resumeId) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await api.post('/resumes/ats-score', { resumeId: Number(resumeId) });
      setResult(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const resumeName = resumes.find(r => r.id === Number(resumeId))?.version_name || '';
  const grade = result
    ? result.overallScore >= 82 ? 'Strong' : result.overallScore >= 68 ? 'Good' : result.overallScore >= 50 ? 'Average' : 'Needs Work'
    : '';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>ATS Score</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Select + button */}
          {!result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Resume</label>
                <select className="form-select" value={resumeId} onChange={e => setResumeId(e.target.value)}>
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.version_name}</option>)}
                </select>
              </div>
              <button className="btn btn-primary w-full justify-center" onClick={runAnalysis}>
                <RiSearchLine /> Check ATS Score
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 0' }}>
              <div className="spinner-ring" style={{ width: 44, height: 44, borderWidth: 4 }} />
              <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>Scanning resume…</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                <ScoreCircle score={result.overallScore} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {grade} — {resumeName}
                    {result.ai_powered && <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(153,173,122,0.2)', color: 'var(--primary)', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>AI</span>}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>{result.summary}</p>
                  {result.wordCount && <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{result.wordCount} words</p>}
                </div>
              </div>

              {/* Expanded detail sections */}
              {[
                { label: '✅ Strengths',    items: result.strengths,       color: '#1A6634', bg: 'rgba(76,175,80,0.08)' },
                { label: '⚠️ Weaknesses',  items: result.weaknesses,      color: '#B75B00', bg: 'rgba(255,152,0,0.08)' },
                { label: '🚀 Improvements', items: result.improvements,    color: '#1565C0', bg: 'rgba(74,108,247,0.08)' },
                { label: '❌ Missing',      items: result.missingSections, color: '#B71C1C', bg: 'rgba(239,83,80,0.08)' },
                { label: '🔤 Spelling',     items: result.spellingErrors,  color: '#4A3800', bg: 'rgba(255,235,59,0.12)' },
              ].filter(s => s.items?.length).map(section => (
                <div key={section.label} style={{ background: section.bg, border: `1px solid ${section.color}22`, borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: section.color, marginBottom: 6 }}>{section.label}</p>
                  <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <button className="btn btn-ghost btn-sm" onClick={() => setResult(null)} style={{ alignSelf: 'center' }}>← Analyze Another</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Resumes() {
  const { confirm, dialog } = useConfirm();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [showAts, setShowAts] = useState(false);
  const [quickAnalyzeResume, setQuickAnalyzeResume] = useState(null);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    api.get('/resumes').then(r => setResumes(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file) return toast.error('Please select a file');
    if (!versionName.trim()) return toast.error('Please enter a version name');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('version_name', versionName);
      await api.post('/resumes/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Resume uploaded!');
      setVersionName('');
      fileRef.current.value = '';
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Delete Resume', message: 'This will permanently delete the resume file and its ATS score history. This cannot be undone.', confirmLabel: 'Delete', cancelLabel: 'Cancel' });
    if (!ok) return;
    await api.delete(`/resumes/${id}`);
    toast.success('Deleted');
    load();
  };

  const setActive = async (id) => {
    await api.patch(`/resumes/${id}/active`);
    toast.success('Set as active resume');
    load();
  };

  // Open AtsModal pre-selected to a specific resume
  const openAnalysis = (resume) => {
    setQuickAnalyzeResume(resume);
    setShowAts(true);
  };

  return (
    <div>
      <Helmet><title>Resumes | CareerDock</title></Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resumes</h1>
          <p className="page-subtitle">Upload and manage your resume versions</p>
        </div>
        {resumes.length > 0 && (
          <button className="btn btn-outline" onClick={() => { setQuickAnalyzeResume(null); setShowAts(true); }}>
            <RiSearchLine /> Analyze Resume
          </button>
        )}
      </div>

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        {/* Upload form */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <p className="section-title">Upload Resume</p>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label className="form-label">Version Name *</label>
              <input className="form-input" value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="e.g. SDE Resume v3, Frontend Focus" required />
            </div>
            <div className="form-group">
              <label className="form-label">File (PDF, DOC, DOCX) *</label>
              <input type="file" ref={fileRef} accept=".pdf,.doc,.docx" className="form-input" required />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center" disabled={uploading}>
              <RiUploadLine />{uploading ? 'Uploading…' : 'Upload Resume'}
            </button>
          </form>
        </div>

        {/* Resume list */}
        <div>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner-ring" /></div>
          ) : resumes.length === 0 ? (
            <div className="glass-card empty-state">
              <div className="empty-state-icon"><RiFileTextLine size={48} /></div>
              <h3>No resumes yet</h3>
              <p>Upload your first resume to get started.</p>
            </div>
          ) : resumes.map((r, i) => (
            <motion.div key={r.id} className="glass-card card-hover" style={{ marginBottom: 12, padding: 16 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <RiFileTextLine size={28} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{r.version_name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {r.file_type?.toUpperCase() || 'FILE'} · {new Date(r.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                </div>
                {r.is_active && <span className="badge badge-offered"><RiCheckLine size={11} /> Active</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {!r.is_active && <button className="btn btn-outline btn-sm" onClick={() => setActive(r.id)}>Set Active</button>}
                <a href={r.file_url?.startsWith('http') ? r.file_url : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${r.file_url}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Open</a>
                <button className="btn btn-outline btn-sm" onClick={() => openAnalysis(r)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RiLightbulbLine size={13} /> Analyze
                </button>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => handleDelete(r.id)}>
                  <RiDeleteBinLine size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showAts && (
        <AtsModal
          resumes={resumes}
          defaultResumeId={quickAnalyzeResume?.id}
          onClose={() => { setShowAts(false); setQuickAnalyzeResume(null); }}
        />
      )}
      {dialog}
    </div>
  );
}
