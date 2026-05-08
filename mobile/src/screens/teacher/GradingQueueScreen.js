import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const GRADING_LABELS = {
  GRADING_MCQ:         'Grading MCQs…',
  GRADING_DESCRIPTIVE: 'Grading Descriptive…',
  ANALYZING:           'Analyzing…',
  PROCESSING:          'Grading…',
};

const AVATAR_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function GradingQueueScreen({ navigation }) {
  const [onlineItems, setOnlineItems]       = useState([]);
  const [hwItems, setHwItems]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [gradingIds, setGradingIds]         = useState(new Set());

  const fetchAll = useCallback(async () => {
    try {
      const [onlineRes, hwRes] = await Promise.all([
        api.get('/api/exams/pending-review/').catch(() => ({ data: [] })),
        api.get('/api/handwritten/').catch(() => ({ data: [] })),
      ]);
      setOnlineItems(onlineRes.data.results || onlineRes.data || []);
      const hw = hwRes.data.results || hwRes.data || [];
      setHwItems(hw.filter(e => e.status === 'UPLOADED' || e.status === 'PROCESSING'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-poll when items are being processed
  useEffect(() => {
    const hasProcessing =
      onlineItems.some(e => e.grading_status !== 'PENDING_REVIEW') ||
      hwItems.some(e => e.status === 'PROCESSING');
    if (!hasProcessing) return;
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, [onlineItems, hwItems, fetchAll]);

  const handleGradeOnline = async (examId, includeAnalysis = false) => {
    const key = `online_${examId}`;
    setGradingIds(prev => new Set(prev).add(key));
    try {
      await api.post(`/api/exams/${examId}/grade/`, { include_analysis: includeAnalysis });
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start grading');
      setGradingIds(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  const handleGradeHW = async (examId, includeAnalysis = false) => {
    const key = `hw_${examId}`;
    setGradingIds(prev => new Set(prev).add(key));
    try {
      await api.post(`/api/handwritten/${examId}/process/`, { include_analysis: includeAnalysis });
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start grading');
      setGradingIds(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  const totalQueue     = onlineItems.length + hwItems.length;
  const awaitingCount  = onlineItems.filter(e => e.grading_status === 'PENDING_REVIEW').length
                       + hwItems.filter(e => e.status === 'UPLOADED').length;
  const processingCount = onlineItems.filter(e => e.grading_status !== 'PENDING_REVIEW').length
                        + hwItems.filter(e => e.status === 'PROCESSING').length;

  if (loading) return <LoadingScreen color="#f59e0b" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label="TEACHER PORTAL"
        title="Grading Queue"
        subtitle="Student submissions awaiting AI grading"
      >
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {[
            { label: 'Queue',      value: totalQueue,      color: 'rgba(255,255,255,0.15)' },
            { label: 'Awaiting',   value: awaitingCount,   color: 'rgba(245,158,11,0.3)' },
            { label: 'Processing', value: processingCount, color: 'rgba(79,70,229,0.3)' },
          ].map(({ label, value, color }) => (
            <View key={label} style={[s.statPill, { backgroundColor: color }]}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {totalQueue === 0 ? (
          <EmptyState
            icon="✅"
            title="All caught up!"
            message="No submissions are waiting to be graded."
            style={{ marginTop: 20 }}
          />
        ) : (
          <>
            {/* ── Online exams ── */}
            {onlineItems.map((exam, idx) => {
              const isProcessing = exam.grading_status !== 'PENDING_REVIEW';
              const key          = `online_${exam.id}`;
              const isGrading    = gradingIds.has(key);
              const avatarColor  = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const isOrphaned   = !exam.student;
              const studentInitial = exam.student?.charAt(0)?.toUpperCase() || '?';

              return (
                <View key={key} style={[s.card, isOrphaned && s.cardOrphaned]}>
                  {isOrphaned && (
                    <View style={s.orphanBanner}>
                      <Text style={s.orphanBannerText}>⚠️ Student account deleted — paper is unassigned</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <View style={[s.avatar, { backgroundColor: isOrphaned ? '#f59e0b' : avatarColor }]}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{isOrphaned ? '?' : studentInitial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.studentName, isOrphaned && { color: '#92400e' }]}>{exam.student || 'Unknown Student'}</Text>
                      <Text style={s.subjectText}>{exam.subject}</Text>
                    </View>
                    <View style={s.typeBadge}>
                      <Text style={s.typeBadgeText}>💻 Online</Text>
                    </View>
                    {isProcessing ? (
                      <View style={s.badgeBlue}>
                        <ActivityIndicator size="small" color="#3b82f6" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '700' }}>
                          {GRADING_LABELS[exam.grading_status] || 'Processing…'}
                        </Text>
                      </View>
                    ) : (
                      <View style={s.badgeAmber}>
                        <View style={s.dot} />
                        <Text style={{ color: '#92400e', fontSize: 11, fontWeight: '700' }}>Pending</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 4 }} numberOfLines={1}>
                      {exam.exam_title || '—'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <Text style={s.infoText}>Questions: <Text style={s.infoVal}>{exam.total_questions}</Text></Text>
                      {exam.completed_at && (
                        <Text style={s.infoText}>
                          Submitted: <Text style={s.infoVal}>
                            {new Date(exam.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Text>
                        </Text>
                      )}
                    </View>
                  </View>

                  {!isProcessing ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={[s.gradeBtn, isGrading && { opacity: 0.6 }]} onPress={() => handleGradeOnline(exam.id, false)} disabled={isGrading}>
                        {isGrading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.gradeBtnText}>⚡ Quick Grade</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.analyzeBtn, isGrading && { opacity: 0.6 }]} onPress={() => handleGradeOnline(exam.id, true)} disabled={isGrading}>
                        <Text style={s.analyzeBtnText}>🔍 + Analyze</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                      <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Processing… refreshing automatically</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* ── Handwritten exams ── */}
            {hwItems.map((exam, idx) => {
              const isProcessing   = exam.status === 'PROCESSING';
              const key            = `hw_${exam.id}`;
              const isGrading      = gradingIds.has(key);
              const avatarColor    = AVATAR_COLORS[(onlineItems.length + idx) % AVATAR_COLORS.length];
              const displayName    = exam.student_display_name || exam.student_name || null;
              const isOrphaned     = !exam.student && !displayName;
              const studentInitial = displayName?.charAt(0)?.toUpperCase() || '?';

              return (
                <View key={key} style={[s.card, isOrphaned && s.cardOrphaned]}>
                  {isOrphaned && (
                    <View style={s.orphanBanner}>
                      <Text style={s.orphanBannerText}>⚠️ Student account deleted — paper is unassigned</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <View style={[s.avatar, { backgroundColor: isOrphaned ? '#f59e0b' : avatarColor }]}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{isOrphaned ? '?' : studentInitial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.studentName, isOrphaned && { color: '#92400e' }]}>{displayName || 'Unknown Student'}</Text>
                      <Text style={s.subjectText}>{exam.subject_name || '—'}</Text>
                    </View>
                    <View style={[s.typeBadge, { backgroundColor: '#ecfdf5' }]}>
                      <Text style={[s.typeBadgeText, { color: '#065f46' }]}>✍️ Written</Text>
                    </View>
                    {isProcessing ? (
                      <View style={s.badgeBlue}>
                        <ActivityIndicator size="small" color="#3b82f6" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '700' }}>Grading…</Text>
                      </View>
                    ) : (
                      <View style={s.badgeAmber}>
                        <View style={s.dot} />
                        <Text style={{ color: '#92400e', fontSize: 11, fontWeight: '700' }}>Pending</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 4 }} numberOfLines={1}>
                      {exam.title || '—'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <Text style={s.infoText}>Marks: <Text style={s.infoVal}>{exam.total_marks}</Text></Text>
                      {exam.created_at && (
                        <Text style={s.infoText}>
                          Uploaded: <Text style={s.infoVal}>
                            {new Date(exam.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Text>
                        </Text>
                      )}
                    </View>
                  </View>

                  {!isProcessing ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={[s.gradeBtn, isGrading && { opacity: 0.6 }]} onPress={() => handleGradeHW(exam.id, false)} disabled={isGrading}>
                        {isGrading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.gradeBtnText}>⚡ Quick Grade</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.analyzeBtn, isGrading && { opacity: 0.6 }]} onPress={() => handleGradeHW(exam.id, true)} disabled={isGrading}>
                        <Text style={s.analyzeBtnText}>✨ + Analyze</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                      <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Processing… refreshing automatically</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  statPill:      { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardOrphaned:  { borderWidth: 1.5, borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  orphanBanner:  { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  orphanBannerText: { fontSize: 11, fontWeight: '600', color: '#92400e' },
  avatar:        { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  studentName:   { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  subjectText:   { fontSize: 12, color: '#64748b', marginTop: 2 },
  typeBadge:     { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: '#4f46e5' },
  badgeBlue:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeAmber:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' },
  infoText:      { fontSize: 12, color: '#64748b' },
  infoVal:       { fontWeight: '700', color: '#334155' },
  gradeBtn:      { flex: 1, backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  gradeBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  analyzeBtn:    { flex: 1, backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  analyzeBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});
