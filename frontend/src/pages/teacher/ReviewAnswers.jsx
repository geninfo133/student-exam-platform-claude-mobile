import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ReviewAnswers() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await api.get(`/api/exams/review/${examId}/`);
        setExam(res.data);
        const initial = {};
        (res.data.answers || []).forEach((ans) => {
          if (ans.teacher_score !== null || ans.teacher_feedback) {
            initial[ans.id] = {
              teacher_score: ans.teacher_score ?? '',
              teacher_feedback: ans.teacher_feedback ?? '',
            };
          }
        });
        setReviewData(initial);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load review data');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [examId]);

  const handleReviewChange = (answerId, field, value) => {
    setReviewData((prev) => ({ ...prev, [answerId]: { ...prev[answerId], [field]: value } }));
    setSaved((prev) => ({ ...prev, [answerId]: false }));
  };

  const handleSave = async (answerId) => {
    const data = reviewData[answerId];
    if (!data) return;
    setSaving((prev) => ({ ...prev, [answerId]: true }));
    try {
      await api.patch(`/api/exams/review/${examId}/`, {
        answer_id: answerId,
        teacher_score: parseFloat(data.teacher_score) || 0,
        teacher_feedback: data.teacher_feedback || '',
      });
      setSaved((prev) => ({ ...prev, [answerId]: true }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save review');
    } finally {
      setSaving((prev) => ({ ...prev, [answerId]: false }));
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/api/exams/${examId}/analyze/`);
      setAnalysisDone(true);
      const res = await api.get(`/api/exams/review/${examId}/`);
      setExam(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Loading review…</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 max-w-sm">
          <p className="text-red-600 mb-4">{error || 'Exam not found'}</p>
          <Link to="/teacher/created-exams" className="text-indigo-600 font-medium hover:underline text-sm">
            Back to Created Exams
          </Link>
        </div>
      </div>
    );
  }

  const answers = exam.answers || [];
  const backTo = exam.assigned_exam_id
    ? `/teacher/exam/${exam.assigned_exam_id}/submissions`
    : '/teacher/created-exams';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-10 right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <Link to={backTo} className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Submissions
          </Link>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <p className="text-indigo-300 text-sm font-medium">
                {exam.student_name || exam.student_username} · {exam.subject_name}
              </p>
              <h1 className="text-2xl font-bold text-white">{exam.title || 'Review Answers'}</h1>
            </div>
          </div>

          {/* Score tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Score', value: exam.score ?? '—' },
              { label: 'Total Marks', value: exam.total_marks ?? '—' },
              { label: 'Percentage', value: exam.percentage != null ? `${Math.round(exam.percentage)}%` : '—' },
              { label: 'Answers', value: answers.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/10">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Analysis section */}
        {exam.analysis ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-5 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="font-semibold text-white text-sm">AI Analysis</h2>
            </div>
            <div className="p-5 grid md:grid-cols-3 gap-4">
              {exam.analysis.strengths?.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Strengths</h3>
                  <ul className="space-y-1">
                    {exam.analysis.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-800 flex gap-2"><span className="text-emerald-500">+</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {exam.analysis.weaknesses?.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Weaknesses</h3>
                  <ul className="space-y-1">
                    {exam.analysis.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-red-800 flex gap-2"><span className="text-red-500">-</span>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {exam.analysis.recommendations?.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {exam.analysis.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-blue-800 flex gap-2"><span className="text-blue-500">*</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Analyzing…
                </>
              ) : analysisDone ? (
                'Analysis Generated'
              ) : (
                'Run AI Analysis'
              )}
            </button>
            <p className="text-sm text-gray-500">Generate strengths, weaknesses, and recommendations for this student</p>
          </div>
        )}

        {/* Answers */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">All Answers</h2>
          {answers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-gray-500">No answers submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((ans, i) => {
                const isDescriptive = ans.question?.question_type === 'SHORT' || ans.question?.question_type === 'LONG';
                const review = reviewData[ans.id] || { teacher_score: '', teacher_feedback: '' };
                const correct = ans.is_correct;
                const partial = !correct && (ans.marks_obtained > 0 || ans.ai_score > 0);
                const strip = correct ? 'border-l-emerald-500' : partial ? 'border-l-amber-400' : 'border-l-red-500';

                return (
                  <div key={ans.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${strip} overflow-hidden`}>
                    {/* Question header */}
                    <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          ans.question?.question_type === 'MCQ' ? 'bg-blue-100 text-blue-700' :
                          ans.question?.question_type === 'SHORT' ? 'bg-amber-100 text-amber-700' :
                          'bg-violet-100 text-violet-700'
                        }`}>
                          {ans.question?.question_type}
                        </span>
                        <span className="text-xs text-gray-400">Q{i + 1} · {ans.question?.marks} mark{ans.question?.marks !== 1 ? 's' : ''}</span>
                      </div>
                      <span className={`font-bold text-sm ${correct ? 'text-emerald-600' : partial ? 'text-amber-600' : 'text-red-600'}`}>
                        {ans.marks_obtained ?? ans.ai_score ?? 0}/{ans.question?.marks}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="font-medium text-gray-800 text-sm">{ans.question?.question_text}</p>

                      {ans.question?.question_type === 'MCQ' ? (
                        <div className="space-y-1.5">
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const text = ans.question[`option_${opt.toLowerCase()}`];
                            if (!text) return null;
                            const isCorrect = opt === ans.question.correct_answer;
                            const isSelected = opt === ans.selected_answer;
                            return (
                              <div key={opt} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                                isCorrect ? 'bg-emerald-50 border border-emerald-200' :
                                isSelected && !isCorrect ? 'bg-red-50 border border-red-200' :
                                'bg-gray-50 border border-transparent'
                              }`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  isCorrect ? 'bg-emerald-500 text-white' :
                                  isSelected && !isCorrect ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>{opt}</span>
                                <span className={isCorrect ? 'text-emerald-800' : isSelected && !isCorrect ? 'text-red-700' : 'text-gray-600'}>
                                  {text}
                                  {isCorrect && <span className="ml-2 text-xs font-medium">(correct)</span>}
                                  {isSelected && !isCorrect && <span className="ml-2 text-xs font-medium">(student answer)</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium mb-1">Student Answer</p>
                            <p className="text-sm text-gray-800">{ans.text_answer || 'No answer provided'}</p>
                          </div>
                          {ans.question?.model_answer && (
                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                              <p className="text-xs text-emerald-600 font-medium mb-1">Model Answer</p>
                              <p className="text-sm text-gray-800">{ans.question.model_answer}</p>
                            </div>
                          )}
                          {(ans.ai_feedback || ans.ai_score != null) && (
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                              <p className="text-xs text-blue-600 font-medium mb-1">AI Score: {ans.ai_score ?? '—'}/{ans.question?.marks}</p>
                              {ans.ai_feedback && <p className="text-sm text-gray-800">{ans.ai_feedback}</p>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Teacher review */}
                      {isDescriptive && (
                        <div className="mt-2 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Teacher Review</p>
                          <div className="grid md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Score (out of {ans.question?.marks})</label>
                              <input
                                type="number" min="0" max={ans.question?.marks} step="0.5"
                                value={review.teacher_score}
                                onChange={(e) => handleReviewChange(ans.id, 'teacher_score', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition bg-gray-50"
                                placeholder="0"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-400 mb-1">Feedback</label>
                              <input
                                type="text"
                                value={review.teacher_feedback}
                                onChange={(e) => handleReviewChange(ans.id, 'teacher_feedback', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition bg-gray-50"
                                placeholder="Optional feedback…"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => handleSave(ans.id)}
                                disabled={saving[ans.id]}
                                className={`w-full py-2 rounded-xl text-sm font-semibold transition ${
                                  saved[ans.id]
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm'
                                } disabled:opacity-50`}
                              >
                                {saving[ans.id] ? (
                                  <span className="flex items-center justify-center gap-1">
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                                  </span>
                                ) : saved[ans.id] ? 'Saved ✓' : 'Save'}
                              </button>
                            </div>
                          </div>
                          {ans.teacher_score != null && !reviewData[ans.id] && (
                            <div className="mt-2 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                              <p className="text-xs text-indigo-600 font-medium">Your score: {ans.teacher_score}/{ans.question?.marks}</p>
                              {ans.teacher_feedback && <p className="text-sm text-gray-700 mt-0.5">{ans.teacher_feedback}</p>}
                            </div>
                          )}
                        </div>
                      )}

                      {ans.question?.explanation && (
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                          <p className="text-xs text-amber-700 font-medium mb-1">Explanation</p>
                          <p className="text-sm text-gray-700">{ans.question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 pb-4">
          <Link
            to={backTo}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-sm text-sm"
          >
            Back to Submissions
          </Link>
          <Link
            to="/teacher/dashboard"
            className="px-6 py-3 bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-semibold rounded-xl transition-all text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
