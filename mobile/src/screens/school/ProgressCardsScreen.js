import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput,
} from 'react-native';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getGrade, studentName } from '../../utils/helpers';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import PctBar from '../../components/PctBar';
import PickerModal from '../../components/PickerModal';

function gradeBadge(pct) {
  if (pct >= 90) return { label: 'A+', bg: '#d1fae5', color: '#065f46' };
  if (pct >= 75) return { label: 'A',  bg: '#d1fae5', color: '#065f46' };
  if (pct >= 60) return { label: 'B',  bg: '#dbeafe', color: '#1e40af' };
  if (pct >= 50) return { label: 'C',  bg: '#fef9c3', color: '#854d0e' };
  if (pct >= 35) return { label: 'D',  bg: '#ffedd5', color: '#9a3412' };
  return               { label: 'F',  bg: '#fee2e2', color: '#991b1b' };
}

export default function ProgressCardsScreen({ navigation }) {
  const { user } = useAuth();
  const isSchool = user?.role === 'school';

  const [students, setStudents]             = useState([]);
  const [studentModal, setStudentModal]     = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch]   = useState('');

  const [results, setResults]               = useState([]);
  const [studentInfo, setStudentInfo]       = useState(null);
  const [loading, setLoading]               = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [searched, setSearched]             = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const fetchStudents = useCallback(async () => {
    try {
      const url = isSchool ? '/api/auth/members/?role=student' : '/api/auth/my-students/';
      const res = await api.get(url);
      setStudents(res.data?.results || res.data || []);
    } catch { }
    finally { setStudentsLoading(false); }
  }, [isSchool]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchProgress = useCallback(async () => {
    if (!selectedStudent) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = { student_id: selectedStudent.id };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      const res = await api.get('/api/progress-card/', { params });
      setResults(res.data.results || []);
      setStudentInfo(res.data.student || null);
    } catch { setResults([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedStudent, dateFrom, dateTo]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const clear = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    setDateFrom('');
    setDateTo('');
    setResults([]);
    setStudentInfo(null);
    setSearched(false);
  };

  // Deduplicate: best result per subject+category+source
  const grid = {};
  for (const r of results) {
    const key = `${r.subject_id}_${r.exam_category}_${r.source}`;
    if (!grid[key] || r.percentage > grid[key].percentage) grid[key] = r;
  }
  const rows = Object.values(grid).map(r => {
    const score = Number(r.score || 0);
    const total = Number(r.total_marks || 0);
    return {
      key:       `${r.subject_id}_${r.exam_category}_${r.source}`,
      subject:   r.subject_name,
      category:  r.exam_category_display || r.exam_category || '',
      score, total,
      pct:       total > 0 ? Math.round((score / total) * 100) : 0,
      source:    r.source,
      result_id: r.result_id,
    };
  }).sort((a, b) => a.subject.localeCompare(b.subject) || a.category.localeCompare(b.category));

  const grandScore = rows.reduce((s, r) => s + r.score, 0);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const grandPct   = grandTotal > 0 ? Math.round((grandScore / grandTotal) * 100) : 0;
  const grandGrade = gradeBadge(grandPct);

  const passCount  = rows.filter(r => r.pct >= 35).length;
  const topSubject = rows.length > 0 ? [...rows].sort((a, b) => b.pct - a.pct)[0] : null;

  const filteredStudents = students.filter(s => {
    const name = `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase();
    return name.includes(studentSearch.toLowerCase());
  });

  const handleRowPress = (row) => {
    if (!row.result_id) return;
    navigation.navigate('ExamResultDetail', {
      resultId: row.result_id,
      type: row.source === 'handwritten' ? 'handwritten' : 'online',
    });
  };

  if (studentsLoading) return <LoadingScreen color="#4f46e5" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label={isSchool ? 'School Admin' : 'Teacher Portal'}
        title="Progress Cards"
        subtitle={searched && studentInfo ? studentInfo.name : 'Student performance summary'}
      >
        {searched && studentInfo && rows.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { label: `${rows.length} Exams`, bg: 'rgba(255,255,255,0.15)' },
              { label: `${passCount} Passed`,  bg: 'rgba(16,185,129,0.25)' },
              topSubject && { label: `Best: ${topSubject.subject}`, bg: 'rgba(245,158,11,0.25)' },
            ].filter(Boolean).map((chip, i) => (
              <View key={i} style={{ backgroundColor: chip.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{chip.label}</Text>
              </View>
            ))}
          </View>
        )}
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProgress(); }} tintColor="#4f46e5" />}
      >
        {/* Find Student card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIcon}>
              <Text style={{ color: '#fff', fontSize: 14 }}>🔍</Text>
            </View>
            <Text style={s.cardHeaderText}>Find Student</Text>
          </View>
          <View style={s.cardBody}>
            {/* Search input */}
            <Text style={s.label}>Search by Name</Text>
            <TextInput
              style={s.input}
              placeholder="Type name or username…"
              placeholderTextColor="#94a3b8"
              value={studentSearch}
              onChangeText={setStudentSearch}
            />

            {/* Student picker */}
            <Text style={[s.label, { marginTop: 12 }]}>Select Student</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => setStudentModal(true)}>
              <Text style={[s.pickerBtnText, !selectedStudent && { color: '#94a3b8' }]}>
                {selectedStudent
                  ? `${selectedStudent.first_name} ${selectedStudent.last_name}${selectedStudent.grade ? ` (Class ${selectedStudent.grade}${selectedStudent.section || ''})` : ''}`
                  : '— Select Student —'}
              </Text>
              <Text style={{ color: '#94a3b8' }}>▾</Text>
            </TouchableOpacity>

            {/* Date range */}
            <Text style={[s.label, { marginTop: 12 }]}>Date Range</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="From (YYYY-MM-DD)" placeholderTextColor="#94a3b8" value={dateFrom} onChangeText={setDateFrom} />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="To (YYYY-MM-DD)"   placeholderTextColor="#94a3b8" value={dateTo}   onChangeText={setDateTo}   />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[s.primaryBtn, (!selectedStudent || loading) && { opacity: 0.5 }]}
                onPress={fetchProgress}
                disabled={!selectedStudent || loading}
              >
                <Text style={s.primaryBtnText}>{loading ? 'Loading…' : 'View Progress Card'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.clearBtn} onPress={clear}>
                <Text style={s.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <LoadingScreen color="#4f46e5" />
        ) : !searched ? (
          <EmptyState icon="🔍" title="Select a Student" message="Search and select a student above to view their progress card." />
        ) : rows.length === 0 ? (
          <EmptyState icon="📊" title="No Progress Data" message="No exam results found for the selected filters." />
        ) : (
          <View style={s.card}>
            {/* Table header */}
            <View style={[s.tableRow, s.tableHead]}>
              <Text style={[s.th, { width: 24 }]}>#</Text>
              <Text style={[s.th, { flex: 1 }]}>Subject</Text>
              <Text style={[s.th, { width: 60 }]}>Exam</Text>
              <Text style={[s.th, { width: 36, textAlign: 'center' }]}>Max</Text>
              <Text style={[s.th, { width: 44, textAlign: 'center' }]}>Got</Text>
              <Text style={[s.th, { width: 52, textAlign: 'center' }]}>Grade</Text>
            </View>

            {rows.map((row, idx) => {
              const g = gradeBadge(row.pct);
              return (
                <TouchableOpacity
                  key={row.key}
                  style={[s.tableRow, idx < rows.length - 1 && s.rowBorder]}
                  onPress={() => handleRowPress(row)}
                  activeOpacity={row.result_id ? 0.7 : 1}
                >
                  <Text style={[s.td, { width: 24, color: '#94a3b8' }]}>{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={s.subjectIcon}>
                        <Text style={s.subjectIconText}>{row.subject.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={s.subjectName} numberOfLines={1}>{row.subject}</Text>
                      {row.source === 'handwritten' && <Text style={{ fontSize: 10 }}>✍️</Text>}
                    </View>
                    <View style={{ marginTop: 4, paddingLeft: 30 }}>
                      <PctBar pct={row.pct} color={row.pct >= 60 ? '#10b981' : row.pct >= 35 ? '#f59e0b' : '#ef4444'} />
                    </View>
                  </View>
                  <View style={{ width: 60, alignItems: 'center' }}>
                    {row.category ? (
                      <View style={s.categoryChip}>
                        <Text style={s.categoryChipText} numberOfLines={1}>{row.category}</Text>
                      </View>
                    ) : (
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>—</Text>
                    )}
                  </View>
                  <Text style={[s.td, { width: 36, textAlign: 'center', color: '#475569' }]}>{row.total}</Text>
                  <Text style={[s.td, { width: 44, textAlign: 'center', color: '#4f46e5', fontWeight: '800' }]}>{row.score}</Text>
                  <View style={{ width: 52, alignItems: 'center' }}>
                    <View style={[s.gradePill, { backgroundColor: g.bg }]}>
                      <Text style={[s.gradePillText, { color: g.color }]}>{g.label}</Text>
                    </View>
                    {row.result_id ? (
                      <Text style={{ fontSize: 10, color: '#6366f1', marginTop: 2 }}>View →</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Total row */}
            <View style={[s.tableRow, s.totalRow]}>
              <Text style={[s.totalLabel, { width: 24 }]} />
              <Text style={[s.totalLabel, { flex: 1 }]}>Total</Text>
              <View style={{ width: 60 }} />
              <Text style={[s.totalLabel, { width: 36, textAlign: 'center' }]}>{grandTotal}</Text>
              <Text style={[s.totalValue, { width: 44, textAlign: 'center' }]}>{grandScore}</Text>
              <View style={{ width: 52, alignItems: 'center' }}>
                <View style={[s.gradePill, { backgroundColor: grandGrade.bg }]}>
                  <Text style={[s.gradePillText, { color: grandGrade.color }]}>{grandGrade.label}</Text>
                </View>
              </View>
            </View>

            {/* Legend */}
            <View style={s.legend}>
              {[
                { color: '#10b981', label: 'A+ ≥90%' },
                { color: '#22c55e', label: 'A ≥75%' },
                { color: '#3b82f6', label: 'B ≥60%' },
                { color: '#eab308', label: 'C ≥50%' },
                { color: '#f97316', label: 'D ≥35%' },
                { color: '#ef4444', label: 'F <35%' },
              ].map(({ color, label }) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <PickerModal
        visible={studentModal}
        title="Select Student"
        items={filteredStudents.map(s => ({ ...s, label: `${s.first_name} ${s.last_name}${s.grade ? ` (Class ${s.grade}${s.section || ''})` : ''}` }))}
        onSelect={s => { setSelectedStudent(s); setStudentModal(false); }}
        onClose={() => setStudentModal(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card:           { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardIcon:       { width: 32, height: 32, borderRadius: 10, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  cardBody:       { padding: 16 },
  label:          { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:          { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#334155', backgroundColor: '#f8fafc' },
  pickerBtn:      { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
  pickerBtnText:  { color: '#334155', fontSize: 13, flex: 1 },
  primaryBtn:     { flex: 1, backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  clearBtn:       { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  clearBtnText:   { color: '#64748b', fontWeight: '700', fontSize: 13 },

  tableHead:      { backgroundColor: '#1e293b', paddingVertical: 12 },
  th:             { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 6 },
  rowBorder:      { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  td:             { fontSize: 13, color: '#334155' },
  subjectIcon:    { width: 26, height: 26, borderRadius: 8, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  subjectIconText:{ fontSize: 11, fontWeight: '800', color: '#4f46e5' },
  subjectName:    { fontSize: 13, fontWeight: '600', color: '#1e293b', flex: 1 },
  categoryChip:   { backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, maxWidth: 58 },
  categoryChipText:{ fontSize: 10, fontWeight: '600', color: '#4f46e5' },
  gradePill:      { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  gradePillText:  { fontSize: 11, fontWeight: '800' },
  totalRow:       { backgroundColor: '#eef2ff', borderTopWidth: 2, borderTopColor: '#c7d2fe' },
  totalLabel:     { fontSize: 13, fontWeight: '800', color: '#4338ca' },
  totalValue:     { fontSize: 13, fontWeight: '800', color: '#4f46e5' },
  legend:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
});
