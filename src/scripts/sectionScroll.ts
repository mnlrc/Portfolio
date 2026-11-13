/**
 * Section-by-section scrolling with resistance (landing page only).
 *
 * CSS scroll snapping (global.css) is the no-JS fallback. When this script is active it takes over:
 * small scrolls only "stretch" the page a little and spring back; the page moves to the next
 * section only once the scroll passes a threshold. Sections taller than the screen scroll
 * normally until their edge is reached.
 */

/** Tuning knobs. Higher thresholds = more resistance. */
const WHEEL_THRESHOLD = 160; // px of accumulated wheel delta (~1.5 mouse-wheel notches)
const TOUCH_THRESHOLD_RATIO = 0.13; // fraction of the screen height a swipe must cover
const TOUCH_THRESHOLD_MIN = 70; // px
const MAX_STRETCH = 22; // px the page visibly gives before moving
const RESET_MS = 350; // wheel pause after which the accumulated scroll is forgotten
const QUIET_MS = 180; // after a move, wait for the wheel/trackpad to go quiet before accepting input
const MOVE_TIMEOUT_MS = 1000; // fallback if `scrollend` never fires

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const tallEnough = matchMedia('(min-height: 32rem)');
const main = document.querySelector<HTMLElement>('main');

function enabled(): boolean {
  return root.classList.contains('snap-scroll') && !reducedMotion.matches && tallEnough.matches;
}

if (main && root.classList.contains('snap-scroll')) {
  const targets = [
    ...document.querySelectorAll<HTMLElement>('.snap-section'),
    ...document.querySelectorAll<HTMLElement>('body > footer'),
  ];

  const sync = () => root.classList.toggle('snap-js', enabled());
  sync();
  reducedMotion.addEventListener('change', sync);
  tallEnough.addEventListener('change', sync);

  const headerHeight = () => document.querySelector('header')?.getBoundingClientRect().height ?? 0;
  const maxScroll = () => root.scrollHeight - innerHeight;
  const positionOf = (el: HTMLElement) =>
    Math.min(el.getBoundingClientRect().top + scrollY - headerHeight(), maxScroll());

  /** Index of the target whose snap position is closest to the current scroll position. */
  const currentIndex = () => {
    let best = 0;
    let bestDistance = Infinity;
    targets.forEach((el, i) => {
      const distance = Math.abs(positionOf(el) - scrollY);
      if (distance < bestDistance) [best, bestDistance] = [i, distance];
    });
    return best;
  };

  /** True when the current section is taller than the screen and has more to show in `dir`. */
  const canScrollWithin = (dir: 1 | -1) => {
    const el = targets[currentIndex()];
    if (!el?.classList.contains('snap-section')) return false;
    const rect = el.getBoundingClientRect();
    return dir > 0 ? rect.bottom > innerHeight + 2 : rect.top < headerHeight() - 2;
  };

  // --- Movement & lock -------------------------------------------------------
  let moving = false;
  let quiet = true;
  let quietTimer: number | undefined;

  const holdUntilQuiet = () => {
    quiet = false;
    clearTimeout(quietTimer);
    quietTimer = window.setTimeout(() => (quiet = true), QUIET_MS);
  };

  const go = (dir: 1 | -1) => {
    const next = targets[currentIndex() + dir];
    stretch(0, true);
    if (!next) return;
    moving = true;
    holdUntilQuiet();
    const done = () => {
      moving = false;
      clearTimeout(fallback);
      removeEventListener('scrollend', done);
    };
    const fallback = window.setTimeout(done, MOVE_TIMEOUT_MS);
    addEventListener('scrollend', done, { once: true });
    scrollTo({ top: positionOf(next), behavior: 'smooth' });
  };

  // --- Visual resistance -----------------------------------------------------
  /** Shifts the page slightly against the scroll direction; progress in [-1, 1]. */
  const stretch = (progress: number, release = false) => {
    main.style.transition = release ? 'transform var(--duration-base) var(--ease-out)' : 'none';
    main.style.transform = progress ? `translateY(${-progress * MAX_STRETCH}px)` : '';
  };

  // --- Mouse wheel / trackpad ------------------------------------------------
  let accumulated = 0;
  let resetTimer: number | undefined;

  addEventListener(
    'wheel',
    (event) => {
      if (!enabled() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const delta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * innerHeight
            : event.deltaY;
      if (delta === 0) return;
      const dir: 1 | -1 = delta > 0 ? 1 : -1;

      if (moving || !quiet) {
        event.preventDefault();
        holdUntilQuiet(); // swallow trackpad inertia from the previous gesture
        return;
      }
      if (canScrollWithin(dir)) {
        accumulated = 0;
        return; // let the browser scroll inside a tall section
      }

      event.preventDefault();
      if (Math.sign(accumulated) !== dir) accumulated = 0;
      accumulated += delta;

      clearTimeout(resetTimer);
      if (Math.abs(accumulated) >= WHEEL_THRESHOLD) {
        accumulated = 0;
        go(dir);
        return;
      }
      stretch(accumulated / WHEEL_THRESHOLD);
      resetTimer = window.setTimeout(() => {
        accumulated = 0;
        stretch(0, true);
      }, RESET_MS);
    },
    { passive: false },
  );

  // --- Touch -----------------------------------------------------------------
  let touchStartY: number | null = null;
  let touchDelta = 0;
  let touchNative = false;

  addEventListener(
    'touchstart',
    (event) => {
      if (!enabled() || event.touches.length !== 1) return;
      touchStartY = event.touches[0].clientY;
      touchDelta = 0;
      touchNative = false;
    },
    { passive: true },
  );

  addEventListener(
    'touchmove',
    (event) => {
      if (touchStartY === null || !enabled() || event.touches.length !== 1) return;
      touchDelta = touchStartY - event.touches[0].clientY;
      if (touchDelta === 0) return;
      const dir: 1 | -1 = touchDelta > 0 ? 1 : -1;
      if (touchNative || canScrollWithin(dir)) {
        touchNative = true;
        return;
      }
      event.preventDefault();
      if (moving) return;
      const threshold = Math.max(TOUCH_THRESHOLD_MIN, innerHeight * TOUCH_THRESHOLD_RATIO);
      stretch(Math.max(-1, Math.min(1, touchDelta / threshold)));
    },
    { passive: false },
  );

  addEventListener('touchend', () => {
    if (touchStartY === null) return;
    const threshold = Math.max(TOUCH_THRESHOLD_MIN, innerHeight * TOUCH_THRESHOLD_RATIO);
    if (!touchNative && !moving && Math.abs(touchDelta) >= threshold) {
      go(touchDelta > 0 ? 1 : -1);
    } else {
      stretch(0, true);
    }
    touchStartY = null;
  });

  // --- Keyboard (no resistance: a key press is deliberate) ------------------
  const keyDirections: Record<string, 1 | -1> = {
    ArrowDown: 1,
    PageDown: 1,
    ' ': 1,
    ArrowUp: -1,
    PageUp: -1,
  };

  addEventListener('keydown', (event) => {
    if (!enabled() || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, button, [contenteditable]')) return;
    let dir = keyDirections[event.key];
    if (event.key === ' ' && event.shiftKey) dir = -1;
    if (!dir || canScrollWithin(dir)) return;
    event.preventDefault();
    if (!moving) go(dir);
  });
}
