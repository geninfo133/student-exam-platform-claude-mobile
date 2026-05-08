import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const ACTIONS = [
  { label: 'Create Exam',        sub: 'Assign to students',    screen: 'CreateExam',           color: '#059669', bg: '#ecfdf5' },
  { label: 'Created Exams',      sub: 'View all your exams',   screen: 'CreatedExams',         color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Grading Queue',      sub: 'Grade submissions',     screen: 'GradingQueue',         color: '#d97706', bg: '#fffbeb' },
  { label: 'Upload Paper',       sub: 'Upload PDF for Qs',     screen: 'UploadPaper',          color: '#0891b2', bg: '#ecfeff' },
  { label: 'Papers List',        sub: 'View uploaded papers',  screen: 'PapersList',           color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Generate Questions', sub: 'AI question generation',screen: 'GeneratePaper',        color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Progress Cards',      sub: 'Student progress report',screen: 'ProgressCards',        color: '#059669', bg: '#ecfdf5' },
  { label: 'Analytics',          sub: 'Student performance',   screen: 'TeacherAnalytics',     color: '#dc2626', bg: '#fef2f2' },
  { label: 'Study Materials',    sub: 'Manage chapter content',screen: 'ManageStudyMaterials', color: '#059669', bg: '#ecfdf5' },
  { label: 'Handwritten List',   sub: 'All answer sheets',     screen: 'HandwrittenList',      color: '#4f46e5', bg: '#eef2ff' },
];

export default function TeacherDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ papers: 0, exams: 0, pending_grading: 0 });
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [papersRes, pendingRes, examsRes] = await Promise.all([
        api.get('/api/exams/papers/'),
        api.get('/api/exams/pending-review/'),
        api.get('/api/exams/assigned/'),
      ]);
      const papers = papersRes.data?.results || papersRes.data || [];
      const exams = examsRes.data?.results || examsRes.data || [];
      const pending = pendingRes.data?.results || pendingRes.data || [];
      setStats({
        papers: Array.isArray(papers) ? papers.length : (papersRes.data?.count || 0),
        exams: Array.isArray(exams) ? exams.length : (examsRes.data?.count || 0),
        pending_grading: Array.isArray(pending) ? pending.length : 0,
      });
      setRecentExams((Array.isArray(exams) ? exams : []).slice(0, 5));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
    >
      {/* Header */}
      <ScreenHeader
        label="Teacher Portal"
        title={`${greeting()}, ${user?.first_name || user?.username}!`}
        subtitle={user?.school_name || 'Manage exams, grade submissions, track progress.'}
      >
        <View style={s.headerTop}>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={s.pillsRow}>
          {[
            { label: 'Papers',   value: stats.papers },
            { label: 'Exams',    value: stats.exams },
            { label: 'To Grade', value: stats.pending_grading },
          ].map(({ label, value }) => (
            <View key={label} style={s.pill}>
              <Text style={s.pillValue}>{value}</Text>
              <Text style={s.pillLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {ACTIONS.map(({ label, sub, screen, color, bg }) => (
            <TouchableOpacity
              key={label}
              style={s.actionCard}
              onPress={() => navigation.navigate(screen)}
            >
              <View style={[s.actionIcon, { backgroundColor: bg }]}>
                <Text style={[s.actionIconText, { color }]}>{label[0]}</Text>
              </View>
              <Text style={s.actionLabel}>{label}</Text>
              <Text style={s.actionSub}>{sub}</Text>
              <Text style={[s.actionArrow, { color }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Exams */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Exams</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreatedExams')}>
            <Text style={s.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentExams.length === 0
          ? (
            <EmptyState
              icon="📋"
              title="No exams created yet"
              message="Start by creating your first exam for students."
            />
          )
          : recentExams.map(exam => (
            <TouchableOpacity
              key={exam.id}
              style={s.examCard}
              onPress={() => navigation.navigate('ExamSubmissions', { examId: exam.id, examTitle: exam.title })}
            >
              <View style={{ flex: 1 }}>
                <View style={s.examTags}>
                  <View style={s.subjectTag}>
                    <Text style={s.subjectTagText}>{exam.subject_name}</Text>
                  </View>
                  {exam.grade ? <Text style={s.gradeTag}>Class {exam.grade}</Text> : null}
                </View>
                <Text style={s.examTitle}>{exam.title}</Text>
                <Text style={s.examDate}>
                  {exam.created_at ? new Date(exam.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </Text>
              </View>
              <View style={s.examRight}>
                <Text style={s.submCount}>{exam.submissions_count || 0}</Text>
                <Text style={s.submLabel}>Submissions</Text>
              </View>
              <Text style={s.examArrow}>›</Text>
            </TouchableOpacity>
          ))
        }
      </View>

      {/* Grading summary */}
      <View style={[s.section, { marginBottom: 32 }]}>
        <View style={s.gradingCard}>
          <Text style={s.gradingTitle}>Grading Queue</Text>
          <Text style={s.gradingCount}>{stats.pending_grading} pending</Text>
          <TouchableOpacity style={s.gradingBtn} onPress={() => navigation.navigate('GradingQueue')}>
            <Text style={s.gradingBtnText}>Review Queue →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f8fafc' },
  headerTop:      { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  logoutBtn:      { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText:     { color: '#fff', fontSize: 12, fontWeight: '600' },
  pillsRow:       { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill:           { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', flex: 1 },
  pillValue:      { color: '#fff', fontSize: 18, fontWeight: '800' },
  pillLabel:      { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  section:        { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:   { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  viewAll:        { fontSize: 13, fontWeight: '700', color: '#4f46e5' },
  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 14, width: '47%', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  actionIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionIconText: { fontSize: 20, fontWeight: '800' },
  actionLabel:    { fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  actionSub:      { fontSize: 11, color: '#94a3b8', marginBottom: 6 },
  actionArrow:    { fontSize: 14, fontWeight: '700' },
  examCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  examTags:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  subjectTag:     { backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  subjectTagText: { color: '#4f46e5', fontSize: 10, fontWeight: '700' },
  gradeTag:       { fontSize: 10, color: '#94a3b8', fontWeight: '700', fontStyle: 'italic' },
  examTitle:      { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  examDate:       { fontSize: 11, color: '#94a3b8' },
  examRight:      { alignItems: 'center', marginRight: 4 },
  submCount:      { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  submLabel:      { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  examArrow:      { fontSize: 22, color: '#94a3b8' },
  gradingCard:    { backgroundColor: '#1e1b4b', borderRadius: 16, padding: 20 },
  gradingTitle:   { color: '#a5b4fc', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  gradingCount:   { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 14 },
  gradingBtn:     { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  gradingBtnText: { color: '#1e1b4b', fontWeight: '800', fontSize: 13 },
});
