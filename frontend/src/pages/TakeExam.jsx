import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useTimer } from '../hooks/useTimer';

const TYPE_META = {
  MCQ:   { label: 'MCQ',          cls: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-500'   },
  SHORT: { label: 'Short Answer', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  LONG:  { label: 'Long Answer',  cls: 'bg-violet-100 text-violet-700 border-violet-200',   dot: 'bg-violet-500'  },
};
const DIFF_CLS = {
  EASY:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  MEDIUM: 'text-amber-600 bg-amber-50 border-amber-200',
  HARD:   'text-red-600 bg-red-50 border-red-200',
};

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(`exam_${examId}`);
    if (stored) {
      setExamData(JSON.parse(stored));
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  }, [examId, navigate]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      for (const [qId, answer] of Object.entries(answers)) {
        await api.post(`/api/exams/${examId}/answer/`, {
          question_id: parseInt(qId),
          selected_answer: answer.selected || '',
          text_answer: answer.text || '',
          time_taken_seconds: answer.time || 0,
        });
      }
      await api.post(`/api/exams/${examId}/submit/`);
      sessionStorage.removeItem(`exam_${examId}`);
      navigate(`/result/${examId}`);
    } catch {
      alert('Failed to submit exam. Please try again.');
      setSubmitting(false);
    }
  }, [examId, answers, navigate, submitting]);

  const { timeLeft, formatTime } = useTimer(examData?.total_time_seconds || 3600, handleSubmit);

  if (loading || !examData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-indigo-700 border-t-indigo-300 animate-spin" />
        <p className="text-indigo-300 text-sm font-medium">Loading exam…</p>
      </div>
    );
  }

  const questions    = examData.questions;
  const question     = questions[currentIndex];
  const answer       = answers[question.id] || {};
  const answeredCount = Object.keys(answers).filter(id => {
    const a = answers[id];
    return a && (a.selected || a.text?.trim());
  }).length;

  const updateAnswer = (field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], [field]: value },
    }));
  };

  const isAnswered = (qId) => {
    const a = answers[qId];
    return a && (a.selected || a.text?.trim());
  };

  const isLow    = timeLeft < 300;
  const isMedium = timeLeft < 600 && timeLeft >= 300;
  const timerCls = isLow
    ? 'bg-red-600'
    : isMedium
    ? 'bg-amber-500'
    : 'bg-gradient-to-r from-slate-900 to-indigo-950';

  const mcqQuestions   = questions.filter(q => q.question_type === 'MCQ');
  const shortQuestions = questions.filter(q => q.question_type === 'SHORT');
  const longQuestions  = questions.filter(q => q.question_type === 'LONG');

  const typeMeta = TYPE_META[question.question_type] || TYPE_META.MCQ;

  const NavButton = ({ q, i }) => (
    <button
      key={q.id}
      onClick={() => setCurrentIndex(i)}
      className={`w-9 h-9 rounded-xl text-xs font-bold transition border-2 ${
        i === currentIndex
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
          : isAnswered(q.id)
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
      }`}
    >
      {i + 1}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── STICKY TIMER BAR ── */}
      <div className={`sticky top-0 z-50 ${timerCls} shadow-xl`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: subject + progress */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{examData.subject}</p>
              <p className="text-white/60 text-xs">{answeredCount}/{questions.length} answered</p>
            </div>
          </div>

          {/* Center: timer */}
          <div className={`flex items-center gap-2 ${isLow ? 'animate-pulse' : ''}`}>
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-2xl font-mono font-extrabold text-white tracking-wider">
              {formatTime()}
            </span>
          </div>

          {/* Right: submit */}
          <button
            onClick={() => { if (confirm('Are you sure you want to submit?')) handleSubmit(); }}
            disabled={submitting}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition min-h-[40px] shrink-0 ${
              isLow
                ? 'bg-white text-red-600 hover:bg-red-50'
                : 'bg-white/20 border border-white/30 text-white hover:bg-white/30'
            } disabled:opacity-50`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Submitting…
              </span>
            ) : '📤 Submit'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-white/50 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-5">

        {/* ── SIDEBAR (desktop) ── */}
        <div className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-slate-800 to-indigo-900">
              <p className="text-white font-bold text-xs uppercase tracking-widest">Questions</p>
            </div>

            <div className="p-3 space-y-4">
              {mcqQuestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">MCQ · 1 mark</p>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {questions.map((q, i) => q.question_type === 'MCQ' && <NavButton key={q.id} q={q} i={i} />)}
                  </div>
                </div>
              )}

              {shortQuestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Short · 2 marks</p>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {questions.map((q, i) => q.question_type === 'SHORT' && <NavButton key={q.id} q={q} i={i} />)}
                  </div>
                </div>
              )}

              {longQuestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Long · 5 marks</p>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {questions.map((q, i) => q.question_type === 'LONG' && <NavButton key={q.id} q={q} i={i} />)}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 space-y-1.5">
                {[
                  { cls: 'bg-indigo-600', label: 'Current' },
                  { cls: 'bg-emerald-100 border border-emerald-300', label: 'Answered' },
                  { cls: 'bg-white border border-gray-200', label: 'Unanswered' },
                ].map(({ cls, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`w-4 h-4 rounded-lg ${cls} shrink-0`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE STRIP ── */}
        <div className="lg:hidden overflow-x-auto pb-1">
          <div className="flex gap-1.5 w-max">
            {questions.map((q, i) => (
              <button key={q.id} onClick={() => setCurrentIndex(i)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition border-2 shrink-0 ${
                  i === currentIndex
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : isAnswered(q.id)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* ── QUESTION CARD ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Question header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-slate-50/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${typeMeta.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${typeMeta.dot}`} />
                  {typeMeta.label}
                </span>
                <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                  {question.marks} mark{question.marks > 1 ? 's' : ''}
                </span>
                {question.difficulty && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${DIFF_CLS[question.difficulty] || 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                    {question.difficulty}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-gray-400">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Question text */}
            <div className="px-6 py-6">
              <h2 className="text-lg font-semibold text-gray-800 leading-relaxed">
                <span className="text-indigo-500 font-extrabold mr-2">Q{currentIndex + 1}.</span>
                {question.question_text}
              </h2>
            </div>

            {/* Answer area */}
            <div className="px-6 pb-6">
              {question.question_type === 'MCQ' ? (
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const optionText = question[`option_${opt.toLowerCase()}`];
                    if (!optionText) return null;
                    const isSelected = answer.selected === opt;
                    return (
                      <button key={opt} onClick={() => updateAnswer('selected', opt)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition group ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/40'
                        }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl text-sm font-extrabold flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border-2 border-gray-200 text-gray-500 group-hover:border-indigo-300'
                          }`}>
                            {opt}
                          </span>
                          <span className={`text-sm font-medium ${isSelected ? 'text-indigo-800' : 'text-gray-700'}`}>
                            {optionText}
                          </span>
                          {isSelected && (
                            <span className="ml-auto text-indigo-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <textarea
                    value={answer.text || ''}
                    onChange={(e) => updateAnswer('text', e.target.value)}
                    placeholder={
                      question.question_type === 'SHORT'
                        ? 'Write your answer in 2–3 sentences…'
                        : 'Write a detailed answer with explanation, examples, and key points…'
                    }
                    rows={question.question_type === 'LONG' ? 10 : 5}
                    className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-800 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                               resize-y transition leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {(answer.text || '').length} characters
                    </p>
                    {(answer.text || '').trim() && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Answered
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation footer */}
            <div className="px-6 py-4 border-t border-gray-50 bg-slate-50/60 flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-gray-100
                           text-gray-600 font-semibold text-sm hover:border-gray-300 transition
                           disabled:opacity-40 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <span className="text-xs text-gray-400 font-medium">
                {answeredCount} of {questions.length} answered
              </span>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={() => { if (confirm('Submit exam?')) handleSubmit(); }}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500
                             to-teal-600 text-white font-bold text-sm hover:from-emerald-600 hover:to-teal-700
                             transition shadow-sm disabled:opacity-50">
                  {submitting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {submitting ? 'Submitting…' : 'Submit Exam'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600
                             to-violet-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-violet-700
                             transition shadow-sm">
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
