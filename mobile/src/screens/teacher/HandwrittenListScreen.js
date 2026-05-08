import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { pctColor } from '../../utils/helpers';

const STATUS_CFG = {
  UPLOADED:   { label: 'Uploaded',   bg: '#f1f5f9', color: '#64748b', icon: '📤' },
  PROCESSING: { label: 'Processing', bg: '#fef3c7', color: '#92400e', icon: '⏳' },
  GRADED:     { label: 'Graded',     bg: '#d1fae5', color: '#065f46', icon: '✅' },
  FAILED:     { label: 'Failed',     bg: '#fee2e2', color: '#dc2626', icon: '❌' },
};

function getStatus(exam) {
  return STATUS_CFG[exam.status] || STATUS_CFG.UPLOADED;
}

export default function HandwrittenListScreen({ navigation }) {
  const [exams, setExams]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(new Set());

  const fetchExams = useCallback(async () => {
    try {
      const res = await api.get('/api/handwritten/');
      setExams(res.data?.results || res.data || []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  useEffect(() => {
    const hasProcessing = exams.some(e => e.status === 'PROCESSING');
    if (!hasProcessing) return;
    const interval = setInterval(fetchExams, 3000);
    return () => clearInterval(interval);
  }, [exams, fetchExams]);

  const handleGrade = async (id, includeAnalysis = false) => {
    setProcessing(prev => new Set(prev).add(id));
    try {
      await api.post(`/api/handwritten/${id}/process/`, { include_analysis: includeAnalysis });
      fetchExams();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start grading');
      setProcessing(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this handwritten exam?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/handwritten/${id}/delete/`);
            setExams(prev => prev.filter(e => e.id !== id));
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Delete failed');
          }
        },
      },
    ]);
  };

  const graded      = exams.filter(e => e.status === 'GRADED').length;
  const inProgress  = exams.filter(e => e.status === 'PROCESSING').length;

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label="TEACHER PORTAL"
        title="Handwritten Exams"
        subtitle="AI graded answer sheets"
      >
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Total',      value: exams.length },
            { label: 'Graded',     value: graded },
            { label: 'Processing', value: inProgress },
          ].map(({ label, value }) => (
            <View key={label} style={s.statPill}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExams(); }} tintColor="#4f46e5" />}
      >
        <TouchableOpacity style={s.uploadBtn} onPress={() => navigation.navigate('UploadHandwritten')}>
          <Text style={s.uploadBtnText}>+ Upload Handwritten Paper</Text>
        </TouchableOpacity>

        {exams.length === 0 ? (
          <EmptyState
            icon="✍️"
            title="No Handwritten Exams"
            message="Upload answer sheets to get AI grading."
          />
        ) : (
          exams.map(exam => {
            const st = getStatus(exam);
            const isProcessing = processing.has(exam.id) || exam.status === 'PROCESSING';
            const isGraded = exam.status === 'GRADED';
            const pct = isGraded && exam.percentage != null ? Math.round(exam.percentage) : null;
            const scoreColor = pct == null ? '#64748b' : pctColor(pct);

            const displayName = exam.student_display_name || exam.student_name || null;
            const isOrphaned = !exam.student && !displayName;
            return (
              <View key={exam.id} style={[s.card, isOrphaned && s.cardOrphaned]}>
                {/* Orphaned warning banner */}
                {isOrphaned && (
                  <View style={s.orphanBanner}>
                    <Text style={s.orphanBannerText}>⚠️ Student account deleted — this paper is unassigned</Text>
                  </View>
                )}
                {/* Top row */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, isOrphaned && { color: '#92400e' }]} numberOfLines={1}>
                      {displayName || 'Unknown Student'}
                    </Text>
                    <Text style={s.cardSub}>{exam.subject_name || 'No subject'}</Text>
                    {exam.uploaded_at && (
                      <Text style={s.timeText}>
                        {new Date(exam.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[s.statusText, { color: st.color }]}>{st.icon} {st.label}</Text>
                    </View>
                    {pct != null && <Text style={[s.scoreText, { color: scoreColor }]}>{pct}%</Text>}
                  </View>
                </View>

                {/* Score bar if graded */}
                {isGraded && exam.score != null && (
                  <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>Score</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: scoreColor }}>{exam.score}/{exam.total_marks}</Text>
                    </View>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${pct}%`, backgroundColor: scoreColor }]} />
                    </View>
                  </View>
                )}

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {exam.status === 'UPLOADED' && (
                    <>
                      <TouchableOpacity
                        style={[s.gradeBtn, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleGrade(exam.id, false)}
                        disabled={isProcessing}
                      >
                        {isProcessing
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={s.gradeBtnText}>⚡ Quick Grade</Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.analyzeBtn, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleGrade(exam.id, true)}
                        disabled={isProcessing}
                      >
                        <Text style={s.analyzeBtnText}>✨ + Analyze</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {isProcessing && exam.status === 'PROCESSING' && (
                    <View style={s.processingBadge}>
                      <ActivityIndicator color="#1d4ed8" size="small" />
                      <Text style={{ color: '#1d4ed8', fontSize: 12, fontWeight: '600' }}>Grading…</Text>
                    </View>
                  )}

                  {isGraded && (
                    <TouchableOpacity
                      style={s.reviewBtn}
                      onPress={() => navigation.navigate('ReviewAnswers', { examId: exam.id })}
                    >
                      <Text style={s.reviewBtnText}>📋 Review Answers</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(exam.id)}>
                    <Text style={s.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>

                {/* Files count */}
                {exam.pages_count != null && (
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{exam.pages_count} page{exam.pages_count !== 1 ? 's' : ''} uploaded</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  statPill:     { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  uploadBtn:    { backgroundColor: '#4f46e5', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 12 },
  uploadBtnText:{ color: '#fff', fontWeight: '800', fontSize: 14 },
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardOrphaned:  { borderWidth: 1.5, borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  orphanBanner:  { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  orphanBannerText: { fontSize: 11, fontWeight: '600', color: '#92400e' },
  cardTitle:     { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  cardSub:      { fontSize: 12, color: '#64748b', marginTop: 2 },
  timeText:     { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statusBadge:  { borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  scoreText:    { fontSize: 20, fontWeight: '800' },
  barTrack:     { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  barFill:      { height: 6, borderRadius: 3 },
  gradeBtn:     { backgroundColor: '#4f46e5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  gradeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  analyzeBtn:   { backgroundColor: '#8b5cf6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  analyzeBtnText:{ color: '#fff', fontSize: 12, fontWeight: '700' },
  reviewBtn:    { backgroundColor: '#ecfdf5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  reviewBtnText:{ color: '#065f46', fontSize: 12, fontWeight: '700' },
  processingBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  deleteBtn:    { borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  deleteBtnText:{ fontSize: 14 },
});
