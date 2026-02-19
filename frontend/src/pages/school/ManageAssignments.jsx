import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form state
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/api/assignments/');
      setAssignments(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Auto-select students when grade+section change
  useEffect(() => {
    if (selectedGrade && selectedSection) {
      const matching = students.filter(
        (s) => s.grade === selectedGrade && s.section === selectedSection
      );
      setSelectedStudentIds(new Set(matching.map((s) => s.id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  }, [selectedGrade, selectedSection, students]);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const matchingStudents = students.filter(
    (s) => selectedGrade && selectedSection && s.grade === selectedGrade && s.section === selectedSection
  );

  const allSelected = matchingStudents.length > 0 && matchingStudents.every((s) => selectedStudentIds.has(s.id));

  const toggleAll = () => {
    if (allSelected) setSelectedStudentIds(new Set());
    else setSelectedStudentIds(new Set(matchingStudents.map((s) => s.id)));
  };

  const resetForm = () => {
    setSelectedTeacher('');
    setSelectedSubject('');
    setSelectedGrade('');
    setSelectedSection('');
    setSelectedStudentIds(new Set());
  };

  const selectTeacher = (tid) => {
    const id = String(tid);
    setSelectedTeacher(id);
    const t = teachers.find((t) => String(t.id) === id);
    if (t) {
      setSelectedGrade(t.grade || '');
      setSelectedSection(t.section || '');
    }
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSubject || !selectedGrade || !selectedSection) {
      showMsg('Please select a teacher, subject, class and section.', 'error');
      return;
    }
    if (selectedStudentIds.size === 0) {
      showMsg('Please select at least one student.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/assignments/create/', {
        teacher_id: parseInt(selectedTeacher, 10),
        subject_id: parseInt(selectedSubject, 10),
        grade: selectedGrade,
        section: selectedSection,
      });
      showMsg(`Assignment created! ${selectedStudentIds.size} student(s) mapped.`);
      resetForm();
      fetchAssignments();
    } catch (err) {
      const detail = err.response?.data;
      let errorMsg = 'Failed to create assignment.';
      if (detail?.error) errorMsg = detail.error;
      else if (detail && typeof detail === 'object') {
        const firstKey = Object.keys(detail)[0];
        const val = detail[firstKey];
        errorMsg = Array.isArray(val) ? val[0] : String(val);
      }
      showMsg(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/assignments/${id}/`);
      showMsg('Assignment removed.');
      fetchAssignments();
    } catch {
      showMsg('Failed to remove.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/school/dashboard" className="hover:text-indigo-200 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Teacher Assignments</h1>
        </div>
        <p className="text-indigo-100">Select a teacher, then pick subject and class to assign.</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`px-4 py-3 rounded-lg mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* ── Two-column: Teachers list | Students list ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* LEFT: Teachers List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Teachers ({teachers.length})</h2>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {teachers.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No teachers found.</div>
            ) : (
              teachers.map((t) => (
                <div
                  key={t.id}
                  onClick={() => selectTeacher(t.id)}
                  className={`px-5 py-3 flex items-center justify-between cursor-pointer border-b border-gray-50 transition ${
                    String(t.id) === selectedTeacher
                      ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{t.first_name} {t.last_name}</p>
                    <p className="text-xs text-gray-400">
                      Class {t.grade}{t.section} &middot; @{t.username}
                    </p>
                  </div>
                  {String(t.id) === selectedTeacher && (
                    <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Students
              {selectedGrade && selectedSection && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  Class {selectedGrade}{selectedSection} ({matchingStudents.length})
                </span>
              )}
            </h2>
            {matchingStudents.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {allSelected ? 'Deselect All' : 'Select All'} ({selectedStudentIds.size})
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!selectedGrade || !selectedSection ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Select a teacher to see students.</div>
            ) : matchingStudents.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No students in Class {selectedGrade}{selectedSection}.
              </div>
            ) : (
              matchingStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`px-5 py-3 flex items-center gap-3 cursor-pointer border-b border-gray-50 transition ${
                    selectedStudentIds.has(s.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.has(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                  />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-gray-400">@{s.username} {s.student_id && `· ${s.student_id}`}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Subject + Assign bar ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            >
              <option value="">--</option>
              {[1,2,3,4,5,6,7,8,9,10].map((g) => (
                <option key={g} value={String(g)}>Class {g}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            >
              <option value="">--</option>
              {['A','B','C','D','E'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            {(selectedTeacher || selectedSubject) && (
              <button type="button" onClick={resetForm} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium">
                Clear
              </button>
            )}
            <button
              onClick={handleAssign}
              disabled={submitting || !selectedTeacher || !selectedSubject || !selectedGrade || !selectedSection || selectedStudentIds.size === 0}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-40"
            >
              {submitting ? 'Assigning...' : `Assign (${selectedStudentIds.size})`}
            </button>
          </div>
        </div>
        {selectedTeacher && selectedSubject && selectedGrade && selectedSection && (
          <p className="text-xs text-gray-500 mt-3">
            <span className="font-medium text-gray-700">{teachers.find(t => String(t.id) === selectedTeacher)?.first_name} {teachers.find(t => String(t.id) === selectedTeacher)?.last_name}</span>
            {' → '}<span className="font-medium text-indigo-600">{subjects.find(s => String(s.id) === selectedSubject)?.name}</span>
            {' → '}<span className="font-medium text-gray-700">Class {selectedGrade}{selectedSection}</span>
            {' → '}<span className="font-medium text-purple-600">{selectedStudentIds.size} student(s)</span>
          </p>
        )}
      </div>

      {/* ── Existing Assignments Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Existing Assignments ({assignments.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Teacher</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Students</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No assignments yet.</td>
                </tr>
              ) : assignments.map((a, i) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{a.teacher_name}</td>
                  <td className="px-4 py-3 text-indigo-600 font-medium">{a.subject_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                      {a.grade_display || `Class ${a.grade}${a.section}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.student_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deleting === a.id}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      {deleting === a.id ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
