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

const EMPTY_FORM = { username: '', first_name: '', last_name: '', email: '', phone_number: '', password: '', subject_ids: [] };
const AVATAR_COLORS = ['#4f46e5','#7c3aed','#059669','#d97706','#dc2626','#0891b2'];

export default function ManageTeachersScreen({ navigation }) {
  const [teachers, setTeachers]     = useState([]);
  const [subjects, setSubjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        api.get('/api/auth/members/?role=teacher'),
        api.get('/api/subjects/').catch(() => ({ data: [] })),
      ]);
      setTeachers(tRes.data.results || tRes.data || []);
      setSubjects(sRes.data.results || sRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleSubject = (id) =>
    setForm(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(id)
        ? prev.subject_ids.filter(s => s !== id)
        : [...prev.subject_ids, id],
    }));

  const handleCreate = async () => {
    if (!form.first_name || !form.password) {
      Alert.alert('Error', 'First name and password are required.'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/auth/create-teacher/', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
      Alert.alert('Success', 'Teacher account created.');
    } catch (e) {
      const data = e.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join('\n') : 'Failed to create teacher.';
      Alert.alert('Error', msg);
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Teacher', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(id);
        try {
          await api.delete(`/api/auth/members/${id}/`);
          setTeachers(prev => prev.filter(t => t.id !== id));
        } catch { Alert.alert('Error', 'Could not delete teacher.'); }
        finally { setDeleting(null); }
      }},
    ]);
  };

  const startEditing = (t) => {
    setEditingId(t.id);
    const assignedSubjectNames = (t.assigned_teachers || []).map(a => a.subject_name);
    const assignedIds = subjects.filter(s => assignedSubjectNames.includes(s.name)).map(s => s.id);
    setEditForm({ first_name: t.first_name || '', last_name: t.last_name || '', email: t.email || '', phone_number: t.phone_number || '', subject_ids: assignedIds });
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

  const toggleEditSubject = (id) =>
    setEditForm(prev => ({
      ...prev,
      subject_ids: (prev.subject_ids || []).includes(id)
        ? prev.subject_ids.filter(s => s !== id)
        : [...(prev.subject_ids || []), id],
    }));

  const initials = (t) =>
    `${t.first_name?.[0] || ''}${t.last_name?.[0] || ''}`.toUpperCase() || t.username?.[0]?.toUpperCase() || 'T';

  if (loading) return <LoadingScreen color="#4f46e5" />;

  return (
    <View style={s.container}>
      <ScreenHeader
        navigation={navigation}
        label="School Administration"
        title="Manage Teachers"
        subtitle="View and manage teacher accounts"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={s.pillsRow}>
            <View style={s.pill}><Text style={s.pillVal}>{teachers.length}</Text><Text style={s.pillLabel}>Teachers</Text></View>
            <View style={[s.pill, { backgroundColor: 'rgba(129,140,248,0.2)' }]}><Text style={s.pillVal}>{subjects.length}</Text><Text style={s.pillLabel}>Subjects</Text></View>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </ScreenHeader>

      <FlatList
        data={teachers}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <EmptyState icon="👩‍🏫" title="No Teachers Yet" message='Tap "+ Add" to create one.' />
        }
        renderItem={({ item, index }) =>
          editingId === item.id ? (
            <View style={[s.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={s.editHeader}>
                <Text style={s.editTitle}>Edit Teacher</Text>
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
              {subjects.length > 0 && (
                <View>
                  <Text style={s.label}>Assigned Subjects</Text>
                  <View style={s.subjectChips}>
                    {subjects.map(sub => {
                      const active = (editForm.subject_ids || []).includes(sub.id);
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[s.chip, active && s.chipActive]}
                          onPress={() => toggleEditSubject(sub.id)}
                        >
                          <Text style={[s.chipText, active && s.chipTextActive]}>{sub.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[s.submitBtn, { flex: 1 }]} onPress={() => handleEditSave(item.id)} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Save Changes</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setEditingId(null); setEditForm({}); }}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.card}>
              <View style={[s.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                <Text style={s.avatarText}>{initials(item)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.first_name} {item.last_name}</Text>
                <Text style={s.meta}>@{item.username}</Text>
                {item.email ? <Text style={s.meta}>{item.email}</Text> : null}
                {item.phone_number ? <Text style={s.meta}>{item.phone_number}</Text> : null}
                <View style={s.subjectTagsRow}>
                  {item.assigned_teachers && item.assigned_teachers.length > 0
                    ? [...new Map(item.assigned_teachers.map(a => [a.subject_name, a])).values()].map((at, i) => (
                        <View key={i} style={s.subjectTag}>
                          <Text style={s.subjectTagText}>{at.subject_name}</Text>
                        </View>
                      ))
                    : <View style={s.noSubjectTag}><Text style={s.noSubjectText}>No subject</Text></View>
                  }
                </View>
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

      {/* Add Teacher Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Create New Teacher</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                <Text style={s.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              {[
                { label: 'First Name *',   key: 'first_name',   placeholder: 'Enter first name' },
                { label: 'Last Name *',    key: 'last_name',    placeholder: 'Enter last name' },
                { label: 'Username',       key: 'username',     placeholder: 'Auto-generated if blank' },
                { label: 'Email *',        key: 'email',        placeholder: 'Enter email', keyboard: 'email-address' },
                { label: 'Password *',     key: 'password',     placeholder: 'Enter password', secure: true },
                { label: 'Phone Number',   key: 'phone_number', placeholder: 'Enter phone number', keyboard: 'phone-pad' },
              ].map(({ label, key, placeholder, keyboard, secure }) => (
                <View key={key}>
                  <Text style={s.label}>{label}</Text>
                  <TextInput
                    style={s.input}
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

              {subjects.length > 0 && (
                <View>
                  <Text style={s.label}>Assign Subject(s)</Text>
                  <View style={s.subjectChips}>
                    {subjects.map(sub => {
                      const active = form.subject_ids.includes(sub.id);
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[s.chip, active && s.chipActive]}
                          onPress={() => toggleSubject(sub.id)}
                        >
                          <Text style={[s.chipText, active && s.chipTextActive]}>{sub.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {form.subject_ids.length > 0 && (
                    <Text style={s.chipCount}>{form.subject_ids.length} subject(s) selected</Text>
                  )}
                </View>
              )}

              <TouchableOpacity style={s.submitBtn} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Create Teacher</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f8fafc' },
  addBtn:         { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:     { color: '#4f46e5', fontWeight: '800', fontSize: 13 },
  pillsRow:       { flexDirection: 'row', gap: 8 },
  pill:           { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  pillVal:        { color: '#fff', fontSize: 18, fontWeight: '800' },
  pillLabel:      { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  avatar:         { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: '#fff', fontWeight: '800', fontSize: 16 },
  name:           { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  meta:           { fontSize: 12, color: '#64748b', marginTop: 1 },
  subjectTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  subjectTag:     { backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  subjectTagText: { color: '#4f46e5', fontSize: 10, fontWeight: '700' },
  noSubjectTag:   { backgroundColor: '#fffbeb', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  noSubjectText:  { color: '#d97706', fontSize: 10, fontWeight: '600' },
  cardActions:    { gap: 6, alignItems: 'flex-end' },
  editBtn:        { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  editBtnText:    { color: '#4f46e5', fontWeight: '700', fontSize: 12 },
  deleteBtn:      { backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnText:  { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  editHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, backgroundColor: '#fef3c7', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  editTitle:      { fontSize: 13, fontWeight: '700', color: '#92400e' },
  editClose:      { fontSize: 16, color: '#92400e' },
  subjectChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:           { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipActive:     { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  chipText:       { fontSize: 12, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#4f46e5', fontWeight: '700' },
  chipCount:      { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  cancelBtn:      { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  cancelBtnText:  { color: '#64748b', fontWeight: '700', fontSize: 13 },
  overlay:        { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  sheetHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle:     { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  sheetClose:     { fontSize: 20, color: '#94a3b8' },
  label:          { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:          { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b' },
  submitBtn:      { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  submitBtnText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
