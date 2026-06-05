import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl,
} from 'react-native';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

export default function SchoolExamsListScreen({ navigation }) {
  const [exams, setExams]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');

  const load = async () => {
    try {
      const res = await api.get('/api/exams/assigned/');
      setExams(res.data.results || res.data || []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = exams.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.teacher_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingScreen color="#059669" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label="School Admin"
        title="All Exams"
        subtitle={`${exams.length} exam${exams.length !== 1 ? 's' : ''} assigned by your teachers`}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#059669" />}
      >
        {/* Search */}
        <TextInput
          style={s.search}
          placeholder="Search by title, subject or teacher…"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />

        {filtered.length === 0 ? (
          <EmptyState icon="📋" title="No Exams Found" message="Exams assigned by teachers will appear here." />
        ) : (
          filtered.map(exam => (
            <TouchableOpacity
              key={exam.id}
              style={s.card}
              onPress={() => navigation.navigate('ExamSubmissions', { examId: exam.id })}
              activeOpacity={0.8}
            >
              <View style={s.cardTop}>
                <View style={s.icon}>
                  <Text style={{ fontSize: 18 }}>📋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>{exam.title}</Text>
                  <Text style={s.subject}>{exam.subject_name}</Text>
                  <Text style={s.teacher}>by {exam.teacher_name}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: exam.is_active ? '#d1fae5' : '#f1f5f9' }]}>
                  <Text style={[s.statusText, { color: exam.is_active ? '#065f46' : '#64748b' }]}>
                    {exam.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={s.stats}>
                <View style={s.stat}><Text style={s.statVal}>{exam.total_marks}</Text><Text style={s.statLbl}>Marks</Text></View>
                <View style={s.stat}><Text style={s.statVal}>{exam.duration_minutes}m</Text><Text style={s.statLbl}>Duration</Text></View>
                <View style={s.stat}><Text style={s.statVal}>{exam.student_count ?? '—'}</Text><Text style={s.statLbl}>Students</Text></View>
                <View style={s.stat}><Text style={s.statVal}>{exam.completed_count ?? '—'}</Text><Text style={s.statLbl}>Done</Text></View>
              </View>

              {exam.exam_category_display && (
                <View style={s.catChip}>
                  <Text style={s.catText}>{exam.exam_category_display}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  search:     { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#334155', marginBottom: 14 },
  card:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  icon:       { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  subject:    { fontSize: 12, color: '#64748b' },
  teacher:    { fontSize: 11, color: '#4f46e5', fontWeight: '600', marginTop: 2 },
  statusBadge:{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '800' },
  stats:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, gap: 4 },
  stat:       { flex: 1, alignItems: 'center' },
  statVal:    { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  statLbl:    { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  catChip:    { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  catText:    { fontSize: 10, fontWeight: '700', color: '#4f46e5' },
});
