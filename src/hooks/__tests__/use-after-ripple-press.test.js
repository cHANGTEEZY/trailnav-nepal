import { afterEach, beforeEach, expect, jest, mock, spyOn, test } from "bun:test";
import * as React from "react";

import { useAfterRipplePress } from "../use-after-ripple-press";

beforeEach(() => {
  jest.useFakeTimers();
  // Run a single hook render and capture its unmount effects without a native renderer.
  spyOn(React, "useRef").mockImplementation((current) => ({ current }));
  spyOn(React, "useCallback").mockImplementation((callback) => callback);
});

afterEach(() => {
  jest.useRealTimers();
  mock.restore();
});

function mount(action, options) {
  const cleanups = [];
  spyOn(React, "useEffect").mockImplementation((effect) => {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  });
  return {
    ...useAfterRipplePress(action, options),
    unmount: () => cleanups.forEach((cleanup) => cleanup()),
  };
}

function withIdleQueue(run) {
  const idleCallbacks = new Map();
  const originalRequest = Object.getOwnPropertyDescriptor(globalThis, "requestIdleCallback");
  const originalCancel = Object.getOwnPropertyDescriptor(globalThis, "cancelIdleCallback");
  let nextId = 0;
  Object.defineProperty(globalThis, "requestIdleCallback", {
    configurable: true,
    value: (callback) => {
      const id = nextId++;
      idleCallbacks.set(id, callback);
      return id;
    },
  });
  Object.defineProperty(globalThis, "cancelIdleCallback", {
    configurable: true,
    value: (id) => idleCallbacks.delete(id),
  });
  try {
    run(() => {
      for (const [id, callback] of idleCallbacks) {
        idleCallbacks.delete(id);
        callback();
      }
    });
  } finally {
    if (originalRequest) Object.defineProperty(globalThis, "requestIdleCallback", originalRequest);
    else delete globalThis.requestIdleCallback;
    if (originalCancel) Object.defineProperty(globalThis, "cancelIdleCallback", originalCancel);
    else delete globalThis.cancelIdleCallback;
  }
}

test("waits for both the ripple delay and the idle turn", () => {
  withIdleQueue((runIdle) => {
    const action = mock();
    const press = mount(action);
    press.onPress();

    jest.advanceTimersByTime(press.rippleSettleMs - 1);
    runIdle();
    expect(action).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(action).not.toHaveBeenCalled();
    runIdle();
    expect(action).toHaveBeenCalledTimes(1);
  });
});

test("replaces queued idle work when pressed again, even when its handle is zero", () => {
  withIdleQueue((runIdle) => {
    const action = mock();
    const press = mount(action, { delayMs: 50 });
    press.onPress();
    jest.advanceTimersByTime(50);

    press.onPress();
    runIdle();
    expect(action).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    runIdle();
    expect(action).toHaveBeenCalledTimes(1);
  });
});

test.each(["timer", "idle queue"])("cancels work on unmount while waiting on the %s", (phase) => {
  withIdleQueue((runIdle) => {
    const action = mock();
    const press = mount(action);
    press.onPress();
    if (phase === "idle queue") jest.advanceTimersByTime(press.rippleSettleMs);

    press.unmount();
    jest.advanceTimersByTime(press.rippleSettleMs);
    runIdle();
    expect(action).not.toHaveBeenCalled();
  });
});

test("runs after the supplied delay without an idle turn when opting out", () => {
  withIdleQueue((runIdle) => {
    const action = mock();
    const press = mount(action, { delayMs: 75, afterInteractions: false });
    press.onPress();

    jest.advanceTimersByTime(74);
    expect(action).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(action).toHaveBeenCalledTimes(1);
    runIdle();
    expect(action).toHaveBeenCalledTimes(1);
  });
});

test("does not schedule an action when disabled", () => {
  withIdleQueue((runIdle) => {
    const action = mock();
    const press = mount(action, { enabled: false });
    press.onPress();
    jest.advanceTimersByTime(press.rippleSettleMs);
    runIdle();
    expect(action).not.toHaveBeenCalled();
  });
});
