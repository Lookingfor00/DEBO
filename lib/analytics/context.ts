export type DeviceContext = {
  device_type: "mobile" | "tablet" | "desktop" | "unknown";
  os: string | null;
  browser: string | null;
  connection_type: string | null;
  language: string | null;
  viewport_w: number | null;
  viewport_h: number | null;
  page_type: string;
};

function detectDeviceType(): DeviceContext["device_type"] {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function detectOs(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Mac OS X/i.test(ua)) return "macos";
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(ua)) return "linux";
  return null;
}

function detectBrowser(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "edge";
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "safari";
  if (/Firefox\//i.test(ua)) return "firefox";
  return null;
}

function pageTypeFromPath(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/jobs/") && pathname !== "/jobs") return "job_detail";
  if (pathname.startsWith("/jobs")) return "job_list";
  if (pathname.startsWith("/pay")) return "pay";
  if (pathname.startsWith("/alerts")) return "alerts";
  if (pathname.startsWith("/remboursement")) return "refund";
  return "other";
}

export function getDeviceContext(pathname: string): DeviceContext {
  if (typeof window === "undefined") {
    return {
      device_type: "unknown",
      os: null,
      browser: null,
      connection_type: null,
      language: null,
      viewport_w: null,
      viewport_h: null,
      page_type: pageTypeFromPath(pathname),
    };
  }

  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };

  return {
    device_type: detectDeviceType(),
    os: detectOs(),
    browser: detectBrowser(),
    connection_type: nav.connection?.effectiveType ?? null,
    language: navigator.language?.slice(0, 16) ?? null,
    viewport_w: window.innerWidth || null,
    viewport_h: window.innerHeight || null,
    page_type: pageTypeFromPath(pathname),
  };
}
