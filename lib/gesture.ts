/**
 * Gesture physics: spring, momentum projection, rubber-banding.
 *
 * Hand-rolled rather than pulling in a spring library, because the landing
 * route is the lightest page in the app and this is ~60 lines. The parameters
 * follow Apple's designer-facing pair (damping ratio + response) rather than
 * the physics triplet, and the projection function is the exponential-decay
 * form from the Designing Fluid Interfaces sample — NOT the textbook
 * v²/(2·decel), which decelerates wrongly.
 */

export interface SpringOptions {
  /** 1.0 = critically damped (no overshoot). ~0.8 = a little bounce. */
  damping?: number;
  /** Seconds to approach the target. Not a duration — a spring has none. */
  response?: number;
}

export interface Spring {
  /** Live on-screen value. Read this on interrupt — never the target. */
  readonly current: number;
  readonly velocity: number;
  readonly isAnimating: boolean;
  /** Jump without animating (used while a finger is driving the value). */
  set(value: number, velocity?: number): void;
  /** Re-target. Carries existing velocity through unless one is given, which
   *  is what stops a reversal reading as a brick wall. */
  to(target: number, velocity?: number): void;
  stop(): void;
  destroy(): void;
}

export function createSpring(
  initial: number,
  onUpdate: (value: number) => void,
  { damping = 1, response = 0.3 }: SpringOptions = {}
): Spring {
  let value = initial;
  let velocity = 0;
  let target = initial;
  let raf = 0;
  let lastTime = 0;

  const omega = (2 * Math.PI) / response;

  const step = (now: number) => {
    // Clamp dt so a backgrounded tab doesn't explode the integration.
    const dt = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;

    // Semi-implicit Euler on the damped-spring equation.
    const accel = -2 * damping * omega * velocity - omega * omega * (value - target);
    velocity += accel * dt;
    value += velocity * dt;

    onUpdate(value);

    if (Math.abs(value - target) < 0.1 && Math.abs(velocity) < 1) {
      value = target;
      velocity = 0;
      onUpdate(value);
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(step);
  };

  const start = () => {
    if (raf) return;
    lastTime = performance.now();
    raf = requestAnimationFrame(step);
  };

  return {
    get current() {
      return value;
    },
    get velocity() {
      return velocity;
    },
    get isAnimating() {
      return raf !== 0;
    },
    set(v, vel = 0) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      value = v;
      velocity = vel;
      target = v;
      onUpdate(value);
    },
    to(t, vel) {
      target = t;
      if (vel !== undefined) velocity = vel;
      start();
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

/**
 * Where a flick would come to rest. Snap to the target nearest THIS, not
 * nearest the release point — that is what makes a flick feel thrown rather
 * than merely released.
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary. A hard stop reads as frozen; this
 * reads as "responsive, but there's nothing more here".
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55
): number {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

/** Velocity from a short position history, in px/s. */
export function velocityFrom(
  samples: { y: number; t: number }[],
  windowMs = 100
): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  let first = samples[0];
  for (let i = samples.length - 1; i >= 0; i--) {
    if (last.t - samples[i].t > windowMs) break;
    first = samples[i];
  }
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return ((last.y - first.y) / dt) * 1000;
}
