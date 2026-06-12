import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { RiAddLine, RiStarFill, RiStarLine, RiSearchLine, RiDeleteBinLine, RiEditLine, RiFileTextLine } from 'react-icons/ri';
import api from '../../services/api';

const STATUS_COLOR = { applied: 'badge-applied', 'in-process': 'badge-in-process', offered: 'badge-offered', rejected: 'badge-rejected' };
const ROUND_STATUSES = ['upcoming','completed','passed','failed'];
const ROUND_CATEGORIES = ['Screening','OA','Technical','HR','Managerial','Group Discussion','Other'];

function RoundModal({ appId, round, onClose, onSaved }) {
  const isEdit = !!round;
  const isCustom = round && !ROUND_CATEGORIES.slice(0, -1).includes(round.category);

  const getInitialDate = () => {
    if (!round?.scheduled_at) return '';
    return new Date(round.scheduled_at).toISOString().slice(0, 10);
  };

  const [form, setForm] = useState(isEdit ? {
    category: isCustom ? 'Other' : round.category,
    customCategory: isCustom ? round.category : '',
    date: getInitialDate(),
    status: round.status,
    notes: round.notes || '',
  } : { category: 'Screening', customCategory: '', date: '', status: 'upcoming', notes: '' });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const category = form.category === 'Other' ? form.customCategory.trim() : form.category;
      if (!category) { toast.error('Category is required'); setSaving(false); return; }
      const scheduled_at = form.date ? `${form.date}T00:00` : null;
      if (isEdit) {
        await api.put(`/rounds/${round.id}`, { category, scheduled_at, status: form.status, notes: form.notes });
        toast.success('Round updated!');
      } else {
        await api.post('/rounds', { application_id: appId, category, scheduled_at, status: form.status, notes: form.notes });
        toast.success('Round added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving round');
    } finally {
      setSaving(false);
    }
  };

  // Render via portal so framer-motion transforms on parent cards don't break position:fixed
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--cardBg)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          width: '100%', maxWidth: 500,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header — always visible */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{isEdit ? 'Edit Round' : 'Add Round'}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, lineHeight: 1 }}>✕</button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                {ROUND_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Custom category if "Other" */}
            {form.category === 'Other' && (
              <div className="form-group">
                <label className="form-label">Custom Category Name *</label>
                <input
                  className="form-input"
                  value={form.customCategory}
                  onChange={e => set('customCategory', e.target.value)}
                  placeholder="e.g. Case Study, Assignment…"
                  required
                  autoFocus
                />
              </div>
            )}

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Scheduled Date</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {ROUND_STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Questions asked, topics covered, difficulty level…"
                style={{ minHeight: 80 }}
              />
            </div>
          </div>

          {/* Footer — always visible, never cut off */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update Round' : 'Save Round'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function TrackerCard({ app, onRefresh, expanded, onToggle }) {
  const [activeTab, setActiveTab] = useState('rounds');
  const [rounds, setRounds] = useState([]);
  const [notes, setNotes] = useState('');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [companyInfoError, setCompanyInfoError] = useState(null);
  const [noAIKey, setNoAIKey] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [editRound, setEditRound] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [jdTextData, setJdTextData] = useState(null);
  const [jdSource, setJdSource] = useState(null);
  const [fetchingJd, setFetchingJd] = useState(false);
  const [pasteJdMode, setPasteJdMode] = useState(false);
  const [pasteJdValue, setPasteJdValue] = useState('');
  const [savingJd, setSavingJd] = useState(false);
  const autoSaveRef = useRef(null);

  const loadRounds = async () => {
    setLoadingRounds(true);
    try {
      const r = await api.get(`/rounds/application/${app.id}`);
      setRounds(r.data);
    } catch (err) {
      if (err.response?.status !== 401) toast.error('Could not load rounds');
    } finally {
      setLoadingRounds(false);
    }
  };

  const loadNotes = async () => {
    try {
      const r = await api.get(`/tracker/notes/${app.id}`);
      setNotes(r.data.content || '');
    } catch {}
  };

  const loadInfo = async () => {
    setLoadingInfo(true);
    setCompanyInfoError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const r = await api.get(`/tracker/company-info/${app.id}`, { signal: controller.signal });
      clearTimeout(timeout);
      setCompanyInfo(r.data.data);
      setNoAIKey(!!r.data.noKey);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        setCompanyInfoError('Request timed out after 10 seconds.');
      } else {
        setCompanyInfoError('Could not load company info.');
      }
    }
    setLoadingInfo(false);
  };

  const refreshInfo = async () => {
    setCompanyInfo(null);
    setNoAIKey(false);
    setLoadingInfo(true);
    setCompanyInfoError(null);
    try {
      const r = await api.post(`/tracker/company-info/${app.id}/refresh`);
      setCompanyInfo(r.data.data);
      setNoAIKey(!!r.data.noKey);
    } catch {
      setCompanyInfoError('Could not refresh company info.');
    }
    setLoadingInfo(false);
  };

  const loadJdText = async () => {
    if (jdTextData !== null || fetchingJd) return;
    setFetchingJd(true);
    try {
      const r = await api.get(`/applications/${app.id}/jd-text`);
      setJdTextData(r.data.text || '');
      setJdSource(r.data.source || 'none');
    } catch {
      setJdTextData('');
      setJdSource('error');
    }
    setFetchingJd(false);
  };

  const handleSaveJdText = async () => {
    if (!pasteJdValue.trim()) return;
    setSavingJd(true);
    try {
      await api.post(`/applications/${app.id}/jd-text`, { jd_text: pasteJdValue.trim() });
      setJdTextData(pasteJdValue.trim());
      setJdSource('text');
      setPasteJdMode(false);
      toast.success('JD text saved!');
    } catch {
      toast.error('Failed to save JD text');
    }
    setSavingJd(false);
  };

  const handleExpand = () => {
    if (!expanded) { loadRounds(); loadNotes(); }
    onToggle();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'info' && !companyInfo && !companyInfoError) loadInfo();
    if (tab === 'jd' && app.jd_file_url && !app.jd_text && jdTextData === null) loadJdText();
  };

  const handleNoteChange = (v) => {
    setNotes(v);
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      setSavingNote(true);
      try { await api.post('/tracker/notes', { application_id: app.id, content: v }); }
      catch {}
      setSavingNote(false);
    }, 1500);
  };

  const handleDeleteRound = async (id) => {
    await api.delete(`/rounds/${id}`);
    loadRounds();
  };

  const handleStatusChange = async (status) => {
    await api.patch(`/applications/${app.id}/status`, { status });
    toast.success('Status updated');
    onRefresh();
  };

  const toggleImportant = async () => {
    await api.patch(`/applications/${app.id}/important`);
    onRefresh();
  };

  const cardClass = `glass-card tracker-card${app.overall_status === 'offered' ? ' offered' : app.overall_status === 'rejected' ? ' rejected' : ''}`;

  return (
    <motion.div className={cardClass} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="tracker-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{app.company_name}</h3>
            <button className={`star-btn${app.is_important ? ' active' : ''}`} onClick={toggleImportant} style={{ padding: 2 }}>
              {app.is_important ? <RiStarFill size={15} /> : <RiStarLine size={15} />}
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{app.role || '—'} {app.package_lpa ? `· ${app.package_lpa} LPA` : ''} {app.location ? `· ${app.location}` : ''}</p>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge ${STATUS_COLOR[app.overall_status] || 'badge-applied'}`}>{app.overall_status?.replace('-',' ')}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{app.round_count} rounds · {app.rounds_done} done</span>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleExpand} style={{ flexShrink: 0 }}>
          {expanded ? 'Collapse' : 'View Details'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="tracker-card-body">
              <div className="tabs" style={{ marginBottom: 16 }}>
                {[['rounds','Rounds'],['notes','Notes'],['jd','JD & Stack'],['info','Company Info'],['status','Status']].map(([t,l]) => (
                  <button key={t} className={`tab-btn${activeTab===t?' active':''}`} onClick={() => handleTabChange(t)}>{l}</button>
                ))}
              </div>

              {/* Rounds tab */}
              {activeTab === 'rounds' && (
                <div>
                  {loadingRounds ? <div className="spinner-wrap" style={{ padding: 20 }}><div className="spinner-ring" /></div> : (
                    <>
                      {rounds.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div className="round-timeline">
                            {rounds.map(r => (
                              <div key={r.id} className={`round-dot ${r.status}`} title={`Round ${r.round_number}: ${r.category} (${r.status})`}>{r.round_number}</div>
                            ))}
                          </div>
                          {rounds.map(r => {
                            const daysUntil = (() => {
                              if (!r.scheduled_at) return null;
                              const today = new Date(); today.setHours(0, 0, 0, 0);
                              const rd = new Date(r.scheduled_at); rd.setHours(0, 0, 0, 0);
                              return Math.round((rd - today) / 86400000);
                            })();
                            const isUpcomingFuture = r.status === 'upcoming' && daysUntil !== null && daysUntil >= 0;
                            return (
                            <div key={r.id} className="round-row">
                              <div className="round-num" style={{ flexShrink: 0 }}>{r.round_number}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <p style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.category}</p>
                                  {isUpcomingFuture && daysUntil === 0 && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 6px', borderRadius: 4 }}>TODAY</span>}
                                  {isUpcomingFuture && daysUntil === 1 && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(249,115,22,0.12)', color: '#f97316', padding: '1px 6px', borderRadius: 4 }}>TOMORROW</span>}
                                  {isUpcomingFuture && daysUntil === 2 && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(249,115,22,0.12)', color: '#f97316', padding: '1px 6px', borderRadius: 4 }}>IN 2 DAYS</span>}
                                  {isUpcomingFuture && daysUntil > 2 && daysUntil <= 7 && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(234,179,8,0.12)', color: '#ca8a04', padding: '1px 6px', borderRadius: 4 }}>IN {daysUntil} DAYS</span>}
                                </div>
                                {r.scheduled_at && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(r.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>}
                                {r.notes && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes}</p>}
                              </div>
                              <span className={`badge badge-${r.status}`} style={{ flexShrink: 0 }}>{r.status}</span>
                              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditRound(r)}><RiEditLine size={13} /></button>
                                <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => handleDeleteRound(r.id)}><RiDeleteBinLine size={13} /></button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                      {rounds.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No rounds added yet.</p>}
                      <button className="btn btn-outline btn-sm" onClick={() => setShowRoundModal(true)}><RiAddLine size={13} /> Add Round</button>
                    </>
                  )}
                </div>
              )}

              {/* Notes tab */}
              {activeTab === 'notes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>Personal diary for {app.company_name}. Notes auto-save.</p>
                    {savingNote && <span className="auto-save-badge">Saving…</span>}
                    {!savingNote && notes && <span style={{ fontSize: 11, color: 'var(--primary)' }}>✓ Saved</span>}
                  </div>
                  <textarea className="note-editor" value={notes} onChange={e => handleNoteChange(e.target.value)} placeholder={`Questions asked, key tech discussed, mistakes made, tips for ${app.company_name}…\n\nBe your own coach.`} />
                </div>
              )}

              {/* JD tab */}
              {activeTab === 'jd' && (
                <div>
                  {/* Info chips row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {app.role && <span className="badge badge-applied" style={{ fontSize: 12 }}>💼 {app.role}</span>}
                    {app.package_lpa && <span className="badge badge-in-process" style={{ fontSize: 12 }}>💰 {app.package_lpa} LPA</span>}
                    {app.location && <span className="badge" style={{ fontSize: 12, background: 'rgba(240,160,60,0.12)', color: '#C07810' }}>📍 {app.location}</span>}
                    {app.applied_date && <span className="badge" style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>🗓 Applied {new Date(app.applied_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>}
                  </div>

                  {/* Tech stack */}
                  {app.tech_stack?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tech Stack</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {app.tech_stack.map((t, i) => (
                          <span key={t} className="badge" style={{ background: ['rgba(74,103,65,0.12)','rgba(153,173,122,0.2)','rgba(26,102,52,0.1)','rgba(240,160,60,0.12)'][i%4], color: ['var(--primary)','#3A6030','#1A6634','#C07810'][i%4] }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* JD Text */}
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Description</p>

                  {pasteJdMode ? (
                    <div>
                      <textarea
                        className="note-editor"
                        value={pasteJdValue}
                        onChange={e => setPasteJdValue(e.target.value)}
                        placeholder="Paste the full job description here…"
                        style={{ minHeight: 160, marginBottom: 8 }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={handleSaveJdText} disabled={savingJd || !pasteJdValue.trim()}>
                          {savingJd ? 'Saving…' : 'Save JD Text'}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setPasteJdMode(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : app.jd_text ? (
                    <pre style={{ fontSize: 12.5, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 300, overflowY: 'auto', background: 'var(--surface)', padding: 14, borderRadius: 10, marginBottom: 12, wordBreak: 'break-word' }}>{app.jd_text}</pre>
                  ) : app.jd_file_url ? (
                    fetchingJd ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--muted)', fontSize: 13 }}>
                        <div className="spinner-ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        Extracting text from PDF…
                      </div>
                    ) : jdTextData ? (
                      <pre style={{ fontSize: 12.5, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 300, overflowY: 'auto', background: 'var(--surface)', padding: 14, borderRadius: 10, marginBottom: 12, wordBreak: 'break-word' }}>{jdTextData}</pre>
                    ) : jdSource === 'file_missing' ? (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                        <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }}>JD file not found on server. Please re-upload the JD in the application settings.</p>
                      </div>
                    ) : (jdSource === 'scanned_pdf' || jdTextData === '') ? (
                      <div style={{ background: 'rgba(240,160,60,0.08)', border: '1px solid rgba(240,160,60,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#C07810', marginBottom: 6 }}>📄 Scanned PDF — text extraction failed</p>
                        <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>
                          This appears to be a scanned/image PDF. You can view the original file or paste the JD text manually.
                        </p>
                        <button className="btn btn-outline btn-sm" onClick={() => setPasteJdMode(true)}>📋 Paste JD Text Instead</button>
                      </div>
                    ) : null
                  ) : (
                    <div>
                      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>No JD added. Edit the application to add one, or paste the text directly:</p>
                      <button className="btn btn-outline btn-sm" onClick={() => setPasteJdMode(true)}>📋 Paste JD Text</button>
                    </div>
                  )}

                  {app.jd_file_url && !pasteJdMode && (
                    <a href={`http://localhost:5000${app.jd_file_url}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 8, display: 'inline-flex' }}><RiFileTextLine /> View JD File</a>
                  )}
                </div>
              )}

              {/* Company Info tab */}
              {activeTab === 'info' && (
                <div>
                  {loadingInfo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
                      <div className="spinner-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      Loading company insights…
                    </div>
                  ) : companyInfoError ? (
                    <div>
                      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>{companyInfoError}</p>
                      <button className="btn btn-outline btn-sm" onClick={loadInfo}>Try Again</button>
                    </div>
                  ) : noAIKey ? (
                    <div>
                      <div style={{ background: 'rgba(240,160,60,0.08)', border: '1px solid rgba(240,160,60,0.3)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#C07810', marginBottom: 6 }}>🔑 AI Key Required</p>
                        <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                          Add your <strong>GROQ_API_KEY</strong> to the backend <code>.env</code> file to get AI-powered company insights.
                        </p>
                      </div>
                    </div>
                  ) : companyInfo ? (
                    <div>
                      {companyInfo.industry && <p style={{ marginBottom: 8, fontSize: 13 }}>🏢 <strong>Industry:</strong> {companyInfo.industry}</p>}
                      {companyInfo.overview && <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>{companyInfo.overview}</p>}
                      {companyInfo.products?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Products & Services</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {companyInfo.products.map((p, i) => <span key={i} className="badge badge-applied">{p}</span>)}
                          </div>
                        </div>
                      )}
                      {companyInfo.tech_stack?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Tech Stack Used</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {companyInfo.tech_stack.map((t, i) => <span key={i} className="badge badge-in-process">{t}</span>)}
                          </div>
                        </div>
                      )}
                      {companyInfo.culture?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Culture</p>
                          {companyInfo.culture.map((c, i) => <p key={i} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 3 }}>• {c}</p>)}
                        </div>
                      )}
                      {companyInfo.common_hr_questions?.length > 0 && (
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Common HR Questions</p>
                          {companyInfo.common_hr_questions.map((q, i) => <p key={i} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{i+1}. {q}</p>)}
                        </div>
                      )}
                      <button className="btn btn-outline btn-sm" style={{ marginTop: 14 }} onClick={refreshInfo}>↻ Refresh Info</button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>No company info loaded yet.</p>
                      <button className="btn btn-outline btn-sm" onClick={loadInfo}>Load Company Info</button>
                    </div>
                  )}
                </div>
              )}

              {/* Status tab */}
              {activeTab === 'status' && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 12 }}>Update Overall Status</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['applied','in-process','offered','rejected'].map(s => (
                      <button key={s} className={`btn btn-sm ${app.overall_status === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleStatusChange(s)}>
                        {s.charAt(0).toUpperCase()+s.slice(1).replace('-',' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showRoundModal && <RoundModal appId={app.id} onClose={() => setShowRoundModal(false)} onSaved={loadRounds} />}
      {editRound && <RoundModal round={editRound} appId={app.id} onClose={() => setEditRound(null)} onSaved={loadRounds} />}
    </motion.div>
  );
}

export default function Tracker() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedCards, setExpandedCards] = useState({});

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    api.get('/tracker').then(r => setApps(r.data)).finally(() => { if (!silent) setLoading(false); });
  };

  const refresh = () => load(true);

  const toggleCard = (id) => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => { load(); }, []);

  const filtered = apps.filter(a => {
    if (filter !== 'all' && a.overall_status !== filter) return false;
    if (search && !a.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const importantApps = filtered.filter(a => a.is_important);
  const regularApps   = filtered.filter(a => !a.is_important);

  return (
    <div>
      <Helmet><title>Tracker | CareerDock</title></Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tracker</h1>
          <p className="page-subtitle">Your company-by-company placement diary</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 280 }}>
          <RiSearchLine size={15} className="search-icon" />
          <input className="form-input" placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div className="tabs" style={{ margin: 0 }}>
          {[['all','All'],['in-process','In Process'],['offered','Offered'],['rejected','Rejected']].map(([v,l]) => (
            <button key={v} className={`tab-btn${filter===v?' active':''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner-ring" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No companies to track{filter !== 'all' ? ` with status "${filter}"` : ''}</h3>
          <p>Add applications first — each application becomes a trackable company card here.</p>
        </div>
      ) : (
        <>
          {/* ── Important companies ── */}
          {importantApps.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <RiStarFill size={16} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.03em' }}>Important</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface)', padding: '1px 8px', borderRadius: 20 }}>{importantApps.length}</span>
              </div>
              <div className="tracker-grid" style={{ border: '1.5px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: 16, background: 'rgba(245,158,11,0.03)' }}>
                {importantApps.map(app => (
                  <TrackerCard key={app.id} app={app} onRefresh={refresh} expanded={!!expandedCards[app.id]} onToggle={() => toggleCard(app.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ── All other companies ── */}
          {regularApps.length > 0 && (
            <div>
              {importantApps.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.03em' }}>All Companies</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface)', padding: '1px 8px', borderRadius: 20 }}>{regularApps.length}</span>
                </div>
              )}
              <div className="tracker-grid">
                {regularApps.map(app => (
                  <TrackerCard key={app.id} app={app} onRefresh={refresh} expanded={!!expandedCards[app.id]} onToggle={() => toggleCard(app.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
