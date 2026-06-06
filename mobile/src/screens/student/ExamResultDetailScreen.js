import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import Svg, { Circle, G } from 'react-native-svg';
import api from '../../api/axios';
import LoadingScreen from '../../components/LoadingScreen';
import { deriveHWAnalysis, deriveOnlineAnalysis } from '../../utils/helpers';

const W = Dimensions.get('window').width;
const CHART_W = W - 48;

function DonutChart({ scored, total, size = 180, strokeWidth = 36 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const scoredPct = total > 0 ? scored / total : 0;
  const center = size / 2;
  const scoredColor = '#f59e0b';
  const remainColor = '#e5e7eb';
  const remainPct = 1 - scoredPct;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center},${center}`}>
          {/* Remaining arc (background) */}
          <Circle
            cx={center} cy={center} r={r}
            fill="none" stroke={remainColor} strokeWidth={strokeWidth}
            strokeDasharray={`${circ * remainPct} ${circ * scoredPct}`}
            strokeLinecap="butt"
          />
          {/* Scored arc */}
          <Circle
            cx={center} cy={center} r={r}
            fill="none" stroke={scoredColor} strokeWidth={strokeWidth}
            strokeDasharray={`${circ * scoredPct} ${circ * remainPct}`}
            strokeDashoffset={-(circ * remainPct)}
            strokeLinecap="butt"
          />
        </G>
      </Svg>
      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
        {[
          { color: remainColor, label: 'Remaining' },
          { color: scoredColor, label: 'Scored' },
        ].map(({ color, label }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: color }} />
            <Text style={{ fontSize: 12, color: '#64748b' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const BAR_W = 14;
const GROUP_W = BAR_W * 2 + 6 + 16; // two bars + gap + padding

function GroupedBarChart({ data, height = 220 }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.flatMap(d => [d.obtained, d.total]), 1);
  const chartH = height - 44;
  const ySteps = 4;

  return (
    <View style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', height }}>
        {/* Y-axis */}
        <View style={{ width: 28, justifyContent: 'space-between', paddingBottom: 28 }}>
          {Array.from({ length: ySteps + 1 }).map((_, i) => {
            const val = Math.round(maxVal * (1 - i / ySteps));
            return (
              <Text key={i} style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', paddingRight: 2 }}>
                {val}
              </Text>
            );
          })}
        </View>

        {/* Scrollable bars area */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexDirection: 'row', alignItems: 'flex-end',
            paddingBottom: 28, paddingHorizontal: 4,
            borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0',
          }}
        >
          {data.map(({ label, obtained, total }) => (
            <View key={label} style={{ alignItems: 'center', width: GROUP_W }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                <View style={{ width: BAR_W, alignItems: 'center' }}>
                  <View style={{
                    width: BAR_W,
                    height: Math.max((obtained / maxVal) * chartH, obtained > 0 ? 3 : 0),
                    backgroundColor: '#6366f1',
                    borderRadius: 2,
                  }} />
                </View>
                <View style={{ width: BAR_W, alignItems: 'center' }}>
                  <View style={{
                    width: BAR_W,
                    height: Math.max((total / maxVal) * chartH, 3),
                    backgroundColor: '#e0e7ff',
                    borderRadius: 2,
                  }} />
                </View>
              </View>
              <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>{label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 4, paddingLeft: 32 }}>
        {[{ color: '#6366f1', label: 'Obtained' }, { color: '#e2e8f0', label: 'Total' }].map(({ color, label }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: color }} />
            <Text style={{ fontSize: 11, color: '#64748b' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const CHART_CFG = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo:   '#ffffff',
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: () => '#94a3b8',
  decimalPlaces: 0,
};

function getGradeInfo(pct) {
  if (pct >= 90) return { grade: 'A+', color: '#059669', bg: '#d1fae5', border: '#a7f3d0' };
  if (pct >= 80) return { grade: 'A',  color: '#059669', bg: '#d1fae5', border: '#a7f3d0' };
  if (pct >= 70) return { grade: 'B',  color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' };
  if (pct >= 60) return { grade: 'C',  color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' };
  if (pct >= 40) return { grade: 'D',  color: '#d97706', bg: '#fef3c7', border: '#fde68a' };
  return               { grade: 'F',  color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' };
}

// Custom score ring using View (no SVG dependency)
function RingView({ pct, size = 110 }) {
  const g = getGradeInfo(pct);
  const segments = 40;
  const filled = Math.round(segments * pct / 100);
  const r = size / 2 - 8;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i * (360 / segments) - 90) * (Math.PI / 180);
        return (
          <View key={i} style={{
            position: 'absolute', width: 6, height: 6, borderRadius: 3,
            backgroundColor: i < filled ? g.color : '#e2e8f0',
            left: size / 2 + r * Math.cos(angle) - 3,
            top:  size / 2 + r * Math.sin(angle) - 3,
          }} />
        );
      })}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{pct}%</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>Grade {g.grade}</Text>
      </View>
    </View>
  );
}

export default function ExamResultDetailScreen({ route, navigation }) {
  const { resultId, type = 'online' } = route.params || {};

  const [result, setResult]       = useState(null);
  const [answers, setAnswers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const load = useCallback(async () => {
    try {
      const url = type === 'handwritten'
        ? `/api/handwritten/${resultId}/`
        : `/api/exams/${resultId}/result/`;
      const res = await api.get(url);
      setResult(res.data);
      setAnswers(type === 'handwritten'
        ? (res.data?.grading_data?.questions || [])
        : (res.data?.answers || []));
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
  const g = getGradeInfo(pct);
  const score = isHW ? (result.obtained_marks ?? 0) : (result.score ?? result.obtained_marks ?? 0);
  const totalMarks = result.total_marks
    || (isHW ? 0 : answers.reduce((s, a) => s + (a.question?.marks || 0), 0));

  const correct   = isHW
    ? answers.filter(a => (a.marks_awarded ?? 0) >= (a.max_marks ?? 1)).length
    : (result.correct_answers ?? 0);
  const incorrect = isHW
    ? answers.filter(a => (a.marks_awarded ?? 0) === 0 && a.student_answer).length
    : (result.wrong_answers ?? 0);
  const unanswered = isHW
    ? answers.filter(a => !a.student_answer).length
    : (result.unanswered ?? 0);

  const analysis = result.analysis || {};
  const typeBreakdown = analysis.question_type_breakdown || result.analysis_data?.question_type_breakdown || {};
  const diffBreakdown = analysis.difficulty_breakdown   || result.analysis_data?.difficulty_breakdown   || {};

  // Charts
  const typeChartEntries = Object.entries(typeBreakdown).map(([k, v]) => ({
    label: k === 'MCQ' ? 'MCQ' : k === 'SHORT' ? 'Short Answer' : 'Long Answer',
    obtained: v.marks_obtained || 0,
    total:    v.total_marks    || 0,
  })).filter(e => e.total > 0);

  const pieRaw = [
    { name: 'Correct',    count: Math.max(correct, 0.001),    color: '#10b981', legendFontColor: '#334155', legendFontSize: 12 },
    { name: 'Wrong',      count: Math.max(incorrect, 0.001),  color: '#ef4444', legendFontColor: '#334155', legendFontSize: 12 },
    { name: 'Unanswered', count: Math.max(unanswered, 0.001), color: '#94a3b8', legendFontColor: '#334155', legendFontSize: 12 },
  ];
  const pieData = (correct > 0 || incorrect > 0 || unanswered > 0) ? pieRaw : null;

  const diffEntries = Object.entries(diffBreakdown);

  const aiAnalysis = isHW
    ? (result.grading_data?.analysis || deriveHWAnalysis(answers, pct))
    : ((analysis.strengths?.length > 0 || analysis.weaknesses?.length > 0)
        ? analysis : deriveOnlineAnalysis(answers, pct));

  const isPending = result.grading_status === 'PENDING_REVIEW';
  const isGrading = ['NOT_STARTED', 'GRADING_MCQ', 'GRADING_DESCRIPTIVE', 'ANALYZING'].includes(result.grading_status);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header banner */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>

        {!isPending && !isGrading && (
          <View style={s.headerContent}>
            {/* Score ring */}
            <RingView pct={pct} size={110} />

            {/* Exam info */}
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={s.headerTitle} numberOfLines={2}>
                {result.subject_name || result.title || result.exam_title || 'Result'}
              </Text>
              {isHW ? (
                <View style={{ marginBottom: 6 }}>
                  <View style={{ backgroundColor: 'rgba(139,92,246,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6, borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)' }}>
                    <Text style={{ color: '#c4b5fd', fontSize: 10, fontWeight: '700' }}>✍️ Handwritten</Text>
                  </View>
                  <Text style={s.headerSub}>{result.subject_name || ''}</Text>
                </View>
              ) : (
                <Text style={s.headerSub}>
                  {result.exam_type_name || result.exam_category_display || ''}
                  {result.chapter_name ? ` · ${result.chapter_name}` : ''}
                </Text>
              )}
              {isHW ? (
                <View style={s.typeRow}>
                  {[
                    { label: 'Obtained', value: score },
                    { label: 'Total',    value: totalMarks },
                    { label: 'Lost',     value: totalMarks - score },
                  ].map(({ label, value }) => (
                    <View key={label} style={s.typeChip}>
                      <Text style={s.typeChipVal}>{value}</Text>
                      <Text style={s.typeChipLbl}>{label}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={s.typeRow}>
                  {[
                    { label: `MCQ /${result.total_mcq_marks ?? 20}`,    value: result.mcq_score ?? '-' },
                    { label: `Short /${result.total_short_marks ?? 10}`, value: result.short_answer_score ?? '-' },
                    { label: `Long /${result.total_long_marks ?? 20}`,   value: result.long_answer_score ?? '-' },
                  ].map(({ label, value }) => (
                    <View key={label} style={s.typeChip}>
                      <Text style={s.typeChipVal}>{value}</Text>
                      <Text style={s.typeChipLbl}>{label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Grade badge */}
            <View style={[s.gradeBadge, { backgroundColor: g.bg, borderColor: g.border }]}>
              <Text style={[s.gradeText, { color: g.color }]}>{g.grade}</Text>
            </View>
          </View>
        )}

        {isPending && (
          <View style={s.pendingBox}>
            <Text style={s.pendingTitle}>{result.title || 'Exam Submitted'}</Text>
            <Text style={s.pendingMsg}>Your teacher will review and grade your answers.</Text>
          </View>
        )}
        {isGrading && (
          <View style={s.pendingBox}>
            <Text style={s.pendingTitle}>Grading in progress…</Text>
            <Text style={s.pendingMsg}>This may take a minute for descriptive answers.</Text>
          </View>
        )}
      </View>

      {isPending ? (
        <View style={{ padding: 20 }}>
          <TouchableOpacity style={s.dashBtn} onPress={() => navigation.navigate('StudentTabs')}>
            <Text style={s.dashBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
        >
          {/* Stat tiles */}
          {!isGrading && (() => {
            const stats = isHW ? [
              { label: 'Obtained', value: score,              color: '#059669', bg: '#d1fae5' },
              { label: 'Total',    value: totalMarks,         color: '#4f46e5', bg: '#eef2ff' },
              { label: 'Lost',     value: totalMarks - score, color: '#dc2626', bg: '#fee2e2' },
            ] : [
              { label: 'Correct',    value: correct,    color: '#059669', bg: '#d1fae5' },
              { label: 'Wrong',      value: incorrect,  color: '#dc2626', bg: '#fee2e2' },
              { label: 'Unanswered', value: unanswered, color: '#94a3b8', bg: '#f1f5f9' },
              { label: 'Percentile', value: analysis.percentile ? `${analysis.percentile}%` : '—', color: '#4f46e5', bg: '#eef2ff' },
            ];
            return (
              <View style={s.statsRow}>
                {stats.map(({ label, value, color, bg }) => (
                  <View key={label} style={[s.statBox, { backgroundColor: bg }]}>
                    <Text style={[s.statVal, { color }]}>{value}</Text>
                    <Text style={[s.statLbl, { color: '#64748b' }]}>{label}</Text>
                  </View>
                ))}
              </View>
            );
          })()}

          {/* Handwritten: Score Overview donut + Question-wise bar */}
          {!isGrading && isHW && totalMarks > 0 && (
            <>
              {/* Score Overview — proper SVG donut */}
              <View style={[s.chartCard, { marginBottom: 12 }]}>
                <View style={s.chartHeader}>
                  <Text style={s.chartTitle}>Score Overview</Text>
                </View>
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <DonutChart scored={score} total={totalMarks} size={200} strokeWidth={48} />
                </View>
              </View>

              {/* Question-wise Marks — Max + Scored bars per question (matches web) */}
              {answers.length > 0 && (
                <View style={[s.chartCard, { marginBottom: 12 }]}>
                  <View style={s.chartHeader}>
                    <Text style={s.chartTitle}>Question-wise Marks</Text>
                  </View>
                  <GroupedBarChart
                    data={answers.map((q, i) => ({
                      label: `Q${q.question_number ?? i + 1}`,
                      obtained: q.marks_awarded ?? 0,
                      total:    q.max_marks ?? 1,
                    }))}
                    height={200}
                  />
                </View>
              )}
            </>
          )}

          {/* Online: Marks by Question Type */}
          {!isGrading && !isHW && typeChartEntries.length > 0 && (
            <View style={[s.chartCard, { marginBottom: 12 }]}>
              <View style={s.chartHeader}>
                <Text style={s.chartTitle}>Marks by Question Type</Text>
              </View>
              <GroupedBarChart data={typeChartEntries} height={200} />
            </View>
          )}

          {/* Online: Answer Distribution */}
          {!isGrading && !isHW && pieData && (
            <View style={[s.chartCard, { marginBottom: 12 }]}>
              <View style={s.chartHeader}>
                <Text style={s.chartTitle}>Answer Distribution</Text>
              </View>
              <View style={{ alignItems: 'center', paddingTop: 8 }}>
                <PieChart
                  data={pieData}
                  width={CHART_W}
                  height={200}
                  chartConfig={CHART_CFG}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                />
              </View>
            </View>
          )}

          {/* Performance by Difficulty */}
          {!isGrading && diffEntries.length > 0 && (
            <View style={[s.chartCard, { marginBottom: 12 }]}>
              <View style={[s.chartHeader, { backgroundColor: '#1e1b4b' }]}>
                <Text style={s.chartTitle}>Performance by Difficulty</Text>
              </View>
              <View style={{ padding: 14, gap: 10 }}>
                {diffEntries.map(([key, val]) => (
                  <View key={key}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>{key}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#8b5cf6' }}>{Math.round(val.percentage || 0)}%</Text>
                    </View>
                    <View style={{ height: 24, backgroundColor: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                      <View style={{ height: 24, width: `${Math.min(val.percentage || 0, 100)}%`, backgroundColor: '#8b5cf6', borderRadius: 6 }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Insights: Strengths / Areas to Improve / Suggestions */}
          {!isGrading && aiAnalysis && (
            <View style={{ gap: 10, marginBottom: 12 }}>
              {aiAnalysis.weaknesses?.length > 0 && (
                <View style={[s.insightCard, { borderTopColor: '#ef4444' }]}>
                  <View style={[s.insightHeader, { backgroundColor: '#ef4444' }]}>
                    <Text style={s.insightTitle}>Areas to Improve</Text>
                  </View>
                  <View style={{ padding: 14, gap: 4 }}>
                    {aiAnalysis.weaknesses.map((w, i) => (
                      <Text key={i} style={{ fontSize: 13, color: '#334155' }}>- {w}</Text>
                    ))}
                  </View>
                </View>
              )}
              {aiAnalysis.recommendations?.length > 0 && (
                <View style={[s.insightCard, { borderTopColor: '#6366f1' }]}>
                  <View style={[s.insightHeader, { backgroundColor: '#6366f1' }]}>
                    <Text style={s.insightTitle}>Suggestions</Text>
                  </View>
                  <View style={{ padding: 14, gap: 4 }}>
                    {aiAnalysis.recommendations.map((r, i) => (
                      <Text key={i} style={{ fontSize: 13, color: '#334155' }}>• {r}</Text>
                    ))}
                  </View>
                </View>
              )}
              {aiAnalysis.strengths?.length > 0 && (
                <View style={[s.insightCard, { borderTopColor: '#10b981' }]}>
                  <View style={[s.insightHeader, { backgroundColor: '#10b981' }]}>
                    <Text style={s.insightTitle}>Strengths</Text>
                  </View>
                  <View style={{ padding: 14, gap: 4 }}>
                    {aiAnalysis.strengths.map((str, i) => (
                      <Text key={i} style={{ fontSize: 13, color: '#334155' }}>+ {str}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* AI Suggestions */}
          {!isGrading && result.suggestions && (
            <View style={[s.insightCard, { marginBottom: 12, borderTopColor: '#f59e0b' }]}>
              <View style={[s.insightHeader, { backgroundColor: '#f59e0b' }]}>
                <Text style={s.insightTitle}>✦ AI Suggestions</Text>
              </View>
              <View style={{ padding: 14 }}>
                <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>{result.suggestions}</Text>
              </View>
            </View>
          )}

          {/* Review Answers toggle */}
          {!isGrading && answers.length > 0 && (
            <TouchableOpacity
              style={s.reviewBtn}
              onPress={() => setShowAnswers(v => !v)}
            >
              <Text style={s.reviewBtnText}>{showAnswers ? 'Hide Answers' : 'Review Answers'}</Text>
            </TouchableOpacity>
          )}

          {/* Answer cards */}
          {showAnswers && answers.map((ans, i) => {
            const hwQ = isHW;
            const qText    = hwQ ? ans.question_text           : ans.question?.question_text;
            const qType    = hwQ ? null                        : ans.question?.question_type;
            const qMarks   = hwQ ? ans.max_marks               : ans.question?.marks;
            const marksGot = hwQ ? ans.marks_awarded           : ans.marks_obtained;
            const studentAns = hwQ ? ans.student_answer        : (ans.selected_answer || ans.text_answer);
            const correctAns = hwQ ? ans.correct_answer        : ans.question?.correct_answer;
            const modelAns   = hwQ ? null                      : ans.question?.model_answer;
            const feedback   = hwQ ? ans.feedback              : (ans.teacher_feedback || ans.ai_feedback);
            const expl       = hwQ ? null                      : ans.question?.explanation;
            const isMCQ      = !hwQ && (qType === 'MCQ' || qType === 'TRUE_FALSE');
            const isOk       = hwQ ? (marksGot ?? 0) >= (qMarks ?? 1) : ans.is_correct === true;
            const isPartial  = hwQ && (marksGot ?? 0) > 0 && (marksGot ?? 0) < (qMarks ?? 1);
            const borderColor = isOk ? '#10b981' : isPartial ? '#f59e0b' : '#e2e8f0';
            const bgColor     = isOk ? '#f0fdf4' : isPartial ? '#fffbeb' : '#fff';

            return (
              <View key={i} style={[s.ansCard, { borderLeftColor: borderColor, backgroundColor: bgColor }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {qType && (
                      <View style={{ backgroundColor: qType === 'MCQ' ? '#dbeafe' : qType === 'SHORT' ? '#fef9c3' : '#ede9fe', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: qType === 'MCQ' ? '#1e40af' : qType === 'SHORT' ? '#854d0e' : '#5b21b6' }}>{qType}</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700' }}>
                      Q{hwQ ? (ans.question_number ?? i + 1) : i + 1}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isOk ? '#059669' : isPartial ? '#d97706' : '#dc2626' }}>
                    {marksGot != null ? `${marksGot}/${qMarks ?? '?'} marks` : ''}
                    {isOk ? ' ✅' : isPartial ? ' ⚡' : ' ❌'}
                  </Text>
                </View>

                {qText ? <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18, marginBottom: 8 }}>{qText}</Text> : null}

                {isMCQ ? (
                  <View style={{ gap: 4 }}>
                    {['A', 'B', 'C', 'D'].map(opt => {
                      const txt = ans.question[`option_${opt.toLowerCase()}`];
                      if (!txt) return null;
                      const isCor = opt === ans.question.correct_answer;
                      const isSel = opt === ans.selected_answer;
                      return (
                        <View key={opt} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, backgroundColor: isCor ? '#d1fae5' : isSel && !isCor ? '#fee2e2' : '#f8fafc' }}>
                          <View style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isCor ? '#10b981' : isSel && !isCor ? '#ef4444' : '#e2e8f0' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: (isCor || (isSel && !isCor)) ? '#fff' : '#64748b' }}>{opt}</Text>
                          </View>
                          <Text style={{ fontSize: 12, flex: 1, color: isCor ? '#065f46' : isSel && !isCor ? '#991b1b' : '#334155' }}>
                            {txt}{isCor ? ' ✓' : ''}{isSel && !isCor ? ' ✗' : ''}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={{ gap: 6 }}>
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: 10 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4 }}>Your Answer</Text>
                      <Text style={{ fontSize: 12, color: '#334155' }}>{studentAns || '(not answered)'}</Text>
                    </View>
                    {correctAns && !hwQ && (
                      <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669', marginBottom: 4 }}>Expected Answer</Text>
                        <Text style={{ fontSize: 12, color: '#065f46' }}>{correctAns}</Text>
                      </View>
                    )}
                    {modelAns && (
                      <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669', marginBottom: 4 }}>Model Answer</Text>
                        <Text style={{ fontSize: 12, color: '#065f46' }}>{modelAns}</Text>
                      </View>
                    )}
                    {feedback && (
                      <View style={{ backgroundColor: '#eff6ff', borderRadius: 8, padding: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#3b82f6', marginBottom: 4 }}>AI Feedback</Text>
                        <Text style={{ fontSize: 12, color: '#1e40af' }}>{feedback}</Text>
                      </View>
                    )}
                    {expl && (
                      <View style={{ backgroundColor: '#fffbeb', borderRadius: 8, padding: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#d97706', marginBottom: 4 }}>Explanation</Text>
                        <Text style={{ fontSize: 12, color: '#92400e' }}>{expl}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Actions */}
          {!isGrading && (
            <View style={s.actions}>
              <TouchableOpacity style={s.dashBtn} onPress={() => navigation.navigate('StudentTabs')}>
                <Text style={s.dashBtnText}>Back to Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.historyBtn} onPress={() => navigation.navigate('Results')}>
                <Text style={s.historyBtnText}>Exam History</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header:       { backgroundColor: '#0f172a', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20,
                  backgroundImage: undefined },
  backBtn:      { color: '#818cf8', fontSize: 13, fontWeight: '600', marginBottom: 12 },
  headerContent:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  headerSub:    { color: '#818cf8', fontSize: 12, marginBottom: 8 },
  typeRow:      { flexDirection: 'row', gap: 8, marginTop: 4 },
  typeChip:     { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  typeChipVal:  { color: '#fff', fontSize: 15, fontWeight: '800' },
  typeChipLbl:  { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
  gradeBadge:   { width: 64, height: 64, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  gradeText:    { fontSize: 26, fontWeight: '900' },
  pendingBox:   { backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  pendingTitle: { color: '#fcd34d', fontWeight: '700', fontSize: 15 },
  pendingMsg:   { color: 'rgba(252,211,77,0.8)', fontSize: 13, marginTop: 4 },

  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox:      { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', elevation: 1 },
  statVal:      { fontSize: 20, fontWeight: '800' },
  statLbl:      { fontSize: 10, marginTop: 2, fontWeight: '600' },

  chartCard:    { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  chartHeader:  { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 10 },
  chartTitle:   { color: '#fff', fontWeight: '700', fontSize: 11 },

  insightCard:  { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, borderTopWidth: 0 },
  insightHeader:{ paddingHorizontal: 14, paddingVertical: 10 },
  insightTitle: { color: '#fff', fontWeight: '700', fontSize: 13 },

  reviewBtn:    { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  reviewBtnText:{ color: '#fff', fontWeight: '800', fontSize: 14 },

  ansCard:      { borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4 },

  actions:      { flexDirection: 'row', gap: 10, marginTop: 8 },
  dashBtn:      { flex: 1, backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  dashBtnText:  { color: '#fff', fontWeight: '800', fontSize: 13 },
  historyBtn:   { paddingHorizontal: 20, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  historyBtnText:{ color: '#475569', fontWeight: '700', fontSize: 13 },
});
