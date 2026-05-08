import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', school_name: '', phone_number: '',
  });
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [showPw2, setShowPw2]   = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSignup = async () => {
    if (!form.username || !form.password || !form.password2 || !form.first_name) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (form.password !== form.password2) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/register/', { ...form, role: 'school' });
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e) {
      const data = e.response?.data;
      const msg = typeof data === 'object'
        ? Object.values(data).flat().join('\n')
        : 'Registration failed.';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  const Field = ({ label, field, placeholder, keyboard }) => (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={form[field]}
        onChangeText={val => set(field, val)}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboard || 'default'}
      />
    </>
  );

  const PwField = ({ label, field, placeholder, show, onToggle }) => (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={s.pwWrap}>
        <TextInput
          style={s.pwInput}
          value={form[field]}
          onChangeText={val => set(field, val)}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={s.eyeBtn} onPress={onToggle}>
          <Text style={s.eyeIcon}>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader navigation={navigation} label="EXAM PLATFORM" title="Create Account" subtitle="Register your school to get started" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoBox}><Text style={s.logoText}>EP</Text></View>
        <Text style={s.title}>Create School Account</Text>
        <Text style={s.subtitle}>Register your school to get started</Text>

        <Field label="First Name *"  field="first_name"    placeholder="School admin first name" />
        <Field label="Last Name"     field="last_name"     placeholder="Last name" />
        <Field label="Username *"    field="username"      placeholder="Choose a username" />
        <Field label="School Name"   field="school_name"   placeholder="Your school name" />
        <Field label="Email"         field="email"         placeholder="email@school.com" keyboard="email-address" />
        <Field label="Phone"         field="phone_number"  placeholder="Phone number" keyboard="phone-pad" />

        <PwField
          label="Password *"
          field="password"
          placeholder="Password"
          show={showPw}
          onToggle={() => setShowPw(v => !v)}
        />
        <PwField
          label="Confirm Password *"
          field="password2"
          placeholder="Re-enter password"
          show={showPw2}
          onToggle={() => setShowPw2(v => !v)}
        />

        <TouchableOpacity style={s.btn} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.loginLink}>
          <Text style={s.loginLinkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0f172a' },
  scroll:       { padding: 24 },
  logoBox:      { width: 56, height: 56, borderRadius: 14, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  logoText:     { color: '#fff', fontSize: 20, fontWeight: '800' },
  title:        { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  subtitle:     { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  label:        { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:        { backgroundColor: '#1e293b', color: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  pwWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  pwInput:      { flex: 1, color: '#fff', paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  eyeBtn:       { paddingHorizontal: 14, paddingVertical: 11 },
  eyeIcon:      { fontSize: 16 },
  btn:          { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6, marginBottom: 16 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  loginLink:    { alignItems: 'center', paddingBottom: 32 },
  loginLinkText:{ color: '#818cf8', fontSize: 13 },
});
