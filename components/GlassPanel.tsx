import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/colors';

interface GlassPanelProps {
  children: React.ReactNode;
  active?: boolean;
  style?: any;
  testID?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  active = false,
  style,
  testID,
}) => {
  return (
    <View
      style={[
        styles.container,
        active && styles.containerActive,
        style,
      ]}
      testID={testID}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      <View style={[styles.innerBorder, active && styles.innerBorderActive]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glassBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  containerActive: {
    backgroundColor: Colors.glassBgActive,
    borderColor: Colors.glassBorderActive,
  },
  innerBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    pointerEvents: 'none',
  },
  innerBorderActive: {
    borderColor: Colors.glassBorderActive,
  },
  content: {
    padding: 12,
    zIndex: 1,
  },
});
