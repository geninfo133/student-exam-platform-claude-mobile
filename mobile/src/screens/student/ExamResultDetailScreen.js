import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl,
} from 'react-native';
import api from '../../api/axios';
import LoadingScreen from '../../components/LoadingScreen';
import AnalysisCard from '../../components/AnalysisCard';
import { getGrade, deriveHWAnalysis, deriveOnlineAnalysis } from '../../utils/helpers';

function ScoreRing({ pct }) {
  const size = 80;
  const segments = 36;
  const g = getGrade(pct);
  const filled = Math.round(segments * pct / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i * (360 / segments) - 90) * (Math.PI / 180);
        const r = size / 2 - 6;
        return (
          <View key={i} style={{
            position: 'absolute', width: 5, height: 5, borderRadius: 2.5,
            backgroundColor: i < filled ? g.color : '#f1f5f9',
            left: size / 2 + r * Math.cos(angle) - 2.5,
            top:  size / 2 + r * Math.sin(angle) - 2.5,
          }} />
        );
      })}
      <Text style={{ fontSize: 14, fontWeight: '800', color: g.color }}>{pct}%</Text>
    </View>
  );
}

export default function ExamResultDetailScreen({ route, navigation }) {
  const { resultId, type = 'online' } = route.params || {};

  const [result, setResult]     = useState(null);
  const [answers, setAnswers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll]   = useState(false);

  const load = useCallback(async () => {
    try {
      if (type === 'handwritten') {
        const res = await api.get(`/api/handwritten/${resultId}/`);
        setResult(res.data);
        // grading_data.questions holds per-question results
        setAnswers(res.data?.grading_data?.questions || []);
      } else {
        const res = await api.get(`/api/exams/${resultId}/result/`);
        setResult(res.data);
        setAnswers(res.data?.answers || []);
      }
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [resultId, type]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;
  if (!result) return (
    <View style={s.center}>
      <Text style={{ color: '#94a3b8', fontSize: 15 }}>Result not found.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
        <Text style={{ color: '#4f46e5', fontWeight: '700' }}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const isHW = type === 'handwritten';
  const pct = Math.round(result.percentage || result.score_percentage || 0);
  const g = getGrade(pct);
  const score = isHW ? (result.obtained_marks ?? 0) : (result.score ?? result.obtained_marks ?? 0);
  const totalMarks = result.total_marks
    || (isHW ? 0 : answers.reduce((s, a) => s + (a.question?.marks || 0), 0));

  // For handwritten: derive from grading_data questions; for online: use backend counts
  const correct   = isHW
    ? answers.filter(a => (a.marks_awarded ?? 0) >= (a.max_marks ?? 1)).length
    : (result.correct_answers ?? answers.filter(a => a.is_correct).length);
  const incorrect = isHW
    ? answers.filter(a => (a.marks_awarded ?? 0) === 0 && a.student_answer).length
    : (result.wrong_answers ?? answers.filter(a => a.is_correct === false && (a.selected_answer || a.text_answer)).length);
  const skipped = isHW
    ? answers.filter(a => !a.student_answer).length
    : (result.unanswered ?? answers.filter(a => !a.selected_answer && !a.text_answer).length);

  const displayAnswers = showAll ? answers : answers.slice(0, 10);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerLabel}>EXAM RESULT</Text>
        <Text style={s.headerTitle} numberOfLines={2}>{result.title || result.exam_title || result.subject_name || 'Result'}</Text>
        {(result.subject_name || result.chapter_name) && (
          <Text style={s.headerSub}>{result.subject_name}{result.chapter_name ? ` · ${result.chapter_name}` : ''}</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
      >
        {/* Score card */}
        <View style={s.scoreCard}>
          <ScoreRing pct={pct} />
          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={[s.scoreMain, { color: g.color }]}>{score} / {totalMarks}</Text>
            <Text style={s.scoreLabel}>marks scored</Text>
            <View style={[s.gradePill, { backgroundColor: g.bg }]}>
              <Text style={[s.gradeLabel, { color: g.color }]}>Grade {g.label}</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        {answers.length > 0 && (
          <View style={s.statsRow}>
            {[
              { label: 'Correct',   value: correct,   color: '#059669', bg: '#d1fae5' },
              { label: 'Wrong',     value: incorrect, color: '#dc2626', bg: '#fee2e2' },
              { label: 'Skipped',   value: skipped,   color: '#94a3b8', bg: '#f1f5f9' },
              { label: 'Total Q',   value: answers.length, color: '#4f46e5', bg: '#eef2ff' },
            ].map(({ label, value, color, bg }) => (
              <View key={label} style={[s.statBox, { backgroundColor: bg }]}>
                <Text style={[s.statValue, { color }]}>{value}</Text>
                <Text style={[s.statLabel, { color }]}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Date + meta */}
        {(result.submitted_at || result.completed_at || result.created_at) && (
          <View style={s.metaCard}>
            <Text style={s.metaRow}>
              <Text style={s.metaKey}>{isHW ? 'Graded: ' : 'Submitted: '}</Text>
              {new Date(result.submitted_at || result.completed_at || result.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
            {result.teacher_name && (
              <Text style={s.metaRow}>
                <Text style={s.metaKey}>Teacher: </Text>{result.teacher_name}
              </Text>
            )}
            {isHW && result.exam_category_display && (
              <Text style={s.metaRow}>
                <Text style={s.metaKey}>Category: </Text>{result.exam_category_display}
              </Text>
            )}
          </View>
        )}

        {/* Handwritten grading summary */}
        {isHW && result.grading_data && (
          <View style={s.analysisCard}>
            <Text style={s.analysisSectionTitle}>AI Grading Summary</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#065f46', marginBottom: 4 }}>Total Obtained</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#059669' }}>
                  {result.grading_data.total_obtained ?? result.obtained_marks ?? 0}
                </Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>out of {result.total_marks}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#eef2ff', borderRadius: 10, padding: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#3730a3', marginBottom: 4 }}>Questions Graded</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#4f46e5' }}>
                  {answers.length}
                </Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>by AI</Text>
              </View>
            </View>
            {result.grading_data.analysis?.overall_comment ? (
              <Text style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 18 }}>
                "{result.grading_data.analysis.overall_comment}"
              </Text>
            ) : null}
          </View>
        )}

        {/* AI Analysis — handwritten (AI-generated or derived from question scores) */}
        {isHW && answers.length > 0 && (
          <AnalysisCard
            analysis={result.grading_data?.analysis || deriveHWAnalysis(answers, pct)}
            title="AI Analysis"
          />
        )}

        {/* AI Analysis (online exams) — uses backend data or derived fallback */}
        {!isHW && answers.length > 0 && (
          <AnalysisCard
            analysis={
              (result.analysis?.strengths?.length > 0 || result.analysis?.weaknesses?.length > 0)
                ? result.analysis
                : deriveOnlineAnalysis(answers, pct)
            }
            title="AI Analysis"
          />
        )}
        {!isHW && result.suggestions ? (
          <View style={s.analysisCard}>
            <Text style={s.analysisSectionTitle}>Suggestions</Text>
            <Text style={[s.analysisPt, { color: '#5b21b6' }]}>{result.suggestions}</Text>
          </View>
        ) : null}

        {/* Answer review */}
        {answers.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <Text style={s.sectionTitle}>Answer Review</Text>
            {displayAnswers.map((ans, i) => {
              // handwritten shape: { question_number, question_text, student_answer,
              //                      correct_answer, marks_awarded, max_marks, feedback }
              // online shape:      { question: { question_text, question_type, correct_answer,
              //                      model_answer, marks }, selected_answer, text_answer,
              //                      is_correct, marks_obtained, ai_feedback, teacher_feedback }
              const hwQ = isHW;
              const qText   = hwQ ? ans.question_text   : ans.question?.question_text;
              const qType   = hwQ ? null                : ans.question?.question_type;
              const qMarks  = hwQ ? ans.max_marks       : ans.question?.marks;
              const marksGot= hwQ ? ans.marks_awarded   : ans.marks_obtained;
              const studentAns = hwQ ? ans.student_answer  : (ans.selected_answer || ans.text_answer);
              const correctAns = hwQ ? ans.correct_answer  : ans.question?.correct_answer;
              const modelAns   = hwQ ? null                : ans.question?.model_answer;
              const feedback   = hwQ ? ans.feedback         : (ans.teacher_feedback || ans.ai_feedback);
              const isMCQ      = !hwQ && (qType === 'MCQ' || qType === 'TRUE_FALSE');

              const marksOk  = hwQ
                ? (marksGot ?? 0) >= (qMarks ?? 1)
                : ans.is_correct === true;
              const marksPartial = hwQ
                ? ((marksGot ?? 0) > 0 && (marksGot ?? 0) < (qMarks ?? 1))
                : false;
              const borderColor = marksOk ? '#10b981' : marksPartial ? '#f59e0b' : '#e2e8f0';
              const bgColor     = marksOk ? '#f0fdf4' : marksPartial ? '#fffbeb' : '#fff';

              return (
                <View key={i} style={[s.answerCard, { borderLeftColor: borderColor, backgroundColor: bgColor }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={s.qLabel}>Q{hwQ ? (ans.question_number ?? i + 1) : i + 1}{qType ? ` · ${qType}` : ''}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      {marksGot != null && (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: borderColor }}>
                          {marksGot}/{qMarks ?? '?'} marks
                        </Text>
                      )}
                      {marksOk && <Text style={{ fontSize: 12 }}>✅</Text>}
                      {!marksOk && !marksPartial && <Text style={{ fontSize: 12 }}>❌</Text>}
                      {marksPartial && <Text style={{ fontSize: 12 }}>⚡</Text>}
                    </View>
                  </View>

                  {qText ? <Text style={s.qText}>{qText}</Text> : null}

                  {isMCQ ? (
                    <View style={{ marginTop: 8, gap: 3 }}>
                      <Text style={s.ansLabel}>Your answer: <Text style={{ color: marksOk ? '#059669' : '#dc2626', fontWeight: '700' }}>{studentAns || 'Skipped'}</Text></Text>
                      {!marksOk && correctAns && (
                        <Text style={s.ansLabel}>Correct: <Text style={{ color: '#059669', fontWeight: '700' }}>{correctAns}</Text></Text>
                      )}
                    </View>
                  ) : (
                    <View style={{ marginTop: 8 }}>
                      <Text style={s.ansLabel}>Your answer:</Text>
                      <Text style={s.ansText}>{studentAns || '(not answered)'}</Text>
                      {correctAns && !hwQ && (
                        <View style={[s.feedbackBox, { backgroundColor: '#f0fdf4' }]}>
                          <Text style={[s.feedbackLabel, { color: '#065f46' }]}>Correct Answer</Text>
                          <Text style={[s.feedbackText, { color: '#166534' }]}>{correctAns}</Text>
                        </View>
                      )}
                      {modelAns && (
                        <View style={[s.feedbackBox, { backgroundColor: '#f0fdf4' }]}>
                          <Text style={[s.feedbackLabel, { color: '#065f46' }]}>Model Answer</Text>
                          <Text style={[s.feedbackText, { color: '#166534' }]}>{modelAns}</Text>
                        </View>
                      )}
                      {feedback && (
                        <View style={s.feedbackBox}>
                          <Text style={s.feedbackLabel}>AI Feedback</Text>
                          <Text style={s.feedbackText}>{feedback}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {answers.length > 10 && (
              <TouchableOpacity style={s.showAllBtn} onPress={() => setShowAll(v => !v)}>
                <Text style={s.showAllText}>{showAll ? 'Show Less ▲' : `Show All ${answers.length} Questions ▼`}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header:          { backgroundColor: '#1e1b4b', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn:         { color: '#a5b4fc', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  headerLabel:     { color: '#818cf8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle:     { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub:       { color: '#94a3b8', fontSize: 12, marginTop: 4 },

  scoreCard:       { backgroundColor: '#fff', borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8 },
  scoreMain:       { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  scoreLabel:      { fontSize: 12, color: '#64748b', marginBottom: 8 },
  gradePill:       { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  gradeLabel:      { fontSize: 13, fontWeight: '800' },

  statsRow:        { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox:         { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  statValue:       { fontSize: 18, fontWeight: '800' },
  statLabel:       { fontSize: 10, marginTop: 2, fontWeight: '600' },

  metaCard:        { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  metaRow:         { fontSize: 13, color: '#334155', marginBottom: 4 },
  metaKey:         { fontWeight: '700', color: '#64748b' },

  analysisCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  analysisSectionTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  analysisPt:      { fontSize: 13, lineHeight: 20, marginBottom: 2 },

  sectionTitle:    { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  answerCard:      { borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4 },
  qLabel:          { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  qText:           { fontSize: 13, color: '#334155', lineHeight: 18 },
  ansLabel:        { fontSize: 12, color: '#64748b' },
  ansText:         { fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 18 },
  feedbackBox:     { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: 10, marginTop: 8 },
  feedbackLabel:   { fontSize: 10, fontWeight: '800', color: '#64748b', marginBottom: 4 },
  feedbackText:    { fontSize: 12, color: '#475569', lineHeight: 18 },
  showAllBtn:      { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  showAllText:     { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
});
