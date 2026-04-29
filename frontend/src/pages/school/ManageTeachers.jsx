import { useState, useEffect } from 'react';
import api from '../../api/axios';

const INPUT_CLS = 'w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
const EDIT_INPUT = 'w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';

const initialForm = { username: '', email: '', password: '', first_name: '', last_name: '', phone_number: '', subject_ids: [] };

const AVATAR_PALETTE = [
  'from-indigo-400 to-violet-500', 'from-blue-400 to-cyan-500', 'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500', 'from-pink-400 to-rose-500', 'from-purple-400 to-fuchsia-500',
];

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...initialForm });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '' });
  const [editSubjectIds, setEditSubjectIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchTeachers = async (pageNum) => {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/members/', { params: { role: 'teacher', page: pageNum } });
      const data = res.data;
      if (data.results) { setTeachers(data.results); setHasMore(!!data.next); }
      else { setTeachers(data); setHasMore(false); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTeachers(page);
    api.get('/api/subjects/').then(res => setSubjects(res.data.results || res.data)).catch(console.error);
  }, [page]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const toggleSubject = (id) => {
    setFormData(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(id) ? prev.subject_ids.filter(s => s !== id) : [...prev.subject_ids, id],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/auth/create-teacher/', formData);
      showMessage('Teacher created successfully!');
      setFormData({ ...initialForm }); setShowForm(false); setPage(1); fetchTeachers(1);
    } catch (err) {
      const detail = err.response?.data;
      let msg = 'Failed to create teacher.';
      if (detail && typeof detail === 'object') { const k = Object.keys(detail)[0]; const v = detail[k]; msg = Array.isArray(v) ? v[0] : String(v); }
      showMessage(msg, 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this teacher?')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/auth/members/${id}/`);
      showMessage('Teacher removed successfully!'); fetchTeachers(page);
    } catch { showMessage('Failed to remove teacher.', 'error'); }
    finally { setDeleting(null); }
  };

  const startEditing = (teacher) => {
    setEditingId(teacher.id);
    setEditForm({ first_name: teacher.first_name || '', last_name: teacher.last_name || '', username: teacher.username || '', email: teacher.email || '', phone_number: teacher.phone_number || '', teacher_id: teacher.teacher_id || '', new_password: '' });
    const currentSubjectNames = (teacher.assigned_teachers || []).map(a => a.subject_name);
    setEditSubjectIds(subjects.filter(s => currentSubjectNames.includes(s.name)).map(s => s.id));
  };

  const cancelEditing = () => { setEditingId(null); setEditForm({}); setEditSubjectIds([]); };

  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      await api.patch(`/api/auth/members/${id}/update/`, { ...editForm, subject_ids: editSubjectIds });
      showMessage('Teacher updated successfully!'); cancelEditing(); fetchTeachers(page);
    } catch (err) {
      const detail = err.response?.data;
      let msg = 'Failed to update teacher.';
      if (detail && typeof detail === 'object') { const k = Object.keys(detail)[0]; const v = detail[k]; msg = Array.isArray(v) ? v[0] : String(v); }
      showMessage(msg, 'error');
    } finally { setSaving(false); }
  };

  const initials = (t) => `${t.first_name?.[0] || ''}${t.last_name?.[0] || ''}`.toUpperCase() || t.username?.[0]?.toUpperCase() || 'T';

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
            <h1 className="text-3xl font-extrabold text-white">Manage Teachers</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition shrink-0 ${showForm ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
              </svg>
              {showForm ? 'Cancel' : 'Add Teacher'}
            </button>
          </div>
          <p className="text-indigo-200 text-sm mb-6">View and manage all teacher accounts in your school</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Teachers', value: teachers.length, color: 'bg-white/10 border-white/20',           text: 'text-white'      },
              { label: 'Subjects', value: subjects.length, color: 'bg-indigo-500/30 border-indigo-400/40', text: 'text-indigo-200' },
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        {message.text && (
          <div className={`rounded-2xl p-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-emerald-800' : 'text-red-700'}`}>{message.text}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-4">
              <p className="font-semibold text-white text-sm">Create New Teacher</p>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={LABEL_CLS}>First Name *</label><input name="first_name" value={formData.first_name} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required className={INPUT_CLS} placeholder="Enter first name" /></div>
                <div><label className={LABEL_CLS}>Last Name *</label><input name="last_name" value={formData.last_name} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required className={INPUT_CLS} placeholder="Enter last name" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={LABEL_CLS}>Username <span className="text-gray-400 font-normal normal-case">(optional)</span></label><input name="username" value={formData.username} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={INPUT_CLS} placeholder="Auto-generated if left blank" /></div>
                <div><label className={LABEL_CLS}>Email *</label><input name="email" type="email" value={formData.email} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required className={INPUT_CLS} placeholder="Enter email" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={LABEL_CLS}>Password *</label><input name="password" type="password" value={formData.password} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required className={INPUT_CLS} placeholder="Enter password" /></div>
                <div><label className={LABEL_CLS}>Phone Number</label><input name="phone_number" value={formData.phone_number} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={INPUT_CLS} placeholder="Enter phone number" /></div>
              </div>
              <div>
                <label className={LABEL_CLS}>Assign Subject(s)</label>
                {subjects.length === 0 ? (
                  <p className="text-sm text-gray-400">No subjects available.</p>
                ) : (
                  <div className="border-2 border-gray-100 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 bg-gray-50">
                    {subjects.map(s => (
                      <label key={s.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-white px-2 py-1.5 rounded-lg transition">
                        <input type="checkbox" checked={formData.subject_ids.includes(s.id)} onChange={() => toggleSubject(s.id)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700">{s.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {formData.subject_ids.length > 0 && <p className="text-xs text-gray-400 mt-1">{formData.subject_ids.length} subject(s) selected</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-sm">
                  {submitting ? 'Creating…' : 'Create Teacher'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setFormData({...initialForm}); }} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teachers List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No teachers yet</h3>
            <button onClick={() => setShowForm(true)} className="text-indigo-600 font-medium text-sm hover:underline">Add your first teacher →</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {teachers.map((teacher, idx) => (
                <div key={teacher.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {editingId === teacher.id ? (
                    <div>
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
                        <p className="font-semibold text-white text-sm">Edit Teacher</p>
                        <button onClick={cancelEditing} className="text-white/70 hover:text-white transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={LABEL_CLS}>First Name</label><input name="first_name" value={editForm.first_name} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className={EDIT_INPUT} /></div>
                          <div><label className={LABEL_CLS}>Last Name</label><input name="last_name" value={editForm.last_name} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className={EDIT_INPUT} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={LABEL_CLS}>Username</label><input name="username" value={editForm.username} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className={EDIT_INPUT} /></div>
                          <div><label className={LABEL_CLS}>Teacher ID</label><input name="teacher_id" value={editForm.teacher_id} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className={EDIT_INPUT} placeholder="e.g. TCH001" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={LABEL_CLS}>Email</label><input name="email" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className={EDIT_INPUT} /></div>
                          <div><label className={LABEL_CLS}>Phone</label><input name="phone_number" value={editForm.phone_number} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className={EDIT_INPUT} /></div>
                        </div>
                        <div><label className={LABEL_CLS}>New Password <span className="text-gray-400 font-normal normal-case">(leave blank to keep)</span></label><input name="new_password" type="password" value={editForm.new_password} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className={EDIT_INPUT} /></div>
                        {subjects.length > 0 && (
                          <div>
                            <label className={LABEL_CLS}>Assigned Subjects</label>
                            <div className="flex flex-wrap gap-2">
                              {subjects.map(s => (
                                <label key={s.id} className={`flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-xl border-2 text-sm transition ${editSubjectIds.includes(s.id) ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-100 bg-gray-50 text-gray-600'}`}>
                                  <input type="checkbox" checked={editSubjectIds.includes(s.id)} onChange={() => setEditSubjectIds(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} className="hidden" />
                                  {s.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-3 pt-1">
                          <button onClick={() => handleEditSave(teacher.id)} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm transition-all disabled:opacity-50">
                            {saving ? 'Saving…' : 'Save Changes'}
                          </button>
                          <button onClick={cancelEditing} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${AVATAR_PALETTE[idx % AVATAR_PALETTE.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {initials(teacher)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-gray-800">{teacher.first_name} {teacher.last_name}</h3>
                            {teacher.teacher_id && <span className="text-xs text-gray-400">{teacher.teacher_id}</span>}
                          </div>
                          <p className="text-sm text-gray-500">@{teacher.username}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                            {teacher.email && <span>{teacher.email}</span>}
                            {teacher.phone_number && <span>{teacher.phone_number}</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {teacher.assigned_teachers && teacher.assigned_teachers.length > 0
                              ? [...new Map(teacher.assigned_teachers.map(a => [a.subject_name, a])).values()].map((at, i) => (
                                  <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{at.subject_name}</span>
                                ))
                              : <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">No subject assigned</span>
                            }
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => startEditing(teacher)} className="px-3 py-1.5 rounded-xl text-indigo-600 text-sm font-semibold hover:bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-200 transition">Edit</button>
                          <button onClick={() => handleDelete(teacher.id)} disabled={deleting === teacher.id} className="px-3 py-1.5 rounded-xl text-red-500 text-sm font-semibold hover:bg-red-50 border-2 border-gray-100 hover:border-red-200 transition disabled:opacity-50">
                            {deleting === teacher.id ? '…' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-600 font-medium text-sm transition disabled:opacity-40">Previous</button>
              <span className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-xl border-2 border-indigo-100">Page {page}</span>
              <button onClick={() => setPage(page + 1)} disabled={!hasMore} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-600 font-medium text-sm transition disabled:opacity-40">Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
