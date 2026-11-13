export type DesktopPlatform = "windows" | "macos" | "linux";

export const PLATFORM_OPTIONS: Array<{
  id: DesktopPlatform;
  /** Backend asset key for /api/downloads/latest/:platform */
  asset: string;
  label: string;
  hint: string;
  afterDownload: string;
}> = [
  {
    id: "windows",
    asset: "windows",
    label: "Windows",
    hint: "Windows 10 or 11 · .exe installer",
    afterDownload: "Open the .exe. If Windows warns you, click More info → Run anyway.",
  },
  {
    id: "macos",
    asset: "macos",
    label: "macOS",
    hint: "Apple Silicon and Intel · .dmg",
    afterDownload:
      "Open the .dmg and drag the app to Applications. If it's blocked, go to System Settings → Privacy & Security → Open Anyway.",
  },
  {
    id: "linux",
    asset: "linux",
    label: "Linux",
    hint: "AppImage · most distributions",
    afterDownload: "Make the AppImage executable (chmod +x) and run it.",
  },
];

/** Best guess of the visitor's desktop OS from the browser. Defaults to Windows. */
export function detectPlatform(userAgent: string, platform = ""): DesktopPlatform {
  const ua = `${userAgent} ${platform}`.toLowerCase();
  if (/mac|iphone|ipad|darwin/.test(ua)) return "macos";
  if (/linux|x11|ubuntu|fedora|cros/.test(ua) && !/android/.test(ua)) return "linux";
  return "windows";
}
