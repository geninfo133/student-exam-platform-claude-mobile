import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import api from '../../api/axios';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import Card from '../../components/Card';
import StatBox from '../../components/StatBox';
import { pctColor } from '../../utils/helpers';

const W = Dimensions.get('window').width;
const CHART_W = W - 64; // inside card with 16px screen + 16px card padding each side

const PERIODS = [
  { label: '7 Days',  value: '7' },
  { label: '30 Days', value: '30' },
  { label: '90 Days', value: '90' },
  { label: 'All',     value: 'all' },
];

const BASE_CFG = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo:   '#ffffff',
  decimalPlaces: 0,
  labelColor: () => '#94a3b8',
  style: { borderRadius: 12 },
};

export default function StudentAnalyticsScreen({ navigation }) {
  const [period, setPeriod]   = useState(PERIODS[3]);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/analytics/student/?period=${period.value}`);
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const ov          = data?.overview || {};
  const subjects    = data?.subjects || data?.subject_breakdown || [];
  const recentExams = data?.recent_exams || data?.recent || [];
  const improvement = data?.improvement || data?.improvement_data || [];
  const qta         = data?.question_type_analysis || null;

  const avgPct     = ov.average_percentage ?? ov.avg_score ?? null;
  const totalExams = ov.total_exams ?? ov.exams_taken ?? 0;
  const passRate   = ov.pass_rate ?? null;
  const passCount  = ov.pass_count ?? null;
  const failCount  = ov.fail_count ?? null;

  const bestSub = subjects.reduce((b, s) => (!b || (s.average_percentage || 0) > (b.average_percentage || 0) ? s : b), null);
  const weakSub = subjects.filter(s => s !== bestSub).reduce((w, s) => (!w || (s.average_percentage || 0) < (w.average_percentage || 0) ? s : w), null);

  // Charts data — guard against empty arrays
  const barData = subjects.length > 0 ? {
    labels: subjects.map(s => (s.subject_name || s.name || '').slice(0, 5)),
    datasets: [{ data: subjects.map(s => Math.round(s.average_percentage || s.percentage || 0)) }],
  } : null;

  const lineData = improvement.length >= 2 ? {
    labels: improvement.map(p => String(p.label || p.period || '').slice(0, 4)),
    datasets: [{ data: improvement.map(p => Math.round(p.percentage || p.avg || 0) || 0) }],
  } : null;

  const pieData = passCount > 0 || failCount > 0 ? [
    { name: 'Pass', count: passCount || 0, color: '#10b981', legendFontColor: '#334155', legendFontSize: 13 },
    { name: 'Fail', count: failCount || 0, color: '#ef4444', legendFontColor: '#334155', legendFontSize: 13 },
  ].filter(d => d.count > 0) : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerLabel}>STUDENT PORTAL</Text>
        <Text style={s.headerTitle}>My Analytics</Text>
        <Text style={s.headerSub}>Your performance at a glance</Text>
        <View style={s.pillsRow}>
          {[
            { label: 'Exams',     value: totalExams || 0 },
            { label: 'Avg Score', value: avgPct != null ? `${Math.round(avgPct)}%` : '—' },
            { label: 'Pass Rate', value: passRate != null ? `${passRate}%` : '—' },
            { label: 'Subjects',  value: subjects.length },
          ].map(({ label, value }) => (
            <View key={label} style={s.pill}>
              <Text style={s.pillVal}>{value}</Text>
              <Text style={s.pillLbl}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Period tabs */}
      <View style={s.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.value}
            style={[s.periodBtn, period.value === p.value && s.periodActive]}
            onPress={() => { setPeriod(p); setLoading(true); }}
          >
            <Text style={[s.periodText, period.value === p.value && s.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingScreen />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Stat boxes */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <StatBox label="Exams" value={totalExams} color="#4f46e5" bg="#eef2ff" />
            <StatBox
              label="Avg Score"
              value={avgPct != null ? `${Math.round(avgPct)}%` : '—'}
              color={avgPct != null ? pctColor(avgPct) : '#64748b'}
              bg={avgPct != null ? (avgPct >= 60 ? '#d1fae5' : avgPct >= 35 ? '#fef3c7' : '#fee2e2') : '#f1f5f9'}
            />
            <StatBox label="Best" value={bestSub ? `${Math.round(bestSub.average_percentage || 0)}%` : '—'} sub={bestSub?.subject_name?.slice(0, 7)} color="#059669" bg="#d1fae5" />
            {weakSub ? <StatBox label="Weak" value={`${Math.round(weakSub.average_percentage || 0)}%`} sub={weakSub?.subject_name?.slice(0, 7)} color="#dc2626" bg="#fee2e2" /> : null}
          </View>

          {/* Subject Performance bar chart */}
          {barData ? (
            <Card title="Subject Performance" accent="#4f46e5">
              <BarChart
                data={barData}
                width={CHART_W}
                height={200}
                chartConfig={{
                  ...BASE_CFG,
                  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                  barPercentage: 0.65,
                }}
                style={{ borderRadius: 12, marginTop: 10 }}
                showValuesOnTopOfBars
                fromZero
                yAxisSuffix="%"
                withInnerLines={false}
              />
            </Card>
          ) : null}

          {/* Pass / Fail pie */}
          {pieData?.length >= 2 ? (
            <Card title="Pass / Fail Breakdown" accent="#10b981">
              <PieChart
                data={pieData}
                width={CHART_W}
                height={160}
                chartConfig={BASE_CFG}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                style={{ marginTop: 8 }}
              />
              <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>Passed: {passCount}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>Failed: {failCount}</Text>
              </View>
            </Card>
          ) : null}

          {/* Question Insights */}
          {qta && (qta.avg_correct > 0 || qta.avg_wrong > 0) ? (
            <Card title="Question Insights" accent="#0891b2">
              {/* Correct / Wrong / Unanswered visual */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 14 }}>
                <View style={[s.insightBox, { backgroundColor: '#d1fae5' }]}>
                  <Text style={[s.insightVal, { color: '#059669' }]}>{qta.avg_correct}</Text>
                  <Text style={[s.insightLbl, { color: '#059669' }]}>Avg Correct</Text>
                </View>
                <View style={[s.insightBox, { backgroundColor: '#fee2e2' }]}>
                  <Text style={[s.insightVal, { color: '#dc2626' }]}>{qta.avg_wrong}</Text>
                  <Text style={[s.insightLbl, { color: '#dc2626' }]}>Avg Wrong</Text>
                </View>
                <View style={[s.insightBox, { backgroundColor: '#f1f5f9' }]}>
                  <Text style={[s.insightVal, { color: '#64748b' }]}>{qta.avg_unanswered}</Text>
                  <Text style={[s.insightLbl, { color: '#64748b' }]}>Skipped</Text>
                </View>
              </View>

              {/* Question type score rows */}
              {[
                { label: 'MCQ Avg Score',        value: qta.mcq_avg,   color: '#4f46e5' },
                { label: 'Short Answer Avg',      value: qta.short_avg, color: '#8b5cf6' },
                { label: 'Long Answer Avg',       value: qta.long_avg,  color: '#0891b2' },
              ].filter(r => r.value > 0).map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{row.label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: row.color }}>{row.value}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {/* What to Improve */}
          {qta && (
            <Card title="What to Improve" accent="#dc2626">
              {(() => {
                const tips = [];
                if (qta.avg_wrong > 1.5) tips.push({ icon: '❌', text: `You average ${qta.avg_wrong} wrong answers per exam. Review questions before submitting.` });
                if (qta.avg_unanswered > 0.5) tips.push({ icon: '⏭️', text: `You skip ~${qta.avg_unanswered} questions per exam. Attempt every question — even a partial answer earns marks.` });
                if (qta.short_avg < qta.mcq_avg * 0.5 && qta.short_avg > 0) tips.push({ icon: '✍️', text: 'Short answer scores are low. Practice writing structured answers with key points.' });
                if (qta.long_avg < qta.mcq_avg * 0.4 && qta.long_avg > 0) tips.push({ icon: '📝', text: 'Long answer performance needs improvement. Use introduction, points, and conclusion structure.' });
                if (qta.avg_wrong <= 1 && qta.avg_unanswered <= 0.5) tips.push({ icon: '🌟', text: 'Great consistency! Keep practicing to maintain and improve your average.' });
                if (tips.length === 0) tips.push({ icon: '📚', text: 'Complete more exams to get personalised improvement tips.' });
                return tips.map((tip, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#f1f5f9', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 18 }}>{tip.icon}</Text>
                    <Text style={{ fontSize: 13, color: '#334155', flex: 1, lineHeight: 19 }}>{tip.text}</Text>
                  </View>
                ));
              })()}
            </Card>
          )}

          {/* Recent Exams — tap to see per-question breakdown */}
          {recentExams.length > 0 ? (
            <Card title="Recent Exams — tap for question details" accent="#f59e0b">
              {recentExams.slice(0, 8).map((exam, i) => {
                const pct = Math.round(exam.percentage || exam.score_percentage || 0);
                const clr = pctColor(pct);
                const date = exam.date
                  ? new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
                const hasQTypes = exam.type === 'online' && (exam.mcq_score > 0 || exam.short_answer_score > 0 || exam.long_answer_score > 0);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.examRow, i < Math.min(recentExams.length, 8) - 1 && s.examBorder]}
                    onPress={() => navigation.navigate('ExamResultDetail', { resultId: exam.id, type: exam.type || 'online' })}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.examTitle} numberOfLines={1}>{exam.exam_title || exam.title || exam.subject}</Text>
                        <View style={{ backgroundColor: exam.type === 'online' ? '#eef2ff' : '#ecfeff', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: exam.type === 'online' ? '#4f46e5' : '#0891b2' }}>{exam.type === 'online' ? 'ONLINE' : 'WRITTEN'}</Text>
                        </View>
                      </View>
                      <Text style={s.examMeta}>{exam.subject}{date ? ` · ${date}` : ''}</Text>
                      {hasQTypes && (
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                          {exam.mcq_score > 0 && <Text style={{ fontSize: 10, color: '#4f46e5', fontWeight: '600' }}>MCQ: {exam.mcq_score}</Text>}
                          {exam.short_answer_score > 0 && <Text style={{ fontSize: 10, color: '#8b5cf6', fontWeight: '600' }}>Short: {exam.short_answer_score}</Text>}
                          {exam.long_answer_score > 0 && <Text style={{ fontSize: 10, color: '#0891b2', fontWeight: '600' }}>Long: {exam.long_answer_score}</Text>}
                        </View>
                      )}
                      <View style={{ marginTop: 5, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ height: 5, width: `${Math.min(pct, 100)}%`, backgroundColor: clr, borderRadius: 3 }} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 14 }}>
                      <Text style={[s.examPct, { color: clr }]}>{pct}%</Text>
                      <Text style={s.examScore}>{exam.score ?? 0}/{exam.total_marks ?? '—'}</Text>
                      <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>View →</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>
          ) : null}

          {/* Performance Trend */}
          {lineData ? (
            <Card title="Performance Trend" accent="#8b5cf6">
              <LineChart
                data={lineData}
                width={CHART_W}
                height={180}
                chartConfig={{
                  ...BASE_CFG,
                  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                  propsForDots: { r: '5', strokeWidth: '2', stroke: '#8b5cf6' },
                }}
                bezier
                style={{ borderRadius: 12, marginTop: 10 }}
                yAxisSuffix="%"
                withInnerLines={false}
              />
            </Card>
          ) : null}

          {!data || (subjects.length === 0 && recentExams.length === 0) ? (
            <EmptyState
              icon="📊"
              title="No Data Yet"
              message="Complete some exams to see your analytics here."
              style={{ marginTop: 20 }}
            />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header:      { backgroundColor: '#1e1b4b', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn:     { color: '#a5b4fc', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  headerLabel: { color: '#818cf8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSub:   { color: '#94a3b8', fontSize: 12, marginTop: 4, marginBottom: 16 },
  pillsRow:    { flexDirection: 'row', gap: 8 },
  pill:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  pillVal:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  pillLbl:     { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  periodRow:   { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  periodBtn:   { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center', backgroundColor: '#f1f5f9' },
  periodActive:{ backgroundColor: '#4f46e5' },
  periodText:  { fontSize: 12, fontWeight: '700', color: '#64748b' },
  periodTextActive: { color: '#fff' },
  examRow:     { paddingVertical: 12, borderRadius: 8 },
  examBorder:  { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  insightBox:  { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  insightVal:  { fontSize: 22, fontWeight: '800' },
  insightLbl:  { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  examTitle:   { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  examMeta:    { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  examPct:     { fontSize: 20, fontWeight: '800' },
  examScore:   { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});
