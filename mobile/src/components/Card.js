import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../theme';

export default function Card({ title, accent = COLORS.primary, style, children }) {
  return (
    <View style={[s.card, style]}>
      <View style={[s.accent, { backgroundColor: accent }]} />
      <View style={s.inner}>
        {title ? <Text style={s.title}>{title}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:   { backgroundColor: COLORS.white, borderRadius: 18, marginBottom: 14, overflow: 'hidden', ...SHADOWS.md, shadowColor: COLORS.headerDark },
  accent: { height: 4 },
  inner:  { padding: 16 },
  title:  { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
});
