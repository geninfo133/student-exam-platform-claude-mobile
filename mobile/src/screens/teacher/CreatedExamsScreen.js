import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const GRADIENTS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function CreatedExamsScreen({ navigation }) {
  const { user } = useAuth();
  const [exams, setExams]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchExams = async (pageNum) => {
    try {
      const res = await api.get('/api/exams/assigned/', { params: { page: pageNum } });
      const data = res.data;
      if (data.results) { setExams(data.results); setHasMore(!!data.next); }
      else { setExams(data); setHasMore(false); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(page); }, [page]);

  const handleDelete = (examId, examTitle) => {
    Alert.alert(
      'Delete Exam',
      `Delete "${examTitle}"? All student submissions will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeletingId(examId);
            try {
              await api.delete(`/api/exams/assigned/${examId}/`);
              fetchExams(page);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete exam');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const totalStudents  = exams.reduce((s, e) => s + (e.student_count  || 0), 0);
  const totalCompleted = exams.reduce((s, e) => s + (e.completed_count || 0), 0);

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <ScreenHeader
        navigation={navigation}
        label={user?.role === 'school' ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
        title="Created Exams"
        subtitle="All exams you have created and assigned"
      >
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {[
            { label: 'Exams',     value: exams.length,    color: 'rgba(255,255,255,0.15)' },
            { label: 'Students',  value: totalStudents,   color: 'rgba(79,70,229,0.3)' },
            { label: 'Submitted', value: totalCompleted,  color: 'rgba(16,185,129,0.3)' },
          ].map(({ label, value, color }) => (
            <View key={label} style={[s.statPill, { backgroundColor: color }]}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14 }}>
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('CreateExam')}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Create Exam</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.gradingBtn} onPress={() => navigation.navigate('GradingQueue')}>
          <Text style={{ color: '#4f46e5', fontWeight: '700', fontSize: 13 }}>Grading Queue</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {exams.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Exams Created Yet"
            message="Create your first exam and assign it to students."
            style={{ marginTop: 20 }}
          />
        ) : (
          <>
            {exams.map((exam, idx) => {
              const allDone  = exam.completed_count === exam.student_count && exam.student_count > 0;
              const progress = exam.student_count > 0 ? Math.round((exam.completed_count / exam.student_count) * 100) : 0;
              const accentColor = GRADIENTS[idx % GRADIENTS.length];
              const initial = exam.subject_name?.charAt(0)?.toUpperCase() || '?';

              return (
                <View key={exam.id} style={s.card}>
                  <View style={{ flexDirection: 'row' }}>
                    {/* Accent strip */}
                    <View style={[s.accentStrip, { backgroundColor: accentColor }]}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{initial}</Text>
                    </View>

                    <View style={{ flex: 1, padding: 12 }}>
                      {/* Title + status */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.examTitle} numberOfLines={2}>{exam.title}</Text>
                          <Text style={{ fontSize: 12, color: accentColor, fontWeight: '600', marginTop: 2 }}>
                            {exam.subject_name}
                          </Text>
                        </View>
                        <View style={[s.statusBadge, allDone ? s.badgeDone : s.badgeProgress]}>
                          <Text style={[s.statusText, allDone ? { color: '#065f46' } : { color: '#92400e' }]}>
                            {allDone ? '✅ Done' : `${exam.completed_count}/${exam.student_count}`}
                          </Text>
                        </View>
                      </View>

                      {/* Info chips */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {exam.start_time && (
                          <Text style={s.infoBadge}>
                            🟢 {new Date(exam.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Text>
                        )}
                        {exam.duration_minutes && <Text style={s.infoBadge}>⏱ {exam.duration_minutes} min</Text>}
                        {exam.total_marks     && <Text style={s.infoBadge}>🏆 {exam.total_marks} marks</Text>}
                      </View>

                      {/* Progress bar */}
                      <View style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 11, color: '#64748b' }}>
                            {exam.completed_count} of {exam.student_count} submitted
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>{progress}%</Text>
                        </View>
                        <View style={s.progressTrack}>
                          <View style={[s.progressFill,
                            { width: `${progress}%`, backgroundColor: allDone ? '#10b981' : '#f59e0b' }
                          ]} />
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        <TouchableOpacity style={s.actionBtn}
                          onPress={() => navigation.navigate('ExamSubmissions', { examId: exam.id, examTitle: exam.title })}>
                          <Text style={{ color: '#4f46e5', fontSize: 12, fontWeight: '700' }}>Submissions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.actionBtn, { borderColor: '#059669' }]}
                          onPress={() => navigation.navigate('ExamPaperView', { examId: exam.id, examTitle: exam.title })}>
                          <Text style={{ color: '#059669', fontSize: 12, fontWeight: '700' }}>View Paper</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.deleteBtn, deletingId === exam.id && { opacity: 0.5 }]}
                          disabled={deletingId === exam.id}
                          onPress={() => handleDelete(exam.id, exam.title)}>
                          {deletingId === exam.id
                            ? <ActivityIndicator size="small" color="#dc2626" />
                            : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '700' }}>Delete</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Pagination */}
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 16 }}>
              <TouchableOpacity
                style={[s.pageBtn, page === 1 && s.pageBtnDisabled]}
                disabled={page === 1}
                onPress={() => setPage(p => p - 1)}>
                <Text style={[s.pageBtnText, page === 1 && { color: '#94a3b8' }]}>← Prev</Text>
              </TouchableOpacity>
              <View style={s.pageIndicator}>
                <Text style={{ color: '#4f46e5', fontWeight: '700', fontSize: 13 }}>Page {page}</Text>
              </View>
              <TouchableOpacity
                style={[s.pageBtn, !hasMore && s.pageBtnDisabled]}
                disabled={!hasMore}
                onPress={() => setPage(p => p + 1)}>
                <Text style={[s.pageBtnText, !hasMore && { color: '#94a3b8' }]}>Next →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  statPill: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  createBtn: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  gradingBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    borderWidth: 2, borderColor: '#e0e7ff' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  accentStrip: { width: 44, alignItems: 'center', justifyContent: 'center' },
  examTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeDone:     { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
  badgeProgress: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  statusText: { fontSize: 11, fontWeight: '700' },
  infoBadge: { fontSize: 11, fontWeight: '600', color: '#64748b', backgroundColor: '#f1f5f9',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  actionBtn: { flex: 1, backgroundColor: '#eef2ff', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteBtn:  { paddingHorizontal: 16, backgroundColor: '#fff1f2', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  pageBtn:       { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 2, borderColor: '#e2e8f0' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontWeight: '600', fontSize: 13, color: '#4f46e5' },
  pageIndicator: { backgroundColor: '#eef2ff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 2, borderColor: '#e0e7ff' },
});
