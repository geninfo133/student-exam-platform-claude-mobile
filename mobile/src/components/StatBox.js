import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatBox({ label, value, color, bg }) {
  return (
    <View style={[s.box, { backgroundColor: bg }]}>
      <Text style={[s.value, { color }]}>{value}</Text>
      <Text style={[s.label, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box:   { flex: 1, borderRadius: 14, padding: 10, alignItems: 'center', minHeight: 66, justifyContent: 'center' },
  value: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
});
