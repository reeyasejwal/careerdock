import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiStarFill, RiStarLine, RiSearchLine, RiMapPinLine, RiBriefcaseLine, RiMoneyDollarCircleLine, RiFilterLine, RiCloseLine } from 'react-icons/ri';
import api from '../../services/api';
import { useConfirm } from '../../components/ConfirmDialog';

const STATUSES = ['all','applied','in-process','offered','rejected'];
const STATUS_COLOR = { applied:'badge-applied', 'in-process':'badge-in-process', offered:'badge-offered', rejected:'badge-rejected' };


function TagsInput({ value = [], onChange }) {
  const [input, setInput] = useState('');
  const addTag = (tag) => { const t = tag.trim(); if (t && !value.includes(t)) onChange([...value, t]); setInput(''); };
  return (
    <div className="tags-container" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
      {value.map(t => (
        <span key={t} className="tag-chip">{t}<button type="button" onClick={() => onChange(value.filter(x => x !== t))}>×</button></span>
      ))}
      <input className="tags-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); } }} placeholder={value.length ? '' : 'Type & press Enter…'} />
    </div>
  );
}

const EMPTY = { company_name: '', role: '', package_lpa: '', location: '', tech_stack: [], jd_text: '', applied_date: '' };

function AppModal({ app, onClose, onSaved }) {
  const [form, setForm] = useState(app ? { ...app, tech_stack: app.tech_stack || [], applied_date: app.applied_date?.slice(0,10) || '' } : EMPTY);
  const [jdMode, setJdMode] = useState('text');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tech_stack') fd.append(k, JSON.stringify(v));
        else if (v !== null && v !== undefined && v !== '') fd.append(k, v);
      });
      if (fileRef.current?.files[0]) fd.append('jdFile', fileRef.current.files[0]);
      if (app) await api.put(`/applications/${app.id}`, fd);
      else await api.post('/applications', fd);
      toast.success(app ? 'Application updated!' : 'Application added!');
      onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <p className="modal-title">{app ? 'Edit Application' : 'Add Application'}</p>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-input" required value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g. Google" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. SDE Intern" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Package (LPA)</label>
              <input className="form-input" type="number" step="0.1" value={form.package_lpa} onChange={e => set('package_lpa', e.target.value)} placeholder="e.g. 12.5" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bangalore" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tech Stack</label>
            <TagsInput value={form.tech_stack} onChange={v => set('tech_stack', v)} />
          </div>
          <div className="form-group">
            <label className="form-label">Job Description</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {['text','file','none'].map(m => (
                <button key={m} type="button" className={`btn btn-sm ${jdMode===m?'btn-primary':'btn-outline'}`} onClick={() => setJdMode(m)}>
                  {m === 'text' ? 'Paste JD' : m === 'file' ? 'Upload File' : 'Skip'}
                </button>
              ))}
            </div>
            {jdMode === 'text' && <textarea className="form-textarea" value={form.jd_text} onChange={e => set('jd_text', e.target.value)} placeholder="Paste the job description…" />}
            {jdMode === 'file' && <input type="file" ref={fileRef} accept=".pdf,.doc,.docx,.txt" className="form-input" />}
          </div>
          <div className="form-group">
            <label className="form-label">Applied Date</label>
            <input className="form-input" type="date" value={form.applied_date} onChange={e => set('applied_date', e.target.value)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : app ? 'Update' : 'Add Application'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Applications() {
  const { confirm, dialog } = useConfirm();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pkgMin, setPkgMin] = useState('');
  const [pkgMax, setPkgMax] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editApp, setEditApp] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/applications').then(r => setApps(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Delete Application', message: 'This will permanently remove the application and all its rounds. This cannot be undone.', confirmLabel: 'Delete', cancelLabel: 'Cancel' });
    if (!ok) return;
    await api.delete(`/applications/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggleImportant = async (app) => {
    await api.patch(`/applications/${app.id}/important`);
    load();
  };

  const hasActiveFilters = pkgMin || pkgMax || locationFilter || roleFilter || techFilter;

  const clearFilters = () => { setPkgMin(''); setPkgMax(''); setLocationFilter(''); setRoleFilter(''); setTechFilter(''); };

  const filtered = apps
    .filter(a => {
      if (filter !== 'all' && a.overall_status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch = a.company_name.toLowerCase().includes(q) ||
          (a.role || '').toLowerCase().includes(q) ||
          (a.location || '').toLowerCase().includes(q) ||
          (a.tech_stack || []).some(t => t.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      if (pkgMin && (a.package_lpa === null || a.package_lpa < Number(pkgMin))) return false;
      if (pkgMax && (a.package_lpa === null || a.package_lpa > Number(pkgMax))) return false;
      if (locationFilter && !(a.location || '').toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (roleFilter && !(a.role || '').toLowerCase().includes(roleFilter.toLowerCase())) return false;
      if (techFilter && !(a.tech_stack || []).some(t => t.toLowerCase().includes(techFilter.toLowerCase()))) return false;
      return true;
    })
    .sort((a, b) => {
      switch ('newest') {
        default: return new Date(b.created_at||0) - new Date(a.created_at||0);
      }
    });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? apps.length : apps.filter(a => a.overall_status === s).length;
    return acc;
  }, {});

  return (
    <div>
      <Helmet><title>Applications | CareerDock</title></Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">{apps.length} total · {apps.filter(a => a.is_important).length} important</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditApp(null); setShowModal(true); }}>
          <RiAddLine /> Add Application
        </button>
      </div>

      {/* Search row */}
      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-bar" style={{ flex:1, minWidth:200, maxWidth:340 }}>
          <RiSearchLine size={15} className="search-icon" />
          <input className="form-input" placeholder="Search company, role, location…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:36 }} />
        </div>
        <button className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowFilters(f => !f)} style={{ display:'flex', alignItems:'center', gap:5 }}>
          <RiFilterLine size={14}/> Filters
          {hasActiveFilters && <span style={{ background:'var(--accent)', borderRadius:'50%', width:7, height:7, display:'inline-block' }}/>}
        </button>
      </div>

      {/* Status chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding:'5px 14px', borderRadius:20, fontSize:12.5, fontWeight:500, cursor:'pointer',
              border: filter===s ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
              background: filter===s ? 'var(--primary)' : 'var(--cardBg)',
              color: filter===s ? '#fff' : 'var(--text)',
              backdropFilter:'blur(8px)', transition:'all 0.2s', display:'flex', alignItems:'center', gap:5,
            }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-',' ')}
            {counts[s] > 0 && <span style={{ background: filter===s ? 'rgba(255,255,255,0.25)' : 'var(--surface)', borderRadius:20, padding:'1px 6px', fontSize:10.5 }}>{counts[s]}</span>}
          </button>
        ))}
      </div>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="glass-card"
            initial={{ opacity:0, height:0, marginBottom:0 }}
            animate={{ opacity:1, height:'auto', marginBottom:16 }}
            exit={{ opacity:0, height:0, marginBottom:0 }}
            style={{ padding:'16px 20px', overflow:'hidden' }}
          >
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
              <div>
                <p style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Role</p>
                <div style={{ position:'relative' }}>
                  <RiBriefcaseLine size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}/>
                  <input className="form-input" style={{ fontSize:13, paddingLeft:30 }} placeholder="e.g. SDE, Frontend…" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} />
                </div>
              </div>
              <div>
                <p style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Location</p>
                <div style={{ position:'relative' }}>
                  <RiMapPinLine size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}/>
                  <input className="form-input" style={{ fontSize:13, paddingLeft:30 }} placeholder="e.g. Bangalore, Remote…" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} />
                </div>
              </div>
              <div>
                <p style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Tech Stack</p>
                <input className="form-input" style={{ fontSize:13 }} placeholder="e.g. React, Python…" value={techFilter} onChange={e => setTechFilter(e.target.value)} />
              </div>
              <div>
                <p style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Package (LPA)</p>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <input type="number" min="0" step="0.5" className="form-input" style={{ fontSize:13 }} placeholder="Min" value={pkgMin} onChange={e => setPkgMin(e.target.value)} />
                  <span style={{ color:'var(--muted)', fontSize:12, flexShrink:0 }}>—</span>
                  <input type="number" min="0" step="0.5" className="form-input" style={{ fontSize:13 }} placeholder="Max" value={pkgMax} onChange={e => setPkgMax(e.target.value)} />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>Active:</span>
                {roleFilter && <span className="tag-chip" style={{ fontSize:11.5 }}>Role: {roleFilter}<button onClick={() => setRoleFilter('')}>×</button></span>}
                {locationFilter && <span className="tag-chip" style={{ fontSize:11.5 }}>Location: {locationFilter}<button onClick={() => setLocationFilter('')}>×</button></span>}
                {techFilter && <span className="tag-chip" style={{ fontSize:11.5 }}>Tech: {techFilter}<button onClick={() => setTechFilter('')}>×</button></span>}
                {(pkgMin || pkgMax) && <span className="tag-chip" style={{ fontSize:11.5 }}>Pkg: {pkgMin||'0'}–{pkgMax||'∞'} LPA<button onClick={() => { setPkgMin(''); setPkgMax(''); }}>×</button></span>}
                <button className="btn btn-ghost btn-sm" style={{ color:'#B71C1C', fontSize:12 }} onClick={clearFilters}><RiCloseLine size={12}/> Clear all</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner-ring" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}</h3>
          <p>{search || hasActiveFilters ? 'Try adjusting your filters.' : 'Start tracking your placement journey by adding your first application.'}</p>
          {!search && !hasActiveFilters && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setEditApp(null); setShowModal(true); }}>
              <RiAddLine /> Add First Application
            </button>
          )}
        </div>
      ) : (
        <motion.div
          className="app-grid"
          key={filter + search + roleFilter + locationFilter + techFilter + pkgMin + pkgMax}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
        >
            {filtered.map((app) => (
              <motion.div key={app.id} className={`glass-card app-card card-hover${app.is_important ? ' important' : ''}`} layout>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p className="app-card-company">{app.company_name}</p>
                    <p className="app-card-role">{app.role || '—'}</p>
                  </div>
                  <button className={`star-btn${app.is_important ? ' active' : ''}`} onClick={() => toggleImportant(app)}>
                    {app.is_important ? <RiStarFill size={16} /> : <RiStarLine size={16} />}
                  </button>
                </div>

                <div className="app-card-meta">
                  {app.package_lpa && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:'var(--muted)' }}><RiMoneyDollarCircleLine size={13}/>{app.package_lpa} LPA</span>}
                  {app.location && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:'var(--muted)' }}><RiMapPinLine size={13}/>{app.location}</span>}
                  {app.role && !app.package_lpa && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:'var(--muted)' }}><RiBriefcaseLine size={13}/>{app.role}</span>}
                </div>

                {app.tech_stack?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
                    {app.tech_stack.slice(0,5).map(t => <span key={t} className="badge badge-applied">{t}</span>)}
                    {app.tech_stack.length > 5 && <span className="badge" style={{ color:'var(--muted)' }}>+{app.tech_stack.length-5}</span>}
                  </div>
                )}

                <div className="app-card-footer">
                  <span className={`badge ${STATUS_COLOR[app.overall_status] || 'badge-applied'}`}>
                    {app.overall_status?.replace('-',' ')}
                  </span>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:11.5, color:'var(--muted)' }}>
                      {app.applied_date ? new Date(app.applied_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—'}
                    </span>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditApp(app); setShowModal(true); }}><RiEditLine size={13}/></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(app.id)}><RiDeleteBinLine size={13}/></button>
                  </div>
                </div>
              </motion.div>
            ))}
        </motion.div>
      )}

      {showModal && <AppModal app={editApp} onClose={() => setShowModal(false)} onSaved={load} />}
      {dialog}
    </div>
  );
}
