import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';

function SectionCard({ title, accent = '#4f46e5', children }) {
  return (
    <View style={[s.card, { marginBottom: 14 }]}>
      <View style={[s.cardHeader, { borderLeftColor: accent }]}>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      <View style={s.cardBody}>{children}</View>
    </View>
  );
}

export default function CreateExamScreen({ navigation }) {
  const { user } = useAuth();
  const [assignments, setAssignments]         = useState([]);
  const [chapters, setChapters]               = useState([]);
  const [students, setStudents]               = useState([]);
  const [availableQs, setAvailableQs]         = useState([]);
  const [selectedQIds, setSelectedQIds]       = useState([]);
  const [qLoading, setQLoading]               = useState(false);
  const [qFilters, setQFilters]               = useState({ chapter: '', question_type: '', difficulty: '' });
  const [selectionMode, setSelectionMode]     = useState('random');
  const [form, setForm] = useState({
    title: '', subject: '', chapter_ids: [],
    duration_minutes: '90', total_marks: '50',
    num_mcq: '20', num_short: '5', num_long: '4',
    student_ids: [],
    start_time: new Date(),
    end_time: new Date(Date.now() + 2 * 3600000),
  });
  const [loading, setLoading]                 = useState(false);
  const [initLoading, setInitLoading]         = useState(true);
  const [error, setError]                     = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker]     = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const [assignRes, subjectRes] = await Promise.allSettled([
          api.get('/api/assignments/my/'),
          api.get('/api/subjects/'),
        ]);

        let assignList = [];
        if (assignRes.status === 'fulfilled') {
          assignList = assignRes.value.data.results || assignRes.value.data || [];
        }

        let subjectList = [];
        if (subjectRes.status === 'fulfilled') {
          subjectList = subjectRes.value.data.results || subjectRes.value.data || [];
        }

        if (assignList.length > 0) {
          setAssignments(assignList);
        } else {
          setAssignments(subjectList.map(s => ({ subject: s.id, subject_name: s.name })));
        }
      } catch (e) {
        // ignore load errors
      } finally {
        setInitLoading(false);
      }
    };
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!form.subject) { setChapters([]); setStudents([]); return; }
    api.get('/api/chapters/', { params: { subject: form.subject } })
      .then(res => setChapters(res.data.results || res.data))
      .catch(() => {});
    const match = assignments.filter(a => String(a.subject) === String(form.subject));
    const asgn = match[0];
    // If assignment has grade (teacher), use teacher endpoint; else school admin — fetch all students
    if (asgn?.grade) {
      api.get('/api/auth/my-students/', { params: { subject: asgn.subject, grade: asgn.grade, section: asgn.section } })
        .then(res => {
          const data = res.data.results || res.data;
          setStudents(data);
          setForm(p => ({ ...p, student_ids: data.map(s => s.id) }));
        }).catch(() => {});
    } else {
      api.get('/api/auth/members/?role=student')
        .then(res => {
          const data = res.data.results || res.data;
          setStudents(data);
          setForm(p => ({ ...p, student_ids: data.map(s => s.id) }));
        }).catch(() => {});
    }
    setSelectedQIds([]);
  }, [form.subject]);

  useEffect(() => {
    if (selectionMode !== 'manual' || !form.subject) { setAvailableQs([]); return; }
    setQLoading(true);
    const params = { subject: form.subject };
    if (qFilters.chapter) params.chapter = qFilters.chapter;
    if (qFilters.question_type) params.question_type = qFilters.question_type;
    if (qFilters.difficulty) params.difficulty = qFilters.difficulty;
    api.get('/api/questions/', { params })
      .then(res => setAvailableQs(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setQLoading(false));
  }, [selectionMode, form.subject, qFilters]);

  const subjects = [...new Map(assignments.map(a => [a.subject, a.subject_name])).entries()]
    .map(([id, name]) => ({ id, name }));

  const openDatePicker = (field) => {
    const current = form[field];
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current, mode: 'date', is24Hour: true,
        onChange: (_, date) => {
          if (!date) return;
          DateTimePickerAndroid.open({
            value: date, mode: 'time', is24Hour: true,
            onChange: (_, time) => {
              if (!time) return;
              const combined = new Date(date);
              combined.setHours(time.getHours(), time.getMinutes());
              setForm(p => ({ ...p, [field]: combined }));
            },
          });
        },
      });
    } else {
      if (field === 'start_time') setShowStartPicker(true);
      else setShowEndPicker(true);
    }
  };

  const toggleChapter = id => setForm(p => ({
    ...p, chapter_ids: p.chapter_ids.includes(id) ? p.chapter_ids.filter(c => c !== id) : [...p.chapter_ids, id]
  }));
  const toggleStudent = id => setForm(p => ({
    ...p, student_ids: p.student_ids.includes(id) ? p.student_ids.filter(s => s !== id) : [...p.student_ids, id]
  }));
  const toggleQ = id => setSelectedQIds(p => p.includes(id) ? p.filter(q => q !== id) : [...p, id]);

  const selQs = availableQs.filter(q => selectedQIds.includes(q.id));
  const mcqCnt   = selQs.filter(q => q.question_type === 'MCQ').length;
  const shortCnt = selQs.filter(q => q.question_type === 'SHORT').length;
  const longCnt  = selQs.filter(q => q.question_type === 'LONG').length;
  const manualMarks = selQs.reduce((sum, q) => sum + (q.marks || 1), 0);

  const fmtDate = d => d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.subject) { setError('Title and subject are required.'); return; }
    if (selectionMode === 'manual' && selectedQIds.length === 0) { setError('Select at least one question.'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        title: form.title, subject: form.subject, chapter_ids: form.chapter_ids,
        duration_minutes: parseInt(form.duration_minutes) || 90,
        total_marks: selectionMode === 'manual' ? manualMarks : (parseInt(form.total_marks) || 50),
        student_ids: form.student_ids,
        start_time: form.start_time.toISOString(), end_time: form.end_time.toISOString(),
        selection_mode: selectionMode,
      };
      if (selectionMode === 'manual') {
        payload.question_ids = selectedQIds; payload.num_mcq = mcqCnt;
        payload.num_short = shortCnt; payload.num_long = longCnt;
      } else {
        payload.num_mcq = parseInt(form.num_mcq) || 0;
        payload.num_short = parseInt(form.num_short) || 0;
        payload.num_long = parseInt(form.num_long) || 0;
      }
      await api.post('/api/exams/assigned/create/', payload);
      Alert.alert('Success', 'Exam created successfully!', [{
        text: 'View Exams', onPress: () => navigation.navigate('CreatedExams')
      }, {
        text: 'Done', onPress: () => navigation.goBack()
      }]);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create exam.');
    } finally { setLoading(false); }
  };

  if (initLoading) return <LoadingScreen />;

  const subjectName = subjects.find(x => String(x.id) === String(form.subject))?.name || 'Select Subject';

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label={user?.role === 'school' ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
        title="New Exam Setup"
        subtitle="Configure and assign an exam to students"
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!!error && <Text style={s.error}>{error}</Text>}

        {/* Basic Info */}
        <SectionCard title="Basic Information" accent="#4f46e5">
          <Text style={s.label}>Exam Title *</Text>
          <TextInput style={s.input} placeholder="e.g. Unit Test — Chapter 3 & 4"
            value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} />
          <Text style={[s.label, { marginTop: 12 }]}>Subject *</Text>
          <TouchableOpacity style={s.select} onPress={() => setShowSubjectModal(true)}>
            <Text style={{ color: form.subject ? '#1e293b' : '#94a3b8', fontSize: 14 }}>{subjectName}</Text>
            <Text style={{ color: '#94a3b8' }}>▾</Text>
          </TouchableOpacity>
          {subjects.length === 0 && (
            <Text style={{ fontSize: 12, color: '#f59e0b', marginTop: 6 }}>
              No subjects found. Create subjects in the school admin panel first, then assign the teacher to subjects.
            </Text>
          )}
        </SectionCard>

        {/* Chapters */}
        {chapters.length > 0 && (
          <SectionCard title="Chapters" accent="#3b82f6">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {chapters.map(ch => {
                const sel = form.chapter_ids.includes(ch.id);
                return (
                  <TouchableOpacity key={ch.id} style={[s.chip, sel && s.chipActive]} onPress={() => toggleChapter(ch.id)}>
                    <Text style={[s.chipText, sel && s.chipTextActive]}>{sel ? '✓ ' : ''}{ch.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>
        )}

        {/* Selection Mode */}
        {!!form.subject && (
          <SectionCard title="Question Selection Mode" accent="#7c3aed">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { value: 'random', label: 'Random (Auto)', icon: '🎲', desc: 'Auto-picked from bank' },
                { value: 'manual', label: 'Manual Select', icon: '✋', desc: 'Hand-pick questions' },
              ].map(opt => (
                <TouchableOpacity key={opt.value}
                  style={[s.modeCard, selectionMode === opt.value && s.modeCardActive]}
                  onPress={() => setSelectionMode(opt.value)}>
                  <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                  <Text style={[s.modeLbl, selectionMode === opt.value && { color: '#4f46e5' }]}>{opt.label}</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>{opt.desc}</Text>
                  {selectionMode === opt.value && <Text style={{ fontSize: 11, color: '#4f46e5', fontWeight: '700' }}>✓ Selected</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>
        )}

        {/* Random mode settings */}
        {selectionMode === 'random' && (
          <SectionCard title="Exam Settings" accent="#10b981">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Duration (min)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.duration_minutes}
                  onChangeText={v => setForm(p => ({ ...p, duration_minutes: v }))} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Total Marks</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.total_marks}
                  onChangeText={v => setForm(p => ({ ...p, total_marks: v }))} />
              </View>
            </View>
            <Text style={[s.label, { marginTop: 12 }]}>Question Distribution</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'num_mcq', label: 'MCQ', sub: '1 mark', color: '#3b82f6', bg: '#eff6ff' },
                { key: 'num_short', label: 'Short', sub: '2 marks', color: '#10b981', bg: '#f0fdf4' },
                { key: 'num_long', label: 'Long', sub: '5 marks', color: '#7c3aed', bg: '#f5f3ff' },
              ].map(f => (
                <View key={f.key} style={[s.qBox, { backgroundColor: f.bg, flex: 1 }]}>
                  <Text style={[s.qBoxLabel, { color: f.color }]}>{f.label}</Text>
                  <TextInput style={[s.qBoxInput, { color: f.color }]} keyboardType="numeric"
                    value={String(form[f.key])}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))} />
                  <Text style={{ fontSize: 10, color: f.color, opacity: 0.7, textAlign: 'center' }}>{f.sub}</Text>
                </View>
              ))}
            </View>
            <Text style={s.calcText}>
              {(parseInt(form.num_mcq)||0)+(parseInt(form.num_short)||0)+(parseInt(form.num_long)||0)} questions
              · {(parseInt(form.num_mcq)||0)*1+(parseInt(form.num_short)||0)*2+(parseInt(form.num_long)||0)*5} calc marks
            </Text>
          </SectionCard>
        )}

        {/* Manual question picker */}
        {selectionMode === 'manual' && !!form.subject && (
          <SectionCard title="Select Questions" accent="#3b82f6">
            <Text style={[s.label, { marginBottom: 8 }]}>Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {[['', 'All Types'], ['MCQ', 'MCQ'], ['SHORT', 'Short'], ['LONG', 'Long']].map(([val, lbl]) => (
                <TouchableOpacity key={val}
                  style={[s.filterChip, qFilters.question_type === val && s.filterChipActive]}
                  onPress={() => setQFilters(p => ({ ...p, question_type: val }))}>
                  <Text style={[s.filterChipText, qFilters.question_type === val && { color: '#4f46e5' }]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {[['', 'All Difficulty'], ['EASY', 'Easy'], ['MEDIUM', 'Medium'], ['HARD', 'Hard']].map(([val, lbl]) => (
                <TouchableOpacity key={val}
                  style={[s.filterChip, qFilters.difficulty === val && s.filterChipActive]}
                  onPress={() => setQFilters(p => ({ ...p, difficulty: val }))}>
                  <Text style={[s.filterChipText, qFilters.difficulty === val && { color: '#4f46e5' }]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {qLoading ? (
              <ActivityIndicator color="#4f46e5" style={{ paddingVertical: 20 }} />
            ) : availableQs.length === 0 ? (
              <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 20, fontSize: 13 }}>
                No questions found. Try adjusting filters.
              </Text>
            ) : (
              availableQs.map(q => {
                const sel = selectedQIds.includes(q.id);
                return (
                  <TouchableOpacity key={q.id}
                    style={[s.questionRow, sel && { backgroundColor: '#eef2ff' }]}
                    onPress={() => toggleQ(q.id)}>
                    <View style={[s.checkbox, sel && s.checkboxActive]}>
                      {sel && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: '#334155' }} numberOfLines={2}>{q.question_text}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <Text style={[s.badge, q.question_type === 'MCQ' ? s.badgeMCQ : q.question_type === 'SHORT' ? s.badgeSHORT : s.badgeLONG]}>
                          {q.question_type}
                        </Text>
                        {q.chapter_name && <Text style={s.badgeGray}>{q.chapter_name}</Text>}
                        <Text style={[s.badgeGray, { marginLeft: 'auto' }]}>
                          {q.marks || 1}m
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {selectedQIds.length > 0 && (
              <View style={s.selectedSummary}>
                <Text style={s.selectedSummaryText}>
                  Selected: {selectedQIds.length} · MCQ: {mcqCnt} · Short: {shortCnt} · Long: {longCnt}
                </Text>
                <Text style={s.selectedSummaryText}>Total Marks: {manualMarks}</Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* Schedule */}
        <SectionCard title="Schedule" accent="#10b981">
          <Text style={s.label}>Start Time</Text>
          <TouchableOpacity style={s.select} onPress={() => openDatePicker('start_time')}>
            <Text style={{ fontSize: 14, color: '#1e293b' }}>{fmtDate(form.start_time)}</Text>
            <Text>📅</Text>
          </TouchableOpacity>
          {showStartPicker && Platform.OS === 'ios' && (
            <DateTimePicker value={form.start_time} mode="datetime" display="default"
              onChange={(_, d) => { setShowStartPicker(false); if (d) setForm(p => ({ ...p, start_time: d })); }} />
          )}

          <Text style={[s.label, { marginTop: 12 }]}>End Time</Text>
          <TouchableOpacity style={s.select} onPress={() => openDatePicker('end_time')}>
            <Text style={{ fontSize: 14, color: '#1e293b' }}>{fmtDate(form.end_time)}</Text>
            <Text>📅</Text>
          </TouchableOpacity>
          {showEndPicker && Platform.OS === 'ios' && (
            <DateTimePicker value={form.end_time} mode="datetime" display="default"
              onChange={(_, d) => { setShowEndPicker(false); if (d) setForm(p => ({ ...p, end_time: d })); }} />
          )}
        </SectionCard>

        {/* Students */}
        <SectionCard title="Assign to Students" accent="#7c3aed">
          {students.length === 0 ? (
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>
              {form.subject ? 'No students found for this subject/class.' : 'Select a subject first.'}
            </Text>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>{form.student_ids.length} of {students.length} selected</Text>
                <TouchableOpacity onPress={() => setForm(p => ({
                  ...p, student_ids: p.student_ids.length === students.length ? [] : students.map(s => s.id)
                }))}>
                  <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '700' }}>
                    {form.student_ids.length === students.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
              {students.map(stu => {
                const name = stu.first_name ? `${stu.first_name} ${stu.last_name}`.trim() : stu.username;
                const sel = form.student_ids.includes(stu.id);
                return (
                  <TouchableOpacity key={stu.id} style={[s.studentRow, sel && { backgroundColor: '#f5f3ff' }]}
                    onPress={() => toggleStudent(stu.id)}>
                    <View style={[s.checkbox, sel && s.checkboxActive]}>
                      {sel && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                    </View>
                    <View style={s.avatarSmall}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#334155', flex: 1 }}>{name}</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>@{stu.username}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </SectionCard>

        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>🚀  Create Exam</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Subject Modal */}
      <Modal visible={showSubjectModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Select Subject</Text>
            <ScrollView>
              {subjects.map(sub => (
                <TouchableOpacity key={sub.id} style={s.modalItem}
                  onPress={() => { setForm(p => ({ ...p, subject: String(sub.id), chapter_ids: [] })); setShowSubjectModal(false); }}>
                  <Text style={{ fontSize: 15, color: '#1e293b' }}>{sub.name}</Text>
                  {String(form.subject) === String(sub.id) && <Text style={{ color: '#4f46e5' }}>✓</Text>}
                </TouchableOpacity>
              ))}
              {subjects.length === 0 && (
                <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 20 }}>No subjects assigned</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowSubjectModal(false)}>
              <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  error:    { backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 14, color: '#dc2626', fontSize: 13 },
  card:     { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { paddingHorizontal: 16, paddingVertical: 12, borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  cardBody:   { padding: 16 },
  label:    { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:    { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' },
  select:   { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
  chip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText:   { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  modeCard: { flex: 1, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 14, padding: 12, gap: 4 },
  modeCardActive: { borderColor: '#4f46e5', backgroundColor: '#f5f3ff' },
  modeLbl:  { fontSize: 13, fontWeight: '700', color: '#334155' },
  qBox:     { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  qBoxLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  qBoxInput: { fontSize: 20, fontWeight: '800', textAlign: 'center', width: '100%', paddingVertical: 0 },
  calcText: { fontSize: 12, color: '#64748b', marginTop: 8, textAlign: 'center' },
  questionRow: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 10, marginBottom: 6, backgroundColor: '#f8fafc', alignItems: 'flex-start' },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  badge:    { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeMCQ:   { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  badgeSHORT: { backgroundColor: '#d1fae5', color: '#065f46' },
  badgeLONG:  { backgroundColor: '#ede9fe', color: '#5b21b6' },
  badgeGray:  { fontSize: 10, color: '#94a3b8', paddingVertical: 2 },
  selectedSummary: { marginTop: 10, backgroundColor: '#eef2ff', borderRadius: 10, padding: 10 },
  selectedSummaryText: { fontSize: 12, color: '#4338ca', fontWeight: '600' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 6, backgroundColor: '#f8fafc' },
  filterChipActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, marginBottom: 4 },
  avatarSmall: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7c3aed' },
  submitBtn: { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
});
