import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import EmptyState from '../../components/EmptyState';

const QUICK_ACTIONS = [
  { label: 'My Exams',           desc: 'View pending assignments',   screen: 'AssignedExams',    color: '#6366f1', icon: '📋' },
  { label: 'Exam Results',       desc: 'Review past results',        screen: 'Results',           color: '#10b981', icon: '🕐' },
  { label: 'Analytics',          desc: 'Track your performance',     screen: 'StudentAnalytics',  color: '#f59e0b', icon: '📊' },
  { label: 'Progress Card',      desc: 'Detailed report card',       screen: 'Progress',          color: '#f43f5e', icon: '🎓' },
  { label: 'Study Materials',    desc: 'Notes, PDFs & links',        screen: 'StudyMaterials',    color: '#0ea5e9', icon: '📚' },
  { label: 'Handwritten',        desc: 'AI-graded answer sheets',    screen: 'Results',           color: '#8b5cf6', icon: '✍️' },
];

const BOARD_COLORS = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#f43f5e','#0ea5e9'];

function ScoreRing({ pct }) {
  const size = 56;
  const segments = 28;
  const color = pct >= 60 ? '#16a34a' : pct >= 40 ? '#ca8a04' : '#dc2626';
  const filled = Math.round(segments * pct / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i * (360 / segments) - 90) * (Math.PI / 180);
        const r = size / 2 - 5;
        return (
          <View key={i} style={{
            position: 'absolute', width: 4, height: 4, borderRadius: 2,
            backgroundColor: i < filled ? color : '#f1f5f9',
            left: size / 2 + r * Math.cos(angle) - 2,
            top:  size / 2 + r * Math.sin(angle) - 2,
          }} />
        );
      })}
      <Text style={{ fontSize: 10, fontWeight: '800', color }}>{pct}%</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [examTypes,    setExamTypes]    = useState([]);
  const [recentExams,  setRecentExams]  = useState([]);
  const [assignedExams,setAssignedExams]= useState([]);
  const [refreshing,   setRefreshing]   = useState(false);

  const load = async () => {
    try {
      const [typesRes, historyRes, assignedRes, hwRes] = await Promise.all([
        api.get('/api/exam-types/').catch(() => ({ data: [] })),
        api.get('/api/my-results/').catch(() => ({ data: [] })),
        api.get('/api/assigned-exams/').catch(() => ({ data: [] })),
        api.get('/api/handwritten/my/').catch(() => ({ data: [] })),
      ]);
      setExamTypes(typesRes.data?.results || typesRes.data || []);

      const online = (historyRes.data?.results || historyRes.data || [])
        .map(e => ({ ...e, _type: 'online', _date: e.submitted_at || e.completed_at }));
      const hw = (hwRes.data?.results || hwRes.data || [])
        .map(e => ({ ...e, _type: 'hw', _date: e.created_at }));
      setRecentExams([...online, ...hw]
        .sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0))
        .slice(0, 8));

      const all = assignedRes.data?.results || assignedRes.data || [];
      setAssignedExams(all.filter(e => !e.my_attempt || e.my_attempt?.status !== 'COMPLETED').slice(0, 5));
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const userName  = user?.first_name || user?.username || '';
  const schoolInfo = [user?.board, user?.grade && `Class ${user.grade}`, user?.school_name]
    .filter(Boolean).join(' · ') || 'Track your exams and progress.';
  const avgScore = recentExams.length
    ? Math.round(recentExams.reduce((s, e) => s + (e.percentage || e.score_percentage || 0), 0) / recentExams.length)
    : null;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#818cf8" />}
    >
      {/* ── Hero Banner ── */}
      <View style={s.hero}>
        <View style={s.heroDots} pointerEvents="none">
          {Array.from({ length: 80 }).map((_, i) => <View key={i} style={s.dot} />)}
        </View>
        <View style={s.glow1} /><View style={s.glow2} />
        <View style={s.heroInner}>
          <View style={s.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.portalLabel}>Student Portal</Text>
              <Text style={s.heroTitle}>Welcome back, {userName}!</Text>
              <Text style={s.heroSub}>{schoolInfo}</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={logout}>
              <Text style={s.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <View style={s.pillsRow}>
            {[
              { label: 'Exams Taken', value: recentExams.length,            bg: 'rgba(255,255,255,0.1)',  tc: '#fff' },
              { label: 'Assigned',    value: assignedExams.length,           bg: 'rgba(139,92,246,0.3)',   tc: '#ddd6fe' },
              { label: 'Avg Score',   value: avgScore ? `${avgScore}%` : '—',bg: 'rgba(16,185,129,0.2)',  tc: '#a7f3d0' },
            ].map(({ label, value, bg, tc }) => (
              <View key={label} style={[s.pill, { backgroundColor: bg }]}>
                <Text style={[s.pillVal, { color: tc }]}>{value}</Text>
                <Text style={s.pillLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {QUICK_ACTIONS.map(({ label, desc, screen, color, icon }) => (
            <TouchableOpacity key={label} style={s.actionCard} onPress={() => navigation.navigate(screen)}>
              <View style={[s.actionIcon, { backgroundColor: color }]}>
                <Text style={{ fontSize: 22 }}>{icon}</Text>
              </View>
              <Text style={s.actionLabel}>{label}</Text>
              <Text style={s.actionDesc}>{desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Assigned Exams ── */}
      {assignedExams.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.sectionTitle}>Assigned Exams</Text>
              <View style={s.pendingBadge}><Text style={s.pendingText}>{assignedExams.length} pending</Text></View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AssignedExams')}>
              <Text style={s.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {assignedExams.map(exam => (
            <TouchableOpacity
              key={exam.id} style={s.assignedCard}
              onPress={() => navigation.navigate('TakeExam', { examId: exam.id, examTitle: exam.title })}
            >
              <View style={s.assignedTop}>
                <View style={s.assignedIcon}><Text style={{ fontSize: 18 }}>📋</Text></View>
                <View style={exam.my_attempt ? s.inProgressBadge : s.newBadge}>
                  <Text style={exam.my_attempt ? s.inProgressText : s.newText}>
                    {exam.my_attempt ? 'In Progress' : 'New'}
                  </Text>
                </View>
              </View>
              <Text style={s.assignedTitle} numberOfLines={1}>{exam.title}</Text>
              <Text style={s.assignedSub}>{exam.subject_name}</Text>
              <View style={s.assignedMeta}>
                <Text style={s.metaText}>🎯 {exam.total_marks} marks</Text>
                <Text style={s.metaText}>⏱ {exam.duration_minutes} min</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Exam Boards ── */}
      {examTypes.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Exam Boards</Text>
          {examTypes.map((et, i) => (
            <View key={et.id} style={s.boardCard}>
              <View style={[s.boardIcon, { backgroundColor: BOARD_COLORS[i % BOARD_COLORS.length] }]}>
                <Text style={{ fontSize: 20 }}>📚</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.boardName}>{et.name}</Text>
                {et.subject_count != null && <Text style={s.boardSub}>{et.subject_count} subjects</Text>}
              </View>
              <Text style={s.boardArrow}>›</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Recent Exams ── */}
      <View style={[s.section, { marginBottom: 32 }]}>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Recent Exams</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Results')}>
            <Text style={s.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>
        {recentExams.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No exams yet"
            message="Start your first exam to see results here."
          />
        ) : (
          recentExams.map(exam => {
            const pct  = Math.round(exam.percentage || exam.score_percentage || 0);
            const isHw = exam._type === 'hw';
            const date = exam._date
              ? new Date(exam._date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '';
            return (
              <View key={`${exam._type}-${exam.id}`} style={s.recentCard}>
                <ScoreRing pct={pct} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={s.recentTitle} numberOfLines={1}>
                      {isHw ? exam.title : (exam.subject_name || exam.title)}
                    </Text>
                    {isHw && <View style={s.hwBadge}><Text style={s.hwText}>✍️ HW</Text></View>}
                  </View>
                  <Text style={s.recentSub}>{!isHw && exam.chapter_name ? `${exam.chapter_name} · ` : ''}{date}</Text>
                </View>
                <Text style={s.recentArrow}>›</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f8fafc' },
  hero:           { backgroundColor: '#0f172a', overflow: 'hidden' },
  heroDots:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.12 },
  dot:            { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#818cf8', margin: 5 },
  glow1:          { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(124,58,237,0.2)' },
  glow2:          { position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(79,70,229,0.2)' },
  heroInner:      { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 20 },
  heroTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  portalLabel:    { color: '#818cf8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  heroTitle:      { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heroSub:        { color: '#64748b', fontSize: 12 },
  logoutBtn:      { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  logoutText:     { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  pillsRow:       { flexDirection: 'row', gap: 8 },
  pill:           { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pillVal:        { fontSize: 18, fontWeight: '800' },
  pillLabel:      { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 },
  section:        { paddingHorizontal: 16, marginTop: 20 },
  sectionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:   { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  viewAll:        { fontSize: 13, fontWeight: '700', color: '#6366f1', marginBottom: 12 },
  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:     { backgroundColor: '#fff', borderRadius: 20, padding: 16, width: '47%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, alignItems: 'center' },
  actionIcon:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  actionLabel:    { fontSize: 12, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 2 },
  actionDesc:     { fontSize: 10, color: '#94a3b8', textAlign: 'center' },
  pendingBadge:   { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pendingText:    { color: '#7c3aed', fontSize: 11, fontWeight: '800' },
  assignedCard:   { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: '#ede9fe', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  assignedTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  assignedIcon:   { width: 40, height: 40, backgroundColor: '#ede9fe', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  newBadge:       { backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  newText:        { color: '#4f46e5', fontSize: 11, fontWeight: '800' },
  inProgressBadge:{ backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  inProgressText: { color: '#d97706', fontSize: 11, fontWeight: '800' },
  assignedTitle:  { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  assignedSub:    { fontSize: 12, color: '#94a3b8', marginBottom: 10 },
  assignedMeta:   { flexDirection: 'row', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  metaText:       { fontSize: 12, color: '#64748b' },
  boardCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  boardIcon:      { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  boardName:      { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  boardSub:       { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  boardArrow:     { fontSize: 22, color: '#6366f1' },
  recentCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  recentTitle:    { fontSize: 13, fontWeight: '800', color: '#0f172a', flex: 1 },
  recentSub:      { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  recentArrow:    { fontSize: 20, color: '#cbd5e1', marginLeft: 8 },
  hwBadge:        { backgroundColor: '#ede9fe', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  hwText:         { color: '#7c3aed', fontSize: 9, fontWeight: '800' },
});
