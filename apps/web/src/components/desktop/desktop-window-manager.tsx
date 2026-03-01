"use client";

import { AppWindow } from "@/components/desktop/app-window";
import { BuilderAppView } from "@/components/apps/builder-app-view";
import { ChatAppView } from "@/components/apps/chat-app-view";
import { DashboardAppView } from "@/components/apps/dashboard-app-view";
import { HistoryAppView } from "@/components/apps/history-app-view";
import { PipelinesAppView } from "@/components/apps/pipelines-app-view";
import { SkillsAppView } from "@/components/apps/skills-app-view";
import { APP_LABELS, MIN_WINDOW_SIZES } from "@/lib/desktop/constants";
import type {
  DesktopAppId,
  DesktopWindowRect,
  DesktopWindowState,
  DesktopWindowsState,
  DesktopViewState,
  HistoryViewState,
  PipelinesViewState,
  SkillsViewState,
} from "@/lib/desktop/types";

interface DesktopWindowManagerProps {
  windows: DesktopWindowsState;
  activeAppId: DesktopAppId | null;
  onFocus: (appId: DesktopAppId) => void;
  onClose: (appId: DesktopAppId) => void;
  onMinimize: (appId: DesktopAppId) => void;
  onToggleMaximize: (appId: DesktopAppId) => void;
  onMoveResize: (appId: DesktopAppId, rect: DesktopWindowRect) => void;
}

function renderAppContentWithFocus(
  appId: DesktopAppId,
  viewState: DesktopViewState,
  onFocus: (appId: DesktopAppId) => void
) {
  const handleInteract = () => onFocus(appId);

  switch (appId) {
    case "dashboard":
      return <DashboardAppView />;
    case "chat":
      return <ChatAppView />;
    case "skills":
      return <SkillsAppView viewState={viewState as SkillsViewState} onInteract={handleInteract} />;
    case "pipelines":
      return (
        <PipelinesAppView
          viewState={viewState as PipelinesViewState}
          onInteract={handleInteract}
        />
      );
    case "builder":
      return <BuilderAppView onInteract={handleInteract} />;
    case "history":
      return <HistoryAppView viewState={viewState as HistoryViewState} onInteract={handleInteract} />;
    default:
      return null;
  }
}

export function DesktopWindowManager({
  windows,
  activeAppId,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMoveResize,
}: DesktopWindowManagerProps) {
  // Keep DOM order stable to avoid iframe reloads when focusing windows.
  // Stacking is controlled by each window's inline z-index style in AppWindow.
  const openWindows = Object.values(windows).filter(
    (windowState) => windowState.isOpen
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {openWindows.map((windowState) => {
        const typed = windowState as DesktopWindowState;
        return (
          <AppWindow
            key={typed.appId}
            appId={typed.appId}
            title={APP_LABELS[typed.appId]}
            window={typed}
            isActive={activeAppId === typed.appId}
            minSize={MIN_WINDOW_SIZES[typed.appId]}
            onFocus={onFocus}
            onClose={onClose}
            onMinimize={onMinimize}
            onToggleMaximize={onToggleMaximize}
            onMoveResize={onMoveResize}
            hidden={typed.isMinimized}
            contentPadding={typed.appId !== "chat"}
          >
            {renderAppContentWithFocus(typed.appId, typed.viewState, onFocus)}
          </AppWindow>
        );
      })}
    </div>
  );
}
