import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const AVATAR_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

function getState(sub) {
  if (sub.status === 'NOT_STARTED') return { label: 'Not Started', bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' };
  if (sub.status === 'IN_PROGRESS')  return { label: 'In Progress',  bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' };
  if (sub.grading_status === 'COMPLETED') return { label: 'Graded',    bg: '#d1fae5', text: '#065f46', dot: '#10b981' };
  if (sub.grading_status === 'FAILED')    return { label: 'Grade Failed', bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' };
  if (sub.grading_status && sub.grading_status !== 'PENDING_REVIEW')
    return { label: 'Grading…', bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' };
  return { label: 'Submitted', bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' };
}

export default function ExamSubmissionsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { examId, examTitle } = route.params || {};
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get(`/api/exams/assigned/${examId}/submissions/`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return <LoadingScreen />;

  if (error) return (
    <LoadingScreen />
  );

  const submissions = data?.submissions || [];
  const submitted   = submissions.filter(s => s.status === 'COMPLETED').length;
  const graded      = submissions.filter(s => s.grading_status === 'COMPLETED').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <ScreenHeader
        navigation={navigation}
        label={user?.role === 'school' ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
        title={data?.exam_title || examTitle || 'Exam Submissions'}
        subtitle={data?.subject}
      >
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {[
            { label: 'Assigned',  value: submissions.length, color: 'rgba(255,255,255,0.15)' },
            { label: 'Submitted', value: submitted,           color: 'rgba(79,70,229,0.3)' },
            { label: 'Graded',    value: graded,              color: 'rgba(16,185,129,0.3)' },
          ].map(({ label, value, color }) => (
            <View key={label} style={[s.statPill, { backgroundColor: color }]}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {submissions.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No Submissions Yet"
            message="Students haven't submitted this exam yet."
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {submissions.map((sub, idx) => {
              const state     = getState(sub);
              const isGraded  = sub.grading_status === 'COMPLETED';
              const pct       = isGraded ? Math.round(sub.percentage) : null;
              const scoreColor = pct != null ? (pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#dc2626') : '#64748b';
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const initial = sub.student_name?.charAt(0)?.toUpperCase() || '?';

              return (
                <View key={sub.student_id || idx} style={s.studentCard}>
                  {/* Avatar + name */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <View style={[s.avatar, { backgroundColor: avatarColor }]}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.studentName} numberOfLines={1}>{sub.student_name}</Text>
                      {sub.completed_at && (
                        <Text style={s.timeText}>
                          {new Date(sub.completed_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Status + score */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={[s.statusBadge, { backgroundColor: state.bg }]}>
                      <View style={[s.dot, { backgroundColor: state.dot }]} />
                      <Text style={[s.statusText, { color: state.text }]}>{state.label}</Text>
                    </View>
                    {pct != null && (
                      <Text style={[s.scoreText, { color: scoreColor }]}>{pct}%</Text>
                    )}
                  </View>
                  {sub.attempt_id && isGraded && (
                    <TouchableOpacity
                      style={s.reviewBtn}
                      onPress={() => navigation.navigate('ReviewAnswers', { examId: sub.attempt_id })}
                    >
                      <Text style={s.reviewBtnText}>Review Answers →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  statPill: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  studentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, width: '47%',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  timeText: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  scoreText: { fontSize: 18, fontWeight: '800' },
  reviewBtn: { marginTop: 8, backgroundColor: '#eef2ff', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  reviewBtnText: { color: '#4f46e5', fontSize: 11, fontWeight: '700' },
});
