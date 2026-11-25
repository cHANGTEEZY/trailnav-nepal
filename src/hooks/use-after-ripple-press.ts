import { useCallback, useEffect, useRef } from "react";

/** Default HeroUI PressableFeedback.Ripple `progress.baseDuration`. */
export const DEFAULT_RIPPLE_SETTLE_MS = 200;

type UseAfterRipplePressOptions = {
  delayMs?: number;
  enabled?: boolean;
  afterInteractions?: boolean;
};

/**
 * Defers a press action until after a press ripple has had time to finish.
 */
export function useAfterRipplePress(
  action: () => void,
  {
    delayMs = DEFAULT_RIPPLE_SETTLE_MS,
    enabled = true,
    afterInteractions = true,
  }: UseAfterRipplePressOptions = {},
) {
  const actionRef = useRef(action);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRef = useRef<number | null>(null);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (idleRef.current != null) cancelIdleCallback(idleRef.current);
    };
  }, []);

  const onPress = useCallback(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (idleRef.current != null) {
      cancelIdleCallback(idleRef.current);
      idleRef.current = null;
    }

    const run = () => {
      idleRef.current = null;
      actionRef.current();
    };

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (!afterInteractions) {
        run();
        return;
      }
      idleRef.current = requestIdleCallback(run);
    }, delayMs);
  }, [afterInteractions, delayMs, enabled]);

  return {
    onPress,
    rippleSettleMs: delayMs,
  };
}
