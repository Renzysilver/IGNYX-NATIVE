import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  color?: string;
  fontSize?: number;
  onComplete?: () => void;
  style?: any;
  delay?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 40,
  color = Colors.textCyan,
  fontSize = 14,
  onComplete,
  style,
  delay = 0,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    indexRef.current = 0;
    setDisplayedText('');

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, text, speed]);

  return (
    <Text
      style={[
        styles.text,
        {
          color,
          fontSize,
          fontFamily: 'SpaceMono-Regular',
        },
        style,
      ]}
    >
      {displayedText}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'SpaceMono-Regular',
    lineHeight: 22,
  },
});
