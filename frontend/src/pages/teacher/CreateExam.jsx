import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getCategoriesForBoard } from '../../utils/examCategories';

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
  const [questionFilters, setQuestionFilters] = useState({
    chapter: '',
    question_type: '',
    difficulty: '',
  });
  const [form, setForm] = useState({
    title: '',
    subject: '',
    chapter_ids: [],
    duration_minutes: 90,
    total_marks: 50,
    num_mcq: 20,
    num_short: 5,
    num_long: 4,
    student_ids: [],
    exam_category: '',
    start_time: '',
    end_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCoaching, setIsCoaching] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [existingExams, setExistingExams] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateQuestions, setTemplateQuestions] = useState([]);
  const [templateMode, setTemplateMode] = useState('');  // 'random' or 'manual'

  // Fetch subjects - from assignments for teachers, from subjects API for school admins
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const profileRes = await api.get('/api/auth/profile/');
        const role = profileRes.data.role;
        const orgType = profileRes.data.org_type;
        setUserRole(role);
        setIsCoaching(orgType === 'coaching');
        if (orgType === 'coaching') {
          setForm(prev => ({ ...prev, num_short: 0, num_long: 0 }));
        }
        if (role === 'school') {
          const res = await api.get('/api/subjects/');
          const subs = res.data.results || res.data;
          setAssignments(subs.map(s => ({ subject: s.id, subject_name: s.name })));
        } else {
          const res = await api.get('/api/assignments/my/');
          setAssignments(res.data.results || res.data);
        }
        // Fetch existing exams for template picker
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

  // In edit mode, fetch exam details and pre-fill form
  useEffect(() => {
    if (!isEditMode) return;
    const fetchExam = async () => {
      try {
        const res = await api.get(`/api/exams/assigned/${examId}/`);
        const d = res.data;
        // Format datetimes for datetime-local input (strip timezone offset)
        const fmtDt = (s) => s ? s.substring(0, 16) : '';
        setForm({
          title: d.title,
          subject: String(d.subject),
          chapter_ids: d.chapter_ids || [],
          duration_minutes: d.duration_minutes,
          total_marks: d.total_marks,
          num_mcq: d.num_mcq,
          num_short: d.num_short,
          num_long: d.num_long,
          student_ids: d.student_ids || [],
          exam_category: d.exam_category || '',
          start_time: fmtDt(d.start_time),
          end_time: fmtDt(d.end_time),
        });
        setSelectionMode(d.selection_mode || 'random');
        if (d.question_ids && d.question_ids.length > 0) {
          setSelectedQuestionIds(d.question_ids);
        }
      } catch (err) {
        console.error('Failed to load exam for editing', err);
      }
    };
    fetchExam();
  }, [examId, isEditMode]);

  // When subject changes, fetch chapters and students
  useEffect(() => {
    if (!form.subject) {
      setChapters([]);
      setStudents([]);
      setSelectedAssignment('');
      setForm((prev) => ({ ...prev, chapter_ids: [], student_ids: [] }));
      setAvailableQuestions([]);
      setSelectedQuestionIds([]);
      return;
    }

    api.get('/api/chapters/', { params: { subject: form.subject } }).then((res) => {
      setChapters(res.data.results || res.data);
      setForm((prev) => ({ ...prev, chapter_ids: [] }));
    }).catch(() => {});

    if (userRole === 'school') {
      // School/coaching admin: fetch all students directly
      api.get('/api/auth/members/', { params: { role: 'student' } }).then((res) => {
        const data = res.data.results || res.data;
        setStudents(data);
        setForm((prev) => ({ ...prev, student_ids: data.map((s) => s.id) }));
      }).catch(() => {});
    } else {
      // Teacher: use assignment-based student lookup
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
        setSelectedAssignment('');
        setStudents([]);
        setForm((prev) => ({ ...prev, student_ids: [] }));
      }
    }

    // Reset question selection when subject changes
    setSelectedQuestionIds([]);
    setQuestionFilters({ chapter: '', question_type: '', difficulty: '' });
  }, [form.subject, assignments, userRole]);

  // Fetch questions when in manual mode and subject is selected
  useEffect(() => {
    if (selectionMode !== 'manual' || !form.subject) {
      setAvailableQuestions([]);
      return;
    }

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

  // When assignment (class/section) is manually changed, fetch students
  useEffect(() => {
    if (!selectedAssignment) {
      setStudents([]);
      setForm((prev) => ({ ...prev, student_ids: [] }));
      return;
    }
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

  // Derive unique subjects from teacher's assignments
  const subjectMap = {};
  assignments.forEach((a) => { subjectMap[a.subject] = a.subject_name; });
  const subjects = Object.entries(subjectMap).map(([id, name]) => ({ id, name }));

  // Get assignments for the currently selected subject
  const subjectAssignments = assignments.filter((a) => String(a.subject) === String(form.subject));

  const handleLoadTemplate = async (examId) => {
    if (!examId) {
      setTemplateQuestions([]);
      setTemplateMode('');
      return;
    }
    setTemplateLoading(true);
    try {
      const res = await api.get(`/api/exams/assigned/${examId}/`);
      const d = res.data;
      setForm({
        title: d.title + ' (Copy)',
        subject: String(d.subject),
        chapter_ids: d.chapter_ids || [],
        duration_minutes: d.duration_minutes,
        total_marks: d.total_marks,
        num_mcq: d.num_mcq,
        num_short: d.num_short,
        num_long: d.num_long,
        student_ids: d.student_ids || [],
        exam_category: d.exam_category || '',
        start_time: '',
        end_time: '',
      });
      setSelectionMode(d.selection_mode || 'random');
      setTemplateMode(d.selection_mode || 'random');
      if (d.question_ids && d.question_ids.length > 0) {
        setSelectedQuestionIds(d.question_ids);
      }
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
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
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
    setForm((prev) => {
      if (prev.student_ids.length === students.length) {
        return { ...prev, student_ids: [] };
      }
      return { ...prev, student_ids: students.map((s) => s.id) };
    });
  };

  // Compute selected question stats
  const selectedQuestions = availableQuestions.filter((q) => selectedQuestionIds.includes(q.id));
  const selectedMcqCount = selectedQuestions.filter((q) => q.question_type === 'MCQ').length;
  const selectedShortCount = selectedQuestions.filter((q) => q.question_type === 'SHORT').length;
  const selectedLongCount = selectedQuestions.filter((q) => q.question_type === 'LONG').length;
  const selectedTotalMarks = selectedMcqCount * 1 + selectedShortCount * 2 + selectedLongCount * 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: form.title,
        subject: form.subject,
        chapter_ids: form.chapter_ids,
        duration_minutes: parseInt(form.duration_minutes, 10),
        total_marks: selectionMode === 'manual' ? selectedTotalMarks : parseInt(form.total_marks, 10),
        student_ids: form.student_ids,
        exam_category: form.exam_category,
        start_time: form.start_time,
        end_time: form.end_time,
        selection_mode: selectionMode,
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

  const typeBadge = (type) => {
    const colors = {
      MCQ: 'bg-blue-100 text-blue-700',
      SHORT: 'bg-green-100 text-green-700',
      LONG: 'bg-purple-100 text-purple-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const difficultyBadge = (diff) => {
    const colors = {
      EASY: 'bg-emerald-100 text-emerald-700',
      MEDIUM: 'bg-amber-100 text-amber-700',
      HARD: 'bg-red-100 text-red-700',
    };
    return colors[diff] || 'bg-gray-100 text-gray-700';
  };

  if (initLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={isEditMode ? "/teacher/results" : "/teacher/dashboard"} className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Exam' : 'Create Exam'}</h1>
      </div>

      {assignments.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-700 text-sm">
            You have no subject assignments yet. Ask your school admin to assign you to a subject with students before creating exams.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Template Picker — only shown in create mode */}
      {!isEditMode && existingExams.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-indigo-800 mb-2">Copy from an existing exam paper</p>
          <div className="flex gap-3 items-center">
            <select
              onChange={(e) => handleLoadTemplate(e.target.value)}
              defaultValue=""
              className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select an existing exam to use as template --</option>
              {existingExams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.subject_name})
                </option>
              ))}
            </select>
            {templateLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 shrink-0"></div>
            )}
          </div>
          <p className="text-xs text-indigo-500 mt-1.5">Selecting an exam pre-fills the form below. You can edit before saving as a new exam.</p>

          {/* Questions preview */}
          {templateQuestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-indigo-700 mb-2">
                Questions in this exam ({templateQuestions.length})
              </p>
              <div className="border border-indigo-200 rounded-lg bg-white max-h-64 overflow-y-auto divide-y divide-gray-100">
                {templateQuestions.map((q, idx) => (
                  <div key={q.id} className="flex items-start gap-3 px-3 py-2.5">
                    <span className="text-xs text-gray-400 mt-0.5 shrink-0 w-5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2">{q.question_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          q.question_type === 'MCQ' ? 'bg-blue-100 text-blue-700' :
                          q.question_type === 'SHORT' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{q.question_type}</span>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                          q.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{q.difficulty}</span>
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
            <p className="text-xs text-indigo-500 mt-2">
              This is a random-selection exam — questions are picked automatically from the question bank.
              Distribution: {form.num_mcq} MCQ, {form.num_short} Short, {form.num_long} Long.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="e.g. Unit Test - Chapter 3 & 4"
          />
        </div>

        {/* Subject (from assignments) */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            id="subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {subjects.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No subjects assigned. Contact your school admin.</p>
          )}
        </div>

        {/* Class/Section selector (teachers only, not for school/coaching admins) */}
        {userRole !== 'school' && form.subject && subjectAssignments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class & Section</label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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

        {/* Chapters multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chapters</label>
          {!form.subject ? (
            <p className="text-sm text-gray-400">Select a subject first</p>
          ) : chapters.length === 0 ? (
            <p className="text-sm text-gray-400">No chapters found for this subject</p>
          ) : (
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {chapters.map((ch) => (
                <label key={ch.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={form.chapter_ids.includes(ch.id)}
                    onChange={() => toggleChapter(ch.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{ch.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Selection Mode Toggle */}
        {form.subject && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Selection Mode</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setSelectionMode('random')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
                  selectionMode === 'random'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Random (Auto)
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('manual')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
                  selectionMode === 'manual'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Select Questions Manually
              </button>
            </div>
          </div>
        )}

        {/* Random mode: Question Distribution */}
        {selectionMode === 'random' && (
          <>
            {/* Duration & Total Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  id="duration_minutes"
                  name="duration_minutes"
                  value={form.duration_minutes}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label htmlFor="total_marks" className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  id="total_marks"
                  name="total_marks"
                  value={form.total_marks}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Distribution</label>
              <div className={`grid gap-4 ${isCoaching ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <div>
                  <label htmlFor="num_mcq" className="block text-xs text-gray-500 mb-1">MCQ (1 mark each)</label>
                  <input
                    type="number"
                    id="num_mcq"
                    name="num_mcq"
                    value={form.num_mcq}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
                {!isCoaching && (
                  <>
                    <div>
                      <label htmlFor="num_short" className="block text-xs text-gray-500 mb-1">Short Answer (2 marks each)</label>
                      <input
                        type="number"
                        id="num_short"
                        name="num_short"
                        value={form.num_short}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="num_long" className="block text-xs text-gray-500 mb-1">Long Answer (5 marks each)</label>
                      <input
                        type="number"
                        id="num_long"
                        name="num_long"
                        value={form.num_long}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Total: {parseInt(form.num_mcq || 0) + parseInt(form.num_short || 0) + parseInt(form.num_long || 0)} questions
                ({parseInt(form.num_mcq || 0) * 1 + parseInt(form.num_short || 0) * 2 + parseInt(form.num_long || 0) * 5} marks)
              </p>
            </div>
          </>
        )}

        {/* Manual mode: Question Browser */}
        {selectionMode === 'manual' && form.subject && (
          <>
            {/* Duration for manual mode */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="duration_minutes_manual" className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  id="duration_minutes_manual"
                  name="duration_minutes"
                  value={form.duration_minutes}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Filter bar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Questions</label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={questionFilters.chapter}
                  onChange={(e) => setQuestionFilters((prev) => ({ ...prev, chapter: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Chapters</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
                <select
                  value={questionFilters.question_type}
                  onChange={(e) => setQuestionFilters((prev) => ({ ...prev, question_type: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="MCQ">MCQ</option>
                  <option value="SHORT">Short Answer</option>
                  <option value="LONG">Long Answer</option>
                </select>
                <select
                  value={questionFilters.difficulty}
                  onChange={(e) => setQuestionFilters((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Difficulty</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {/* Question list */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Available Questions ({availableQuestions.length})
                </label>
                {selectedQuestionIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedQuestionIds([])}
                    className="text-xs text-red-600 font-medium hover:underline"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {questionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : availableQuestions.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-400">No questions found. Try adjusting filters or generate questions first.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto divide-y divide-gray-100">
                  {availableQuestions.map((q) => (
                    <label
                      key={q.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer transition ${
                        selectedQuestionIds.includes(q.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(q.id)}
                        onChange={() => toggleQuestion(q.id)}
                        className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-2">
                          {q.question_text.length > 150
                            ? q.question_text.substring(0, 150) + '...'
                            : q.question_text}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${typeBadge(q.question_type)}`}>
                            {q.question_type}
                          </span>
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${difficultyBadge(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                          {q.chapter_name && (
                            <span className="text-xs text-gray-400">{q.chapter_name}</span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">
                            {q.question_type === 'MCQ' ? 1 : q.question_type === 'SHORT' ? 2 : 5} mark(s)
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Selected summary */}
              {selectedQuestionIds.length > 0 && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm font-medium text-indigo-800">
                    Selected: {selectedQuestionIds.length} question(s)
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    MCQ: {selectedMcqCount} | Short: {selectedShortCount} | Long: {selectedLongCount} | Total Marks: {selectedTotalMarks}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Exam Category — only shown when board has categories */}
        {getCategoriesForBoard(user?.board).length > 0 && (
          <div>
            <label htmlFor="exam_category" className="block text-sm font-medium text-gray-700 mb-1">
              Exam Category <span className="text-gray-400 font-normal">(for Progress Card)</span>
            </label>
            <select
              id="exam_category"
              name="exam_category"
              value={form.exam_category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="">-- None / Not categorised --</option>
              {getCategoriesForBoard(user?.board).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Start & End Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="datetime-local"
              id="end_time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Students multi-select */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Assign to Students</label>
            {students.length > 0 && (
              <button
                type="button"
                onClick={toggleAllStudents}
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
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
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {students.map((stu) => (
                <label key={stu.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={form.student_ids.includes(stu.id)}
                    onChange={() => toggleStudent(stu.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    {stu.name || stu.first_name && stu.last_name
                      ? (stu.name || `${stu.first_name} ${stu.last_name}`)
                      : stu.username}
                  </span>
                  <span className="text-xs text-gray-400">({stu.username})</span>
                </label>
              ))}
            </div>
          )}
          {form.student_ids.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{form.student_ids.length} student(s) selected</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (selectionMode === 'manual' && selectedQuestionIds.length === 0)}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {isEditMode ? 'Updating Exam...' : 'Creating Exam...'}
            </span>
          ) : (
            isEditMode ? 'Update Exam' : 'Create Exam'
          )}
        </button>
      </form>
    </div>
  );
}
