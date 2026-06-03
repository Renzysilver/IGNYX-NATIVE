import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircuitBackground } from '../components/CircuitBackground';
import { GlassPanel } from '../components/GlassPanel';
import { Colors } from '../constants/colors';

// Stub — will be fully built in Module 03
export default function ShellScreen() {
  return (
    <View style={styles.root}>
      <CircuitBackground />
      <View style={styles.content}>
        <GlassPanel>
          <Text style={styles.text}>IGNYX SHELL — ACTIVE</Text>
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  text: {
    color: Colors.textCyan,
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
  },
});
