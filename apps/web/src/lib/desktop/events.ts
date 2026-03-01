export const DESKTOP_OPEN_APP_EVENT = "desktop-open-app";

export interface DesktopOpenAppEventDetail {
  appId: "dashboard" | "chat" | "skills" | "pipelines" | "builder" | "history";
  viewState?: Record<string, unknown>;
}
