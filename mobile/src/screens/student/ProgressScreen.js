import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../../api/axios';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import GradeBadge from '../../components/GradeBadge';
import { getGrade } from '../../utils/helpers';

export default function ProgressScreen({ navigation }) {
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/api/progress-card/');
      setResults(res.data.results || []);
      setStudent(res.data.student || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingScreen />;

  const grandScore = results.reduce((sum, r) => sum + Number(r.score || 0), 0);
  const grandTotal = results.reduce((sum, r) => sum + Number(r.total_marks || 0), 0);
  const grandPct   = grandTotal > 0 ? Math.round((grandScore / grandTotal) * 100) : 0;
  const g = getGrade(grandPct);

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
    >
      {/* Header card */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ alignSelf: 'flex-start', marginBottom: 8 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: '#818cf8', fontSize: 13, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <View style={s.avatar}><Text style={s.avatarText}>{student?.name?.[0] || 'S'}</Text></View>
        <Text style={s.name}>{student?.name || 'Student'}</Text>
        {student?.grade && <Text style={s.className}>Class {student.grade}{student.section || ''}</Text>}
        <View style={[s.overallBadge, { backgroundColor: g.color }]}>
          <Text style={s.overallText}>{grandPct}% · Grade {g.label}</Text>
        </View>
      </View>

      {results.length === 0
        ? <EmptyState icon="📊" title="No Results Yet" message="No exam results yet." style={{ margin: 16 }} />
        : results.map((r, i) => {
            const pct = Math.round(r.percentage || 0);
            const rg = getGrade(pct);
            return (
              <View key={i} style={s.card}>
                <View style={s.row}>
                  <View style={s.badge}><Text style={s.badgeText}>{r.subject_name?.charAt(0)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.subject}>{r.subject_name}</Text>
                    <Text style={s.category}>{r.exam_category_display || r.exam_category || 'General'}</Text>
                  </View>
                  <GradeBadge pct={pct} />
                </View>
                <View style={s.scoreRow}>
                  <Text style={s.score}>{Number(r.score || 0)} / {r.total_marks}</Text>
                  <Text style={[s.pct, { color: rg.color }]}>{pct}%</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: rg.color }]} />
                </View>
              </View>
            );
          })
      }
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f8fafc' },
  header:       { backgroundColor: '#1e1b4b', padding: 28, alignItems: 'center', paddingTop: 40 },
  avatar:       { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:   { color: '#fff', fontSize: 26, fontWeight: '800' },
  name:         { color: '#fff', fontSize: 20, fontWeight: '800' },
  className:    { color: '#a5b4fc', fontSize: 13, marginTop: 4 },
  overallBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 12 },
  overallText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:         { backgroundColor: '#fff', borderRadius: 16, margin: 16, marginBottom: 0, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  badge:        { width: 40, height: 40, borderRadius: 10, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  badgeText:    { color: '#4f46e5', fontWeight: '800', fontSize: 16 },
  subject:      { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  category:     { fontSize: 12, color: '#64748b', marginTop: 2 },
  scoreRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  score:        { fontSize: 13, color: '#475569', fontWeight: '600' },
  pct:          { fontSize: 13, fontWeight: '800' },
  barBg:        { height: 6, backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 99 },
});
