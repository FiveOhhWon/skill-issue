import {
  APP_LABELS,
  DEFAULT_ICON_POSITIONS,
  DEFAULT_VIEW_STATE,
  DEFAULT_WINDOW_RECTS,
} from "@/lib/desktop/constants";
import type {
  DesktopAction,
  DesktopAppId,
  DesktopIconPosition,
  DesktopState,
  DesktopWindowRect,
  DesktopWindowsState,
  DesktopViewState,
} from "@/lib/desktop/types";

function cloneRect(rect: DesktopWindowRect): DesktopWindowRect {
  return { ...rect };
}

function cloneIconPosition(position: DesktopIconPosition): DesktopIconPosition {
  return { ...position };
}

function nextZ(state: DesktopState): number {
  return state.zCounter + 1;
}

function normalizeViewState(appId: DesktopAppId, viewState?: DesktopViewState) {
  if (!viewState) return DEFAULT_VIEW_STATE[appId];
  return { ...DEFAULT_VIEW_STATE[appId], ...viewState };
}

function focusWindow(state: DesktopState, appId: DesktopAppId): DesktopState {
  const target = state.windows[appId];
  const newZ = nextZ(state);

  return {
    ...state,
    zCounter: newZ,
    activeAppId: appId,
    windows: {
      ...state.windows,
      [appId]: {
        ...target,
        zIndex: newZ,
      },
    },
  };
}

function openWindow(
  state: DesktopState,
  appId: DesktopAppId,
  viewState?: DesktopViewState
): DesktopState {
  const existing = state.windows[appId];
  // Preserve current app route/state when refocusing an already-open app.
  // Only replace it when a new explicit viewState is provided (deep links, commands).
  const mergedViewState =
    viewState !== undefined
      ? normalizeViewState(appId, viewState)
      : existing.viewState;

  const openState: DesktopState = {
    ...state,
    selectedIconId: null,
    windows: {
      ...state.windows,
      [appId]: {
        ...existing,
        isOpen: true,
        isMinimized: false,
        viewState: mergedViewState,
      },
    },
  };

  return focusWindow(openState, appId);
}

function maximizeRect(viewport: Pick<DesktopWindowRect, "width" | "height">): DesktopWindowRect {
  return {
    x: 0,
    y: 0,
    width: viewport.width,
    height: Math.max(300, viewport.height),
  };
}

export function createInitialDesktopState(): DesktopState {
  const windows: DesktopWindowsState = {
    dashboard: {
      appId: "dashboard",
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      rect: cloneRect(DEFAULT_WINDOW_RECTS.dashboard),
      restoreRect: undefined,
      zIndex: 2,
      viewState: DEFAULT_VIEW_STATE.dashboard,
    },
    chat: {
      appId: "chat",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      rect: cloneRect(DEFAULT_WINDOW_RECTS.chat),
      restoreRect: undefined,
      zIndex: 1,
      viewState: DEFAULT_VIEW_STATE.chat,
    },
    skills: {
      appId: "skills",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      rect: cloneRect(DEFAULT_WINDOW_RECTS.skills),
      restoreRect: undefined,
      zIndex: 1,
      viewState: DEFAULT_VIEW_STATE.skills,
    },
    pipelines: {
      appId: "pipelines",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      rect: cloneRect(DEFAULT_WINDOW_RECTS.pipelines),
      restoreRect: undefined,
      zIndex: 1,
      viewState: DEFAULT_VIEW_STATE.pipelines,
    },
    builder: {
      appId: "builder",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      rect: cloneRect(DEFAULT_WINDOW_RECTS.builder),
      restoreRect: undefined,
      zIndex: 1,
      viewState: DEFAULT_VIEW_STATE.builder,
    },
    history: {
      appId: "history",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      rect: cloneRect(DEFAULT_WINDOW_RECTS.history),
      restoreRect: undefined,
      zIndex: 1,
      viewState: DEFAULT_VIEW_STATE.history,
    },
  };

  return {
    windows,
    iconPositions: {
      dashboard: cloneIconPosition(DEFAULT_ICON_POSITIONS.dashboard),
      chat: cloneIconPosition(DEFAULT_ICON_POSITIONS.chat),
      skills: cloneIconPosition(DEFAULT_ICON_POSITIONS.skills),
      pipelines: cloneIconPosition(DEFAULT_ICON_POSITIONS.pipelines),
      builder: cloneIconPosition(DEFAULT_ICON_POSITIONS.builder),
      history: cloneIconPosition(DEFAULT_ICON_POSITIONS.history),
    },
    activeAppId: "dashboard",
    selectedIconId: null,
    zCounter: 2,
  };
}

export function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case "OPEN_APP": {
      return openWindow(state, action.appId, action.viewState);
    }
    case "FOCUS_APP": {
      if (!state.windows[action.appId].isOpen) {
        return openWindow(state, action.appId);
      }

      if (state.windows[action.appId].isMinimized) {
        return openWindow(state, action.appId, state.windows[action.appId].viewState);
      }

      return focusWindow(state, action.appId);
    }
    case "MINIMIZE_APP": {
      const target = state.windows[action.appId];
      if (!target.isOpen) return state;

      const nextActive = state.activeAppId === action.appId ? null : state.activeAppId;
      return {
        ...state,
        activeAppId: nextActive,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...target,
            isMinimized: true,
          },
        },
      };
    }
    case "CLOSE_APP": {
      const target = state.windows[action.appId];
      if (!target.isOpen) return state;

      return {
        ...state,
        activeAppId: state.activeAppId === action.appId ? null : state.activeAppId,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...target,
            isOpen: false,
            isMinimized: false,
            isMaximized: false,
            rect: cloneRect(DEFAULT_WINDOW_RECTS[action.appId]),
            restoreRect: undefined,
            viewState: DEFAULT_VIEW_STATE[action.appId],
          },
        },
      };
    }
    case "TOGGLE_MAXIMIZE_APP": {
      const target = state.windows[action.appId];
      if (!target.isOpen) return state;

      const maximized = !target.isMaximized;
      const nextRect = maximized
        ? maximizeRect(action.viewport)
        : target.restoreRect ?? cloneRect(DEFAULT_WINDOW_RECTS[action.appId]);

      return {
        ...state,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...target,
            isMaximized: maximized,
            restoreRect: maximized ? cloneRect(target.rect) : undefined,
            rect: cloneRect(nextRect),
          },
        },
      };
    }
    case "MOVE_RESIZE_APP": {
      const target = state.windows[action.appId];
      if (!target.isOpen || target.isMaximized) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...target,
            rect: cloneRect(action.rect),
          },
        },
      };
    }
    case "OPEN_DEEP_LINK": {
      return openWindow(state, action.appId, action.viewState);
    }
    case "MOVE_ICON": {
      const current = state.iconPositions[action.appId];
      if (current.x === action.position.x && current.y === action.position.y) {
        return state;
      }
      return {
        ...state,
        iconPositions: {
          ...state.iconPositions,
          [action.appId]: cloneIconPosition(action.position),
        },
      };
    }
    case "SELECT_ICON": {
      return {
        ...state,
        selectedIconId: action.appId,
      };
    }
    case "CLEAR_ICON_SELECTION": {
      if (!state.selectedIconId) return state;
      return {
        ...state,
        selectedIconId: null,
      };
    }
    default: {
      return state;
    }
  }
}

export function windowTitle(appId: DesktopAppId): string {
  return APP_LABELS[appId];
}
