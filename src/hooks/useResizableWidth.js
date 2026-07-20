import { useState, useRef, useCallback } from 'react';

const STORAGE_KEY = 'ai-sidebar-width';

export function useResizableWidth({ min = 280, max = 560, defaultWidth = 350 } = {}) {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return defaultWidth;
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return saved >= min && saved <= max ? saved : defaultWidth;
  });

  const panelRef = useRef(null);
  const currentWidth = useRef(width);

  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId) || !panelRef.current) return;
      const next = Math.min(max, Math.max(min, window.innerWidth - e.clientX));
      currentWidth.current = next;
      panelRef.current.style.width = `${next}px`;
    },
    [min, max]
  );

  const onPointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setWidth(currentWidth.current);
    localStorage.setItem(STORAGE_KEY, String(currentWidth.current));
  }, []);

  return { width, panelRef, handleProps: { onPointerDown, onPointerMove, onPointerUp } };
}
