import { ReactNode, Children, useEffect, useState, useRef, CSSProperties } from 'react';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Soft floor (ms) for the pause between blocks; capped internally. */
  stagger?: number;
  /** Wait this long before revealing the first child */
  startDelay?: number;
  /** Extra wait (ms) added before revealing the FINAL child. */
  lastChildExtraDelay?: number;
  /** Reset animation sequence when this value changes */
  resetKey?: string | number;
}

/** Typewriter cadence — every character of every block "prints in" in reading order. */
const MS_PER_CHAR = 14;
const MIN_TYPE_MS = 360;
const MAX_TYPE_MS = 2600;
const GAP_AFTER_TYPE_MS = 180;
const MAX_PAUSE_MS = 3200;

const estimateTypeMs = (chars: number) => {
  if (chars <= 0) return MIN_TYPE_MS;
  return Math.min(MAX_TYPE_MS, Math.max(MIN_TYPE_MS, chars * MS_PER_CHAR));
};

/** Count visible characters in the block (excluding chars inside <svg>, which we skip). */
const countTypableChars = (root: HTMLElement): number => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('svg')) return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains('ttype-char')) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let total = 0;
  let n: Node | null;
  while ((n = walker.nextNode())) total += (n.nodeValue ?? '').length;
  return total;
};

/** Wrap each text node's characters in spans with staggered animation-delay so
 *  characters reveal strictly in document (reading) order. */
const wrapBlockForType = (root: HTMLElement, totalDurationMs: number) => {
  if (root.dataset.typed === '1') return;
  // Collect text nodes first (mutating during walk is unsafe).
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('svg')) return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains('ttype-char')) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);

  const totalChars = textNodes.reduce((s, t) => s + (t.nodeValue ?? '').length, 0);
  if (totalChars === 0) {
    root.dataset.typed = '1';
    return;
  }
  const msPerChar = totalDurationMs / totalChars;

  let cursor = 0;
  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      // Whitespace: reveal instantly with its sibling so layout never breaks.
      if (ch === ' ' || ch === '\n' || ch === '\t') {
        frag.appendChild(document.createTextNode(ch));
        cursor++;
        continue;
      }
      const span = document.createElement('span');
      span.className = 'ttype-char';
      span.textContent = ch;
      const delay = Math.round(cursor * msPerChar);
      span.style.animationDelay = `${delay}ms`;
      frag.appendChild(span);
      cursor++;
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
  root.dataset.typed = '1';
};

export const StaggerReveal = ({
  children,
  className = '',
  stagger = 350,
  startDelay = 0,
  lastChildExtraDelay = 0,
  resetKey,
}: StaggerRevealProps) => {
  const items = Children.toArray(children);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [typeDurations, setTypeDurations] = useState<number[]>([]);
  const [started, setStarted] = useState(startDelay <= 0);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const prevKeyRef = useRef(resetKey);

  // Reset when section changes
  useEffect(() => {
    if (prevKeyRef.current !== resetKey) {
      prevKeyRef.current = resetKey;
      setSuppressTransition(true);
      setVisibleCount(0);
      setTypeDurations([]);
      setStarted(false);
      // Clear "typed" markers so blocks re-animate if remounted.
      itemRefs.current.forEach(el => {
        if (el) delete el.dataset.typed;
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSuppressTransition(false));
      });
    }
  }, [resetKey]);

  // Start gate
  useEffect(() => {
    if (startDelay <= 0) {
      setStarted(true);
      return;
    }
    setStarted(false);
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay, resetKey]);

  // Schedule next reveal. We measure the block ABOUT to be revealed so its
  // type duration is known before mount, and we use the PREVIOUSLY-revealed
  // block's char count to size the pause that precedes it.
  useEffect(() => {
    if (!started || visibleCount >= items.length) return;

    const nextEl = itemRefs.current[visibleCount];
    const nextChars = nextEl ? countTypableChars(nextEl) : 0;
    const nextTypeMs = estimateTypeMs(nextChars);
    setTypeDurations(prev => {
      if (prev[visibleCount] === nextTypeMs) return prev;
      const next = prev.slice();
      next[visibleCount] = nextTypeMs;
      return next;
    });

    let delay: number;
    if (visibleCount === 0) {
      delay = 80;
    } else {
      const prevDuration = typeDurations[visibleCount - 1] ?? estimateTypeMs(0);
      const softFloor = Math.min(stagger, MAX_PAUSE_MS);
      delay = Math.min(MAX_PAUSE_MS, Math.max(softFloor, prevDuration + GAP_AFTER_TYPE_MS));
      if (visibleCount === items.length - 1) {
        delay += Math.round(lastChildExtraDelay * 0.5);
      }
    }

    const t = setTimeout(() => setVisibleCount(v => v + 1), delay);
    return () => clearTimeout(t);
    // typeDurations intentionally omitted — we read it via closure but
    // re-running on every measurement would loop. visibleCount changes drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, visibleCount, items.length, stagger, lastChildExtraDelay]);

  // When a block becomes visible, wrap its text into per-char spans (once).
  useEffect(() => {
    if (!started) return;
    for (let i = 0; i < visibleCount; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const duration = typeDurations[i] ?? estimateTypeMs(countTypableChars(el));
      wrapBlockForType(el, duration);
    }
  }, [visibleCount, started, typeDurations]);

  return (
    <div className={`space-y-5 md:space-y-3 ${className}`}>
      {items.map((child, i) => {
        const visible = i < visibleCount;
        const style: CSSProperties = {
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? undefined : 'none',
          transition: suppressTransition ? 'none' : undefined,
        };
        return (
          <div
            key={i}
            ref={el => (itemRefs.current[i] = el)}
            style={style}
            aria-hidden={!visible}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
