import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl,
} from 'react-native';
import api from '../../api/axios';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import GradeBadge from '../../components/GradeBadge';
import { getGrade } from '../../utils/helpers';

const TABS = ['Online', 'Handwritten'];

const HW_STATUS = {
  GRADED:     { label: 'Graded',     bg: '#d1fae5', color: '#065f46' },
  PROCESSING: { label: 'Processing', bg: '#fef3c7', color: '#92400e' },
  UPLOADED:   { label: 'Uploaded',   bg: '#f1f5f9', color: '#64748b' },
  FAILED:     { label: 'Failed',     bg: '#fee2e2', color: '#dc2626' },
};

export default function ResultsScreen({ navigation }) {
  const [tab, setTab]             = useState(0);
  const [online, setOnline]       = useState([]);
  const [handwritten, setHandwritten] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [onlineRes, hwRes] = await Promise.all([
        api.get('/api/my-results/').catch(() => ({ data: [] })),
        api.get('/api/handwritten/my/').catch(() => ({ data: [] })),
      ]);
      setOnline(onlineRes.data?.results || onlineRes.data || []);
      setHandwritten(hwRes.data?.results || hwRes.data || []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avgPct = (arr, key = 'percentage') => {
    if (!arr.length) return null;
    const valid = arr.filter(r => r[key] != null);
    if (!valid.length) return null;
    return Math.round(valid.reduce((s, r) => s + (r[key] || 0), 0) / valid.length);
  };

  const onlineAvg = avgPct(online);
  const hwGraded  = handwritten.filter(h => h.status === 'GRADED');
  const hwAvg     = avgPct(hwGraded, 'percentage');

  if (loading) return <LoadingScreen />;

  const renderOnline = () => (
    online.length === 0
      ? <EmptyState icon="📋" title="No online results yet" message="Complete assigned exams to see your results here." style={{ marginTop: 20 }} />
      : online.map(item => {
          const pct = Math.round(item.percentage || 0);
          const g = getGrade(pct);
          const date = item.submitted_at || item.completed_at
            ? new Date(item.submitted_at || item.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
          return (
            <TouchableOpacity
              key={item.id}
              style={s.card}
              onPress={() => navigation.navigate('ExamResultDetail', { resultId: item.id, type: 'online' })}
            >
              <View style={s.cardRow}>
                <View style={[s.avatar, { backgroundColor: g.bg }]}>
                  <Text style={[s.avatarText, { color: g.color }]}>{item.subject_name?.charAt(0) || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{item.exam_title || item.title}</Text>
                  <Text style={s.cardMeta}>{item.subject_name}{date ? ` · ${date}` : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <GradeBadge pct={pct} />
                  <Text style={[s.pctText, { color: g.color }]}>{pct}%</Text>
                </View>
              </View>
              <View style={s.scoreRow}>
                <Text style={s.scoreText}>{item.score ?? item.obtained_marks ?? 0} / {item.total_marks} marks</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>›</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: g.color }]} />
              </View>
            </TouchableOpacity>
          );
        })
  );

  const renderHandwritten = () => (
    handwritten.length === 0
      ? <EmptyState icon="✍️" title="No handwritten sheets" message="Your teacher hasn't uploaded any handwritten answer sheets yet." style={{ marginTop: 20 }} />
      : handwritten.map(item => {
          const st = HW_STATUS[item.status] || HW_STATUS.UPLOADED;
          const pct = item.percentage != null ? Math.round(item.percentage) : null;
          const g = pct != null ? getGrade(pct) : null;
          const date = item.uploaded_at
            ? new Date(item.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
          return (
            <TouchableOpacity
              key={item.id}
              style={s.card}
              onPress={() => item.status === 'GRADED' && navigation.navigate('ExamResultDetail', { resultId: item.id, type: 'handwritten' })}
              activeOpacity={item.status === 'GRADED' ? 0.7 : 1}
            >
              <View style={s.cardRow}>
                <View style={[s.avatar, { backgroundColor: '#eef2ff' }]}>
                  <Text style={[s.avatarText, { color: '#4f46e5' }]}>✍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{item.subject_name || item.title || 'Handwritten Exam'}</Text>
                  <Text style={s.cardMeta}>{date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                  {pct != null && <Text style={[s.pctText, { color: g?.color || '#64748b' }]}>{pct}%</Text>}
                </View>
              </View>
              {pct != null && (
                <>
                  <View style={s.scoreRow}>
                    <Text style={s.scoreText}>{item.score ?? 0} / {item.total_marks ?? '—'} marks</Text>
                    {item.status === 'GRADED' && <Text style={{ fontSize: 12, color: '#94a3b8' }}>›</Text>}
                  </View>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: g?.color || '#4f46e5' }]} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          );
        })
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginBottom: 8 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: '#818cf8', fontSize: 13, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerLabel}>STUDENT PORTAL</Text>
        <Text style={s.headerTitle}>Exam Results</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {[
            { label: 'Online',    value: online.length,      color: 'rgba(79,70,229,0.3)' },
            { label: 'Avg Score', value: onlineAvg != null ? `${onlineAvg}%` : '—', color: 'rgba(16,185,129,0.25)' },
            { label: 'HW Graded',value: hwGraded.length,    color: 'rgba(245,158,11,0.3)' },
            { label: 'HW Avg',   value: hwAvg != null ? `${hwAvg}%` : '—', color: 'rgba(139,92,246,0.3)' },
          ].map(({ label, value, color }) => (
            <View key={label} style={[s.pill, { backgroundColor: color }]}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === i && s.tabBtnActive]} onPress={() => setTab(i)}>
            <Text style={[s.tabText, tab === i && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
      >
        {tab === 0 ? renderOnline() : renderHandwritten()}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:       { backgroundColor: '#0f172a', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 },
  headerLabel:  { color: '#818cf8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '800' },
  pill:         { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  tabRow:       { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabBtn:       { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#4f46e5' },
  tabText:      { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  tabTextActive:{ color: '#4f46e5' },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar:       { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontWeight: '800', fontSize: 17 },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  cardMeta:     { fontSize: 12, color: '#64748b', marginTop: 2 },
  pctText:      { fontSize: 18, fontWeight: '800' },
  statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:   { fontWeight: '700', fontSize: 11 },
  scoreRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  scoreText:    { fontSize: 12, color: '#64748b', fontWeight: '600' },
  barBg:        { height: 6, backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 99 },
});
