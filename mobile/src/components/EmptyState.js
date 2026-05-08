import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../theme';

export default function EmptyState({ icon = '📭', title, message, style }) {
  return (
    <View style={[s.container, style]}>
      <Text style={s.icon}>{icon}</Text>
      {title   ? <Text style={s.title}>{title}</Text>     : null}
      {message ? <Text style={s.message}>{message}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: COLORS.white, borderRadius: 20, padding: 40, alignItems: 'center', ...SHADOWS.sm },
  icon:      { fontSize: 40, marginBottom: 10 },
  title:     { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  message:   { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});
