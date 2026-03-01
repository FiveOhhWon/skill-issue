"use client";

import { Minus, Square, X } from "lucide-react";
import { Rnd, type RndDragCallback, type RndResizeCallback } from "react-rnd";
import type { DesktopAppId, DesktopWindowRect, DesktopWindowState } from "@/lib/desktop/types";

interface AppWindowProps {
  appId: DesktopAppId;
  title: string;
  window: DesktopWindowState;
  isActive: boolean;
  minSize: Pick<DesktopWindowRect, "width" | "height">;
  onFocus: (appId: DesktopAppId) => void;
  onClose: (appId: DesktopAppId) => void;
  onMinimize: (appId: DesktopAppId) => void;
  onToggleMaximize: (appId: DesktopAppId) => void;
  onMoveResize: (appId: DesktopAppId, rect: DesktopWindowRect) => void;
  hidden?: boolean;
  contentPadding?: boolean;
  children: React.ReactNode;
}

function parseSize(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const windowControlClass =
  "flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--os-line)] bg-[var(--os-panel)] p-0 text-[var(--os-ink)] transition-colors";

export function AppWindow({
  appId,
  title,
  window,
  isActive,
  minSize,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMoveResize,
  hidden = false,
  contentPadding = true,
  children,
}: AppWindowProps) {
  const handleDragStop: RndDragCallback = (_e, data) => {
    onMoveResize(appId, {
      ...window.rect,
      x: data.x,
      y: data.y,
    });
  };

  const handleResizeStop: RndResizeCallback = (_e, _dir, ref, _delta, position) => {
    onMoveResize(appId, {
      x: position.x,
      y: position.y,
      width: parseSize(ref.style.width),
      height: parseSize(ref.style.height),
    });
  };

  return (
    <Rnd
      size={{ width: window.rect.width, height: window.rect.height }}
      position={{ x: window.rect.x, y: window.rect.y }}
      minWidth={minSize.width}
      minHeight={minSize.height}
      bounds="parent"
      dragHandleClassName="desktop-window-drag-handle"
      disableDragging={window.isMaximized}
      enableResizing={!window.isMaximized}
      style={{ zIndex: window.zIndex }}
      onMouseDown={() => onFocus(appId)}
      onDragStart={() => onFocus(appId)}
      onDragStop={handleDragStop}
      onResizeStart={() => onFocus(appId)}
      onResizeStop={handleResizeStop}
      className={`pointer-events-auto rounded-[10px] border border-[var(--os-window-edge)] bg-[var(--os-window)] shadow-[0_18px_28px_rgba(31,25,17,0.22)] ${
        hidden ? "hidden" : ""
      }`}
    >
      <div className="flex h-full flex-col">
        <div
          className={`desktop-window-drag-handle grid h-[44px] grid-cols-[1fr_auto] items-center rounded-t-[10px] border-b border-[var(--os-line)] px-3 ${
            isActive ? "bg-[linear-gradient(#efe8d9,#e7decd)]" : "bg-[linear-gradient(#ece6d9,#e2dac9)]"
          }`}
        >
          <div className="truncate pr-3 text-xs font-semibold leading-none text-[var(--os-ink)]">
            {title}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Minimize window"
              className={`${windowControlClass} hover:bg-[var(--os-paper-dark)]`}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onMinimize(appId);
              }}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Maximize window"
              className={`${windowControlClass} hover:bg-[var(--os-paper-dark)]`}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onToggleMaximize(appId);
              }}
            >
              <Square className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label="Close window"
              className={`${windowControlClass} hover:bg-[#ffd6cc]`}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onClose(appId);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-hidden rounded-b-[10px] bg-[var(--os-window)] ${
            contentPadding ? "p-3" : ""
          }`}
        >
          <div
            className={`h-full w-full overflow-hidden rounded-[9px] ${contentPadding ? "border border-[var(--os-line)] bg-[var(--os-panel)]" : ""}`}
          >
            {children}
          </div>
        </div>
      </div>
    </Rnd>
  );
}
