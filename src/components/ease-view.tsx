import { useEffect, type ReactNode } from "react";
import {
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export type AnimateState = {
  opacity?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
};

export type TimingTransition = {
  type: "timing";
  duration?: number;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
  delay?: number;
};

export type SpringTransition = {
  type: "spring";
  damping?: number;
  stiffness?: number;
  mass?: number;
  delay?: number;
};

type Transition = TimingTransition | SpringTransition;

type EaseViewProps = ViewProps & {
  animate?: AnimateState;
  initialAnimate?: AnimateState;
  transition?: Transition;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const EASINGS = {
  linear: Easing.linear,
  easeIn: Easing.bezier(0.42, 0, 1, 1),
  easeOut: Easing.bezier(0, 0, 0.58, 1),
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
} as const;

function resolve(animate: AnimateState | undefined) {
  return {
    opacity: animate?.opacity ?? 1,
    translateX: animate?.translateX ?? 0,
    translateY: animate?.translateY ?? 0,
    scale: animate?.scale ?? 1,
    rotate: animate?.rotate ?? 0,
  };
}

function run(value: number, transition: Transition | undefined) {
  const delay = transition?.delay ?? 0;
  const animation =
    transition?.type === "spring"
      ? withSpring(value, {
          damping: transition.damping ?? 15,
          stiffness: transition.stiffness ?? 120,
          mass: transition.mass ?? 1,
        })
      : withTiming(value, {
          duration:
            transition?.type === "timing" ? (transition.duration ?? 300) : 300,
          easing:
            EASINGS[
              transition?.type === "timing"
                ? (transition.easing ?? "easeInOut")
                : "easeInOut"
            ],
        });

  return delay > 0 ? withDelay(delay, animation) : animation;
}

/**
 * JS stand-in for react-native-ease's EaseView.
 * Expo Go does not ship that native view manager.
 */
export function EaseView({
  animate,
  initialAnimate,
  transition,
  style,
  children,
  ...rest
}: EaseViewProps) {
  const start = resolve(initialAnimate ?? animate);
  const target = resolve(animate);
  const delay = transition?.delay ?? 0;
  const kind = transition?.type ?? "timing";
  const duration =
    transition?.type === "timing" ? (transition.duration ?? 300) : 300;
  const easing = transition?.type === "timing" ? (transition.easing ?? "easeInOut") : "easeInOut";
  const damping = transition?.type === "spring" ? (transition.damping ?? 15) : 15;
  const stiffness =
    transition?.type === "spring" ? (transition.stiffness ?? 120) : 120;
  const mass = transition?.type === "spring" ? (transition.mass ?? 1) : 1;
  const opacity = useSharedValue(start.opacity);
  const translateX = useSharedValue(start.translateX);
  const translateY = useSharedValue(start.translateY);
  const scale = useSharedValue(start.scale);
  const rotate = useSharedValue(start.rotate);

  useEffect(() => {
    const current: Transition =
      kind === "spring"
        ? { type: "spring", damping, stiffness, mass, delay }
        : { type: "timing", duration, easing, delay };
    opacity.value = run(target.opacity, current);
    translateX.value = run(target.translateX, current);
    translateY.value = run(target.translateY, current);
    scale.value = run(target.scale, current);
    rotate.value = run(target.rotate, current);
  }, [
    damping,
    delay,
    duration,
    easing,
    kind,
    mass,
    opacity,
    rotate,
    scale,
    stiffness,
    target.opacity,
    target.rotate,
    target.scale,
    target.translateX,
    target.translateY,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
