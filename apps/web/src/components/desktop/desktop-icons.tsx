"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  APP_ICON_PATHS,
  APP_LABELS,
  DESKTOP_ICON_DIMENSIONS,
  DESKTOP_ICON_ORDER,
} from "@/lib/desktop/constants";
import type {
  DesktopAppId,
  DesktopIconPosition,
  DesktopIconPositionsState,
} from "@/lib/desktop/types";

interface DesktopIconsProps {
  selectedIconId: DesktopAppId | null;
  iconPositions: DesktopIconPositionsState;
  workspaceSize: { width: number; height: number };
  onSelectIcon: (appId: DesktopAppId) => void;
  onOpenApp: (appId: DesktopAppId) => void;
  onMoveIcon: (appId: DesktopAppId, position: DesktopIconPosition) => void;
}

type DragState = {
  appId: DesktopAppId;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

function clampIconPosition(
  position: DesktopIconPosition,
  workspaceSize: { width: number; height: number }
): DesktopIconPosition {
  const maxX = Math.max(
    DESKTOP_ICON_DIMENSIONS.padding,
    workspaceSize.width - DESKTOP_ICON_DIMENSIONS.width - DESKTOP_ICON_DIMENSIONS.padding
  );
  const maxY = Math.max(
    DESKTOP_ICON_DIMENSIONS.padding,
    workspaceSize.height - DESKTOP_ICON_DIMENSIONS.height - DESKTOP_ICON_DIMENSIONS.padding
  );

  return {
    x: Math.min(Math.max(position.x, DESKTOP_ICON_DIMENSIONS.padding), maxX),
    y: Math.min(Math.max(position.y, DESKTOP_ICON_DIMENSIONS.padding), maxY),
  };
}

export function DesktopIcons({
  selectedIconId,
  iconPositions,
  workspaceSize,
  onSelectIcon,
  onOpenApp,
  onMoveIcon,
}: DesktopIconsProps) {
  const lastClickRef = useRef<{ appId: DesktopAppId; at: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const draggingIconRef = useRef<DesktopAppId | null>(null);

  function handleIconClick(appId: DesktopAppId) {
    const now = Date.now();
    const prev = lastClickRef.current;
    onSelectIcon(appId);

    if (prev && prev.appId === appId && now - prev.at <= 350) {
      onOpenApp(appId);
      lastClickRef.current = null;
      return;
    }

    lastClickRef.current = { appId, at: now };
  }

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        drag.moved = true;
      }

      const next = clampIconPosition(
        { x: Math.round(drag.originX + dx), y: Math.round(drag.originY + dy) },
        workspaceSize
      );
      onMoveIcon(drag.appId, next);
    };

    const stopDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (drag.moved) {
        suppressClickRef.current = true;
      }
      dragRef.current = null;
      draggingIconRef.current = null;
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      document.body.style.userSelect = "";
    };
  }, [onMoveIcon, workspaceSize]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {DESKTOP_ICON_ORDER.map((appId) => {
        const selected = selectedIconId === appId;
        const iconPosition = iconPositions[appId];
        const isDragging = draggingIconRef.current === appId;
        return (
          <button
            key={appId}
            type="button"
            style={{ left: iconPosition.x, top: iconPosition.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelectIcon(appId);
              draggingIconRef.current = appId;
              dragRef.current = {
                appId,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                originX: iconPosition.x,
                originY: iconPosition.y,
                moved: false,
              };
              document.body.style.userSelect = "none";
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              handleIconClick(appId);
            }}
            className={`pointer-events-auto absolute z-10 flex w-[104px] select-none flex-col items-center rounded-[10px] px-1 py-1.5 text-center transition-colors [touch-action:none] ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } ${selected ? "bg-[rgba(255,255,255,0.42)]" : "hover:bg-[rgba(255,255,255,0.28)]"}`}
          >
            <span className="mb-1.5 flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[12px] border border-[var(--os-ink)] bg-[var(--os-paper)] shadow-[0_7px_14px_rgba(26,20,14,0.22)]">
              <Image
                src={APP_ICON_PATHS[appId]}
                alt={APP_LABELS[appId]}
                width={58}
                height={58}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="text-[11px] font-medium text-[var(--os-ink)]">{APP_LABELS[appId]}</span>
          </button>
        );
      })}
    </div>
  );
}
