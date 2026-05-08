import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';

const ACCOUNTS_KEY = 'saved_accounts';

async function loadAccounts() {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveAccount(username, password) {
  const accounts = await loadAccounts();
  const idx = accounts.findIndex(a => a.username === username);
  if (idx >= 0) accounts[idx] = { username, password };
  else accounts.unshift({ username, password });
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function removeAccount(username) {
  const accounts = await loadAccounts();
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.filter(a => a.username !== username)));
}

const ROLE_COLORS = {
  school:  { bg: '#d1fae5', text: '#065f46', label: 'Admin' },
  teacher: { bg: '#dbeafe', text: '#1e40af', label: 'Teacher' },
  student: { bg: '#ede9fe', text: '#5b21b6', label: 'Student' },
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    loadAccounts().then(list => {
      setAccounts(list);
      if (list.length > 0) {
        setUsername(list[0].username);
        setPassword(list[0].password);
      }
    });
  }, []);

  const selectAccount = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  const handleRemove = (acc) => {
    Alert.alert('Remove Account', `Remove saved account "${acc.username}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await removeAccount(acc.username);
        const updated = await loadAccounts();
        setAccounts(updated);
        if (username === acc.username) { setUsername(''); setPassword(''); }
      }},
    ]);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      const u = await login(username.trim(), password.trim());
      await saveAccount(username.trim(), password.trim());
      // update role label in saved accounts
      const updated = await loadAccounts();
      const withRole = updated.map(a =>
        a.username === username.trim() ? { ...a, role: u?.role } : a
      );
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(withRole));
    } catch (e) {
      Alert.alert('Login Failed', e.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader navigation={null} label="EXAM PLATFORM" title="Sign In" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>EP</Text>
          </View>
          <Text style={s.title}>Exam Platform</Text>
          <Text style={s.subtitle}>Sign in to continue</Text>

          {/* Saved accounts */}
          {accounts.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={s.label}>Saved Accounts</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {accounts.map((acc, i) => {
                  const roleStyle = ROLE_COLORS[acc.role] || { bg: '#334155', text: '#94a3b8', label: '' };
                  const isActive = acc.username === username;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.accountChip, isActive && s.accountChipActive]}
                      onPress={() => selectAccount(acc)}
                      onLongPress={() => handleRemove(acc)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.roleTag, { backgroundColor: roleStyle.bg }]}>
                        <Text style={[s.roleTagText, { color: roleStyle.text }]}>{roleStyle.label || '?'}</Text>
                      </View>
                      <Text style={[s.accountName, isActive && { color: '#fff' }]}>{acc.username}</Text>
                      {isActive && <Text style={{ color: '#a5b4fc', fontSize: 12 }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={{ color: '#475569', fontSize: 10, marginTop: 6 }}>Tap to select · Long press to remove</Text>
            </View>
          )}

          <Text style={s.label}>Username</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>Password</Text>
          <View style={s.pwWrap}>
            <TextInput
              style={s.pwInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#475569"
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)}>
              <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign In</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={s.signupLink}>
            <Text style={s.signupText}>New school? Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0f172a', padding: 24 },
  card:             { backgroundColor: '#1e293b', borderRadius: 20, padding: 28 },
  logoBox:          { width: 60, height: 60, borderRadius: 16, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  logoText:         { color: '#fff', fontSize: 22, fontWeight: '800' },
  title:            { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  subtitle:         { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  label:            { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:            { backgroundColor: '#0f172a', color: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  pwWrap:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  pwInput:          { flex: 1, color: '#fff', paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  eyeBtn:           { paddingHorizontal: 14, paddingVertical: 12 },
  eyeIcon:          { fontSize: 16 },
  btn:              { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText:          { color: '#fff', fontSize: 16, fontWeight: '700' },
  signupLink:       { marginTop: 16, alignItems: 'center' },
  signupText:       { color: '#818cf8', fontSize: 13 },
  accountChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#334155' },
  accountChipActive:{ borderColor: '#4f46e5', backgroundColor: '#1e1b4b' },
  accountName:      { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  roleTag:          { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  roleTagText:      { fontSize: 9, fontWeight: '800' },
});
