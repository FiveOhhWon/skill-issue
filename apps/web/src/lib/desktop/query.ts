import { DEFAULT_VIEW_STATE } from "@/lib/desktop/constants";
import type {
  DesktopAppId,
  DesktopDeepLink,
  DesktopState,
  DesktopViewState,
} from "@/lib/desktop/types";

const VALID_APPS: DesktopAppId[] = [
  "dashboard",
  "chat",
  "skills",
  "pipelines",
  "builder",
  "history",
];

function asApp(value: string | null): DesktopAppId | null {
  if (!value) return null;
  if (!VALID_APPS.includes(value as DesktopAppId)) return null;
  return value as DesktopAppId;
}

export function parseDesktopDeepLinkFromSearchParams(
  params: URLSearchParams
): DesktopDeepLink | null {
  const appId = asApp(params.get("app"));
  if (!appId) return null;

  const view = params.get("view") ?? undefined;
  const skill = params.get("skill") ?? undefined;
  const pipeline = params.get("pipeline") ?? undefined;
  const type = params.get("type") ?? undefined;
  const status = params.get("status") ?? undefined;
  const name = params.get("name") ?? undefined;

  if (appId === "skills") {
    const viewState = {
      ...DEFAULT_VIEW_STATE.skills,
      view: (view as "list" | "detail" | "edit" | undefined) ?? "list",
      skill,
    };
    return { appId, viewState };
  }

  if (appId === "pipelines") {
    const viewState = {
      ...DEFAULT_VIEW_STATE.pipelines,
      view: (view as "list" | "run" | undefined) ?? "list",
      pipeline,
    };
    return { appId, viewState };
  }

  if (appId === "history") {
    return {
      appId,
      viewState: {
        ...DEFAULT_VIEW_STATE.history,
        view: "list",
        type,
        status,
        name,
      },
    };
  }

  return {
    appId,
    viewState: { ...DEFAULT_VIEW_STATE[appId] },
  };
}

function encodeParam(params: URLSearchParams, key: string, value?: string) {
  if (value && value.trim()) {
    params.set(key, value);
  }
}

export function buildDashboardQueryFromState(state: DesktopState): string {
  const active = state.activeAppId;
  if (!active) return "";

  const windowState = state.windows[active];
  if (!windowState.isOpen) return "";

  const params = new URLSearchParams();
  params.set("app", active);

  const viewState = windowState.viewState as Record<string, unknown>;
  const view = typeof viewState.view === "string" ? viewState.view : undefined;
  if (view) params.set("view", view);

  if (active === "skills") {
    encodeParam(params, "skill", viewState.skill as string | undefined);
  }

  if (active === "pipelines") {
    encodeParam(params, "pipeline", viewState.pipeline as string | undefined);
  }

  if (active === "history") {
    encodeParam(params, "type", viewState.type as string | undefined);
    encodeParam(params, "status", viewState.status as string | undefined);
    encodeParam(params, "name", viewState.name as string | undefined);
  }

  return params.toString();
}

function encodePathParam(value: string): string {
  return encodeURIComponent(value);
}

export function mapPathnameToDesktopDashboard(
  pathname: string,
  searchParams: URLSearchParams
): string | null {
  if (pathname === "/dashboard") return null;

  if (pathname === "/skills") {
    return "/dashboard?app=skills&view=list";
  }

  const skillDetail = pathname.match(/^\/skills\/([^/]+)$/);
  if (skillDetail) {
    return `/dashboard?app=skills&view=detail&skill=${encodePathParam(skillDetail[1])}`;
  }

  const skillEdit = pathname.match(/^\/skills\/([^/]+)\/edit$/);
  if (skillEdit) {
    return `/dashboard?app=skills&view=edit&skill=${encodePathParam(skillEdit[1])}`;
  }

  if (pathname === "/pipelines") {
    return "/dashboard?app=pipelines&view=list";
  }

  const pipelineRun = pathname.match(/^\/pipelines\/([^/]+)\/run$/);
  if (pipelineRun) {
    return `/dashboard?app=pipelines&view=run&pipeline=${encodePathParam(pipelineRun[1])}`;
  }

  if (pathname === "/builder") {
    return "/dashboard?app=builder";
  }

  if (pathname === "/history") {
    const params = new URLSearchParams();
    params.set("app", "history");
    params.set("view", "list");
    for (const key of ["type", "status", "name"]) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    return `/dashboard?${params.toString()}`;
  }

  return null;
}

export function createDesktopOpenEvent(
  appId: DesktopAppId,
  viewState?: DesktopViewState
): CustomEvent<DesktopDeepLink> {
  return new CustomEvent<DesktopDeepLink>("desktop-open-app", {
    detail: {
      appId,
      viewState,
    },
  });
}
