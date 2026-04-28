import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const INPUT_CLS = 'w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

const initialForm = { username: '', email: '', password: '', first_name: '', last_name: '', phone_number: '', grade: '', section: '', student_id: '', parent_phone: '' };

export default function ManageStudents() {
  const { user } = useAuth();
  const isCoaching = user?.org_type === 'coaching';
  const classFrom = user?.class_from || 1;
  const classTo = user?.class_to || 12;
  const classRange = Array.from({ length: classTo - classFrom + 1 }, (_, i) => classFrom + i);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...initialForm });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [deleting, setDeleting] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [coachingChapters, setCoachingChapters] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchStudents = async (pageNum) => {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/members/', { params: { role: 'student', page: pageNum } });
      const data = res.data;
      if (data.results) { setStudents(data.results); setHasMore(!!data.next); }
      else { setStudents(data); setHasMore(false); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStudents(page);
    if (isCoaching) {
      api.get('/api/subjects/').then(async (res) => {
        const subs = res.data.results || res.data;
        let allChapters = [];
        for (const s of subs) {
          try {
            const chRes = await api.get('/api/chapters/', { params: { subject: s.id } });
            allChapters = [...allChapters, ...(chRes.data.results || chRes.data).map(ch => ({ ...ch, subject_name: s.name }))];
          } catch {}
        }
        setCoachingChapters(allChapters);
      }).catch(() => {});
    }
  }, [page]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/auth/create-student/', formData);
      showMessage('Student created successfully!');
      setFormData({ ...initialForm }); setShowForm(false); setPage(1); fetchStudents(1);
    } catch (err) {
      const detail = err.response?.data;
      let msg = 'Failed to create student.';
      if (detail && typeof detail === 'object') { const k = Object.keys(detail)[0]; const v = detail[k]; msg = Array.isArray(v) ? v[0] : String(v); }
      showMessage(msg, 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/auth/members/${id}/`);
      showMessage('Student removed successfully!'); fetchStudents(page);
    } catch { showMessage('Failed to remove student.', 'error'); }
    finally { setDeleting(null); }
  };

  const handleEditClick = (student) => {
    setEditingId(student.id);
    setEditForm({ first_name: student.first_name || '', last_name: student.last_name || '', email: student.email || '', phone_number: student.phone_number || '', grade: student.grade || '', section: student.section || '' });
  };

  const handleEditSave = async () => {
    try {
      await api.patch(`/api/auth/members/${editingId}/update/`, editForm);
      showMessage('Student updated successfully!'); setEditingId(null); setEditForm({}); fetchStudents(page);
    } catch (err) {
      const detail = err.response?.data;
      let msg = 'Failed to update student.';
      if (detail && typeof detail === 'object') { const k = Object.keys(detail)[0]; const v = detail[k]; msg = Array.isArray(v) ? v[0] : String(v); }
      showMessage(msg, 'error');
    }
  };

  const filtered = students.filter(s => {
    const name = `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase();
    if (searchName && !name.includes(searchName.toLowerCase())) return false;
    if (filterGrade && s.grade !== filterGrade) return false;
    if (filterSection && s.section !== filterSection) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-10 right-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-violet-300 text-sm font-medium uppercase tracking-wider">School Admin</p>
                <h1 className="text-3xl font-bold text-white">Manage Students</h1>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold rounded-xl text-sm transition-all shadow-sm ${showForm ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white'}`}
            >
              {showForm ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Student</>
              )}
            </button>
          </div>

          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{students.length}</p>
              <p className="text-violet-200 text-xs mt-0.5">Students</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{filtered.length}</p>
              <p className="text-violet-200 text-xs mt-0.5">Showing</p>
            </div>
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

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className={`grid grid-cols-1 gap-3 ${isCoaching ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
            <input type="text" placeholder="Search by name…" value={searchName} onChange={e => setSearchName(e.target.value)} className={INPUT_CLS} />
            {isCoaching ? (
              <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className={INPUT_CLS}>
                <option value="">All Exam Types</option>
                {coachingChapters.map(ch => <option key={ch.id} value={ch.name}>{ch.name}</option>)}
              </select>
            ) : (
              <>
                <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className={INPUT_CLS}>
                  <option value="">All Classes</option>
                  {classRange.map(g => <option key={g} value={String(g)}>Class {g}</option>)}
                </select>
                <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className={INPUT_CLS}>
                  <option value="">All Sections</option>
                  {['A','B','C','D','E'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </>
            )}
            {(searchName || filterGrade || filterSection) && (
              <button onClick={() => { setSearchName(''); setFilterGrade(''); setFilterSection(''); }} className="text-sm text-indigo-600 font-semibold hover:underline self-center">Clear filters</button>
            )}
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-600 px-5 py-4">
              <p className="font-semibold text-white text-sm">Create New Student</p>
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
                <div>
                  <label className={LABEL_CLS}>Password *</label>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required className={INPUT_CLS + ' pr-10'} placeholder="Enter password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword
                        ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                        : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                </div>
                <div><label className={LABEL_CLS}>Phone Number</label><input name="phone_number" value={formData.phone_number} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={INPUT_CLS} placeholder="Enter phone number" /></div>
              </div>
              {isCoaching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Exam Type *</label>
                    <select name="grade" value={formData.grade} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required className={INPUT_CLS}>
                      <option value="">Select Exam Type</option>
                      {coachingChapters.map(ch => <option key={ch.id} value={ch.name}>{ch.name}</option>)}
                    </select>
                  </div>
                  <div><label className={LABEL_CLS}>Student ID</label><input name="student_id" value={formData.student_id} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={INPUT_CLS} placeholder="Enter student ID" /></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Class *</label>
                    <select name="grade" value={formData.grade} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required className={INPUT_CLS}>
                      <option value="">Select Class</option>
                      {classRange.map(g => <option key={g} value={String(g)}>Class {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Section *</label>
                    <select name="section" value={formData.section} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required className={INPUT_CLS}>
                      <option value="">Select Section</option>
                      {['A','B','C','D','E'].map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                  <div><label className={LABEL_CLS}>Student ID</label><input name="student_id" value={formData.student_id} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={INPUT_CLS} placeholder="Enter student ID" /></div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={LABEL_CLS}>Parent Phone</label><input name="parent_phone" value={formData.parent_phone} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} className={INPUT_CLS} placeholder="Enter parent phone" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-sm">
                  {submitting ? 'Creating…' : 'Create Student'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setFormData({...initialForm}); }} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Students Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No students yet</h3>
            <button onClick={() => setShowForm(true)} className="text-violet-600 font-medium text-sm hover:underline">Add your first student →</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No students match your filters.</p>
            <button onClick={() => { setSearchName(''); setFilterGrade(''); setFilterSection(''); }} className="text-indigo-600 font-medium text-sm hover:underline mt-1 inline-block">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-5 py-3 flex items-center justify-between">
                <p className="text-white font-semibold text-sm">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{isCoaching ? 'Exam Type' : 'Class'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                      {!isCoaching && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teachers</th>}
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((student, index) =>
                      editingId === student.id ? (
                        <tr key={student.id} className="bg-indigo-50/40">
                          <td className="px-4 py-2 text-gray-400">{index + 1}</td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1.5">
                              <input name="first_name" value={editForm.first_name} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} placeholder="First" className="w-20 px-2 py-1.5 border-2 border-gray-100 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                              <input name="last_name" value={editForm.last_name} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} placeholder="Last" className="w-20 px-2 py-1.5 border-2 border-gray-100 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-gray-400">@{student.username}</td>
                          <td className="px-4 py-2">
                            {isCoaching ? (
                              <select name="grade" value={editForm.grade} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className="w-28 px-2 py-1.5 border-2 border-gray-100 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                                <option value="">Select</option>
                                {coachingChapters.map(ch => <option key={ch.id} value={ch.name}>{ch.name}</option>)}
                              </select>
                            ) : (
                              <div className="flex gap-1">
                                <select name="grade" value={editForm.grade} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className="w-16 px-1 py-1.5 border-2 border-gray-100 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                                  <option value="">--</option>
                                  {classRange.map(g => <option key={g} value={String(g)}>{g}</option>)}
                                </select>
                                <select name="section" value={editForm.section} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className="w-14 px-1 py-1.5 border-2 border-gray-100 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                                  <option value="">--</option>
                                  {['A','B','C','D','E'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-400">{student.student_id || '-'}</td>
                          <td className="px-4 py-2">
                            <input name="email" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className="w-36 px-2 py-1.5 border-2 border-gray-100 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                          </td>
                          <td className="px-4 py-2">
                            <input name="phone_number" value={editForm.phone_number} onChange={e => setEditForm({...editForm, [e.target.name]: e.target.value})} className="w-28 px-2 py-1.5 border-2 border-gray-100 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                          </td>
                          {!isCoaching && (
                            <td className="px-4 py-2 text-gray-400">—</td>
                          )}
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={handleEditSave} className="px-3 py-1.5 rounded-lg text-indigo-600 text-xs font-semibold hover:bg-indigo-50 border-2 border-indigo-100 transition">Save</button>
                              <button onClick={() => { setEditingId(null); setEditForm({}); }} className="px-3 py-1.5 rounded-lg text-gray-500 text-xs font-semibold hover:bg-gray-50 border-2 border-gray-100 transition">Cancel</button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={student.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{student.first_name} {student.last_name}</td>
                          <td className="px-4 py-3 text-gray-500">@{student.username}</td>
                          <td className="px-4 py-3">
                            {student.grade
                              ? <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">{isCoaching ? student.grade : `${student.grade}${student.section || ''}`}</span>
                              : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{student.student_id || '-'}</td>
                          <td className="px-4 py-3 text-gray-500">{student.email || '-'}</td>
                          <td className="px-4 py-3 text-gray-500">{student.phone_number || '-'}</td>
                          {!isCoaching && (
                            <td className="px-4 py-3">
                              {student.assigned_teachers?.length > 0
                                ? <div className="flex flex-wrap gap-1">{student.assigned_teachers.map((at, i) => <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{at.teacher_name} · {at.subject_name}</span>)}</div>
                                : <span className="text-gray-400">-</span>}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleEditClick(student)} className="px-3 py-1.5 rounded-lg text-indigo-600 text-xs font-semibold hover:bg-indigo-50 border-2 border-indigo-100 transition">Edit</button>
                              <button onClick={() => handleDelete(student.id)} disabled={deleting === student.id} className="px-3 py-1.5 rounded-lg text-red-500 text-xs font-semibold hover:bg-red-50 border-2 border-gray-100 hover:border-red-100 transition disabled:opacity-50">
                                {deleting === student.id ? '…' : 'Remove'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-600 font-medium text-sm transition disabled:opacity-40">Previous</button>
              <span className="px-4 py-2 text-sm font-semibold text-violet-700 bg-violet-50 rounded-xl border-2 border-violet-100">Page {page}</span>
              <button onClick={() => setPage(page + 1)} disabled={!hasMore} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-600 font-medium text-sm transition disabled:opacity-40">Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
