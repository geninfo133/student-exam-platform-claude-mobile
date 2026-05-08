import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, RefreshControl, Dimensions,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import Card from '../../components/Card';
import StatBox from '../../components/StatBox';
import PctBar from '../../components/PctBar';
import PickerModal from '../../components/PickerModal';
import AnalysisCard from '../../components/AnalysisCard';
import { pctColor, studentName, deriveHWAnalysis, deriveOnlineAnalysis, deriveProgressAnalysis } from '../../utils/helpers';

const W = Dimensions.get('window').width;
const CHART_W = W - 64;

const PERIODS = [
  { label: '7 Days',   value: 7  },
  { label: '30 Days',  value: 30 },
  { label: '90 Days',  value: 90 },
  { label: 'All Time', value: 0  },
];

const BASE_CFG = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo:   '#ffffff',
  decimalPlaces: 0,
  labelColor: () => '#94a3b8',
};



function HandwrittenDetailModal({ visible, examId, onClose }) {
  const [exam, setExam]       = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !examId) return;
    setLoading(true);
    api.get(`/api/handwritten/${examId}/`)
      .then(res => {
        setExam(res.data);
        setQuestions(res.data?.grading_data?.questions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, examId]);

  const fullMarks    = questions.filter(q => (q.marks_awarded ?? 0) >= (q.max_marks ?? 1)).length;
  const partialMarks = questions.filter(q => (q.marks_awarded ?? 0) > 0 && (q.marks_awarded ?? 0) < (q.max_marks ?? 1)).length;
  const zeroMarks    = questions.filter(q => (q.marks_awarded ?? 0) === 0 && q.student_answer).length;

  const hwPct      = exam?.percentage ?? 0;
  const hwAnalysis = questions.length > 0
    ? (exam?.grading_data?.analysis || deriveHWAnalysis(questions, hwPct))
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={s.sheetHandle} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b' }} numberOfLines={1}>
            ✍️ {exam?.title || 'Handwritten Exam'}
          </Text>
          {!loading && questions.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>✓ {fullMarks} Full</Text>
              {partialMarks > 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: '#f59e0b' }}>~ {partialMarks} Partial</Text>}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>✗ {zeroMarks} Wrong</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#4f46e5' }}>{exam?.obtained_marks ?? 0}/{exam?.total_marks} marks</Text>
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 20, right: 20 }}>
            <Text style={{ fontSize: 22, color: '#94a3b8' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0891b2" />
          </View>
        ) : questions.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📄</Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
              No per-question data available for this exam.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Overall AI analysis */}
            {hwAnalysis && (
              <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#4f46e5' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#4f46e5', marginBottom: 10, letterSpacing: 0.5 }}>AI ANALYSIS</Text>
                {hwAnalysis.strengths?.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669', marginBottom: 4 }}>STRENGTHS</Text>
                    {hwAnalysis.strengths.map((pt, i) => (
                      <Text key={i} style={{ fontSize: 12, color: '#065f46', lineHeight: 18 }}>• {pt}</Text>
                    ))}
                  </View>
                )}
                {hwAnalysis.weaknesses?.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc2626', marginBottom: 4 }}>AREAS TO IMPROVE</Text>
                    {hwAnalysis.weaknesses.map((pt, i) => (
                      <Text key={i} style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 18 }}>• {pt}</Text>
                    ))}
                  </View>
                )}
                {hwAnalysis.recommendations?.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#92400e', marginBottom: 4 }}>RECOMMENDATIONS</Text>
                    {hwAnalysis.recommendations.map((pt, i) => (
                      <Text key={i} style={{ fontSize: 12, color: '#78350f', lineHeight: 18 }}>• {pt}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {questions.length > 0 && (
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 }}>
                PER-QUESTION BREAKDOWN
              </Text>
            )}

            {questions.map((q, i) => {
              const awarded = q.marks_awarded ?? 0;
              const max     = q.max_marks ?? 1;
              const full    = awarded >= max;
              const partial = awarded > 0 && awarded < max;
              const statusColor = full ? '#10b981' : partial ? '#f59e0b' : '#ef4444';
              const statusIcon  = full ? '✓' : partial ? '~' : '✗';
              return (
                <View key={i} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: statusColor, elevation: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8' }}>
                      Q{q.question_number ?? i + 1} · Written
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: statusColor }}>
                      {statusIcon} {awarded}/{max} marks
                    </Text>
                  </View>

                  {q.question_text ? (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 8, lineHeight: 18 }} numberOfLines={4}>
                      {q.question_text}
                    </Text>
                  ) : null}

                  {q.student_answer ? (
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4 }}>STUDENT ANSWER</Text>
                      <Text style={{ fontSize: 12, color: '#334155', lineHeight: 17 }}>{q.student_answer}</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: '#fef2f2', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '600' }}>Not answered</Text>
                    </View>
                  )}

                  {q.correct_answer && !full && (
                    <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669', marginBottom: 4 }}>CORRECT ANSWER</Text>
                      <Text style={{ fontSize: 12, color: '#065f46', lineHeight: 17 }} numberOfLines={4}>{q.correct_answer}</Text>
                    </View>
                  )}

                  {q.feedback ? (
                    <View style={{ backgroundColor: '#fffbeb', borderRadius: 8, padding: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#92400e', marginBottom: 4 }}>AI FEEDBACK</Text>
                      <Text style={{ fontSize: 12, color: '#78350f', lineHeight: 17 }}>{q.feedback}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}


function QuestionDetailModal({ visible, examId, onClose }) {
  const [answers, setAnswers]   = useState([]);
  const [exam, setExam]         = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!visible || !examId) return;
    setLoading(true);
    api.get(`/api/exams/review/${examId}/`)
      .then(res => { setExam(res.data); setAnswers(res.data.answers || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, examId]);

  const correct  = answers.filter(a => a.is_correct).length;
  const wrong    = answers.filter(a => !a.is_correct && (a.marks_obtained === 0)).length;
  const partial  = answers.filter(a => !a.is_correct && a.marks_obtained > 0).length;

  const totalMarks    = answers.reduce((acc, a) => acc + (a.question?.marks || 0), 0);
  const obtainedMarks = answers.reduce((acc, a) => acc + (a.marks_obtained || 0), 0);
  const pct           = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

  const onlineAnalysis = answers.length > 0 ? deriveOnlineAnalysis(answers, pct) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View style={s.sheetHandle} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b' }} numberOfLines={1}>{exam?.exam_title || exam?.title || 'Exam Details'}</Text>
          {!loading && answers.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>✓ {correct} Correct</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>✗ {wrong} Wrong</Text>
              {partial > 0 && <Text style={{ fontSize: 13, fontWeight: '700', color: '#f59e0b' }}>~ {partial} Partial</Text>}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#4f46e5' }}>{obtainedMarks}/{totalMarks} marks</Text>
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 20, right: 20 }}>
            <Text style={{ fontSize: 22, color: '#94a3b8' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* AI analysis for online exams */}
            {onlineAnalysis && (
              <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#4f46e5' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#4f46e5', marginBottom: 10, letterSpacing: 0.5 }}>AI ANALYSIS</Text>
                {onlineAnalysis.strengths?.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669', marginBottom: 4 }}>STRENGTHS</Text>
                    {onlineAnalysis.strengths.map((pt, i) => (
                      <Text key={i} style={{ fontSize: 12, color: '#065f46', lineHeight: 18 }}>• {pt}</Text>
                    ))}
                  </View>
                )}
                {onlineAnalysis.weaknesses?.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc2626', marginBottom: 4 }}>AREAS TO IMPROVE</Text>
                    {onlineAnalysis.weaknesses.map((pt, i) => (
                      <Text key={i} style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 18 }}>• {pt}</Text>
                    ))}
                  </View>
                )}
                {onlineAnalysis.recommendations?.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#92400e', marginBottom: 4 }}>RECOMMENDATIONS</Text>
                    {onlineAnalysis.recommendations.map((pt, i) => (
                      <Text key={i} style={{ fontSize: 12, color: '#78350f', lineHeight: 18 }}>• {pt}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
            {answers.length > 0 && (
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 }}>
                PER-QUESTION BREAKDOWN
              </Text>
            )}
            {answers.map((ans, i) => {
              const q = ans.question || {};
              const statusColor = ans.is_correct ? '#10b981' : ans.marks_obtained > 0 ? '#f59e0b' : '#ef4444';
              const statusIcon  = ans.is_correct ? '✓' : ans.marks_obtained > 0 ? '~' : '✗';
              const feedback    = ans.teacher_feedback || ans.ai_feedback || '';
              return (
                <View key={i} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: statusColor, elevation: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={{ backgroundColor: q.question_type === 'MCQ' ? '#eef2ff' : q.question_type === 'SHORT' ? '#d1fae5' : '#fef3c7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: q.question_type === 'MCQ' ? '#4f46e5' : q.question_type === 'SHORT' ? '#059669' : '#92400e' }}>{q.question_type || 'Q'}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>Q{i + 1} · {q.marks || 0} marks</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: statusColor }}>{statusIcon} {ans.marks_obtained || 0}/{q.marks || 0}</Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 8, lineHeight: 18 }} numberOfLines={3}>{q.question_text}</Text>

                  {q.question_type === 'MCQ' && (
                    <View style={{ gap: 4, marginBottom: 8 }}>
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const optText = q[`option_${opt.toLowerCase()}`];
                        if (!optText) return null;
                        const isCorrect = q.correct_answer === opt;
                        const isSelected = ans.selected_answer === opt;
                        return (
                          <View key={opt} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: isCorrect ? '#d1fae5' : isSelected && !isCorrect ? '#fee2e2' : '#f8fafc', borderRadius: 8, padding: 7 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: isCorrect ? '#059669' : isSelected ? '#dc2626' : '#64748b', width: 16 }}>{opt}</Text>
                            <Text style={{ fontSize: 12, color: isCorrect ? '#065f46' : isSelected ? '#dc2626' : '#334155', flex: 1 }}>{optText}</Text>
                            {isCorrect && <Text style={{ color: '#059669', fontSize: 12 }}>✓</Text>}
                            {isSelected && !isCorrect && <Text style={{ color: '#dc2626', fontSize: 12 }}>✗</Text>}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {(q.question_type === 'SHORT' || q.question_type === 'LONG') && ans.text_answer && (
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4 }}>STUDENT ANSWER</Text>
                      <Text style={{ fontSize: 12, color: '#334155' }}>{ans.text_answer}</Text>
                    </View>
                  )}

                  {q.model_answer && !ans.is_correct && (
                    <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669', marginBottom: 4 }}>MODEL ANSWER</Text>
                      <Text style={{ fontSize: 12, color: '#065f46' }} numberOfLines={4}>{q.model_answer}</Text>
                    </View>
                  )}

                  {feedback ? (
                    <View style={{ backgroundColor: '#fffbeb', borderRadius: 8, padding: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#92400e', marginBottom: 4 }}>FEEDBACK</Text>
                      <Text style={{ fontSize: 12, color: '#78350f' }} numberOfLines={3}>{feedback}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}


export default function TeacherAnalyticsScreen({ navigation }) {
  const { user } = useAuth();
  const isSchool = user?.role === 'school';

  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [period, setPeriod]           = useState(0);
  const [subjects, setSubjects]       = useState([]);
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const [students, setStudents]               = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [studentData, setStudentData]         = useState(null);
  const [studentLoading, setStudentLoading]   = useState(false);
  const [qModalExamId, setQModalExamId]       = useState(null);
  const [hwModalExamId, setHwModalExamId]     = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const params = { period };
      if (subjectFilter) params.subject_id = subjectFilter.id;
      const res = await api.get('/api/analytics/teacher/', { params });
      setData(res.data);
      if (res.data.subjects) setSubjects(res.data.subjects);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [period, subjectFilter]);

  const fetchStudents = useCallback(async () => {
    try {
      const url = isSchool ? '/api/auth/members/?role=student' : '/api/auth/my-students/';
      const res = await api.get(url);
      setStudents(res.data?.results || res.data || []);
    } catch { }
  }, [isSchool]);

  const fetchStudentData = useCallback(async () => {
    if (!selectedStudent) { setStudentData(null); return; }
    setStudentLoading(true);
    try {
      const res = await api.get(`/api/progress-card/?student_id=${selectedStudent.id}`);
      setStudentData(res.data.results || []);
    } catch { setStudentData(null); }
    finally { setStudentLoading(false); }
  }, [selectedStudent]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchStudentData(); }, [fetchStudentData]);

  const ov = data?.overview || {};

  // Class overview charts
  const passFail = (ov.pass_count > 0 || ov.fail_count > 0) ? [
    { name: 'Pass', count: ov.pass_count || 0, color: '#10b981', legendFontColor: '#334155', legendFontSize: 13 },
    { name: 'Fail', count: ov.fail_count || 0, color: '#ef4444', legendFontColor: '#334155', legendFontSize: 13 },
  ].filter(d => d.count > 0) : null;

  const subjectBreakdown = data?.subject_breakdown || [];
  const subjectBar = subjectBreakdown.length > 0 ? {
    labels: subjectBreakdown.map(s => (s.subject_name || '').slice(0, 5)),
    datasets: [{ data: subjectBreakdown.map(s => Math.round(s.average_percentage || 0)) }],
  } : null;

  const typeComparison = data?.exam_type_comparison;
  const typeBar = typeComparison ? {
    labels: ['Online', 'Written'],
    datasets: [{
      data: [
        Math.round(typeComparison.online?.average_percentage || 0),
        Math.round(typeComparison.handwritten?.average_percentage || 0),
      ],
    }],
  } : null;

  const trends = data?.trends || [];
  const trendLine = trends.length >= 2 ? {
    labels: trends.map((t, i) => i % Math.ceil(trends.length / 5) === 0 ? String(t.label || '').slice(0, 4) : ''),
    datasets: [{ data: trends.map(t => Math.round(t.avg_pct || 0) || 0) }],
  } : null;

  // Per-student charts
  const studentExams   = studentData || [];
  const onlineExams    = studentExams.filter(e => e.source === 'online');
  const hwExams        = studentExams.filter(e => e.source === 'handwritten');
  const totalPct       = studentExams.length > 0
    ? Math.round(studentExams.reduce((a, e) => a + (e.percentage || 0), 0) / studentExams.length) : null;

  const subjectMap = {};
  studentExams.forEach(e => {
    if (!subjectMap[e.subject_id]) subjectMap[e.subject_id] = { name: e.subject_name, scores: [] };
    subjectMap[e.subject_id].scores.push(e.percentage || 0);
  });
  const studentSubjects = Object.values(subjectMap).map(sub => ({
    name: sub.name,
    avg: Math.round(sub.scores.reduce((a, b) => a + b, 0) / sub.scores.length),
    count: sub.scores.length,
  }));

  const studentBar = studentSubjects.length > 0 ? {
    labels: studentSubjects.map(s => s.name.slice(0, 5)),
    datasets: [{ data: studentSubjects.map(s => s.avg) }],
  } : null;

  const groupExamsBySubject = (exams) => {
    const map = {};
    exams.forEach(e => {
      if (!map[e.subject_id]) map[e.subject_id] = { subject_name: e.subject_name, scores: [] };
      map[e.subject_id].scores.push(e.percentage || 0);
    });
    return Object.values(map).map(s => ({
      subject_name: s.subject_name,
      percentage: s.scores.reduce((a, b) => a + b, 0) / s.scores.length,
    }));
  };
  const studentProgressObj = {
    online: groupExamsBySubject(onlineExams),
    handwritten: groupExamsBySubject(hwExams),
    subjects: groupExamsBySubject(studentExams),
  };
  const studentGrand = studentExams.length > 0
    ? { percentage: totalPct || 0 }
    : null;

  const studentAnalysis = studentGrand
    ? deriveProgressAnalysis(studentProgressObj, studentGrand)
    : null;

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
      {/* Header */}
      <ScreenHeader
        navigation={navigation}
        label={isSchool ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
        title="Analytics Dashboard"
        subtitle="Insights into student performance"
        bgColor="#1e1b4b"
      >
        <View style={s.pillsRow}>
          {[
            { label: 'Exams',     value: ov.total_exams    ?? 0 },
            { label: 'Students',  value: ov.total_students ?? 0 },
            { label: 'Avg Score', value: ov.average_percentage != null ? `${ov.average_percentage}%` : '—' },
            { label: 'Pass Rate', value: ov.pass_rate != null ? `${ov.pass_rate}%` : '—' },
          ].map(({ label, value }) => (
            <View key={label} style={s.pill}>
              <Text style={s.pillVal}>{value}</Text>
              <Text style={s.pillLbl}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      {/* Period + Subject filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
        {PERIODS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.filterChip, period === opt.value && s.filterChipActive]}
            onPress={() => setPeriod(opt.value)}
          >
            <Text style={[s.filterChipText, period === opt.value && s.filterChipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        {subjects.length > 0 && (
          <TouchableOpacity
            style={[s.filterChip, subjectFilter && s.filterChipActive]}
            onPress={() => setShowSubjectPicker(true)}
          >
            <Text style={[s.filterChipText, subjectFilter && s.filterChipTextActive]}>
              {subjectFilter ? subjectFilter.name : 'All Subjects ▾'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} tintColor="#4f46e5" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── CLASS OVERVIEW ── */}
        {!ov.total_exams ? (
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }]}>
            <Text style={{ fontSize: 28 }}>📊</Text>
            <Text style={{ fontSize: 13, color: '#64748b', flex: 1 }}>
              No class-level data for this period. Try "All Time" or check Per-Student Analysis below.
            </Text>
          </View>
        ) : (
          <>
            {/* Overview stat row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <StatBox label="Total Exams"   value={ov.total_exams}    color="#4f46e5" bg="#eef2ff" />
              <StatBox label="Students"      value={ov.total_students} color="#7c3aed" bg="#f5f3ff" />
              <StatBox label="Avg Score"     value={`${ov.average_percentage}%`} color={pctColor(ov.average_percentage)} bg={ov.average_percentage >= 60 ? '#d1fae5' : ov.average_percentage >= 35 ? '#fef3c7' : '#fee2e2'} />
              <StatBox label="Pass Rate"     value={`${ov.pass_rate}%`} color="#059669" bg="#d1fae5" />
            </View>

            {/* Pass/Fail Pie */}
            {passFail?.length >= 2 && (
              <Card title="Pass / Fail Breakdown" accent="#10b981">
                <PieChart
                  data={passFail}
                  width={CHART_W}
                  height={160}
                  chartConfig={BASE_CFG}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={{ marginTop: 8 }}
                />
                <View style={{ flexDirection: 'row', gap: 24, justifyContent: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#10b981' }}>✓ Passed: {ov.pass_count}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ef4444' }}>✗ Failed: {ov.fail_count}</Text>
                </View>
              </Card>
            )}

            {/* Online vs Handwritten comparison */}
            {typeBar && (
              <Card title="Online vs Handwritten Avg %" accent="#0891b2">
                <BarChart
                  data={typeBar}
                  width={CHART_W}
                  height={180}
                  chartConfig={{
                    ...BASE_CFG,
                    color: (opacity = 1) => `rgba(8, 145, 178, ${opacity})`,
                    barPercentage: 0.5,
                  }}
                  style={{ borderRadius: 12, marginTop: 10 }}
                  showValuesOnTopOfBars
                  fromZero
                  yAxisSuffix="%"
                  withInnerLines={false}
                />
                <View style={{ flexDirection: 'row', gap: 20, justifyContent: 'center', marginTop: 8 }}>
                  {typeComparison.online && <Text style={{ fontSize: 12, color: '#64748b' }}>Online: {typeComparison.online.count} exams</Text>}
                  {typeComparison.handwritten && <Text style={{ fontSize: 12, color: '#64748b' }}>Written: {typeComparison.handwritten.count} exams</Text>}
                </View>
              </Card>
            )}

            {/* Subject Breakdown bar chart */}
            {subjectBar && (
              <Card title="Subject Performance" accent="#8b5cf6">
                <BarChart
                  data={subjectBar}
                  width={CHART_W}
                  height={200}
                  chartConfig={{
                    ...BASE_CFG,
                    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                    barPercentage: 0.65,
                  }}
                  style={{ borderRadius: 12, marginTop: 10 }}
                  showValuesOnTopOfBars
                  fromZero
                  yAxisSuffix="%"
                  withInnerLines={false}
                />
                {subjectBreakdown.map((sub, i) => (
                  <View key={i} style={{ marginTop: 10, paddingTop: i > 0 ? 10 : 0, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#f1f5f9' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b' }}>{sub.subject_name}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#8b5cf6' }}>{sub.average_percentage}% avg</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={{ fontSize: 11, color: '#10b981' }}>↑ {sub.highest_score}%</Text>
                      <Text style={{ fontSize: 11, color: '#ef4444' }}>↓ {sub.lowest_score}%</Text>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>{sub.total_exams} exams · Pass {sub.pass_rate}%</Text>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Trend line */}
            {trendLine && (
              <Card title="Performance Trend" accent="#f59e0b">
                <LineChart
                  data={trendLine}
                  width={CHART_W}
                  height={180}
                  chartConfig={{
                    ...BASE_CFG,
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    propsForDots: { r: '4', strokeWidth: '2', stroke: '#f59e0b' },
                  }}
                  bezier
                  style={{ borderRadius: 12, marginTop: 10 }}
                  yAxisSuffix="%"
                  withInnerLines={false}
                />
              </Card>
            )}

          </>
        )}

        {/* ── PER-STUDENT ANALYSIS ── */}
        <Card title="👤 Per-Student Analysis" accent="#0f172a">
          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 8, marginTop: 4 }}>SELECT STUDENT</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setShowStudentPicker(true)}>
            <Text style={{ color: selectedStudent ? '#1e293b' : '#94a3b8', fontSize: 14, flex: 1 }}>
              {selectedStudent ? studentName(selectedStudent) : 'Choose a student…'}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 16 }}>▾</Text>
          </TouchableOpacity>
        </Card>

        {selectedStudent && (
          studentLoading ? (
            <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#4f46e5" />
            </View>
          ) : studentExams.length === 0 ? (
            <View style={[s.card, { padding: 28, alignItems: 'center' }]}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>No Exams Found</Text>
              <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 }}>{studentName(selectedStudent)} hasn't completed any exams yet.</Text>
            </View>
          ) : (
            <>
              {/* Student stat row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <StatBox label="Exams"   value={studentExams.length}  color="#4f46e5" bg="#eef2ff" />
                <StatBox label="Average" value={totalPct != null ? `${totalPct}%` : '—'} color={totalPct != null ? pctColor(totalPct) : '#64748b'} bg={totalPct != null ? (totalPct >= 60 ? '#d1fae5' : totalPct >= 35 ? '#fef3c7' : '#fee2e2') : '#f1f5f9'} />
                <StatBox label="Online"  value={onlineExams.length}   color="#4f46e5" bg="#dbeafe" />
                <StatBox label="Written" value={hwExams.length}       color="#0891b2" bg="#ecfeff" />
              </View>

              {/* Overall student analytics */}
              {studentAnalysis && (
                <View style={[s.card, { overflow: 'hidden', marginBottom: 14 }]}>
                  <View style={{ height: 4, backgroundColor: '#0f172a' }} />
                  <View style={{ padding: 16 }}>
                    <Text style={s.cardTitle}>Student Performance Analysis</Text>
                    {studentAnalysis.strengths?.length > 0 && (
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669', marginBottom: 6 }}>STRENGTHS</Text>
                        {studentAnalysis.strengths.map((pt, i) => <Text key={i} style={{ fontSize: 12, color: '#065f46', lineHeight: 17, marginBottom: 3 }}>• {pt}</Text>)}
                      </View>
                    )}
                    {studentAnalysis.weaknesses?.length > 0 && (
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc2626', marginBottom: 6 }}>AREAS TO IMPROVE</Text>
                        {studentAnalysis.weaknesses.map((pt, i) => <Text key={i} style={{ fontSize: 12, color: '#991b1b', lineHeight: 17, marginBottom: 3 }}>• {pt}</Text>)}
                      </View>
                    )}
                    {studentAnalysis.recommendations?.length > 0 && (
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563eb', marginBottom: 6 }}>RECOMMENDATIONS</Text>
                        {studentAnalysis.recommendations.map((pt, i) => <Text key={i} style={{ fontSize: 12, color: '#1e40af', lineHeight: 17, marginBottom: 3 }}>• {pt}</Text>)}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Student subject bar chart */}
              {studentBar && (
                <Card title={`${studentName(selectedStudent)} — Subject Scores`} accent="#8b5cf6">
                  <BarChart
                    data={studentBar}
                    width={CHART_W}
                    height={200}
                    chartConfig={{
                      ...BASE_CFG,
                      color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                      barPercentage: 0.65,
                    }}
                    style={{ borderRadius: 12, marginTop: 10 }}
                    showValuesOnTopOfBars
                    fromZero
                    yAxisSuffix="%"
                    withInnerLines={false}
                  />
                </Card>
              )}

              {/* Online exams — tap for per-question breakdown */}
              {onlineExams.length > 0 && (
                <Card title="💻 Online Exams — tap for question details" accent="#4f46e5">
                  {onlineExams.map((exam, i) => {
                    const pct = Math.round(exam.percentage || 0);
                    const clr = pctColor(pct);
                    const date = exam.completed_at
                      ? new Date(exam.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[s.examRow, i < onlineExams.length - 1 && s.examBorder]}
                        onPress={() => setQModalExamId(exam.result_id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={s.examTitle} numberOfLines={1}>{exam.title}</Text>
                          <Text style={s.examMeta}>{exam.subject_name}{date ? ` · ${date}` : ''}</Text>
                          <View style={{ marginTop: 6 }}><PctBar pct={pct} color={clr} height={5} /></View>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                          <Text style={[s.examPct, { color: clr }]}>{pct}%</Text>
                          <Text style={s.examScore}>{exam.score}/{exam.total_marks}</Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>View Qs →</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </Card>
              )}

              {/* Handwritten exams */}
              {hwExams.length > 0 && (
                <Card title="✍️ Handwritten Exams — tap for AI grading details" accent="#0891b2">
                  {hwExams.map((exam, i) => {
                    const pct = Math.round(exam.percentage || 0);
                    const clr = pctColor(pct);
                    const date = (exam.completed_at || exam.created_at)
                      ? new Date(exam.completed_at || exam.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[s.examRow, i < hwExams.length - 1 && s.examBorder]}
                        onPress={() => setHwModalExamId(exam.result_id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={s.examTitle} numberOfLines={1}>{exam.title || 'Handwritten Exam'}</Text>
                          <Text style={s.examMeta}>{exam.subject_name}{date ? ` · ${date}` : ''}</Text>
                          <View style={{ marginTop: 6 }}><PctBar pct={pct} color={clr} height={5} /></View>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                          <Text style={[s.examPct, { color: clr }]}>{pct}%</Text>
                          <Text style={s.examScore}>{exam.score}/{exam.total_marks}</Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>View Details →</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </Card>
              )}
            </>
          )
        )}
      </ScrollView>

      {/* Subject Picker Modal */}
      <PickerModal
        visible={showSubjectPicker}
        title="Filter by Subject"
        items={[{ id: null, name: 'All Subjects', label: 'All Subjects' }, ...subjects.map(sub => ({ ...sub, label: sub.name }))]}
        onSelect={item => setSubjectFilter(item.id ? item : null)}
        onClose={() => setShowSubjectPicker(false)}
      />

      {/* Student Picker Modal */}
      <PickerModal
        visible={showStudentPicker}
        title="Select Student"
        items={students.map(st => ({ ...st, label: studentName(st) }))}
        onSelect={setSelectedStudent}
        onClose={() => setShowStudentPicker(false)}
      />

      {/* Per-Question Breakdown Modal (online) */}
      <QuestionDetailModal
        visible={!!qModalExamId}
        examId={qModalExamId}
        onClose={() => setQModalExamId(null)}
      />

      {/* Handwritten AI Grading Modal */}
      <HandwrittenDetailModal
        visible={!!hwModalExamId}
        examId={hwModalExamId}
        onClose={() => setHwModalExamId(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  pillsRow:     { flexDirection: 'row', gap: 8, marginTop: 16 },
  pill:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  pillVal:      { color: '#fff', fontSize: 16, fontWeight: '800' },
  pillLbl:      { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  filterBar:    { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  filterChip:   { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f8fafc' },
  filterChipActive: { borderColor: '#4f46e5', backgroundColor: '#4f46e5' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#fff' },
  card:         { backgroundColor: '#fff', borderRadius: 18, marginBottom: 14, overflow: 'hidden', elevation: 3, shadowColor: '#1e1b4b', shadowOpacity: 0.08, shadowRadius: 8 },
  pickerBtn:    { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  examRow:      { paddingVertical: 12 },
  examBorder:   { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  examTitle:    { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  examMeta:     { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  examPct:      { fontSize: 20, fontWeight: '800' },
  examScore:    { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 16 },
});
