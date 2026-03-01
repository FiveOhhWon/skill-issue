import type {
  DesktopAppId,
  DesktopIconPositionsState,
  DesktopViewStateMap,
  DesktopWindowRect,
} from "@/lib/desktop/types";

export const DESKTOP_APP_ORDER: DesktopAppId[] = [
  "dashboard",
  "chat",
  "skills",
  "pipelines",
  "builder",
  "history",
];

export const DESKTOP_ICON_ORDER: DesktopAppId[] = [
  "dashboard",
  "chat",
  "skills",
  "pipelines",
  "builder",
  "history",
];

export const APP_LABELS: Record<DesktopAppId, string> = {
  dashboard: "Dashboard",
  chat: "Ops Chat",
  skills: "Skills",
  pipelines: "Pipelines",
  builder: "Builder",
  history: "History",
};

export const APP_ICON_PATHS: Record<DesktopAppId, string> = {
  dashboard: "/desktop/icons/analytics.png",
  chat: "/desktop/icons/content.png",
  skills: "/desktop/icons/research.png",
  pipelines: "/desktop/icons/automations.png",
  builder: "/desktop/icons/sponsors.png",
  history: "/desktop/icons/inbox.png",
};

export const DEFAULT_VIEW_STATE: DesktopViewStateMap = {
  dashboard: { view: "overview" },
  chat: { view: "main" },
  skills: { view: "list" },
  pipelines: { view: "list" },
  builder: { view: "main" },
  history: { view: "list" },
};

export const DEFAULT_WINDOW_RECTS: Record<DesktopAppId, DesktopWindowRect> = {
  dashboard: { x: 120, y: 72, width: 980, height: 640 },
  chat: { x: 1010, y: 92, width: 420, height: 620 },
  skills: { x: 160, y: 104, width: 920, height: 620 },
  pipelines: { x: 220, y: 124, width: 980, height: 620 },
  builder: { x: 280, y: 142, width: 920, height: 610 },
  history: { x: 340, y: 158, width: 900, height: 600 },
};

export const MIN_WINDOW_SIZES: Record<DesktopAppId, Pick<DesktopWindowRect, "width" | "height">> = {
  dashboard: { width: 720, height: 460 },
  chat: { width: 380, height: 440 },
  skills: { width: 700, height: 460 },
  pipelines: { width: 760, height: 460 },
  builder: { width: 700, height: 460 },
  history: { width: 680, height: 440 },
};

export const DESKTOP_ICON_DIMENSIONS = {
  width: 104,
  height: 96,
  padding: 8,
} as const;

export const DEFAULT_ICON_POSITIONS: DesktopIconPositionsState = {
  dashboard: { x: 20, y: 20 },
  chat: { x: 20, y: 116 },
  skills: { x: 20, y: 212 },
  pipelines: { x: 20, y: 308 },
  builder: { x: 20, y: 404 },
  history: { x: 20, y: 500 },
};

export const TOPBAR_HEIGHT = 54;
export const TASKBAR_HEIGHT = 44;
