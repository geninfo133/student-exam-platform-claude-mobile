import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const INPUT_CLS = 'w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
const COMPACT_INPUT = 'w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';

const SUBJECT_PALETTE = [
  'from-indigo-500 to-violet-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500', 'from-pink-500 to-rose-600', 'from-purple-500 to-fuchsia-600',
];

export default function ManageSubjects() {
  const { user } = useAuth();
  const isCoaching = user?.org_type === 'coaching';
  const classFrom = user?.class_from || 1;
  const classTo = user?.class_to || 12;
  const classRange = isCoaching ? [] : Array.from({ length: classTo - classFrom + 1 }, (_, i) => classFrom + i);

  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', grade: '' });
  const [submittingSubject, setSubmittingSubject] = useState(false);

  const [chapterForSubject, setChapterForSubject] = useState(null);
  const [chapterForm, setChapterForm] = useState({ name: '', code: '' });
  const [submittingChapter, setSubmittingChapter] = useState(false);

  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({ name: '', code: '' });
  const [savingSubject, setSavingSubject] = useState(false);

  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editChapterForm, setEditChapterForm] = useState({ name: '', code: '' });
  const [savingChapter, setSavingChapter] = useState(false);

  const [expandedSubject, setExpandedSubject] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const showMsg = (text, type = 'success') => { setMessage({ text, type }); setTimeout(() => setMessage({ text: '', type: '' }), 4000); };

  const fetchSubjects = async () => {
    try { const res = await api.get('/api/subjects/'); setSubjects(res.data.results || res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchChapters = async (subjectId) => {
    try { const res = await api.get('/api/chapters/', { params: { subject: subjectId } }); setChapters(prev => ({ ...prev, [subjectId]: res.data.results || res.data })); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const toggleExpand = (subjectId) => {
    if (expandedSubject === subjectId) { setExpandedSubject(null); }
    else { setExpandedSubject(subjectId); if (!chapters[subjectId]) fetchChapters(subjectId); }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setSubmittingSubject(true);
    try {
      await api.post('/api/subjects/create/', subjectForm);
      showMsg('Subject created successfully!'); setSubjectForm({ name: '', code: '', grade: '' }); setShowSubjectForm(false); fetchSubjects();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed to create subject.', 'error'); }
    finally { setSubmittingSubject(false); }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject and all its chapters/questions?')) return;
    setDeleting(`subject-${id}`);
    try { await api.delete(`/api/subjects/${id}/`); showMsg('Subject deleted.'); fetchSubjects(); }
    catch { showMsg('Failed to delete subject.', 'error'); }
    finally { setDeleting(null); }
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    setSubmittingChapter(true);
    try {
      await api.post('/api/chapters/create/', { ...chapterForm, subject: chapterForSubject });
      showMsg('Chapter created successfully!'); setChapterForm({ name: '', code: '' }); setChapterForSubject(null); fetchChapters(chapterForSubject);
    } catch (err) { showMsg(err.response?.data?.error || 'Failed to create chapter.', 'error'); }
    finally { setSubmittingChapter(false); }
  };

  const handleDeleteChapter = async (subjectId, chapterId) => {
    if (!window.confirm('Delete this chapter?')) return;
    setDeleting(`chapter-${chapterId}`);
    try { await api.delete(`/api/chapters/${chapterId}/`); showMsg('Chapter deleted.'); fetchChapters(subjectId); }
    catch { showMsg('Failed to delete chapter.', 'error'); }
    finally { setDeleting(null); }
  };

  const handleSaveSubject = async (id) => {
    setSavingSubject(true);
    try { await api.patch(`/api/subjects/${id}/update/`, editSubjectForm); showMsg('Subject updated!'); setEditingSubjectId(null); fetchSubjects(); }
    catch (err) { showMsg(err.response?.data?.error || 'Failed to update subject.', 'error'); }
    finally { setSavingSubject(false); }
  };

  const handleSaveChapter = async (subjectId, chapterId) => {
    setSavingChapter(true);
    try { await api.patch(`/api/chapters/${chapterId}/update/`, editChapterForm); showMsg('Chapter updated!'); setEditingChapterId(null); fetchChapters(subjectId); }
    catch (err) { showMsg(err.response?.data?.error || 'Failed to update chapter.', 'error'); }
    finally { setSavingChapter(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

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
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">School Administration</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <h1 className="text-3xl font-extrabold text-white">Subjects & Chapters</h1>
            <button
              onClick={() => setShowSubjectForm(!showSubjectForm)}
              className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition shrink-0 ${showSubjectForm ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSubjectForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
              </svg>
              {showSubjectForm ? 'Cancel' : 'Add Subject'}
            </button>
          </div>
          <p className="text-indigo-200 text-sm mb-6">
            {isCoaching ? 'Manage subjects and chapters for your coaching programme.' : 'Manage subjects and chapters for your school curriculum.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Subjects',  value: subjects.length,                                                     color: 'bg-white/10 border-white/20',             text: 'text-white'      },
              { label: 'Chapters',  value: subjects.reduce((s, sub) => s + (sub.chapter_count || 0), 0),        color: 'bg-indigo-500/30 border-indigo-400/40',   text: 'text-indigo-200' },
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
        {message.text && (
          <div className={`rounded-2xl p-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-emerald-800' : 'text-red-700'}`}>{message.text}</p>
          </div>
        )}

        {/* Create Subject Form */}
        {showSubjectForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-4">
              <p className="font-semibold text-white text-sm">Create New Subject</p>
            </div>
            <form onSubmit={handleCreateSubject} className="p-5 space-y-4">
              {!isCoaching && (
                <div>
                  <label className={LABEL_CLS}>Class *</label>
                  <select value={subjectForm.grade} onChange={e => setSubjectForm({ ...subjectForm, grade: e.target.value })} required className={INPUT_CLS}>
                    <option value="">Select Class</option>
                    {classRange.map(g => <option key={g} value={String(g)}>Class {g}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Subject Name *</label>
                  <input value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} required className={INPUT_CLS} placeholder="e.g. Mathematics" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Code *</label>
                  <input value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} required className={INPUT_CLS} placeholder="e.g. MATH10" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submittingSubject} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-sm">
                  {submittingSubject ? 'Creating…' : 'Create Subject'}
                </button>
                <button type="button" onClick={() => { setShowSubjectForm(false); setSubjectForm({ name: '', code: '', grade: '' }); }} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subjects List */}
        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No subjects yet</h3>
            <button onClick={() => setShowSubjectForm(true)} className="text-indigo-600 font-medium text-sm hover:underline">Create your first subject →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject, idx) => (
              <div key={subject.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Subject Header */}
                <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 transition" onClick={() => toggleExpand(subject.id)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length]} flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{subject.name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{subject.code}</span>
                        {!isCoaching && subject.grade && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Class {subject.grade}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{subject.chapter_count || 0} chapters · {subject.question_count || 0} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); setEditingSubjectId(subject.id); setEditSubjectForm({ name: subject.name, code: subject.code }); }}
                      className="px-3 py-1.5 rounded-xl text-indigo-600 text-sm font-semibold hover:bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-200 transition">
                      Edit
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteSubject(subject.id); }} disabled={deleting === `subject-${subject.id}`}
                      className="px-3 py-1.5 rounded-xl text-red-500 text-sm font-semibold hover:bg-red-50 border-2 border-gray-100 hover:border-red-200 transition disabled:opacity-50">
                      {deleting === `subject-${subject.id}` ? '…' : 'Delete'}
                    </button>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSubject === subject.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Inline Edit Subject */}
                {editingSubjectId === subject.id && (
                  <div className="border-t border-gray-100 bg-indigo-50/30 px-5 py-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[160px]">
                        <label className={LABEL_CLS}>Name</label>
                        <input value={editSubjectForm.name} onChange={e => setEditSubjectForm({ ...editSubjectForm, name: e.target.value })} className={COMPACT_INPUT} placeholder="Subject name" />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className={LABEL_CLS}>Code</label>
                        <input value={editSubjectForm.code} onChange={e => setEditSubjectForm({ ...editSubjectForm, code: e.target.value.toUpperCase() })} className={COMPACT_INPUT} placeholder="Code" />
                      </div>
                      <div className="flex gap-2 self-end">
                        <button onClick={() => handleSaveSubject(subject.id)} disabled={savingSubject} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold disabled:opacity-50 shadow-sm">
                          {savingSubject ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setEditingSubjectId(null)} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chapters */}
                {expandedSubject === subject.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Chapters</h4>
                      <button
                        onClick={() => setChapterForSubject(chapterForSubject === subject.id ? null : subject.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold transition"
                      >
                        {chapterForSubject === subject.id ? 'Cancel' : '+ Add Chapter'}
                      </button>
                    </div>

                    {/* Add Chapter Form */}
                    {chapterForSubject === subject.id && (
                      <form onSubmit={handleCreateChapter} className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input value={chapterForm.name} onChange={e => setChapterForm({ ...chapterForm, name: e.target.value })} required className={COMPACT_INPUT} placeholder="Chapter name" />
                          <input value={chapterForm.code} onChange={e => setChapterForm({ ...chapterForm, code: e.target.value.toUpperCase() })} required className={COMPACT_INPUT} placeholder="Code (e.g. CH01)" />
                        </div>
                        <button type="submit" disabled={submittingChapter} className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold disabled:opacity-50 shadow-sm">
                          {submittingChapter ? 'Creating…' : 'Create Chapter'}
                        </button>
                      </form>
                    )}

                    {/* Chapter List */}
                    {!chapters[subject.id] ? (
                      <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" /></div>
                    ) : chapters[subject.id].length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">No chapters yet. Add one above.</p>
                    ) : (
                      <div className="space-y-2">
                        {chapters[subject.id].map((ch, chIdx) => (
                          <div key={ch.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                  {chIdx + 1}
                                </span>
                                <div>
                                  <span className="text-sm font-medium text-gray-700">{ch.name}</span>
                                  <span className="text-xs text-gray-400 ml-2">({ch.code})</span>
                                  <span className="text-xs text-gray-400 ml-2">{ch.question_count || 0} questions</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingChapterId(ch.id); setEditChapterForm({ name: ch.name, code: ch.code }); }} className="px-2.5 py-1 rounded-lg text-indigo-600 text-xs font-semibold hover:bg-indigo-50 border border-indigo-100 transition">Edit</button>
                                <button onClick={() => handleDeleteChapter(subject.id, ch.id)} disabled={deleting === `chapter-${ch.id}`} className="px-2.5 py-1 rounded-lg text-red-500 text-xs font-semibold hover:bg-red-50 border border-gray-100 transition disabled:opacity-50">
                                  {deleting === `chapter-${ch.id}` ? '…' : 'Delete'}
                                </button>
                              </div>
                            </div>

                            {/* Inline Edit Chapter */}
                            {editingChapterId === ch.id && (
                              <div className="border-t border-gray-100 bg-indigo-50/30 px-4 py-3">
                                <div className="flex flex-wrap items-end gap-3">
                                  <div className="flex-1 min-w-[140px]">
                                    <label className={LABEL_CLS}>Name</label>
                                    <input value={editChapterForm.name} onChange={e => setEditChapterForm({ ...editChapterForm, name: e.target.value })} className={COMPACT_INPUT} />
                                  </div>
                                  <div className="flex-1 min-w-[100px]">
                                    <label className={LABEL_CLS}>Code</label>
                                    <input value={editChapterForm.code} onChange={e => setEditChapterForm({ ...editChapterForm, code: e.target.value.toUpperCase() })} className={COMPACT_INPUT} />
                                  </div>
                                  <div className="flex gap-2 self-end">
                                    <button onClick={() => handleSaveChapter(subject.id, ch.id)} disabled={savingChapter} className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold disabled:opacity-50">
                                      {savingChapter ? 'Saving…' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingChapterId(null)} className="px-3 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50">Cancel</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
