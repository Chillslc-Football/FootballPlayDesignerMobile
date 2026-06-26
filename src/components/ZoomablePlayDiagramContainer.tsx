import { ReactNode, useRef } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { FIELD_ASPECT_RATIO } from '../playDiagram/constants/field';
import { colors } from '../theme';

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const DOUBLE_TAP_DELAY_MS = 300;
const TAP_SLOP = 10;

type TouchLike = {
  pageX: number;
  pageY: number;
};

function getTouchesDistance(touches: readonly TouchLike[]): number {
  const [first, second] = touches;
  const dx = first.pageX - second.pageX;
  const dy = first.pageY - second.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type ZoomablePlayDiagramContainerProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ZoomablePlayDiagramContainer({
  children,
  style,
}: ZoomablePlayDiagramContainerProps) {
  const scale = useRef(new Animated.Value(MIN_SCALE)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const scaleRef = useRef(MIN_SCALE);
  const translateXRef = useRef(0);
  const translateYRef = useRef(0);
  const panStartXRef = useRef(0);
  const panStartYRef = useRef(0);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(MIN_SCALE);
  const lastTapAtRef = useRef(0);
  const layoutRef = useRef({ width: 0, height: 0 });

  const clampTranslation = (x: number, y: number, currentScale: number) => {
    const { width, height } = layoutRef.current;

    if (currentScale <= MIN_SCALE || width === 0 || height === 0) {
      return { x: 0, y: 0 };
    }

    const maxX = (width * (currentScale - 1)) / 2;
    const maxY = (height * (currentScale - 1)) / 2;

    return {
      x: clamp(x, -maxX, maxX),
      y: clamp(y, -maxY, maxY),
    };
  };

  const applyScale = (nextScale: number) => {
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    scaleRef.current = clampedScale;
    scale.setValue(clampedScale);

    if (clampedScale <= MIN_SCALE) {
      translateXRef.current = 0;
      translateYRef.current = 0;
      translateX.setValue(0);
      translateY.setValue(0);
      return;
    }

    const clamped = clampTranslation(translateXRef.current, translateYRef.current, clampedScale);
    translateXRef.current = clamped.x;
    translateYRef.current = clamped.y;
    translateX.setValue(clamped.x);
    translateY.setValue(clamped.y);
  };

  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: MIN_SCALE, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start(() => {
      scaleRef.current = MIN_SCALE;
      translateXRef.current = 0;
      translateYRef.current = 0;
    });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    layoutRef.current = { width, height };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
      onStartShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.numberActiveTouches >= 2 || scaleRef.current > MIN_SCALE,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        gestureState.numberActiveTouches >= 2 || scaleRef.current > MIN_SCALE,
      onPanResponderTerminationRequest: () => scaleRef.current <= MIN_SCALE,
      onPanResponderGrant: () => {
        panStartXRef.current = translateXRef.current;
        panStartYRef.current = translateYRef.current;
        pinchStartDistanceRef.current = null;
      },
      onPanResponderMove: (event, gestureState) => {
        const touches = event.nativeEvent.touches;

        if (touches.length >= 2) {
          const distance = getTouchesDistance(touches);

          if (pinchStartDistanceRef.current === null) {
            pinchStartDistanceRef.current = distance;
            pinchStartScaleRef.current = scaleRef.current;
            return;
          }

          const nextScale =
            pinchStartScaleRef.current * (distance / pinchStartDistanceRef.current);
          applyScale(nextScale);
          return;
        }

        if (scaleRef.current > MIN_SCALE) {
          const nextX = panStartXRef.current + gestureState.dx;
          const nextY = panStartYRef.current + gestureState.dy;
          const clamped = clampTranslation(nextX, nextY, scaleRef.current);
          translateXRef.current = clamped.x;
          translateYRef.current = clamped.y;
          translateX.setValue(clamped.x);
          translateY.setValue(clamped.y);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        pinchStartDistanceRef.current = null;

        const isTap =
          Math.abs(gestureState.dx) < TAP_SLOP && Math.abs(gestureState.dy) < TAP_SLOP;

        if (isTap && scaleRef.current > MIN_SCALE) {
          const now = Date.now();
          if (now - lastTapAtRef.current < DOUBLE_TAP_DELAY_MS) {
            resetZoom();
            lastTapAtRef.current = 0;
            return;
          }
          lastTapAtRef.current = now;
        }
      },
      onPanResponderTerminate: () => {
        pinchStartDistanceRef.current = null;
      },
    }),
  ).current;

  return (
    <View
      style={[styles.viewport, style]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }, { translateY }, { scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: '100%',
    aspectRatio: FIELD_ASPECT_RATIO,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  content: {
    width: '100%',
    height: '100%',
  },
});
