import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const INPUT_CLS = 'w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';

export default function ManageAssignments() {
  const { user } = useAuth();
  const isCoaching = user?.org_type === 'coaching';
  const classFrom = user?.class_from || 1;
  const classTo = user?.class_to || 12;
  const classRange = Array.from({ length: classTo - classFrom + 1 }, (_, i) => classFrom + i);

  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, tRes, sRes, subRes] = await Promise.all([
        api.get('/api/assignments/'),
        api.get('/api/auth/members/', { params: { role: 'teacher' } }),
        api.get('/api/auth/members/', { params: { role: 'student' } }),
        api.get('/api/subjects/'),
      ]);
      setAssignments(aRes.data.results || aRes.data);
      setTeachers(tRes.data.results || tRes.data);
      setStudents(sRes.data.results || sRes.data);
      setSubjects(subRes.data.results || subRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAssignments = async () => {
    try { const res = await api.get('/api/assignments/'); setAssignments(res.data.results || res.data); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (isCoaching) setSelectedStudentIds(new Set(students.map(s => s.id)));
    else if (selectedGrade && selectedSection) {
      const matching = students.filter(s => s.grade === selectedGrade && s.section === selectedSection);
      setSelectedStudentIds(new Set(matching.map(s => s.id)));
    } else setSelectedStudentIds(new Set());
  }, [selectedGrade, selectedSection, students, isCoaching]);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const matchingStudents = isCoaching ? students : students.filter(s => selectedGrade && selectedSection && s.grade === selectedGrade && s.section === selectedSection);
  const allSelected = matchingStudents.length > 0 && matchingStudents.every(s => selectedStudentIds.has(s.id));
  const toggleAll = () => setSelectedStudentIds(allSelected ? new Set() : new Set(matchingStudents.map(s => s.id)));

  const resetForm = () => { setSelectedTeacher(''); setSelectedSubject(''); setSelectedGrade(''); setSelectedSection(''); setSelectedStudentIds(new Set()); };

  const selectTeacher = (tid) => {
    const id = String(tid);
    setSelectedTeacher(id);
    if (!isCoaching) { const t = teachers.find(t => String(t.id) === id); if (t) { setSelectedGrade(t.grade || ''); setSelectedSection(t.section || ''); } }
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSubject) { showMsg('Please select a teacher and subject.', 'error'); return; }
    if (!isCoaching && (!selectedGrade || !selectedSection)) { showMsg('Please select a class and section.', 'error'); return; }
    if (selectedStudentIds.size === 0) { showMsg('Please select at least one student.', 'error'); return; }
    setSubmitting(true);
    try {
      const payload = {
        teacher_id: parseInt(selectedTeacher, 10),
        subject_id: parseInt(selectedSubject, 10),
        student_ids: Array.from(selectedStudentIds),
        grade: isCoaching ? '-' : selectedGrade,
        section: isCoaching ? '-' : selectedSection,
      };
      await api.post('/api/assignments/create/', payload);
      showMsg(`Assignment created! ${selectedStudentIds.size} student(s) mapped.`);
      resetForm(); fetchAssignments();
    } catch (err) {
      const detail = err.response?.data;
      let msg = 'Failed to create assignment.';
      if (detail?.error) msg = detail.error;
      else if (detail && typeof detail === 'object') { const k = Object.keys(detail)[0]; const v = detail[k]; msg = Array.isArray(v) ? v[0] : String(v); }
      showMsg(msg, 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    setDeleting(id);
    try { await api.delete(`/api/assignments/${id}/`); showMsg('Assignment removed.'); fetchAssignments(); }
    catch { showMsg('Failed to remove.', 'error'); }
    finally { setDeleting(null); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  const selectedTeacherObj = teachers.find(t => String(t.id) === selectedTeacher);
  const selectedSubjectObj = subjects.find(s => String(s.id) === selectedSubject);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-10 right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium uppercase tracking-wider">School Admin</p>
              <h1 className="text-3xl font-bold text-white">Teacher Assignments</h1>
              <p className="text-indigo-200 text-sm mt-0.5">{isCoaching ? 'Select a teacher and subject to assign.' : 'Select a teacher, subject and class to assign.'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{assignments.length}</p>
              <p className="text-blue-200 text-xs mt-0.5">Assignments</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{teachers.length}</p>
              <p className="text-blue-200 text-xs mt-0.5">Teachers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{students.length}</p>
              <p className="text-blue-200 text-xs mt-0.5">Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {message.text && (
          <div className={`rounded-2xl p-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-emerald-800' : 'text-red-700'}`}>{message.text}</p>
          </div>
        )}

        {/* Two-column picker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Teachers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-4">
              <p className="font-semibold text-white text-sm">Teachers ({teachers.length}) — click to select</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {teachers.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">No teachers found.</div>
              ) : teachers.map(t => (
                <div key={t.id} onClick={() => selectTeacher(t.id)}
                  className={`px-5 py-3 flex items-center justify-between cursor-pointer border-b border-gray-50 transition ${String(t.id) === selectedTeacher ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-gray-50'}`}>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{t.first_name} {t.last_name}</p>
                    <p className="text-xs text-gray-400">{!isCoaching && <>Class {t.grade}{t.section} · </>}@{t.username}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.assigned_teachers?.length > 0
                        ? [...new Map(t.assigned_teachers.map(a => [a.subject_name, a])).values()].map((a, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{a.subject_name}</span>
                          ))
                        : <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">No subject</span>
                      }
                    </div>
                  </div>
                  {String(t.id) === selectedTeacher && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Students */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-fuchsia-600 px-5 py-4 flex items-center justify-between">
              <p className="font-semibold text-white text-sm">
                Students
                {isCoaching ? ` (All ${matchingStudents.length})` : (selectedGrade && selectedSection ? ` — Class ${selectedGrade}${selectedSection} (${matchingStudents.length})` : '')}
              </p>
              {matchingStudents.length > 0 && (
                <button type="button" onClick={toggleAll} className="text-xs text-white/80 hover:text-white font-medium transition">
                  {allSelected ? 'Deselect All' : 'Select All'} ({selectedStudentIds.size})
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!isCoaching && (!selectedGrade || !selectedSection) ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">Select a teacher to see students.</div>
              ) : matchingStudents.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  {isCoaching ? 'No students found.' : `No students in Class ${selectedGrade}${selectedSection}.`}
                </div>
              ) : matchingStudents.map(s => (
                <div key={s.id} onClick={() => toggleStudent(s.id)}
                  className={`px-5 py-3 flex items-center gap-3 cursor-pointer border-b border-gray-50 transition ${selectedStudentIds.has(s.id) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleStudent(s.id)} onClick={e => e.stopPropagation()} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-gray-400">@{s.username}{s.student_id && ` · ${s.student_id}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assign controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-4">
            <p className="font-semibold text-white text-sm">Create Assignment</p>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject *</label>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className={INPUT_CLS}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {!isCoaching && (
                <>
                  <div className="min-w-[130px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Class</label>
                    <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className={INPUT_CLS}>
                      <option value="">--</option>
                      {classRange.map(g => <option key={g} value={String(g)}>Class {g}</option>)}
                    </select>
                  </div>
                  <div className="min-w-[130px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Section</label>
                    <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className={INPUT_CLS}>
                      <option value="">--</option>
                      {['A','B','C','D','E'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-3 self-end">
                {(selectedTeacher || selectedSubject) && (
                  <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">Clear</button>
                )}
                <button
                  onClick={handleAssign}
                  disabled={submitting || !selectedTeacher || !selectedSubject || (!isCoaching && (!selectedGrade || !selectedSection)) || selectedStudentIds.size === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold transition-all disabled:opacity-40 shadow-sm"
                >
                  {submitting ? 'Assigning…' : `Assign (${selectedStudentIds.size} students)`}
                </button>
              </div>
            </div>

            {selectedTeacherObj && selectedSubjectObj && (isCoaching || (selectedGrade && selectedSection)) && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-gray-700">
                <span className="font-semibold text-indigo-700">{selectedTeacherObj.first_name} {selectedTeacherObj.last_name}</span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="font-semibold text-violet-700">{selectedSubjectObj.name}</span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="font-semibold">{isCoaching ? 'All Students' : `Class ${selectedGrade}${selectedSection}`}</span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="font-semibold text-purple-700">{selectedStudentIds.size} student(s)</span>
              </div>
            )}
          </div>
        </div>

        {/* Existing Assignments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-5 py-4">
            <p className="font-semibold text-white text-sm">Existing Assignments ({assignments.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{isCoaching ? 'Scope' : 'Class'}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No assignments yet.</td></tr>
                ) : assignments.map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.teacher_name}</td>
                    <td className="px-4 py-3"><span className="text-indigo-600 font-medium">{a.subject_name}</span></td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">{a.grade_display || `Class ${a.grade}${a.section}`}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.student_count}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id}
                        className="px-3 py-1.5 rounded-lg text-red-500 text-xs font-semibold hover:bg-red-50 border-2 border-gray-100 hover:border-red-100 transition disabled:opacity-50">
                        {deleting === a.id ? '…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
