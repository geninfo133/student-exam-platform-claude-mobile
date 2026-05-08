import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function LoadingScreen({ color = COLORS.primary, bg }) {
  return (
    <View style={[s.container, bg ? { backgroundColor: bg } : null]}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
