"use client";

import { memo, useEffect, useMemo, useRef } from "react";

interface RouteAppFrameProps {
  path: string;
  title: string;
  onInteract?: () => void;
}

function withEmbeddedQuery(path: string): string {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}embedded=1`;
}

function RouteAppFrameInner({ path, title, onInteract }: RouteAppFrameProps) {
  const src = useMemo(() => withEmbeddedQuery(path), [path]);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const onInteractRef = useRef<typeof onInteract>(onInteract);

  useEffect(() => {
    onInteractRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    if (!onInteractRef.current) return;
    const frame = frameRef.current;
    if (!frame) return;

    let detachDocListeners: (() => void) | null = null;

    const attachDocListeners = () => {
      detachDocListeners?.();
      detachDocListeners = null;

      try {
        const doc = frame.contentDocument;
        if (!doc) return;

        const handleInteract = () => onInteractRef.current?.();
        doc.addEventListener("pointerdown", handleInteract, true);
        doc.addEventListener("focusin", handleInteract, true);

        detachDocListeners = () => {
          doc.removeEventListener("pointerdown", handleInteract, true);
          doc.removeEventListener("focusin", handleInteract, true);
        };
      } catch {
        // Ignore cross-document access edge cases.
      }
    };

    frame.addEventListener("load", attachDocListeners);
    attachDocListeners();

    return () => {
      frame.removeEventListener("load", attachDocListeners);
      detachDocListeners?.();
    };
  }, [src]);

  return (
    <iframe
      ref={frameRef}
      src={src}
      title={title}
      className="h-full w-full border-0 bg-transparent"
      loading="eager"
      referrerPolicy="no-referrer"
      onMouseDown={() => onInteractRef.current?.()}
      onFocus={() => onInteractRef.current?.()}
    />
  );
}

export const RouteAppFrame = memo(
  RouteAppFrameInner,
  (prev, next) => prev.path === next.path && prev.title === next.title,
);
