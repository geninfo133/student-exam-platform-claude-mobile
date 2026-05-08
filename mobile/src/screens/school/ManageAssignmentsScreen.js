import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const CLASSES = Array.from({ length: 12 }, (_, i) => String(i + 1));
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function ManageAssignmentsScreen({ navigation }) {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers]       = useState([]);
  const [students, setStudents]       = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [toast, setToast]             = useState({ text: '', ok: true });

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade]     = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showGradeModal, setShowGradeModal]     = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);

  const showToast = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast({ text: '', ok: true }), 3500);
  };

  const fetchAll = async () => {
    try {
      const [aRes, tRes, sRes, subRes] = await Promise.all([
        api.get('/api/assignments/'),
        api.get('/api/auth/members/', { params: { role: 'teacher' } }),
        api.get('/api/auth/members/', { params: { role: 'student' } }),
        api.get('/api/subjects/'),
      ]);
      setAssignments(aRes.data.results || aRes.data);
      setTeachers(tRes.data.results || tRes.data);
      setStudents(sRes.data.results || sRes.data);
      setSubjects(subRes.data.results || subRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (selectedGrade && selectedSection) {
      const matching = students.filter(s => String(s.grade) === selectedGrade && s.section === selectedSection);
      setSelectedStudentIds(new Set(matching.map(s => s.id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  }, [selectedGrade, selectedSection, students]);

  const matchingStudents = students.filter(s =>
    selectedGrade && selectedSection && String(s.grade) === selectedGrade && s.section === selectedSection
  );
  const allSelected = matchingStudents.length > 0 && matchingStudents.every(s => selectedStudentIds.has(s.id));

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setSelectedTeacher(''); setSelectedSubject('');
    setSelectedGrade(''); setSelectedSection('');
    setSelectedStudentIds(new Set());
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSubject || !selectedGrade || !selectedSection) {
      showToast('Select teacher, subject, class and section.', false); return;
    }
    if (selectedStudentIds.size === 0) {
      showToast('Select at least one student.', false); return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/assignments/create/', {
        teacher_id: parseInt(selectedTeacher, 10),
        subject_id: parseInt(selectedSubject, 10),
        student_ids: Array.from(selectedStudentIds),
        grade: selectedGrade,
        section: selectedSection,
      });
      showToast(`Assignment created! ${selectedStudentIds.size} students mapped.`);
      resetForm();
      const aRes = await api.get('/api/assignments/');
      setAssignments(aRes.data.results || aRes.data);
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.error || (typeof d === 'object' ? Object.values(d)[0] : '') || 'Failed to create assignment.';
      showToast(String(msg), false);
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Remove Assignment', 'Remove this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await api.delete(`/api/assignments/${id}/`);
            showToast('Assignment removed.');
            setAssignments(prev => prev.filter(a => a.id !== id));
          } catch { showToast('Failed to remove.', false); }
          finally { setDeletingId(null); }
        },
      },
    ]);
  };

  const selectedTeacherObj = teachers.find(t => String(t.id) === selectedTeacher);
  const selectedSubjectObj  = subjects.find(s => String(s.id) === selectedSubject);

  if (loading) return <LoadingScreen color="#4f46e5" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label="School Administration"
        title="Teacher Assignments"
        subtitle="Map teachers to subjects, classes and students"
      >
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Assignments', value: assignments.length, color: 'rgba(255,255,255,0.15)' },
            { label: 'Teachers',   value: teachers.length,    color: 'rgba(79,70,229,0.3)'    },
            { label: 'Students',   value: students.length,    color: 'rgba(16,185,129,0.3)'   },
          ].map(({ label, value, color }) => (
            <View key={label} style={[s.statPill, { backgroundColor: color }]}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#4f46e5" />}
      >
        {!!toast.text && (
          <View style={[s.toast, toast.ok ? s.toastOk : s.toastErr]}>
            <Text style={{ color: toast.ok ? '#065f46' : '#dc2626', fontWeight: '600', fontSize: 13 }}>
              {toast.ok ? '✅ ' : '❌ '}{toast.text}
            </Text>
          </View>
        )}

        {/* Teacher picker */}
        <View style={[s.card, { marginBottom: 12 }]}>
          <View style={[s.cardHeader, { backgroundColor: '#4f46e5' }]}>
            <Text style={s.cardHeaderText}>Select Teacher ({teachers.length})</Text>
          </View>
          {teachers.length === 0 ? (
            <EmptyState icon="👩‍🏫" title="No Teachers Yet" message="Add teachers first to create assignments." />
          ) : teachers.map(t => {
            const sel = String(t.id) === selectedTeacher;
            const name = `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.username;
            return (
              <TouchableOpacity key={t.id}
                style={[s.teacherRow, sel && s.teacherRowSel]}
                onPress={() => setSelectedTeacher(sel ? '' : String(t.id))}>
                <View style={[s.teacherAvatar, { backgroundColor: sel ? '#4f46e5' : '#e0e7ff' }]}>
                  <Text style={{ color: sel ? '#fff' : '#4f46e5', fontWeight: '800', fontSize: 14 }}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>{name}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>@{t.username}</Text>
                </View>
                {sel && <Text style={{ color: '#4f46e5', fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Assign controls */}
        <View style={[s.card, { marginBottom: 12 }]}>
          <View style={[s.cardHeader, { backgroundColor: '#334155' }]}>
            <Text style={s.cardHeaderText}>Create Assignment</Text>
          </View>
          <View style={{ padding: 14, gap: 10 }}>
            {/* Subject */}
            <Text style={s.label}>Subject *</Text>
            <TouchableOpacity style={s.select} onPress={() => setShowSubjectModal(true)}>
              <Text style={{ color: selectedSubject ? '#1e293b' : '#94a3b8', fontSize: 14 }}>
                {selectedSubjectObj?.name || 'Select Subject'}
              </Text>
              <Text style={{ color: '#94a3b8' }}>▾</Text>
            </TouchableOpacity>

            {/* Class + Section */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Class *</Text>
                <TouchableOpacity style={s.select} onPress={() => setShowGradeModal(true)}>
                  <Text style={{ color: selectedGrade ? '#1e293b' : '#94a3b8', fontSize: 14 }}>
                    {selectedGrade ? `Class ${selectedGrade}` : 'Select Class'}
                  </Text>
                  <Text style={{ color: '#94a3b8' }}>▾</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Section *</Text>
                <TouchableOpacity style={s.select} onPress={() => setShowSectionModal(true)}>
                  <Text style={{ color: selectedSection ? '#1e293b' : '#94a3b8', fontSize: 14 }}>
                    {selectedSection || 'Section'}
                  </Text>
                  <Text style={{ color: '#94a3b8' }}>▾</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Summary preview */}
            {selectedTeacherObj && selectedSubjectObj && selectedGrade && selectedSection && (
              <View style={s.summaryBox}>
                <Text style={s.summaryText}>
                  <Text style={{ color: '#4f46e5', fontWeight: '700' }}>{`${selectedTeacherObj.first_name || ''} ${selectedTeacherObj.last_name || ''}`.trim()}</Text>
                  {'  →  '}
                  <Text style={{ color: '#7c3aed', fontWeight: '700' }}>{selectedSubjectObj.name}</Text>
                  {'  →  '}
                  <Text style={{ fontWeight: '700' }}>Class {selectedGrade}{selectedSection}</Text>
                </Text>
                {selectedStudentIds.size > 0 && (
                  <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '700', marginTop: 4 }}>
                    {selectedStudentIds.size} student(s) selected
                  </Text>
                )}
              </View>
            )}

            {/* Student list */}
            {matchingStudents.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[s.label, { marginBottom: 0 }]}>
                    Students in Class {selectedGrade}{selectedSection} ({matchingStudents.length})
                  </Text>
                  <TouchableOpacity onPress={() =>
                    setSelectedStudentIds(allSelected ? new Set() : new Set(matchingStudents.map(s => s.id)))
                  }>
                    <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '700' }}>
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {matchingStudents.map(stu => {
                  const name = `${stu.first_name || ''} ${stu.last_name || ''}`.trim() || stu.username;
                  const sel = selectedStudentIds.has(stu.id);
                  return (
                    <TouchableOpacity key={stu.id}
                      style={[s.studentRow, sel && { backgroundColor: '#f5f3ff' }]}
                      onPress={() => toggleStudent(stu.id)}>
                      <View style={[s.checkbox, sel && s.checkboxActive]}>
                        {sel && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                      </View>
                      <Text style={{ fontSize: 13, color: '#334155', flex: 1 }}>{name}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>@{stu.username}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Submit buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              {(selectedTeacher || selectedSubject) && (
                <TouchableOpacity style={s.clearBtn} onPress={resetForm}>
                  <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13 }}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.assignBtn, (submitting || !selectedTeacher || !selectedSubject || !selectedGrade || !selectedSection || selectedStudentIds.size === 0) && { opacity: 0.5 }, { flex: 1 }]}
                onPress={handleAssign}
                disabled={submitting || !selectedTeacher || !selectedSubject || !selectedGrade || !selectedSection || selectedStudentIds.size === 0}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                      Assign ({selectedStudentIds.size} students)
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Existing assignments */}
        <View style={s.card}>
          <View style={[s.cardHeader, { backgroundColor: '#1e293b' }]}>
            <Text style={s.cardHeaderText}>Existing Assignments ({assignments.length})</Text>
          </View>
          {assignments.length === 0 ? (
            <EmptyState icon="📋" title="No Assignments Yet" message="Create an assignment above to get started." />
          ) : assignments.map((a, idx) => (
            <View key={a.id} style={[s.assignmentRow, idx > 0 && { borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>{a.teacher_name}</Text>
                <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '600' }}>{a.subject_name}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <View style={s.classBadge}>
                    <Text style={{ fontSize: 11, color: '#4f46e5', fontWeight: '600' }}>
                      {a.grade_display || `Class ${a.grade}${a.section}`}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>{a.student_count} students</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[s.removeBtn, deletingId === a.id && { opacity: 0.5 }]}
                disabled={deletingId === a.id}
                onPress={() => handleDelete(a.id)}>
                {deletingId === a.id
                  ? <ActivityIndicator size="small" color="#dc2626" />
                  : <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '700' }}>Remove</Text>
                }
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Subject Modal */}
      <Modal visible={showSubjectModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Select Subject</Text>
            <ScrollView>
              {subjects.map(sub => (
                <TouchableOpacity key={sub.id} style={s.modalItem}
                  onPress={() => { setSelectedSubject(String(sub.id)); setShowSubjectModal(false); }}>
                  <Text style={{ fontSize: 15, color: '#1e293b' }}>{sub.name}</Text>
                  {String(selectedSubject) === String(sub.id) && <Text style={{ color: '#4f46e5' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowSubjectModal(false)}>
              <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Grade Modal */}
      <Modal visible={showGradeModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Select Class</Text>
            <ScrollView>
              {CLASSES.map(g => (
                <TouchableOpacity key={g} style={s.modalItem}
                  onPress={() => { setSelectedGrade(g); setShowGradeModal(false); }}>
                  <Text style={{ fontSize: 15, color: '#1e293b' }}>Class {g}</Text>
                  {selectedGrade === g && <Text style={{ color: '#4f46e5' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowGradeModal(false)}>
              <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Section Modal */}
      <Modal visible={showSectionModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { maxHeight: '40%' }]}>
            <Text style={s.modalTitle}>Select Section</Text>
            {SECTIONS.map(sec => (
              <TouchableOpacity key={sec} style={s.modalItem}
                onPress={() => { setSelectedSection(sec); setShowSectionModal(false); }}>
                <Text style={{ fontSize: 15, color: '#1e293b' }}>Section {sec}</Text>
                {selectedSection === sec && <Text style={{ color: '#4f46e5' }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowSectionModal(false)}>
              <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  statPill: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 80 },
  toast:    { borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1 },
  toastOk:  { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
  toastErr: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  card:     { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  cardHeaderText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  label:    { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  select:   { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  teacherRowSel: { backgroundColor: '#eef2ff' },
  teacherAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryBox: { backgroundColor: '#eef2ff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  summaryText: { fontSize: 13, color: '#334155' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10 },
  checkbox:   { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  clearBtn: { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  assignBtn: { backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  assignmentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  classBadge: { backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  removeBtn:  { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
});
