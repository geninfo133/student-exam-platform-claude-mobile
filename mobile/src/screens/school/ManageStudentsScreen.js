import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const EMPTY_FORM = { username: '', first_name: '', last_name: '', email: '', phone_number: '', password: '', grade: '', section: '', student_id: '', parent_phone: '' };
const GRADES = Array.from({ length: 12 }, (_, i) => String(i + 1));
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

function SelectRow({ label, value, options, onSelect, labelFn }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={fs.label}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 4 }}>
        <TouchableOpacity
          style={[fs.selBtn, !value && fs.selBtnActive]}
          onPress={() => onSelect('')}
        >
          <Text style={[fs.selBtnText, !value && fs.selBtnTextActive]}>—</Text>
        </TouchableOpacity>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[fs.selBtn, value === opt && fs.selBtnActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[fs.selBtnText, value === opt && fs.selBtnTextActive]}>{labelFn ? labelFn(opt) : opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ManageStudentsScreen({ navigation }) {
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/api/auth/members/?role=student');
      setStudents(res.data.results || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    if (!form.first_name || !form.password) {
      Alert.alert('Error', 'First name and password are required.'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/auth/create-student/', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
      Alert.alert('Success', 'Student account created.');
    } catch (e) {
      const data = e.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join('\n') : 'Failed to create student.';
      Alert.alert('Error', msg);
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Student', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(id);
        try {
          await api.delete(`/api/auth/members/${id}/`);
          setStudents(prev => prev.filter(s => s.id !== id));
        } catch { Alert.alert('Error', 'Could not delete student.'); }
        finally { setDeleting(null); }
      }},
    ]);
  };

  const startEditing = (s) => {
    setEditingId(s.id);
    setEditForm({ first_name: s.first_name || '', last_name: s.last_name || '', email: s.email || '', phone_number: s.phone_number || '', grade: s.grade || '', section: s.section || '' });
  };

  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      await api.patch(`/api/auth/members/${id}/update/`, editForm);
      setEditingId(null);
      setEditForm({});
      load();
    } catch (e) {
      const data = e.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join('\n') : 'Update failed.';
      Alert.alert('Error', msg);
    } finally { setSaving(false); }
  };

  const filtered = (!filterGrade || !filterSection) ? [] : students.filter(s => {
    const name = `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (s.grade !== filterGrade) return false;
    if (s.section !== filterSection) return false;
    return true;
  });

  if (loading) return <LoadingScreen color="#7c3aed" />;

  return (
    <View style={s.container}>
      <ScreenHeader
        navigation={navigation}
        label="School Administration"
        title="Manage Students"
        subtitle="View and manage student accounts"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={s.pillsRow}>
            <View style={s.pill}><Text style={s.pillVal}>{students.length}</Text><Text style={s.pillLabel}>Total</Text></View>
            <View style={[s.pill, { backgroundColor: 'rgba(167,139,250,0.2)' }]}><Text style={s.pillVal}>{(filterGrade && filterSection) ? filtered.length : '—'}</Text><Text style={s.pillLabel}>Showing</Text></View>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </ScreenHeader>

      {/* Search & Filter */}
      <View style={s.filterBar}>
        <TextInput
          style={s.searchInput}
          placeholder="Search by name…"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {GRADES.map(g => (
            <TouchableOpacity
              key={g}
              style={[s.filterChip, filterGrade === g && s.filterChipActive]}
              onPress={() => setFilterGrade(prev => prev === g ? '' : g)}
            >
              <Text style={[s.filterChipText, filterGrade === g && s.filterChipTextActive]}>Cl.{g}</Text>
            </TouchableOpacity>
          ))}
          {SECTIONS.map(sec => (
            <TouchableOpacity
              key={sec}
              style={[s.filterChip, filterSection === sec && s.filterChipActive]}
              onPress={() => setFilterSection(prev => prev === sec ? '' : sec)}
            >
              <Text style={[s.filterChipText, filterSection === sec && s.filterChipTextActive]}>{sec}</Text>
            </TouchableOpacity>
          ))}
          {(search || filterGrade || filterSection) && (
            <TouchableOpacity style={s.clearChip} onPress={() => { setSearch(''); setFilterGrade(''); setFilterSection(''); }}>
              <Text style={s.clearChipText}>Clear ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          !filterGrade ? (
            <EmptyState icon="🏫" title="Select a Class" message="Choose a class above to get started." />
          ) : !filterSection ? (
            <EmptyState icon="📋" title="Select a Section" message={`Class ${filterGrade} selected — now pick a section (A, B, C…).`} />
          ) : (
            <EmptyState title="No Students Found" message={`No students in Class ${filterGrade} Section ${filterSection}.`} />
          )
        }
        renderItem={({ item, index }) =>
          editingId === item.id ? (
            <View style={[s.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={s.editHeader}>
                <Text style={s.editTitle}>Edit Student</Text>
                <TouchableOpacity onPress={() => { setEditingId(null); setEditForm({}); }}>
                  <Text style={s.editClose}>✕</Text>
                </TouchableOpacity>
              </View>
              {[
                { label: 'First Name', key: 'first_name' },
                { label: 'Last Name',  key: 'last_name' },
                { label: 'Email',      key: 'email', keyboard: 'email-address' },
                { label: 'Phone',      key: 'phone_number', keyboard: 'phone-pad' },
              ].map(({ label, key, keyboard }) => (
                <View key={key}>
                  <Text style={s.label}>{label}</Text>
                  <TextInput
                    style={s.input}
                    value={editForm[key] || ''}
                    onChangeText={val => setEditForm(prev => ({ ...prev, [key]: val }))}
                    keyboardType={keyboard || 'default'}
                    autoCapitalize="none"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              ))}
              <SelectRow label="Class" value={editForm.grade} options={GRADES} onSelect={g => setEditForm(p => ({ ...p, grade: g }))} labelFn={g => `Cl.${g}`} />
              <SelectRow label="Section" value={editForm.section} options={SECTIONS} onSelect={sec => setEditForm(p => ({ ...p, section: sec }))} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[s.submitBtn, { flex: 1, backgroundColor: '#7c3aed' }]} onPress={() => handleEditSave(item.id)} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Save Changes</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setEditingId(null); setEditForm({}); }}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.card}>
              <View style={s.indexBadge}>
                <Text style={s.indexText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={s.name}>{item.first_name} {item.last_name}</Text>
                  {item.grade ? (
                    <View style={s.gradeBadge}>
                      <Text style={s.gradeBadgeText}>{item.grade}{item.section || ''}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={s.meta}>@{item.username}</Text>
                <View style={s.detailRow}>
                  {item.student_id ? <Text style={s.detail}>ID: {item.student_id}</Text> : null}
                  {item.email ? <Text style={s.detail}>{item.email}</Text> : null}
                  {item.phone_number ? <Text style={s.detail}>{item.phone_number}</Text> : null}
                </View>
                {item.assigned_teachers && item.assigned_teachers.length > 0 && (
                  <View style={s.teacherTagsRow}>
                    {item.assigned_teachers.slice(0, 2).map((at, i) => (
                      <View key={i} style={s.teacherTag}>
                        <Text style={s.teacherTagText}>{at.teacher_name} · {at.subject_name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => startEditing(item)}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(item.id, `${item.first_name} ${item.last_name}`)}
                  disabled={deleting === item.id}
                >
                  {deleting === item.id
                    ? <ActivityIndicator size="small" color="#dc2626" />
                    : <Text style={s.deleteBtnText}>Remove</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )
        }
      />

      {/* Add Student Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Create New Student</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                <Text style={s.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              {[
                { label: 'First Name *',  key: 'first_name',   placeholder: 'Enter first name' },
                { label: 'Last Name *',   key: 'last_name',    placeholder: 'Enter last name' },
                { label: 'Username',      key: 'username',     placeholder: 'Auto-generated if blank' },
                { label: 'Email *',       key: 'email',        placeholder: 'Enter email', keyboard: 'email-address' },
                { label: 'Password *',    key: 'password',     placeholder: 'Enter password', secure: true },
                { label: 'Phone Number',  key: 'phone_number', placeholder: 'Enter phone number', keyboard: 'phone-pad' },
                { label: 'Parent Phone',  key: 'parent_phone', placeholder: 'Enter parent phone', keyboard: 'phone-pad' },
                { label: 'Student ID',    key: 'student_id',   placeholder: 'Roll number / ID' },
              ].map(({ label, key, placeholder, keyboard, secure }) => (
                <View key={key}>
                  <Text style={fs.label}>{label}</Text>
                  <TextInput
                    style={fs.input}
                    value={form[key]}
                    onChangeText={val => set(key, val)}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    keyboardType={keyboard || 'default'}
                    secureTextEntry={!!secure}
                    autoCapitalize="none"
                  />
                </View>
              ))}

              <SelectRow
                label="Class *"
                value={form.grade}
                options={GRADES}
                onSelect={g => set('grade', g)}
                labelFn={g => `Class ${g}`}
              />
              <SelectRow
                label="Section *"
                value={form.section}
                options={SECTIONS}
                onSelect={sec => set('section', sec)}
                labelFn={sec => `Section ${sec}`}
              />

              <TouchableOpacity style={[fs.submitBtn]} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={fs.submitBtnText}>Create Student</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const fs = StyleSheet.create({
  label:         { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:         { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b' },
  selBtn:        { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f8fafc' },
  selBtnActive:  { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  selBtnText:    { fontSize: 13, color: '#64748b', fontWeight: '600' },
  selBtnTextActive: { color: '#7c3aed', fontWeight: '800' },
  submitBtn:     { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f8fafc' },
  addBtn:         { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:     { color: '#7c3aed', fontWeight: '800', fontSize: 13 },
  pillsRow:       { flexDirection: 'row', gap: 8 },
  pill:           { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  pillVal:        { color: '#fff', fontSize: 18, fontWeight: '800' },
  pillLabel:      { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  filterBar:      { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8 },
  searchInput:    { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  filterChip:     { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#f8fafc' },
  filterChipActive: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  filterChipText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterChipTextActive: { color: '#7c3aed', fontWeight: '700' },
  clearChip:      { borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fef2f2' },
  clearChipText:  { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  indexBadge:     { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  indexText:      { color: '#7c3aed', fontWeight: '800', fontSize: 12 },
  name:           { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  gradeBadge:     { backgroundColor: '#f5f3ff', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  gradeBadgeText: { color: '#7c3aed', fontSize: 10, fontWeight: '700' },
  meta:           { fontSize: 12, color: '#64748b', marginTop: 1 },
  detailRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  detail:         { fontSize: 11, color: '#94a3b8' },
  teacherTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  teacherTag:     { backgroundColor: '#ecfdf5', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  teacherTagText: { color: '#059669', fontSize: 10, fontWeight: '600' },
  cardActions:    { gap: 6, alignItems: 'flex-end' },
  editBtn:        { backgroundColor: '#f5f3ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  editBtnText:    { color: '#7c3aed', fontWeight: '700', fontSize: 12 },
  deleteBtn:      { backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnText:  { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  editHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, backgroundColor: '#fef3c7', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  editTitle:      { fontSize: 13, fontWeight: '700', color: '#92400e' },
  editClose:      { fontSize: 16, color: '#92400e' },
  label:          { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:          { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b' },
  cancelBtn:      { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  cancelBtnText:  { color: '#64748b', fontWeight: '700', fontSize: 13 },
  overlay:        { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%' },
  sheetHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle:     { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  sheetClose:     { fontSize: 20, color: '#94a3b8' },
});
