const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure react-native-worklets is resolved properly by Metro
// Reanimated 4.x imports from 'react-native-worklets' which needs native code
// For dev builds this works natively; for Expo Go we provide a shim
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

// Make sure .ts source files in worklets are resolved
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

module.exports = config;
