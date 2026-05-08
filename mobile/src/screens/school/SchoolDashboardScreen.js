import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const ACTIONS = [
  { label: 'Teachers',       sub: 'Add & manage teachers',   screen: 'ManageTeachers', color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Students',       sub: 'View & manage students',  screen: 'ManageStudents', color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Subjects',       sub: 'Configure curriculum',    screen: 'ManageSubjects', color: '#059669', bg: '#ecfdf5' },
  { label: 'Assignments',    sub: 'Assign teachers to subjects', screen: 'Assignments', color: '#d97706', bg: '#fffbeb' },
  { label: 'Create Exam',    sub: 'Create & assign exams',   screen: 'CreateExam',     color: '#059669', bg: '#ecfdf5' },
  { label: 'Created Exams',  sub: 'View all exams',          screen: 'CreatedExams',   color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Upload Paper',   sub: 'Upload & generate Qs',   screen: 'UploadPaper',    color: '#0891b2', bg: '#ecfeff' },
  { label: 'Papers List',    sub: 'View uploaded papers',   screen: 'PapersList',     color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Generate Questions', sub: 'AI question generation', screen: 'GeneratePaper',  color: '#059669', bg: '#ecfdf5' },
  { label: 'Progress',       sub: 'Student progress cards', screen: 'ProgressCards',  color: '#dc2626', bg: '#fef2f2' },
  { label: 'Analytics',      sub: 'Performance insights',   screen: 'Analytics',      color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Images',         sub: 'Upload page backgrounds',screen: 'ManageImages',   color: '#0891b2', bg: '#ecfeff' },
];

export default function SchoolDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/api/dashboard/school/');
      setStats(res.data);
      setActivity(res.data.recent_activity || []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <LoadingScreen color="#4f46e5" />;

  const statCards = [
    { label: 'Teachers', value: stats?.teachers_count ?? 0, color: '#4f46e5' },
    { label: 'Students', value: stats?.students_count ?? 0, color: '#7c3aed' },
    { label: 'Exams',    value: stats?.exams_count ?? 0,    color: '#059669' },
    { label: 'Papers',   value: stats?.papers_count ?? 0,   color: '#d97706' },
  ];

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
    >
      <ScreenHeader
        navigation={navigation}
        label="School Administration"
        title={`${greeting()}, ${user?.first_name || user?.username}!`}
        subtitle="Here's what's happening at your institution today."
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={s.pillsRow}>
            {statCards.map(({ label, value }) => (
              <View key={label} style={s.pill}>
                <Text style={s.pillValue}>{value}</Text>
                <Text style={s.pillLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScreenHeader>

      {/* Stat cards */}
      <View style={s.statGrid}>
        {statCards.map(({ label, value, color }) => (
          <View key={label} style={[s.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
            <Text style={[s.statValue, { color }]}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

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

      {/* Recent Activity */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Recent Activity</Text>
        <View style={s.card}>
          {activity.length === 0
            ? <EmptyState icon="📋" title="No Activity Yet" message="Recent exam completions will appear here." />
            : activity.map((item, i) => (
              <View key={i} style={[s.activityItem, i < activity.length - 1 && s.activityBorder]}>
                <View style={s.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={s.activityDesc}>{item.description || item.subject_name || 'Exam completed'}</Text>
                  <Text style={s.activityTime}>
                    {item.completed_at ? new Date(item.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </Text>
                </View>
              </View>
            ))
          }
        </View>
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f8fafc' },
  logoutBtn:     { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText:    { color: '#fff', fontSize: 12, fontWeight: '600' },
  pillsRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill:          { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', minWidth: 60 },
  pillValue:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  pillLabel:     { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  statGrid:      { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 16, width: '47%', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  statValue:     { fontSize: 32, fontWeight: '800', marginBottom: 2 },
  statLabel:     { fontSize: 12, color: '#64748b', fontWeight: '600' },
  section:       { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  actionsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, width: '47%', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  actionIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionIconText:{ fontSize: 20, fontWeight: '800' },
  actionLabel:   { fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  actionSub:     { fontSize: 11, color: '#94a3b8', marginBottom: 6 },
  actionArrow:   { fontSize: 14, fontWeight: '700' },
  card:          { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  activityItem:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  activityBorder:{ borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activityDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4f46e5' },
  activityDesc:  { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  activityTime:  { fontSize: 11, color: '#94a3b8', marginTop: 2 },
});
