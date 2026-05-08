import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import api from '../../api/axios';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { pctColor } from '../../utils/helpers';

const GRADIENTS = ['#4f46e5','#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6'];

function StatusBadge({ attempt, notStartedYet, expired }) {
  if (!attempt && expired)
    return <View style={[b.badge, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}><Text style={[b.text, { color: '#dc2626' }]}>⛔ Expired</Text></View>;
  if (!attempt && notStartedYet)
    return <View style={[b.badge, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}><Text style={[b.text, { color: '#64748b' }]}>🕐 Not yet</Text></View>;
  if (!attempt)
    return <View style={[b.badge, { backgroundColor: '#eef2ff', borderColor: '#e0e7ff' }]}><Text style={[b.text, { color: '#4f46e5' }]}>📝 Available</Text></View>;
  if (attempt.status === 'IN_PROGRESS')
    return <View style={[b.badge, { backgroundColor: '#fef3c7', borderColor: '#fde68a', flexDirection: 'row', gap: 4 }]}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' }} /><Text style={[b.text, { color: '#92400e' }]}>In Progress</Text></View>;
  if (attempt.status === 'COMPLETED' && attempt.grading_status !== 'COMPLETED')
    return <View style={[b.badge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}><Text style={[b.text, { color: '#92400e' }]}>⏳ Pending Review</Text></View>;
  if (attempt.status === 'COMPLETED')
    return <View style={[b.badge, { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' }]}><Text style={[b.text, { color: '#065f46' }]}>✅ Completed</Text></View>;
  return null;
}

const b = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  text:  { fontSize: 11, fontWeight: '700' },
});

export default function AssignedExamsScreen({ navigation }) {
  const [exams, setExams]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [generating, setGenerating]   = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/api/exams/assigned/my/');
      setExams(res.data.results || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const startExam = async (exam) => {
    const attempt = exam.my_attempt;
    if (attempt?.status === 'COMPLETED') return;
    if (attempt?.status === 'IN_PROGRESS') {
      navigation.navigate('TakeExam', { examId: exam.id, examTitle: exam.title }); return;
    }
    setGenerating(exam.id);
    try {
      await api.post('/api/exams/generate/', { subject_id: exam.subject, assigned_exam_id: exam.id });
      navigation.navigate('TakeExam', { examId: exam.id, examTitle: exam.title });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start exam');
    } finally { setGenerating(null); }
  };

  const now = new Date();
  const completedCount  = exams.filter(e => e.my_attempt?.status === 'COMPLETED').length;
  const inProgressCount = exams.filter(e => e.my_attempt?.status === 'IN_PROGRESS').length;
  const availableCount  = exams.filter(e => {
    const s = e.start_time ? new Date(e.start_time) : null;
    const en = e.end_time  ? new Date(e.end_time)   : null;
    return !e.my_attempt && !(s && now < s) && !(en && now > en);
  }).length;

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerLabel}>MY EXAMS</Text>
        <Text style={s.headerTitle}>Assigned Exams</Text>
        <Text style={s.headerSub}>Exams assigned to you by your teacher</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Total',       value: exams.length,    color: 'rgba(255,255,255,0.15)' },
            { label: 'Available',   value: availableCount,  color: 'rgba(79,70,229,0.3)'    },
            { label: 'In Progress', value: inProgressCount, color: 'rgba(245,158,11,0.3)'   },
            { label: 'Completed',   value: completedCount,  color: 'rgba(16,185,129,0.3)'   },
          ].map(({ label, value, color }) => (
            <View key={label} style={[s.statPill, { backgroundColor: color }]}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
      >
        {exams.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Exams Assigned Yet"
            message="Your teacher hasn't assigned any exams yet. Check back later."
            style={{ marginTop: 20 }}
          />
        ) : (
          exams.map((exam, idx) => {
            const attempt      = exam.my_attempt;
            const isCompleted  = attempt?.status === 'COMPLETED';
            const isGraded     = isCompleted && attempt?.grading_status === 'COMPLETED';
            const isInProgress = attempt?.status === 'IN_PROGRESS';
            const startTime    = exam.start_time ? new Date(exam.start_time) : null;
            const endTime      = exam.end_time   ? new Date(exam.end_time)   : null;
            const notStartedYet = startTime && now < startTime;
            const expired       = endTime && now > endTime && !attempt;
            const accentColor   = GRADIENTS[idx % GRADIENTS.length];
            const pct = attempt?.percentage != null ? Math.round(attempt.percentage) : null;
            const scoreColor = pctColor(pct);
            const fmtDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            return (
              <View key={exam.id} style={s.card}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={[s.accentStrip, { backgroundColor: accentColor }]}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
                      {exam.subject_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, padding: 14 }}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={s.examTitle} numberOfLines={2}>{exam.title}</Text>
                      <View style={{ marginTop: 6 }}>
                        <StatusBadge attempt={attempt} notStartedYet={notStartedYet} expired={expired} />
                      </View>
                    </View>

                    {/* Info chips */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <Text style={s.chip}>📚 {exam.subject_name}</Text>
                      <Text style={s.chip}>🏆 {exam.total_marks} marks</Text>
                      <Text style={s.chip}>⏱ {exam.duration_minutes} min</Text>
                      {exam.teacher_name && <Text style={s.chip}>👤 {exam.teacher_name}</Text>}
                    </View>

                    {/* Time window */}
                    {(startTime || endTime) && (
                      <View style={{ marginBottom: 10 }}>
                        {startTime && <Text style={s.timeText}>🟢 Starts: {fmtDate(startTime)}</Text>}
                        {endTime   && <Text style={s.timeText}>🔴 Ends: {fmtDate(endTime)}</Text>}
                      </View>
                    )}

                    {/* Score + action */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                      {isGraded && pct != null && (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={[s.scoreText, { color: scoreColor }]}>{pct}%</Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8' }}>Score</Text>
                        </View>
                      )}

                      {isGraded && (
                        <View style={[s.statusChip, { backgroundColor: '#d1fae5' }]}>
                          <Text style={{ color: '#065f46', fontSize: 12, fontWeight: '700' }}>✅ Graded</Text>
                        </View>
                      )}

                      {isCompleted && !isGraded && (
                        <View style={s.statusChip}>
                          <Text style={{ color: '#92400e', fontSize: 12, fontWeight: '700' }}>⏳ Awaiting grade</Text>
                        </View>
                      )}

                      {isInProgress && (
                        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#f59e0b' }]}
                          onPress={() => startExam(exam)}>
                          <Text style={s.actionBtnText}>▶ Continue</Text>
                        </TouchableOpacity>
                      )}

                      {!attempt && !expired && !notStartedYet && (
                        <TouchableOpacity
                          style={[s.actionBtn, generating === exam.id && { opacity: 0.6 }]}
                          onPress={() => startExam(exam)}
                          disabled={generating === exam.id}>
                          {generating === exam.id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={s.actionBtnText}>🚀 Start Exam</Text>
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:   { backgroundColor: '#0f172a', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn:  { marginBottom: 8 },
  backIcon: { color: '#818cf8', fontSize: 22, fontWeight: '700' },
  headerLabel: { color: '#818cf8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub:   { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  statPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 60 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  accentStrip: { width: 48, alignItems: 'center', justifyContent: 'center' },
  examTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  chip: { fontSize: 11, fontWeight: '600', color: '#64748b', backgroundColor: '#f8fafc',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  timeText: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  scoreText: { fontSize: 22, fontWeight: '800' },
  statusChip: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  actionBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', minWidth: 110 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
