import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getGrade } from '../utils/helpers';

export default function GradeBadge({ pct, style }) {
  const g = getGrade(Math.round(pct || 0));
  return (
    <View style={[s.badge, { backgroundColor: g.bg }, style]}>
      <Text style={[s.text, { color: g.color }]}>{g.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  text:  { fontSize: 10, fontWeight: '800' },
});
