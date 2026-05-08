import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput,
} from 'react-native';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { GRADES, getGrade, studentName, deriveProgressAnalysis } from '../../utils/helpers';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import PctBar from '../../components/PctBar';
import PickerModal from '../../components/PickerModal';
import AnalysisCard from '../../components/AnalysisCard';

const CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'online', label: 'Online Exams' },
  { id: 'handwritten', label: 'Handwritten' },
];

function SubjectTable({ title, accent, rows }) {
  return (
    <View style={[s.tableCard, { marginBottom: 12 }]}>
      {/* Section title strip */}
      <View style={{ backgroundColor: accent, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{title}</Text>
      </View>
      {/* Header */}
      <View style={[s.tableRow, s.tableHeader]}>
        <Text style={[s.th, { flex: 2 }]}>Subject</Text>
        <Text style={[s.th, { width: 65, textAlign: 'right' }]}>Score</Text>
        <Text style={[s.th, { width: 42, textAlign: 'right' }]}>%</Text>
        <Text style={[s.th, { width: 32, textAlign: 'center' }]}>Grd</Text>
      </View>
      {rows.map((row, i) => {
        const pct = Math.round(row.percentage);
        const g = getGrade(pct);
        return (
          <View key={i} style={s.tableRow}>
            <View style={{ flex: 2 }}>
              <Text style={s.subjectName}>{row.subject_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <PctBar pct={pct} color={accent} />
                <Text style={{ fontSize: 10, color: '#94a3b8', width: 28, textAlign: 'right' }}>{row.exams_count}ex</Text>
              </View>
            </View>
            <Text style={[s.td, { width: 65 }]}>{row.total_score}/{row.total_marks}</Text>
            <Text style={[s.td, { width: 42, color: pct >= 60 ? '#10b981' : pct >= 35 ? '#f59e0b' : '#dc2626', fontWeight: '700' }]}>{pct}%</Text>
            <View style={{ width: 32, alignItems: 'center' }}>
              <View style={[s.gradeBadge, { backgroundColor: g.bg }]}>
                <Text style={[s.gradeText, { color: g.color }]}>{g.label}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function ProgressCardsScreen({ navigation }) {
  const { user } = useAuth();
  const isSchool = user?.role === 'school';

  const [students, setStudents]         = useState([]);
  const [selectedStudent, setStudent]   = useState(null);
  const [studentModal, setStudentModal] = useState(false);

  const [category, setCategory]         = useState(CATEGORIES[0]);
  const [categoryModal, setCategoryModal] = useState(false);

  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');

  const [progress, setProgress]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const url = isSchool ? '/api/auth/members/?role=student' : '/api/auth/my-students/';
      const res = await api.get(url);
      const list = res.data?.results || res.data || [];
      setStudents(list);
      if (list.length > 0 && !selectedStudent) setStudent(list[0]);
    } catch { }
    finally { setStudentsLoading(false); }
  }, [isSchool]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const fetchProgress = useCallback(async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('student_id', selectedStudent.id);
      if (category.id && category.id !== 'handwritten') params.append('exam_category', category.id);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      // Fetch online results and handwritten results in parallel
      const [onlineRes, hwRes] = await Promise.all([
        (category.id === 'handwritten') ? Promise.resolve({ data: { results: [] } })
          : api.get(`/api/progress-card/?${params.toString()}`),
        (category.id === 'online') ? Promise.resolve({ data: [] })
          : api.get(`/api/handwritten/?student_id=${selectedStudent.id}`),
      ]);

      const groupBySubject = (items, keyField = 'subject_name') => {
        const map = {};
        items.forEach(r => {
          const key = r.subject_id || r[keyField] || 'unknown';
          if (!map[key]) {
            map[key] = { subject_name: r.subject_name || r[keyField] || 'Unknown', total_score: 0, total_marks: 0, exams_count: 0 };
          }
          map[key].total_score += (r.score ?? r.obtained_marks ?? 0);
          map[key].total_marks += (r.total_marks || 0);
          map[key].exams_count += 1;
        });
        return Object.values(map).map(sub => ({
          ...sub,
          percentage: sub.total_marks > 0 ? (sub.total_score / sub.total_marks) * 100 : 0,
        }));
      };

      const calcGrand = (subjects) => {
        const gs = subjects.reduce((a, sub) => a + sub.total_score, 0);
        const gm = subjects.reduce((a, sub) => a + sub.total_marks, 0);
        return gm > 0 ? { total_score: gs, total_marks: gm, percentage: (gs / gm) * 100 } : null;
      };

      const onlineRaw = onlineRes.data?.results || onlineRes.data || [];
      // Only include GRADED handwritten exams in the progress card
      const hwRaw = (hwRes.data?.results || hwRes.data || []).filter(e => e.status === 'GRADED');

      const onlineSubjects     = groupBySubject(onlineRaw.filter(r => r.source === 'online' || !r.source));
      const handwrittenSubjects = groupBySubject(hwRaw);
      const allRaw = [
        ...onlineRaw.map(r => ({ ...r, score: r.score || 0 })),
        ...hwRaw.map(r => ({ ...r, score: r.obtained_marks ?? r.score ?? 0, subject_id: r.subject_id || r.subject_name })),
      ];
      const allSubjects = groupBySubject(allRaw);

      setProgress({
        online: onlineSubjects,
        handwritten: handwrittenSubjects,
        subjects: allSubjects,
        grand_total: calcGrand(allSubjects),
      });
    } catch { setProgress(null); }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedStudent, category, dateFrom, dateTo]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const subjects = progress?.subjects || [];
  const grand = progress?.grand_total || null;
  const progressAnalysis = grand ? deriveProgressAnalysis(progress, grand) : null;

  if (studentsLoading) {
    return <LoadingScreen color="#4f46e5" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label={isSchool ? 'School Admin' : 'Teacher Portal'}
        title="Progress Cards"
        subtitle="Student performance summary"
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProgress(); }} tintColor="#4f46e5" />}
      >
        {/* Filters */}
        <View style={s.filterCard}>
          <Text style={s.filterTitle}>Filters</Text>

          {/* Student picker */}
          <Text style={s.filterLabel}>Student</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setStudentModal(true)}>
            <Text style={s.pickerBtnText}>{selectedStudent ? studentName(selectedStudent) : 'Select student…'}</Text>
            <Text style={{ color: '#94a3b8' }}>▾</Text>
          </TouchableOpacity>

          {/* Category picker */}
          <Text style={[s.filterLabel, { marginTop: 12 }]}>Category</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setCategoryModal(true)}>
            <Text style={s.pickerBtnText}>{category.label}</Text>
            <Text style={{ color: '#94a3b8' }}>▾</Text>
          </TouchableOpacity>

          {/* Date range */}
          <Text style={[s.filterLabel, { marginTop: 12 }]}>Date Range (YYYY-MM-DD)</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[s.dateInput, { flex: 1 }]}
              placeholder="From"
              value={dateFrom}
              onChangeText={setDateFrom}
              onSubmitEditing={fetchProgress}
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              style={[s.dateInput, { flex: 1 }]}
              placeholder="To"
              value={dateTo}
              onChangeText={setDateTo}
              onSubmitEditing={fetchProgress}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity style={s.applyBtn} onPress={fetchProgress}>
            <Text style={s.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {loading ? (
          <LoadingScreen color="#4f46e5" />
        ) : !progress || subjects.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No Data"
            message={selectedStudent ? 'No exam results found for the selected filters.' : 'Select a student to view progress.'}
          />
        ) : (
          <>
            {/* Student info strip */}
            {selectedStudent && (
              <View style={s.studentStrip}>
                <View style={s.studentAvatar}>
                  <Text style={s.studentAvatarText}>{studentName(selectedStudent)[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.studentName}>{studentName(selectedStudent)}</Text>
                  {selectedStudent.grade && <Text style={s.studentMeta}>Class {selectedStudent.grade}{selectedStudent.section}</Text>}
                </View>
                {grand && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.overallPct}>{Math.round(grand.percentage)}%</Text>
                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>Overall</Text>
                  </View>
                )}
              </View>
            )}

            {/* Online Exams table */}
            {progress.online?.length > 0 && (
              <SubjectTable title="Online Exams" accent="#4f46e5" rows={progress.online} />
            )}

            {/* Handwritten Exams table */}
            {progress.handwritten?.length > 0 && (
              <SubjectTable title="Handwritten Exams" accent="#0891b2" rows={progress.handwritten} />
            )}

            {/* Grand total */}
            {grand && (
              <View style={[s.tableCard, { marginBottom: 12 }]}>
                <View style={[s.tableRow, s.grandRow]}>
                  <View style={{ flex: 2 }}>
                    <Text style={s.grandLabel}>Grand Total (All)</Text>
                  </View>
                  <Text style={[s.grandValue, { width: 65 }]}>{grand.total_score}/{grand.total_marks}</Text>
                  <Text style={[s.grandValue, { width: 42, color: grand.percentage >= 60 ? '#10b981' : grand.percentage >= 35 ? '#f59e0b' : '#dc2626' }]}>
                    {Math.round(grand.percentage)}%
                  </Text>
                  <View style={{ width: 32, alignItems: 'center' }}>
                    {(() => { const g = getGrade(Math.round(grand.percentage)); return (
                      <View style={[s.gradeBadge, { backgroundColor: g.bg }]}>
                        <Text style={[s.gradeText, { color: g.color }]}>{g.label}</Text>
                      </View>
                    ); })()}
                  </View>
                </View>
              </View>
            )}

            {/* AI Analysis */}
            {progressAnalysis && (
              <View style={s.analysisCard}>
                <Text style={s.analysisSectionTitle}>AI Analysis</Text>
                {progressAnalysis.strengths?.length > 0 && (
                  <View style={s.analysisBlock}>
                    <Text style={[s.analysisBlockTitle, { color: '#059669' }]}>STRENGTHS</Text>
                    {progressAnalysis.strengths.map((pt, i) => <Text key={i} style={[s.analysisPt, { color: '#065f46' }]}>• {pt}</Text>)}
                  </View>
                )}
                {progressAnalysis.weaknesses?.length > 0 && (
                  <View style={s.analysisBlock}>
                    <Text style={[s.analysisBlockTitle, { color: '#dc2626' }]}>AREAS TO IMPROVE</Text>
                    {progressAnalysis.weaknesses.map((pt, i) => <Text key={i} style={[s.analysisPt, { color: '#991b1b' }]}>• {pt}</Text>)}
                  </View>
                )}
                {progressAnalysis.recommendations?.length > 0 && (
                  <View style={s.analysisBlock}>
                    <Text style={[s.analysisBlockTitle, { color: '#2563eb' }]}>RECOMMENDATIONS</Text>
                    {progressAnalysis.recommendations.map((pt, i) => <Text key={i} style={[s.analysisPt, { color: '#1e40af' }]}>• {pt}</Text>)}
                  </View>
                )}
              </View>
            )}

            {/* Grade scale legend */}
            <View style={s.legendCard}>
              <Text style={s.legendTitle}>Grade Scale</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {GRADES.map(g => (
                  <View key={g.label} style={[s.gradeBadge, { backgroundColor: g.bg }]}>
                    <Text style={[s.gradeText, { color: g.color }]}>{g.label} ≥{g.min}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Student modal */}
      <PickerModal
        visible={studentModal}
        title="Select Student"
        items={students.map(s => ({ ...s, label: studentName(s) }))}
        onSelect={setStudent}
        onClose={() => setStudentModal(false)}
      />

      {/* Category modal */}
      <PickerModal
        visible={categoryModal}
        title="Select Category"
        items={CATEGORIES}
        onSelect={setCategory}
        onClose={() => setCategoryModal(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({

  filterCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  filterTitle:    { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  filterLabel:    { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  pickerBtn:      { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerBtnText:  { color: '#334155', fontSize: 14, flex: 1 },
  dateInput:      { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#334155' },
  applyBtn:       { backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 14 },
  applyBtnText:   { color: '#fff', fontWeight: '800', fontSize: 13 },

  studentStrip:   { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  studentAvatar:  { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 18, fontWeight: '800', color: '#5b21b6' },
  studentName:    { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  studentMeta:    { fontSize: 12, color: '#64748b' },
  overallPct:     { fontSize: 22, fontWeight: '800', color: '#4f46e5' },

  tableCard:      { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  tableRow:       { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableHeader:    { backgroundColor: '#f8fafc' },
  th:             { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  td:             { fontSize: 13, color: '#334155', textAlign: 'right' },
  subjectName:    { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  gradeBadge:     { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  gradeText:      { fontSize: 10, fontWeight: '800' },
  grandRow:       { backgroundColor: '#f0fdf4', borderTopWidth: 2, borderTopColor: '#bbf7d0' },
  grandLabel:     { fontSize: 13, fontWeight: '800', color: '#065f46' },
  grandValue:     { fontSize: 13, fontWeight: '800', color: '#065f46', textAlign: 'right' },

  legendCard:           { backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  legendTitle:          { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  analysisCard:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  analysisSectionTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  analysisBlock:        { marginBottom: 10 },
  analysisBlockTitle:   { fontSize: 11, fontWeight: '800', marginBottom: 6 },
  analysisPt:           { fontSize: 12, lineHeight: 18, marginBottom: 3 },
});
