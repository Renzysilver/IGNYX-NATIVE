// IGNYX Error Boundary — Module 16
// When the system crashes, it doesn't just die — it degrades gracefully.
// A React error boundary that catches rendering errors and shows
// a themed recovery screen. The operator can always reset.

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

// ─── Props ─────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Called when error is caught — for logging */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called when user presses reset */
  onReset?: () => void;
}

// ─── State ─────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ─── Component ─────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console for debugging
    console.error('[IGNYX ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleHardReset = () => {
    // Nuclear option — clear all storage and restart
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.default.removeItem('ignyx_game_state').catch(() => {});
    } catch (e) {
      // Best effort
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown system fault';
      const componentStack = this.state.errorInfo?.componentStack || '';

      // Truncate stack trace for display
      const shortStack = componentStack
        .split('\n')
        .slice(0, 4)
        .map((line: string) => line.trim())
        .filter(Boolean)
        .join('\n');

      return (
        <View style={styles.root}>
          {/* Ambient glow */}
          <View style={styles.ambientGlow} pointerEvents="none" />

          <View style={styles.content}>
            <Text style={styles.errorCode}>SYSTEM FAULT</Text>
            <Text style={styles.errorTitle}>RENDERING ERROR</Text>
            <Text style={styles.errorMessage}>
              The system encountered an unexpected error and could not
              continue rendering. This is not a mission failure — it is
              a structural fault in the OS itself.
            </Text>

            {/* Error details */}
            <View style={styles.errorDetails}>
              <Text style={styles.detailLabel}>ERROR</Text>
              <Text style={styles.detailValue} numberOfLines={3}>
                {errorMessage}
              </Text>
            </View>

            {shortStack ? (
              <View style={styles.errorDetails}>
                <Text style={styles.detailLabel}>TRACE</Text>
                <Text style={styles.traceValue} numberOfLines={5}>
                  {shortStack}
                </Text>
              </View>
            ) : null}

            {/* Recovery options */}
            <View style={styles.options}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={this.handleReset}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>RETRY</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={this.handleHardReset}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>HARD RESET</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              If the error persists, a hard reset will clear all data and restart the system from boot.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 0, 0, 0.03)',
  },
  content: {
    paddingHorizontal: 24,
    maxWidth: 400,
  },
  errorCode: {
    color: Colors.textRed,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 4,
    marginBottom: 4,
    opacity: 0.6,
  },
  errorTitle: {
    color: Colors.textRed,
    fontSize: 22,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 6,
    marginBottom: 16,
  },
  errorMessage: {
    color: Colors.textDim,
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    lineHeight: 16,
    marginBottom: 20,
  },
  errorDetails: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.04)',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 0, 0, 0.3)',
  },
  detailLabel: {
    color: Colors.textRed,
    fontSize: 7,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
    marginBottom: 4,
    opacity: 0.6,
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    lineHeight: 14,
    opacity: 0.8,
  },
  traceValue: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.3,
    lineHeight: 12,
    opacity: 0.5,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  retryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cyan,
  },
  retryText: {
    color: Colors.textCyan,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  resetText: {
    color: Colors.textRed,
    fontSize: 11,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 3,
  },
  hint: {
    color: Colors.textDim,
    fontSize: 8,
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 12,
    opacity: 0.4,
  },
});
