import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getCategoriesForBoard } from '../../utils/examCategories';

const inputCls = 'w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50 text-sm text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition';
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5';

function SectionCard({ icon, title, children, accent = 'indigo' }) {
  const gradients = {
    indigo: 'from-indigo-500 to-violet-600',
    blue:   'from-blue-500 to-indigo-600',
    emerald:'from-emerald-500 to-teal-600',
    amber:  'from-amber-500 to-orange-600',
    violet: 'from-violet-500 to-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradients[accent]} flex items-center justify-center text-white shrink-0`}>
          {icon}
        </div>
        <h2 className="font-bold text-gray-800">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function CreateExam() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const isEditMode = !!examId;
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectionMode, setSelectionMode] = useState('random');
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionFilters, setQuestionFilters] = useState({ chapter: '', question_type: '', difficulty: '' });
  const [form, setForm] = useState({
    title: '', subject: '', chapter_ids: [], duration_minutes: 90, total_marks: 50,
    num_mcq: 20, num_short: 5, num_long: 4, student_ids: [], exam_category: '',
    start_time: '', end_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCoaching, setIsCoaching] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [existingExams, setExistingExams] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateQuestions, setTemplateQuestions] = useState([]);
  const [templateMode, setTemplateMode] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const profileRes = await api.get('/api/auth/profile/');
        const role = profileRes.data.role;
        const orgType = profileRes.data.org_type;
        setUserRole(role);
        setIsCoaching(orgType === 'coaching');
        if (orgType === 'coaching') setForm(prev => ({ ...prev, num_short: 0, num_long: 0 }));
        if (role === 'school') {
          const res = await api.get('/api/subjects/');
          const subs = res.data.results || res.data;
          setAssignments(subs.map(s => ({ subject: s.id, subject_name: s.name })));
        } else {
          const res = await api.get('/api/assignments/my/');
          setAssignments(res.data.results || res.data);
        }
        const examRes = await api.get('/api/exams/assigned/');
        setExistingExams(examRes.data.results || examRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setInitLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchExam = async () => {
      try {
        const res = await api.get(`/api/exams/assigned/${examId}/`);
        const d = res.data;
        const fmtDt = (s) => s ? s.substring(0, 16) : '';
        setForm({
          title: d.title, subject: String(d.subject), chapter_ids: d.chapter_ids || [],
          duration_minutes: d.duration_minutes, total_marks: d.total_marks,
          num_mcq: d.num_mcq, num_short: d.num_short, num_long: d.num_long,
          student_ids: d.student_ids || [], exam_category: d.exam_category || '',
          start_time: fmtDt(d.start_time), end_time: fmtDt(d.end_time),
        });
        setSelectionMode(d.selection_mode || 'random');
        if (d.question_ids && d.question_ids.length > 0) setSelectedQuestionIds(d.question_ids);
      } catch (err) {
        console.error('Failed to load exam for editing', err);
      }
    };
    fetchExam();
  }, [examId, isEditMode]);

  useEffect(() => {
    if (!form.subject) {
      setChapters([]); setStudents([]); setSelectedAssignment('');
      setForm((prev) => ({ ...prev, chapter_ids: [], student_ids: [] }));
      setAvailableQuestions([]); setSelectedQuestionIds([]);
      return;
    }
    api.get('/api/chapters/', { params: { subject: form.subject } }).then((res) => {
      setChapters(res.data.results || res.data);
      setForm((prev) => ({ ...prev, chapter_ids: [] }));
    }).catch(() => {});

    if (userRole === 'school') {
      api.get('/api/auth/members/', { params: { role: 'student' } }).then((res) => {
        const data = res.data.results || res.data;
        setStudents(data);
        setForm((prev) => ({ ...prev, student_ids: data.map((s) => s.id) }));
      }).catch(() => {});
    } else {
      const matching = assignments.filter((a) => String(a.subject) === String(form.subject));
      if (matching.length === 1) {
        const assignment = matching[0];
        setSelectedAssignment(String(assignment.id));
        api.get('/api/auth/my-students/', {
          params: { subject: assignment.subject, grade: assignment.grade, section: assignment.section },
        }).then((res) => {
          const data = res.data.results || res.data;
          setStudents(data);
          setForm((prev) => ({ ...prev, student_ids: data.map((s) => s.id) }));
        }).catch(() => {});
      } else {
        setSelectedAssignment(''); setStudents([]);
        setForm((prev) => ({ ...prev, student_ids: [] }));
      }
    }
    setSelectedQuestionIds([]);
    setQuestionFilters({ chapter: '', question_type: '', difficulty: '' });
  }, [form.subject, assignments, userRole]);

  useEffect(() => {
    if (selectionMode !== 'manual' || !form.subject) { setAvailableQuestions([]); return; }
    const fetchQuestions = async () => {
      setQuestionsLoading(true);
      try {
        const params = { subject: form.subject };
        if (questionFilters.chapter) params.chapter = questionFilters.chapter;
        if (questionFilters.question_type) params.question_type = questionFilters.question_type;
        if (questionFilters.difficulty) params.difficulty = questionFilters.difficulty;
        const res = await api.get('/api/questions/', { params });
        setAvailableQuestions(res.data.results || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, [selectionMode, form.subject, questionFilters]);

  useEffect(() => {
    if (!selectedAssignment) { setStudents([]); setForm((prev) => ({ ...prev, student_ids: [] })); return; }
    const assignment = assignments.find((a) => String(a.id) === String(selectedAssignment));
    if (!assignment) return;
    api.get('/api/auth/my-students/', {
      params: { subject: assignment.subject, grade: assignment.grade, section: assignment.section },
    }).then((res) => {
      const data = res.data.results || res.data;
      setStudents(data);
      setForm((prev) => ({ ...prev, student_ids: data.map((s) => s.id) }));
    }).catch(() => {});
  }, [selectedAssignment, assignments]);

  const subjectMap = {};
  assignments.forEach((a) => { subjectMap[a.subject] = a.subject_name; });
  const subjects = Object.entries(subjectMap).map(([id, name]) => ({ id, name }));
  const subjectAssignments = assignments.filter((a) => String(a.subject) === String(form.subject));

  const handleLoadTemplate = async (examId) => {
    if (!examId) { setTemplateQuestions([]); setTemplateMode(''); return; }
    setTemplateLoading(true);
    try {
      const res = await api.get(`/api/exams/assigned/${examId}/`);
      const d = res.data;
      setForm({
        title: d.title + ' (Copy)', subject: String(d.subject), chapter_ids: d.chapter_ids || [],
        duration_minutes: d.duration_minutes, total_marks: d.total_marks,
        num_mcq: d.num_mcq, num_short: d.num_short, num_long: d.num_long,
        student_ids: d.student_ids || [], exam_category: d.exam_category || '',
        start_time: '', end_time: '',
      });
      setSelectionMode(d.selection_mode || 'random');
      setTemplateMode(d.selection_mode || 'random');
      if (d.question_ids && d.question_ids.length > 0) setSelectedQuestionIds(d.question_ids);
      setTemplateQuestions(d.questions || []);
    } catch (err) {
      console.error('Failed to load template', err);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleChapter = (chapterId) => {
    setForm((prev) => {
      const ids = prev.chapter_ids.includes(chapterId)
        ? prev.chapter_ids.filter((id) => id !== chapterId)
        : [...prev.chapter_ids, chapterId];
      return { ...prev, chapter_ids: ids };
    });
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const toggleStudent = (studentId) => {
    setForm((prev) => {
      const ids = prev.student_ids.includes(studentId)
        ? prev.student_ids.filter((id) => id !== studentId)
        : [...prev.student_ids, studentId];
      return { ...prev, student_ids: ids };
    });
  };

  const toggleAllStudents = () => {
    setForm((prev) => ({
      ...prev,
      student_ids: prev.student_ids.length === students.length ? [] : students.map((s) => s.id),
    }));
  };

  const selectedQuestions = availableQuestions.filter((q) => selectedQuestionIds.includes(q.id));
  const selectedMcqCount   = selectedQuestions.filter((q) => q.question_type === 'MCQ').length;
  const selectedShortCount = selectedQuestions.filter((q) => q.question_type === 'SHORT').length;
  const selectedLongCount  = selectedQuestions.filter((q) => q.question_type === 'LONG').length;
  const selectedTotalMarks = selectedMcqCount * 1 + selectedShortCount * 2 + selectedLongCount * 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = {
        title: form.title, subject: form.subject, chapter_ids: form.chapter_ids,
        duration_minutes: parseInt(form.duration_minutes, 10),
        total_marks: selectionMode === 'manual' ? selectedTotalMarks : parseInt(form.total_marks, 10),
        student_ids: form.student_ids, exam_category: form.exam_category,
        start_time: form.start_time, end_time: form.end_time, selection_mode: selectionMode,
      };
      if (selectionMode === 'manual') {
        payload.question_ids = selectedQuestionIds;
        payload.num_mcq = selectedMcqCount;
        payload.num_short = selectedShortCount;
        payload.num_long = selectedLongCount;
      } else {
        payload.num_mcq = parseInt(form.num_mcq, 10);
        payload.num_short = parseInt(form.num_short, 10);
        payload.num_long = parseInt(form.num_long, 10);
      }
      if (isEditMode) {
        await api.patch(`/api/exams/assigned/${examId}/`, payload);
      } else {
        await api.post('/api/exams/assigned/create/', payload);
      }
      navigate('/teacher/results');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const typeCls = { MCQ: 'bg-blue-100 text-blue-700', SHORT: 'bg-emerald-100 text-emerald-700', LONG: 'bg-violet-100 text-violet-700' };
  const diffCls = { EASY: 'bg-emerald-100 text-emerald-700', MEDIUM: 'bg-amber-100 text-amber-700', HARD: 'bg-red-100 text-red-700' };

  if (initLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <img
          src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Teacher Portal</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <h1 className="text-3xl font-extrabold text-white">
              {isEditMode ? 'Update Exam Details' : 'New Exam Setup'}
            </h1>
            <Link
              to={isEditMode ? '/teacher/results' : '/teacher/dashboard'}
              className="hidden sm:inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition shrink-0"
            >
              Back
            </Link>
          </div>
          <p className="text-indigo-200 text-sm mb-6">
            {isEditMode ? 'Modify the exam settings and save changes.' : 'Configure a new exam and assign it to students.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]">
              <p className="text-xl font-extrabold text-white">{isEditMode ? 'Edit' : 'New'}</p>
              <p className="text-white/50 text-xs">Mode</p>
            </div>
            {assignments.length > 0 && (
              <div className="bg-indigo-500/30 border border-indigo-400/40 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]">
                <p className="text-xl font-extrabold text-indigo-200">{assignments.length}</p>
                <p className="text-white/50 text-xs">Subjects</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6 items-start">

      {/* ── LEFT: form (2/3) ── */}
      <div className="lg:col-span-2 space-y-5">

        {/* Alerts */}
        {assignments.length === 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4">
            <span className="text-amber-500 text-xl shrink-0">⚠️</span>
            <p className="text-amber-800 text-sm font-medium">
              You have no subject assignments yet. Ask your school admin to assign you to a subject with students before creating exams.
            </p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4">
            <span className="text-red-500 text-xl shrink-0">❌</span>
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Template Picker */}
        {!isEditMode && existingExams.length > 0 && (
          <SectionCard accent="amber" title="Copy from Existing Exam" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }>
            <div className="flex gap-3 items-center">
              <select
                onChange={(e) => handleLoadTemplate(e.target.value)}
                defaultValue=""
                className={inputCls + ' flex-1'}
              >
                <option value="">— Select an existing exam to use as template —</option>
                {existingExams.map((e) => (
                  <option key={e.id} value={e.id}>{e.title} ({e.subject_name})</option>
                ))}
              </select>
              {templateLoading && (
                <div className="w-5 h-5 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-400">
              Selecting an exam pre-fills the form below. You can edit before saving as a new exam.
            </p>

            {templateQuestions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Questions in template ({templateQuestions.length})
                </p>
                <div className="border-2 border-gray-100 rounded-xl bg-gray-50 max-h-56 overflow-y-auto divide-y divide-gray-100">
                  {templateQuestions.map((q, idx) => (
                    <div key={q.id} className="flex items-start gap-3 px-3 py-2.5">
                      <span className="text-xs text-gray-400 mt-0.5 shrink-0 w-5">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-2">{q.question_text}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeCls[q.question_type] || 'bg-gray-100 text-gray-600'}`}>
                            {q.question_type}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diffCls[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                            {q.difficulty}
                          </span>
                          {q.chapter_name && <span className="text-xs text-gray-400">{q.chapter_name}</span>}
                          <span className="text-xs text-gray-400 ml-auto">{q.marks} mark(s)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {templateMode === 'random' && templateQuestions.length === 0 && form.subject && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                Random-selection exam — questions picked automatically. Distribution: {form.num_mcq} MCQ, {form.num_short} Short, {form.num_long} Long.
              </p>
            )}
          </SectionCard>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic Info */}
          <SectionCard accent="indigo" title="Basic Information" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }>
            <div>
              <label className={labelCls}>Exam Title</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="e.g. Unit Test — Chapter 3 & 4"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Subject</label>
                <select name="subject" value={form.subject} onChange={handleChange} required className={inputCls}>
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {subjects.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No subjects assigned. Contact your school admin.</p>
                )}
              </div>

              {userRole !== 'school' && form.subject && subjectAssignments.length > 0 && (
                <div>
                  <label className={labelCls}>Class &amp; Section</label>
                  <select
                    value={selectedAssignment}
                    onChange={(e) => setSelectedAssignment(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select Class/Section</option>
                    {subjectAssignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.grade_display || `Class ${a.grade}${a.section}`} ({a.student_count} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Chapters */}
          <SectionCard accent="blue" title="Chapters" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }>
            {!form.subject ? (
              <p className="text-sm text-gray-400">Select a subject first</p>
            ) : chapters.length === 0 ? (
              <p className="text-sm text-gray-400">No chapters found for this subject</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {chapters.map((ch) => {
                  const selected = form.chapter_ids.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChapter(ch.id)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {selected && <span className="mr-1">✓</span>}{ch.name}
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Selection Mode */}
          {form.subject && (
            <SectionCard accent="violet" title="Question Selection Mode" icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'random', label: 'Random (Auto)', desc: 'Questions picked automatically from bank', icon: '🎲' },
                  { value: 'manual', label: 'Manual Select', desc: 'Hand-pick specific questions', icon: '✋' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectionMode(opt.value)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition ${
                      selectionMode === opt.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-100 bg-white hover:border-violet-200'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-bold text-sm text-gray-800">{opt.label}</span>
                    <span className="text-xs text-gray-400">{opt.desc}</span>
                    {selectionMode === opt.value && (
                      <span className="mt-1 text-xs font-bold text-violet-600">✓ Selected</span>
                    )}
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Random mode fields */}
          {selectionMode === 'random' && (
            <SectionCard accent="emerald" title="Exam Settings" icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Duration (minutes)</label>
                  <input type="number" name="duration_minutes" value={form.duration_minutes}
                    onChange={handleChange} min="1" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Total Marks</label>
                  <input type="number" name="total_marks" value={form.total_marks}
                    onChange={handleChange} min="1" required className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Question Distribution</label>
                <div className={`grid gap-4 ${isCoaching ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-3">
                    <label className="block text-xs font-bold text-blue-600 mb-1.5">MCQ <span className="font-normal text-blue-400">(1 mark)</span></label>
                    <input type="number" name="num_mcq" value={form.num_mcq}
                      onChange={handleChange} min="0"
                      className="w-full px-3 py-2 border-2 border-blue-100 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                  </div>
                  {!isCoaching && (
                    <>
                      <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-3">
                        <label className="block text-xs font-bold text-emerald-600 mb-1.5">Short Answer <span className="font-normal text-emerald-400">(2 marks)</span></label>
                        <input type="number" name="num_short" value={form.num_short}
                          onChange={handleChange} min="0"
                          className="w-full px-3 py-2 border-2 border-emerald-100 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
                      </div>
                      <div className="bg-violet-50 border-2 border-violet-100 rounded-xl p-3">
                        <label className="block text-xs font-bold text-violet-600 mb-1.5">Long Answer <span className="font-normal text-violet-400">(5 marks)</span></label>
                        <input type="number" name="num_long" value={form.num_long}
                          onChange={handleChange} min="0"
                          className="w-full px-3 py-2 border-2 border-violet-100 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition" />
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                  <span>Questions: <strong className="text-gray-700">{parseInt(form.num_mcq||0)+parseInt(form.num_short||0)+parseInt(form.num_long||0)}</strong></span>
                  <span>Calc marks: <strong className="text-gray-700">{parseInt(form.num_mcq||0)*1+parseInt(form.num_short||0)*2+parseInt(form.num_long||0)*5}</strong></span>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Manual mode fields */}
          {selectionMode === 'manual' && form.subject && (
            <SectionCard accent="blue" title="Select Questions" icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }>
              <div>
                <label className={labelCls}>Duration (minutes)</label>
                <input type="number" name="duration_minutes" value={form.duration_minutes}
                  onChange={handleChange} min="1" required className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Filter Questions</label>
                <div className="grid grid-cols-3 gap-3">
                  <select value={questionFilters.chapter}
                    onChange={(e) => setQuestionFilters((prev) => ({ ...prev, chapter: e.target.value }))}
                    className={inputCls}>
                    <option value="">All Chapters</option>
                    {chapters.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                  </select>
                  <select value={questionFilters.question_type}
                    onChange={(e) => setQuestionFilters((prev) => ({ ...prev, question_type: e.target.value }))}
                    className={inputCls}>
                    <option value="">All Types</option>
                    <option value="MCQ">MCQ</option>
                    <option value="SHORT">Short Answer</option>
                    <option value="LONG">Long Answer</option>
                  </select>
                  <select value={questionFilters.difficulty}
                    onChange={(e) => setQuestionFilters((prev) => ({ ...prev, difficulty: e.target.value }))}
                    className={inputCls}>
                    <option value="">All Difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={labelCls + ' mb-0'}>Available Questions ({availableQuestions.length})</label>
                  {selectedQuestionIds.length > 0 && (
                    <button type="button" onClick={() => setSelectedQuestionIds([])}
                      className="text-xs font-bold text-red-500 hover:text-red-700 transition">
                      Clear Selection
                    </button>
                  )}
                </div>

                {questionsLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                  </div>
                ) : availableQuestions.length === 0 ? (
                  <div className="border-2 border-gray-100 rounded-xl p-8 text-center">
                    <p className="text-sm text-gray-400">No questions found. Try adjusting filters or generate questions first.</p>
                  </div>
                ) : (
                  <div className="border-2 border-gray-100 rounded-xl max-h-96 overflow-y-auto divide-y divide-gray-50">
                    {availableQuestions.map((q) => (
                      <label key={q.id}
                        className={`flex items-start gap-3 p-3 cursor-pointer transition ${
                          selectedQuestionIds.includes(q.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input type="checkbox" checked={selectedQuestionIds.includes(q.id)}
                          onChange={() => toggleQuestion(q.id)}
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {q.question_text.length > 150 ? q.question_text.substring(0, 150) + '…' : q.question_text}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeCls[q.question_type] || 'bg-gray-100 text-gray-600'}`}>
                              {q.question_type}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diffCls[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                              {q.difficulty}
                            </span>
                            {q.chapter_name && <span className="text-xs text-gray-400">{q.chapter_name}</span>}
                            <span className="text-xs text-gray-400 ml-auto">
                              {q.question_type === 'MCQ' ? 1 : q.question_type === 'SHORT' ? 2 : 5} mark(s)
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {selectedQuestionIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3 p-3 bg-indigo-50 border-2 border-indigo-100 rounded-xl">
                    <span className="text-xs font-bold text-indigo-800">Selected: {selectedQuestionIds.length}</span>
                    <span className="text-xs text-indigo-600">MCQ: {selectedMcqCount}</span>
                    <span className="text-xs text-indigo-600">Short: {selectedShortCount}</span>
                    <span className="text-xs text-indigo-600">Long: {selectedLongCount}</span>
                    <span className="text-xs font-bold text-indigo-800 ml-auto">Total Marks: {selectedTotalMarks}</span>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Exam Category + Schedule */}
          <SectionCard accent="emerald" title="Schedule & Category" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Time</label>
                <input type="datetime-local" name="start_time" value={form.start_time}
                  onChange={handleChange} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <input type="datetime-local" name="end_time" value={form.end_time}
                  onChange={handleChange} required className={inputCls} />
              </div>
            </div>

            {getCategoriesForBoard(user?.board).length > 0 && (
              <div>
                <label className={labelCls}>
                  Exam Category <span className="normal-case font-normal text-gray-400">(for Progress Card)</span>
                </label>
                <select name="exam_category" value={form.exam_category} onChange={handleChange} className={inputCls}>
                  <option value="">— None / Not categorised —</option>
                  {getCategoriesForBoard(user?.board).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </SectionCard>

          {/* Students */}
          <SectionCard accent="violet" title="Assign to Students" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">
                {form.student_ids.length > 0
                  ? `${form.student_ids.length} student(s) selected`
                  : 'No students selected'}
              </p>
              {students.length > 0 && (
                <button type="button" onClick={toggleAllStudents}
                  className="text-xs font-bold text-violet-600 hover:text-violet-800 transition">
                  {form.student_ids.length === students.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {!form.subject ? (
              <p className="text-sm text-gray-400">Select a subject to see students</p>
            ) : (userRole !== 'school' && !selectedAssignment) ? (
              <p className="text-sm text-gray-400">Select a class/section to load students</p>
            ) : students.length === 0 ? (
              <p className="text-sm text-gray-400">No students found</p>
            ) : (
              <div className="border-2 border-gray-100 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-50">
                {students.map((stu) => {
                  const name = stu.name || (stu.first_name && stu.last_name ? `${stu.first_name} ${stu.last_name}` : stu.username);
                  const checked = form.student_ids.includes(stu.id);
                  return (
                    <label key={stu.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition ${checked ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleStudent(stu.id)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600
                                      flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{name}</span>
                      <span className="text-xs text-gray-400 ml-auto">@{stu.username}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (selectionMode === 'manual' && selectedQuestionIds.length === 0)}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-2xl
                       font-bold text-sm hover:from-indigo-700 hover:to-violet-700 transition shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {isEditMode ? 'Updating Exam…' : 'Creating Exam…'}
              </span>
            ) : (
              isEditMode ? '💾 Update Exam' : '🚀 Create Exam'
            )}
          </button>
        </form>
      </div>{/* end left col */}

      {/* ── RIGHT: sticky summary sidebar (1/3) ── */}
      <div className="sticky top-20 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-slate-800 to-indigo-900">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-bold text-white text-sm">Exam Summary</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Title',     value: form.title || '—',                          icon: '📝' },
              { label: 'Subject',   value: subjects.find(s => String(s.id) === String(form.subject))?.name || '—', icon: '📚' },
              { label: 'Duration',  value: form.duration_minutes ? `${form.duration_minutes} min` : '—', icon: '⏱' },
              { label: 'Mode',      value: selectionMode === 'manual' ? 'Manual Pick' : 'Random (Auto)', icon: '🎲' },
              { label: 'Students',  value: form.student_ids.length > 0 ? `${form.student_ids.length} selected` : '—', icon: '👥' },
              { label: 'Chapters',  value: form.chapter_ids.length > 0 ? `${form.chapter_ids.length} selected` : '—', icon: '📖' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3">
                <span className="text-base w-6 text-center shrink-0">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
                </div>
              </div>
            ))}

            {selectionMode === 'random' && (
              <div className="px-5 py-3">
                <p className="text-xs text-gray-400 font-medium mb-2">Questions</p>
                <div className="flex gap-2">
                  {[
                    { label: 'MCQ',   value: form.num_mcq   || 0, cls: 'bg-blue-50 text-blue-700 border-blue-100'    },
                    { label: 'Short', value: form.num_short || 0, cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                    { label: 'Long',  value: form.num_long  || 0, cls: 'bg-violet-50 text-violet-700 border-violet-100'   },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className={`flex-1 text-center rounded-xl border px-2 py-2 ${cls}`}>
                      <p className="text-sm font-extrabold">{value}</p>
                      <p className="text-xs font-medium">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Total marks: <strong className="text-gray-700">{form.total_marks || '—'}</strong>
                </p>
              </div>
            )}

            {selectionMode === 'manual' && selectedQuestionIds.length > 0 && (
              <div className="px-5 py-3">
                <p className="text-xs text-gray-400 font-medium mb-2">Selected Questions</p>
                <div className="flex gap-2">
                  {[
                    { label: 'MCQ',   value: selectedMcqCount,   cls: 'bg-blue-50 text-blue-700 border-blue-100'    },
                    { label: 'Short', value: selectedShortCount, cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                    { label: 'Long',  value: selectedLongCount,  cls: 'bg-violet-50 text-violet-700 border-violet-100'   },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className={`flex-1 text-center rounded-xl border px-2 py-2 ${cls}`}>
                      <p className="text-sm font-extrabold">{value}</p>
                      <p className="text-xs font-medium">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Total marks: <strong className="text-gray-700">{selectedTotalMarks}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tips card */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-indigo-700 mb-2">💡 Tips</p>
          <ul className="space-y-1.5 text-xs text-indigo-600">
            <li>• Select chapters to scope questions to specific topics</li>
            <li>• Use Manual mode to hand-pick exam questions</li>
            <li>• Set start &amp; end time to control exam availability</li>
            <li>• Assign an exam category for the progress card report</li>
          </ul>
        </div>
      </div>{/* end right sidebar */}

      </div>{/* end grid */}
      </div>{/* end max-w wrapper */}
    </div>
  );
}
