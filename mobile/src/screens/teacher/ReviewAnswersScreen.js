import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const Q_TYPE_STYLE = {
  MCQ:   { bg: '#dbeafe', color: '#1d4ed8' },
  SHORT: { bg: '#fef3c7', color: '#92400e' },
  LONG:  { bg: '#f3e8ff', color: '#6b21a8' },
};

export default function ReviewAnswersScreen({ route, navigation }) {
  const { examId } = route.params || {};
  const [exam, setExam]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [reviewData, setReviewData] = useState({});
  const [saving, setSaving]     = useState({});
  const [saved, setSaved]       = useState({});
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.get(`/api/exams/review/${examId}/`)
      .then(res => {
        setExam(res.data);
        const initial = {};
        (res.data.answers || []).forEach(ans => {
          if (ans.teacher_score !== null || ans.teacher_feedback) {
            initial[ans.id] = {
              teacher_score: ans.teacher_score ?? '',
              teacher_feedback: ans.teacher_feedback ?? '',
            };
          }
        });
        setReviewData(initial);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load review data'))
      .finally(() => setLoading(false));
  }, [examId]);

  const handleChange = (answerId, field, value) => {
    setReviewData(prev => ({ ...prev, [answerId]: { ...prev[answerId], [field]: value } }));
    setSaved(prev => ({ ...prev, [answerId]: false }));
  };

  const handleSave = async (answerId) => {
    const data = reviewData[answerId];
    if (!data) return;
    setSaving(prev => ({ ...prev, [answerId]: true }));
    try {
      await api.patch(`/api/exams/review/${examId}/`, {
        answer_id: answerId,
        teacher_score: parseFloat(data.teacher_score) || 0,
        teacher_feedback: data.teacher_feedback || '',
      });
      setSaved(prev => ({ ...prev, [answerId]: true }));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save review');
    } finally { setSaving(prev => ({ ...prev, [answerId]: false })); }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/api/exams/${examId}/analyze/`);
      const res = await api.get(`/api/exams/review/${examId}/`);
      setExam(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to generate analysis');
    } finally { setAnalyzing(false); }
  };

  if (loading) return <LoadingScreen />;

  if (error || !exam) return (
    <EmptyState
      icon="⚠️"
      title="Error"
      message={error || 'Exam not found'}
    />
  );

  const answers = exam.answers || [];
  const pct = exam.percentage != null ? Math.round(exam.percentage) : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label="TEACHER PORTAL"
        title={exam.title || 'Review Answers'}
        subtitle={(exam.student_name || exam.subject_name) ? [exam.student_name, exam.subject_name].filter(Boolean).join(' · ') : undefined}
      >
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Score',    value: exam.score ?? '—' },
            { label: 'Total',    value: exam.total_marks ?? '—' },
            { label: '%',        value: pct != null ? `${pct}%` : '—' },
            { label: 'Answers',  value: answers.length },
          ].map(({ label, value }) => (
            <View key={label} style={s.statPill}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* AI Analysis */}
        {exam.analysis ? (
          <View style={s.analysisCard}>
            <Text style={s.analysisTitle}>🤖 AI Analysis</Text>
            {exam.analysis.strengths?.length > 0 && (
              <View style={[s.analysisSection, { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' }]}>
                <Text style={[s.analysisSectionTitle, { color: '#065f46' }]}>Strengths</Text>
                {exam.analysis.strengths.map((str, i) => (
                  <Text key={i} style={[s.analysisBullet, { color: '#065f46' }]}>+ {str}</Text>
                ))}
              </View>
            )}
            {exam.analysis.weaknesses?.length > 0 && (
              <View style={[s.analysisSection, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
                <Text style={[s.analysisSectionTitle, { color: '#991b1b' }]}>Weaknesses</Text>
                {exam.analysis.weaknesses.map((w, i) => (
                  <Text key={i} style={[s.analysisBullet, { color: '#991b1b' }]}>- {w}</Text>
                ))}
              </View>
            )}
            {exam.analysis.recommendations?.length > 0 && (
              <View style={[s.analysisSection, { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' }]}>
                <Text style={[s.analysisSectionTitle, { color: '#1e3a8a' }]}>Recommendations</Text>
                {exam.analysis.recommendations.map((r, i) => (
                  <Text key={i} style={[s.analysisBullet, { color: '#1e3a8a' }]}>• {r}</Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={s.analyzeRow}>
            <TouchableOpacity
              style={[s.analyzeBtn, analyzing && { opacity: 0.6 }]}
              onPress={handleRunAnalysis}
              disabled={analyzing}
            >
              {analyzing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.analyzeBtnText}>✨ Run AI Analysis</Text>
              }
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#64748b', flex: 1 }}>Generate strengths, weaknesses & recommendations</Text>
          </View>
        )}

        {/* Answers */}
        <Text style={s.sectionTitle}>All Answers ({answers.length})</Text>

        {answers.map((ans, i) => {
          const isDescriptive = ans.question?.question_type === 'SHORT' || ans.question?.question_type === 'LONG';
          const correct = ans.is_correct;
          const partial = !correct && (ans.marks_obtained > 0 || ans.ai_score > 0);
          const stripColor = correct ? '#10b981' : partial ? '#f59e0b' : '#ef4444';
          const qStyle = Q_TYPE_STYLE[ans.question?.question_type] || Q_TYPE_STYLE.SHORT;
          const review = reviewData[ans.id] || { teacher_score: '', teacher_feedback: '' };

          return (
            <View key={ans.id} style={[s.answerCard, { borderLeftColor: stripColor }]}>
              {/* Q header */}
              <View style={s.qHeader}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <View style={[s.qTypeBadge, { backgroundColor: qStyle.bg }]}>
                    <Text style={[s.qTypeText, { color: qStyle.color }]}>{ans.question?.question_type}</Text>
                  </View>
                  <Text style={s.qNum}>Q{i + 1} · {ans.question?.marks} mark{ans.question?.marks !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={[s.qScore, { color: correct ? '#10b981' : partial ? '#f59e0b' : '#dc2626' }]}>
                  {ans.marks_obtained ?? ans.ai_score ?? 0}/{ans.question?.marks}
                </Text>
              </View>

              {/* Question */}
              <Text style={s.qText}>{ans.question?.question_text}</Text>

              {/* MCQ options */}
              {ans.question?.question_type === 'MCQ' ? (
                <View style={{ gap: 4, marginTop: 8 }}>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const text = ans.question[`option_${opt.toLowerCase()}`];
                    if (!text) return null;
                    const isCorrect = opt === ans.question.correct_answer;
                    const isSelected = opt === ans.selected_answer;
                    return (
                      <View key={opt} style={[
                        s.optionRow,
                        isCorrect && { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
                        isSelected && !isCorrect && { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
                      ]}>
                        <View style={[s.optionBadge,
                          isCorrect && { backgroundColor: '#10b981' },
                          isSelected && !isCorrect && { backgroundColor: '#dc2626' },
                        ]}>
                          <Text style={{ color: (isCorrect || (isSelected && !isCorrect)) ? '#fff' : '#64748b', fontSize: 11, fontWeight: '700' }}>{opt}</Text>
                        </View>
                        <Text style={[s.optionText, isCorrect && { color: '#065f46' }, isSelected && !isCorrect && { color: '#991b1b' }]}>
                          {text}{isCorrect ? ' ✓' : ''}{isSelected && !isCorrect ? ' ✗' : ''}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={{ gap: 6, marginTop: 8 }}>
                  <View style={s.answerBox}>
                    <Text style={s.answerBoxLabel}>Student Answer</Text>
                    <Text style={s.answerBoxText}>{ans.text_answer || 'No answer'}</Text>
                  </View>
                  {ans.question?.model_answer && (
                    <View style={[s.answerBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                      <Text style={[s.answerBoxLabel, { color: '#065f46' }]}>Model Answer</Text>
                      <Text style={s.answerBoxText}>{ans.question.model_answer}</Text>
                    </View>
                  )}
                  {(ans.ai_feedback || ans.ai_score != null) && (
                    <View style={[s.answerBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                      <Text style={[s.answerBoxLabel, { color: '#1e40af' }]}>AI Score: {ans.ai_score ?? '—'}/{ans.question?.marks}</Text>
                      {ans.ai_feedback && <Text style={s.answerBoxText}>{ans.ai_feedback}</Text>}
                    </View>
                  )}
                </View>
              )}

              {/* Teacher review for descriptive */}
              {isDescriptive && (
                <View style={s.teacherReview}>
                  <Text style={s.teacherReviewTitle}>Teacher Review</Text>
                  <Text style={s.label}>Score (out of {ans.question?.marks})</Text>
                  <TextInput
                    style={s.input}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    value={String(review.teacher_score)}
                    onChangeText={v => handleChange(ans.id, 'teacher_score', v)}
                  />
                  <Text style={s.label}>Feedback</Text>
                  <TextInput
                    style={[s.input, { minHeight: 56 }]}
                    multiline
                    placeholder="Optional feedback…"
                    placeholderTextColor="#94a3b8"
                    value={review.teacher_feedback}
                    onChangeText={v => handleChange(ans.id, 'teacher_feedback', v)}
                  />
                  <TouchableOpacity
                    style={[s.saveBtn, saved[ans.id] && { backgroundColor: '#10b981' }, saving[ans.id] && { opacity: 0.6 }]}
                    onPress={() => handleSave(ans.id)}
                    disabled={!!saving[ans.id]}
                  >
                    {saving[ans.id]
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.saveBtnText}>{saved[ans.id] ? '✓ Saved' : 'Save Review'}</Text>
                    }
                  </TouchableOpacity>

                  {ans.teacher_score != null && !reviewData[ans.id] && (
                    <View style={s.savedReview}>
                      <Text style={s.savedReviewText}>Your score: {ans.teacher_score}/{ans.question?.marks}</Text>
                      {ans.teacher_feedback ? <Text style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{ans.teacher_feedback}</Text> : null}
                    </View>
                  )}
                </View>
              )}

              {/* Explanation */}
              {ans.question?.explanation && (
                <View style={[s.answerBox, { backgroundColor: '#fffbeb', borderColor: '#fde68a', marginTop: 8 }]}>
                  <Text style={[s.answerBoxLabel, { color: '#92400e' }]}>Explanation</Text>
                  <Text style={s.answerBoxText}>{ans.question.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  statPill:     { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 58 },
  analysisCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  analysisTitle:{ fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  analysisSection:{ borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8 },
  analysisSectionTitle:{ fontSize: 12, fontWeight: '700', marginBottom: 4 },
  analysisBullet:{ fontSize: 13, marginBottom: 2 },
  analyzeRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12 },
  analyzeBtn:   { backgroundColor: '#8b5cf6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  analyzeBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  answerCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  qHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  qTypeBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  qTypeText:    { fontSize: 10, fontWeight: '700' },
  qNum:         { fontSize: 11, color: '#64748b' },
  qScore:       { fontSize: 16, fontWeight: '800' },
  qText:        { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  optionRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 10 },
  optionBadge:  { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  optionText:   { fontSize: 13, color: '#475569', flex: 1 },
  answerBox:    { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12 },
  answerBoxLabel:{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 4 },
  answerBoxText: { fontSize: 13, color: '#334155' },
  teacherReview: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  teacherReviewTitle:{ fontSize: 12, fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  label:        { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, marginTop: 8 },
  input:        { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  saveBtn:      { backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  savedReview:  { backgroundColor: '#eef2ff', borderRadius: 10, padding: 10, marginTop: 8 },
  savedReviewText:{ fontSize: 12, fontWeight: '700', color: '#4f46e5' },
});
