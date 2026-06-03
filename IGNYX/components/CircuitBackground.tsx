import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle, Line, Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useFrameCallback,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';
import type { GameState } from '../constants/gameState';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NODE_COUNT = 80;
const CONNECTION_DISTANCE = 120;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

interface NodeData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  frozen: boolean;
}

const createNodes = (): NodeData[] => {
  const nodes: NodeData[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 2 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      frozen: false,
    });
  }
  return nodes;
};

const getColorForState = (state: GameState): { r: number; g: number; b: number } => {
  switch (state) {
    case 'normal': return { r: 0, g: 245, b: 255 };
    case 'warning': return { r: 255, g: 191, b: 0 };
    case 'critical': return { r: 255, g: 50, b: 50 };
    case 'breakdown': return { r: 139, g: 0, b: 255 };
  }
};

interface NodeRender {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

interface ConnectionRender {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

export const CircuitBackground: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const isEditorFocused = useGameStore((s) => s.isEditorFocused);
  const reducedMotion = useGameStore((s) => s.reducedMotion);

  const nodesRef = useRef<NodeData[]>(createNodes());
  const lastFrameTime = useRef(0);
  const tickRef = useRef(0);

  const [nodes, setNodes] = useState<NodeRender[]>([]);
  const [connections, setConnections] = useState<ConnectionRender[]>([]);

  // Update at 30fps using requestAnimationFrame via Reanimated
  useFrameCallback((frameInfo) => {
    if (reducedMotion) return;

    const now = frameInfo.timestamp;
    if (now - lastFrameTime.current < FRAME_INTERVAL) return;
    lastFrameTime.current = now;
    tickRef.current += 1;

    const nds = nodesRef.current;
    const speedMultiplier =
      gameState === 'normal' ? 1 :
      gameState === 'warning' ? 1.3 :
      gameState === 'critical' ? 1.7 : 2.2;

    const newNodes: NodeRender[] = [];

    for (let i = 0; i < nds.length; i++) {
      const node = nds[i];

      // Freeze nodes near editor center
      if (isEditorFocused) {
        const dx = node.x - SCREEN_WIDTH * 0.5;
        const dy = node.y - SCREEN_HEIGHT * 0.5;
        if (Math.sqrt(dx * dx + dy * dy) < 200) {
          node.frozen = true;
          newNodes.push({ x: node.x, y: node.y, r: node.radius, opacity: 0.05 });
          continue;
        }
      }
      node.frozen = false;

      node.x += node.vx * speedMultiplier;
      node.y += node.vy * speedMultiplier;

      if (node.x < 0 || node.x > SCREEN_WIDTH) node.vx *= -1;
      if (node.y < 0 || node.y > SCREEN_HEIGHT) node.vy *= -1;
      node.x = Math.max(0, Math.min(SCREEN_WIDTH, node.x));
      node.y = Math.max(0, Math.min(SCREEN_HEIGHT, node.y));

      let opacity = 0.15 + 0.15 * Math.sin(tickRef.current * 0.05 + node.phase);
      if (gameState === 'critical' && Math.random() < 0.05) opacity = 0.02;
      if (gameState === 'breakdown' && Math.random() < 0.08) {
        node.frozen = true;
        opacity = 0.01;
      }

      newNodes.push({ x: node.x, y: node.y, r: node.radius, opacity });
    }

    // Connections
    const newConns: ConnectionRender[] = [];
    for (let i = 0; i < nds.length; i++) {
      for (let j = i + 1; j < nds.length; j++) {
        const dx = nds[i].x - nds[j].x;
        const dy = nds[i].y - nds[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DISTANCE) {
          const shouldBreak =
            (gameState === 'critical' && Math.random() < 0.1) ||
            (gameState === 'breakdown' && Math.random() < 0.2);
          if (!shouldBreak) {
            const lineOpacity =
              (1 - dist / CONNECTION_DISTANCE) * 0.15 *
              (0.7 + 0.3 * Math.sin(tickRef.current * 0.03 + i * 0.5));
            newConns.push({
              x1: nds[i].x, y1: nds[i].y,
              x2: nds[j].x, y2: nds[j].y,
              opacity: lineOpacity,
            });
          }
        }
      }
    }

    setNodes(newNodes);
    setConnections(newConns);
  });

  if (reducedMotion) {
    return <View style={styles.staticFallback} />;
  }

  const color = getColorForState(gameState);
  const nodeColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
  const lineColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;

  return (
    <View style={styles.container}>
      <Canvas style={StyleSheet.absoluteFill}>
        {connections.map((conn, i) => (
          <Line
            key={`l-${i}`}
            p1={{ x: conn.x1, y: conn.y1 }}
            p2={{ x: conn.x2, y: conn.y2 }}
            color={lineColor}
            opacity={conn.opacity}
            strokeWidth={0.5}
          />
        ))}
        {nodes.map((node, i) => (
          <Circle
            key={`n-${i}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            color={nodeColor}
            opacity={node.opacity}
          />
        ))}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    backgroundColor: Colors.black,
  },
  staticFallback: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    backgroundColor: '#050A14',
  },
});
