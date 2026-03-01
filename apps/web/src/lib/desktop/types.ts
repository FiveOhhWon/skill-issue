export type DesktopAppId =
  | "dashboard"
  | "chat"
  | "skills"
  | "pipelines"
  | "builder"
  | "history";

export type SkillsDesktopSubview = "list" | "detail" | "edit";
export type PipelinesDesktopSubview = "list" | "run";

export interface DashboardViewState {
  view?: "overview";
}

export interface ChatViewState {
  view?: "main";
}

export interface SkillsViewState {
  view?: SkillsDesktopSubview;
  skill?: string;
}

export interface PipelinesViewState {
  view?: PipelinesDesktopSubview;
  pipeline?: string;
}

export interface BuilderViewState {
  view?: "main";
}

export interface HistoryViewState {
  view?: "list";
  type?: string;
  status?: string;
  name?: string;
}

export interface DesktopViewStateMap {
  dashboard: DashboardViewState;
  chat: ChatViewState;
  skills: SkillsViewState;
  pipelines: PipelinesViewState;
  builder: BuilderViewState;
  history: HistoryViewState;
}

export type DesktopViewState = DesktopViewStateMap[DesktopAppId];

export interface DesktopWindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopIconPosition {
  x: number;
  y: number;
}

export interface DesktopWindowState<T extends DesktopAppId = DesktopAppId> {
  appId: T;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  rect: DesktopWindowRect;
  restoreRect?: DesktopWindowRect;
  zIndex: number;
  viewState: DesktopViewStateMap[T];
}

export type DesktopWindowsState = {
  [K in DesktopAppId]: DesktopWindowState<K>;
};

export type DesktopIconPositionsState = {
  [K in DesktopAppId]: DesktopIconPosition;
};

export interface DesktopState {
  windows: DesktopWindowsState;
  iconPositions: DesktopIconPositionsState;
  activeAppId: DesktopAppId | null;
  selectedIconId: DesktopAppId | null;
  zCounter: number;
}

export type DesktopAction =
  | { type: "OPEN_APP"; appId: DesktopAppId; viewState?: DesktopViewState }
  | { type: "FOCUS_APP"; appId: DesktopAppId }
  | { type: "MINIMIZE_APP"; appId: DesktopAppId }
  | { type: "CLOSE_APP"; appId: DesktopAppId }
  | { type: "TOGGLE_MAXIMIZE_APP"; appId: DesktopAppId; viewport: Pick<DesktopWindowRect, "width" | "height"> }
  | { type: "MOVE_RESIZE_APP"; appId: DesktopAppId; rect: DesktopWindowRect }
  | { type: "OPEN_DEEP_LINK"; appId: DesktopAppId; viewState?: DesktopViewState }
  | { type: "MOVE_ICON"; appId: DesktopAppId; position: DesktopIconPosition }
  | { type: "SELECT_ICON"; appId: DesktopAppId }
  | { type: "CLEAR_ICON_SELECTION" };

export interface DesktopDeepLink {
  appId: DesktopAppId;
  viewState?: DesktopViewState;
}
