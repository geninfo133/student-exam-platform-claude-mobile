import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

const ACCENT = {
  indigo: { header: 'bg-indigo-50 border-indigo-100', title: 'text-indigo-800', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  purple: { header: 'bg-purple-50 border-purple-100', title: 'text-purple-800', btn: 'bg-purple-600 hover:bg-purple-700' },
};

function FileViewer({ url, label, accentColor = 'indigo', emptyMsg, defaultExpanded = false }) {
  const c = ACCENT[accentColor];
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!url) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-6">
        <p className="text-amber-700 text-sm">{emptyMsg}</p>
      </div>
    );
  }

  const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className={`${c.header} border-b px-5 py-3 flex items-center justify-between`}>
        {/* Toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <svg
            className={`w-4 h-4 ${c.title} transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className={`font-bold ${c.title}`}>{label}</h3>
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs text-white px-3 py-1.5 rounded-lg transition ${c.btn}`}
        >
          Open / Download
        </a>
      </div>

      {expanded && (
        <div className="p-3">
          {isImage ? (
            <img src={url} alt={label} className="w-full rounded-lg border border-gray-100" />
          ) : (
            <object
              data={url}
              type="application/pdf"
              className="w-full rounded-lg"
              style={{ height: '75vh', minHeight: '500px' }}
            >
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 font-medium mb-3">PDF preview not available in this browser</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-white px-5 py-2.5 rounded-lg font-medium transition ${c.btn}`}
                >
                  Open PDF
                </a>
              </div>
            </object>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExamPaperView() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paperType = searchParams.get('type') || 'created'; // 'created' or 'handwritten'

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown lists
  const [createdExams, setCreatedExams] = useState([]);
  const [handwrittenExams, setHandwrittenExams] = useState([]);

  // Two-combo state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPaper, setSelectedPaper]   = useState('');

  // Load both lists for dropdowns
  useEffect(() => {
    Promise.all([
      api.get('/api/exams/assigned/').catch(() => ({ data: [] })),
      api.get('/api/handwritten/').catch(() => ({ data: [] })),
    ]).then(([createdRes, hwRes]) => {
      setCreatedExams(createdRes.data.results || createdRes.data || []);
      setHandwrittenExams(hwRes.data.results || hwRes.data || []);
    });
  }, []);

  // Load selected paper
  useEffect(() => {
    if (!examId) {
      setLoading(false);
      setError('');
      setExam(null);
      return;
    }
    setLoading(true);
    setError('');
    setExam(null);
    const endpoint =
      paperType === 'handwritten'
        ? `/api/handwritten/${examId}/`
        : `/api/exams/assigned/${examId}/`;
    api.get(endpoint)
      .then((res) => setExam(res.data))
      .catch(() => setError('Failed to load paper.'))
      .finally(() => setLoading(false));
  }, [examId, paperType]);

  // Sync combos when exam loads
  useEffect(() => {
    if (!exam) return;
    if (paperType === 'handwritten') {
      setSelectedStudent(exam.student_display_name || exam.student_name || '');
    } else {
      setSelectedStudent('__created__');
    }
    setSelectedPaper(`${paperType}:${examId}`);
  }, [exam, paperType, examId]);

  // Unique students from handwritten list
  const uniqueStudents = [...new Map(
    handwrittenExams.map((e) => {
      const name = e.student_display_name || e.student_name || 'Unknown';
      return [name, name];
    })
  ).keys()];

  // Papers for selected student
  const papersForStudent = selectedStudent === '__created__'
    ? createdExams.map((e) => ({ value: `created:${e.id}`,      label: `${e.title} — ${e.subject_name}` }))
    : handwrittenExams
        .filter((e) => (e.student_display_name || e.student_name) === selectedStudent)
        .map((e)  => ({ value: `handwritten:${e.id}`, label: `${e.title} — ${e.subject_name}` }));

  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
    setSelectedPaper('');
  };

  const handlePaperChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    setSelectedPaper(val);
    const [type, id] = val.split(':');
    navigate(`/teacher/exam/${id}/paper?type=${type}`);
  };

  // Question helpers
  const mcqs = exam?.questions?.filter((q) => q.question_type === 'MCQ') || [];
  const shorts = exam?.questions?.filter((q) => q.question_type === 'SHORT') || [];
  const longs = exam?.questions?.filter((q) => q.question_type === 'LONG') || [];
  const optionLabel = { A: 'a', B: 'b', C: 'c', D: 'd' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/teacher/results" className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Question Paper</h1>
        {exam && !loading && (
          <button
            onClick={() => window.print()}
            className="ml-auto flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition print:hidden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        )}
      </div>

      {/* Two-combo selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 print:hidden">
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Student */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Student</label>
            <select
              value={selectedStudent}
              onChange={handleStudentChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">-- Select Student --</option>
              {uniqueStudents.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              {createdExams.length > 0 && (
                <option value="__created__">📝 Created Exam Papers</option>
              )}
            </select>
          </div>

          {/* Exam / Paper */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {selectedStudent === '__created__' ? 'Exam Paper' : 'Exam Type / Paper'}
            </label>
            <select
              value={selectedPaper}
              onChange={handlePaperChange}
              disabled={!selectedStudent}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Paper --</option>
              {papersForStudent.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* No paper selected */}
      {!loading && !error && !exam && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">Select a paper from the dropdown above to view it.</p>
        </div>
      )}

      {/* ── CREATED EXAM PAPER ── */}
      {!loading && !error && exam && paperType === 'created' && (
        <>
          {/* Exam Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{exam.title}</h2>
            <p className="text-gray-500 mb-4">{exam.subject_name}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-indigo-600">{exam.total_marks}</p>
                <p className="text-xs text-gray-500">Total Marks</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-indigo-600">{exam.duration_minutes} min</p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-indigo-600">
                  {exam.questions?.length ?? (exam.num_mcq + exam.num_short + exam.num_long)}
                </p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-indigo-600">{exam.selection_mode === 'manual' ? 'Fixed' : 'Random'}</p>
                <p className="text-xs text-gray-500">Selection</p>
              </div>
            </div>
            {exam.selection_mode === 'random' && (
              <div className="mt-4 flex gap-3 flex-wrap">
                <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{exam.num_mcq} MCQ</span>
                <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">{exam.num_short} Short</span>
                <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full">{exam.num_long} Long</span>
              </div>
            )}
          </div>

          {exam.selection_mode === 'random' && exam.questions_source === 'attempt' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-700 text-sm">Showing questions from the first completed student attempt (random selection exam).</p>
            </div>
          )}

          {exam.questions?.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
              <p className="text-amber-700 font-medium mb-1">No question paper available yet</p>
              <p className="text-amber-600 text-sm">
                This is a random-selection exam. The paper will be available once a student completes it.
              </p>
            </div>
          )}

          {exam.questions?.length > 0 && (
            <div className="space-y-6">
              {/* MCQ */}
              {mcqs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
                    <h3 className="font-bold text-blue-800">Section A — Multiple Choice Questions</h3>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">{mcqs.length} questions · 1 mark each</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {mcqs.map((q, idx) => (
                      <div key={q.id} className="px-5 py-4">
                        <div className="flex gap-3">
                          <span className="font-semibold text-gray-400 shrink-0 w-6 text-sm">{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium mb-3">{q.question_text}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {['A', 'B', 'C', 'D'].map((opt) => q[`option_${optionLabel[opt]}`] && (
                                <div key={opt} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${
                                  q.correct_answer === opt ? 'border-green-300 bg-green-50 text-green-800' : 'border-gray-200 text-gray-700'
                                }`}>
                                  <span className={`font-semibold shrink-0 ${q.correct_answer === opt ? 'text-green-700' : 'text-gray-400'}`}>{opt}.</span>
                                  <span>{q[`option_${optionLabel[opt]}`]}</span>
                                  {q.correct_answer === opt && (
                                    <svg className="w-4 h-4 text-green-600 ml-auto shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                                q.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }`}>{q.difficulty}</span>
                              {q.chapter_name && <span className="text-xs text-gray-400">{q.chapter_name}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Answer */}
              {shorts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center justify-between">
                    <h3 className="font-bold text-green-800">Section B — Short Answer Questions</h3>
                    <span className="text-xs text-green-600 bg-green-100 px-2.5 py-1 rounded-full">{shorts.length} questions · 2 marks each</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {shorts.map((q, idx) => (
                      <div key={q.id} className="px-5 py-4">
                        <div className="flex gap-3">
                          <span className="font-semibold text-gray-400 shrink-0 w-6 text-sm">{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium mb-2">{q.question_text}</p>
                            {q.model_answer && (
                              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs font-semibold text-green-700 mb-1">Model Answer:</p>
                                <p className="text-sm text-green-800">{q.model_answer}</p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                                q.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }`}>{q.difficulty}</span>
                              {q.chapter_name && <span className="text-xs text-gray-400">{q.chapter_name}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Long Answer */}
              {longs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-purple-50 border-b border-purple-100 px-5 py-3 flex items-center justify-between">
                    <h3 className="font-bold text-purple-800">Section C — Long Answer Questions</h3>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">{longs.length} questions · 5 marks each</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {longs.map((q, idx) => (
                      <div key={q.id} className="px-5 py-4">
                        <div className="flex gap-3">
                          <span className="font-semibold text-gray-400 shrink-0 w-6 text-sm">{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium mb-2">{q.question_text}</p>
                            {q.model_answer && (
                              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs font-semibold text-purple-700 mb-1">Model Answer:</p>
                                <p className="text-sm text-purple-800">{q.model_answer}</p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                                q.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }`}>{q.difficulty}</span>
                              {q.chapter_name && <span className="text-xs text-gray-400">{q.chapter_name}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── HANDWRITTEN PAPER ── */}
      {!loading && !error && exam && paperType === 'handwritten' && (
        <>
          {/* Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{exam.title}</h2>
            <p className="text-gray-500 mb-4">{exam.subject_name}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-indigo-600">{exam.student_display_name || exam.student_name || '—'}</p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-indigo-600">{exam.total_marks}</p>
                <p className="text-xs text-gray-500">Total Marks</p>
              </div>
              {exam.status === 'GRADED' && (
                <>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-indigo-600">{exam.obtained_marks}</p>
                    <p className="text-xs text-gray-500">Obtained Marks</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className={`text-lg font-bold ${
                      exam.percentage >= 60 ? 'text-green-600' :
                      exam.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{Math.round(exam.percentage)}%</p>
                    <p className="text-xs text-gray-500">Percentage</p>
                  </div>
                </>
              )}
              {exam.status !== 'GRADED' && (
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className={`text-lg font-bold ${
                    exam.status === 'PROCESSING' ? 'text-yellow-600' :
                    exam.status === 'FAILED'     ? 'text-red-600' : 'text-gray-600'
                  }`}>{exam.status}</p>
                  <p className="text-xs text-gray-500">Status</p>
                </div>
              )}
            </div>
          </div>

          {/* ── GRADING ANALYSIS (only when GRADED) ── */}
          {exam.status === 'GRADED' && exam.grading_data && (
            <div className="mb-6 space-y-4">

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Overview</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Scored', value: exam.obtained_marks },
                          { name: 'Lost',   value: Math.max(0, exam.total_marks - exam.obtained_marks) },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={80}
                        dataKey="value" startAngle={90} endAngle={-270}
                      >
                        <Cell fill={exam.percentage >= 60 ? '#16a34a' : exam.percentage >= 40 ? '#ca8a04' : '#dc2626'} />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} marks`, n]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {exam.grading_data.questions?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Question-wise Marks</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={exam.grading_data.questions.map((q) => ({
                          name: `Q${q.question_number}`,
                          Scored: q.marks_awarded,
                          Max: q.max_marks,
                        }))}
                        margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Max"    fill="#e0e7ff" radius={[3,3,0,0]} />
                        <Bar dataKey="Scored" fill="#4f46e5" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Overall feedback */}
              {exam.grading_data.overall_feedback && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-indigo-800 mb-1">Overall Feedback</p>
                  <p className="text-sm text-indigo-700">{exam.grading_data.overall_feedback}</p>
                </div>
              )}

              {/* Strengths / Weaknesses / Recommendations */}
              {(exam.grading_data.strengths?.length > 0 || exam.grading_data.weaknesses?.length > 0 || exam.grading_data.recommendations?.length > 0) && (
                <div className="grid md:grid-cols-3 gap-3">
                  {exam.grading_data.strengths?.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <h4 className="text-xs font-semibold text-green-700 mb-2">Strengths</h4>
                      <ul className="text-xs text-green-800 space-y-1">
                        {exam.grading_data.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  )}
                  {exam.grading_data.weaknesses?.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                      <h4 className="text-xs font-semibold text-red-700 mb-2">Weaknesses</h4>
                      <ul className="text-xs text-red-800 space-y-1">
                        {exam.grading_data.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                    </div>
                  )}
                  {exam.grading_data.recommendations?.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="text-xs font-semibold text-blue-700 mb-2">Recommendations</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        {exam.grading_data.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Per-question table */}
              {exam.grading_data.questions?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-700">Question-wise Breakdown</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Q#</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Question</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Student Answer</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Correct Answer</th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-600">Marks</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.grading_data.questions.map((q, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-medium text-gray-700">{q.question_number}</td>
                            <td className="px-4 py-2.5 text-gray-700 max-w-[180px]">{q.question_text}</td>
                            <td className="px-4 py-2.5 text-gray-600 italic max-w-[180px]">{q.student_answer}</td>
                            <td className="px-4 py-2.5 text-gray-600 max-w-[180px]">{q.correct_answer}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`font-bold ${
                                q.marks_awarded >= q.max_marks ? 'text-green-600' :
                                q.marks_awarded > 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {q.marks_awarded}/{q.max_marks}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">{q.feedback}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Files — collapsible */}
          <FileViewer
            url={exam.question_paper}
            label="Question Paper / Answer Key"
            accentColor="indigo"
            emptyMsg="No question paper file attached."
          />
          <FileViewer
            url={exam.answer_sheet}
            label="Student's Answer Sheet"
            accentColor="purple"
            emptyMsg="No answer sheet file attached."
            defaultExpanded
          />
        </>
      )}
    </div>
  );
}
