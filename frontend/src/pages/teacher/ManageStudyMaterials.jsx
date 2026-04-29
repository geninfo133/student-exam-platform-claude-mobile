import { useState, useEffect } from 'react';
import api from '../../api/axios';

const INPUT_CLS = 'w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

export default function ManageStudyMaterials() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', file: null, order: 0 });
  const [keyConcepts, setKeyConcepts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    api.get('/api/assignments/my/').then(res => {
      const assignments = res.data.results || res.data;
      const subjectMap = {};
      assignments.forEach(a => { if (!subjectMap[a.subject]) subjectMap[a.subject] = { id: a.subject, name: a.subject_name }; });
      setSubjects(Object.values(subjectMap));
    });
  }, []);

  useEffect(() => {
    if (!selectedSubject) { setChapters([]); setSelectedChapter(''); return; }
    api.get('/api/chapters/', { params: { subject: selectedSubject } }).then(res => setChapters(res.data.results || res.data));
    setSelectedChapter(''); setMaterials([]);
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedChapter) { setMaterials([]); return; }
    fetchMaterials();
  }, [selectedChapter]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/study-materials/manage/', { params: { chapter: selectedChapter } });
      setMaterials(res.data.results || res.data);
    } catch { setError('Failed to load materials.'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: '', content: '', file: null, order: 0 });
    setKeyConcepts([]); setEditingId(null); setShowForm(false); setError(''); setSuccess('');
    const fi = document.getElementById('material-file-input');
    if (fi) fi.value = '';
  };

  const startEdit = (mat) => {
    setEditingId(mat.id);
    setForm({ title: mat.title, content: mat.content || '', file: null, order: mat.order });
    setKeyConcepts((mat.key_concepts || []).map(kc => ({ title: kc.title, description: kc.description, formula: kc.formula || '', order: kc.order })));
    setShowForm(true); setError(''); setSuccess('');
  };

  const addKeyConcept = () => setKeyConcepts([...keyConcepts, { title: '', description: '', formula: '', order: keyConcepts.length }]);
  const removeKeyConcept = (idx) => setKeyConcepts(keyConcepts.filter((_, i) => i !== idx));
  const updateKeyConcept = (idx, field, value) => setKeyConcepts(keyConcepts.map((kc, i) => i === idx ? { ...kc, [field]: value } : kc));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      fd.append('chapter', selectedChapter);
      fd.append('order', form.order);
      if (form.file) fd.append('file', form.file);
      if (keyConcepts.length > 0) fd.append('key_concepts', JSON.stringify(keyConcepts));

      if (editingId) {
        await api.patch(`/api/study-materials/${editingId}/update/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Material updated successfully!');
      } else {
        await api.post('/api/study-materials/create/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Material created successfully!');
      }
      resetForm(); fetchMaterials();
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'string') setError(detail);
      else if (detail?.non_field_errors) setError(detail.non_field_errors.join(', '));
      else if (detail?.detail) setError(detail.detail);
      else setError('Failed to save material.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/study-materials/${id}/delete/`);
      setSuccess('Material deleted.'); setDeleteConfirm(null); fetchMaterials();
    } catch { setError('Failed to delete material.'); }
  };

  const getFileName = (url) => url ? url.split('/').pop() : '';

  const chapterName = chapters.find(c => String(c.id) === String(selectedChapter))?.name || '';
  const subjectName = subjects.find(s => String(s.id) === String(selectedSubject))?.name || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Teacher Portal</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <h1 className="text-3xl font-extrabold text-white">Study Materials</h1>
          </div>
          <p className="text-indigo-200 text-sm mb-6">
            {chapterName ? `${subjectName} · ${chapterName}` : 'Upload and manage chapter study materials'}
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Materials',    value: selectedChapter ? materials.length : subjects.length, color: 'bg-white/10 border-white/20',             text: 'text-white'       },
              { label: 'Key Concepts', value: selectedChapter ? materials.reduce((s, m) => s + (m.key_concepts?.length || 0), 0) : chapters.length, color: 'bg-emerald-500/20 border-emerald-400/30', text: 'text-emerald-200' },
            ].map(({ label, value, color, text }) => (
              <div key={label} className={`${color} border rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]`}>
                <p className={`text-xl font-extrabold ${text}`}>{value}</p>
                <p className="text-white/50 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4"><p className="text-red-700 text-sm">{error}</p></div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4"><p className="text-emerald-800 font-semibold text-sm">{success}</p></div>}

        {!selectedChapter ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Select a subject and chapter</h3>
            <p className="text-gray-400 text-sm">Use the dropdowns above to choose a chapter and manage its study materials.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Add Material button */}
            {!showForm && (
              <div className="flex justify-end">
                <button
                  onClick={() => { resetForm(); setShowForm(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Material
                </button>
              </div>
            )}

            {/* Create / Edit Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`bg-gradient-to-r ${editingId ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-600'} px-5 py-4 flex items-center justify-between`}>
                  <p className="font-semibold text-white text-sm">{editingId ? 'Edit Material' : 'New Material'}</p>
                  <button type="button" onClick={resetForm} className="text-white/70 hover:text-white transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={LABEL_CLS}>Title *</label>
                    <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={INPUT_CLS} placeholder="Material title" />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Content</label>
                    <textarea rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                      className={INPUT_CLS + ' resize-none'} placeholder="Enter study material content…" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>File <span className="text-gray-400 font-normal normal-case">(PDF, images, docs)</span></label>
                      <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition">
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm text-gray-500 truncate">{form.file ? form.file.name : 'Click to attach file'}</span>
                        <input id="material-file-input" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => setForm({ ...form, file: e.target.files[0] || null })} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Display Order</label>
                      <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className={INPUT_CLS} />
                    </div>
                  </div>

                  {/* Key Concepts */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className={LABEL_CLS + ' mb-0'}>Key Concepts</label>
                      <button type="button" onClick={addKeyConcept}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Concept
                      </button>
                    </div>
                    <div className="space-y-3">
                      {keyConcepts.map((kc, idx) => (
                        <div key={idx} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-indigo-600">Concept {idx + 1}</span>
                            <button type="button" onClick={() => removeKeyConcept(idx)} className="text-red-400 hover:text-red-600 transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                            <input type="text" placeholder="Title *" required value={kc.title} onChange={e => updateKeyConcept(idx, 'title', e.target.value)}
                              className="px-3 py-2 border-2 border-indigo-100 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-400 transition" />
                            <input type="text" placeholder="Formula (optional)" value={kc.formula} onChange={e => updateKeyConcept(idx, 'formula', e.target.value)}
                              className="px-3 py-2 border-2 border-indigo-100 rounded-xl bg-white text-sm font-mono focus:outline-none focus:border-indigo-400 transition" />
                          </div>
                          <textarea placeholder="Description *" required rows={2} value={kc.description} onChange={e => updateKeyConcept(idx, 'description', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-indigo-100 rounded-xl bg-white text-sm resize-none focus:outline-none focus:border-indigo-400 transition" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-sm">
                      {saving ? (editingId ? 'Updating…' : 'Creating…') : (editingId ? 'Update Material' : 'Create Material')}
                    </button>
                    <button type="button" onClick={resetForm}
                      className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Materials list */}
            {materials.length === 0 && !showForm ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">No materials yet</h3>
                <p className="text-gray-400 text-sm">Add the first study material for this chapter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((mat, idx) => (
                  <div key={mat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-stretch">
                      {/* Order strip */}
                      <div className="w-12 bg-gradient-to-b from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{mat.order || idx + 1}</span>
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-gray-800">{mat.title}</h3>
                              {!mat.is_active && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactive</span>}
                            </div>
                            {mat.content && <p className="text-gray-500 text-sm line-clamp-2 mb-2">{mat.content}</p>}
                            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                              {mat.file && (
                                <a href={mat.file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {getFileName(mat.file)}
                                </a>
                              )}
                              {mat.key_concepts?.length > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                  {mat.key_concepts.length} concept{mat.key_concepts.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {mat.uploaded_by_name && <span>By {mat.uploaded_by_name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => startEdit(mat)}
                              className="px-3 py-1.5 rounded-xl text-indigo-600 text-sm font-semibold hover:bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-200 transition">
                              Edit
                            </button>
                            {deleteConfirm === mat.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDelete(mat.id)}
                                  className="px-3 py-1.5 rounded-xl text-red-600 text-sm font-semibold hover:bg-red-50 border-2 border-red-100 transition">
                                  Confirm
                                </button>
                                <button onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1.5 rounded-xl text-gray-500 text-sm hover:bg-gray-50 border-2 border-gray-100 transition">
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(mat.id)}
                                className="p-1.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 border-2 border-gray-100 hover:border-red-200 transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
