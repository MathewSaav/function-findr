"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sdk: any = null;

export async function getWhopSdk() {
  if (typeof window === "undefined") return null;
  if (sdk) return sdk;
  try {
    const { createSdk } = await import("@whop/iframe");
    sdk = createSdk({
      appId: process.env.NEXT_PUBLIC_WHOP_APP_ID || "",
      onMessage: {
        appPing: () => "app_pong" as const,
        onColorThemeChange: () => {},
        navigateBack: () => {
          window.history.back();
          return "ok" as const;
        },
        navigateForward: () => {
          window.history.forward();
          return "ok" as const;
        },
      },
    });
    return sdk;
  } catch {
    return null;
  }
}

export async function openUrl(url: string) {
  const s = await getWhopSdk();
  if (s) s.openExternalUrl({ url });
  else window.open(url, "_blank");
}

export async function getWhopContext() {
  const s = await getWhopSdk();
  if (!s) return null;
  try {
    return await s.getTopLevelUrlData();
  } catch {
    return null;
  }
}

export async function isInsideWhop(): Promise<boolean> {
  const ctx = await getWhopContext();
  return ctx !== null && typeof ctx.experienceId === "string";
}
