import { describe, expect, it } from "vitest";
import { detectPlatform, PLATFORM_OPTIONS } from "./downloads";

describe("detectPlatform", () => {
  it("recognises Windows, macOS and Linux browsers", () => {
    expect(
      detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Win32"),
    ).toBe("windows");
    expect(
      detectPlatform(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15",
        "MacIntel",
      ),
    ).toBe("macos");
    expect(
      detectPlatform("Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:126.0)", "Linux x86_64"),
    ).toBe("linux");
  });

  it("defaults to Windows for unknown or mobile browsers", () => {
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe("windows");
    expect(detectPlatform("")).toBe("windows");
  });

  it("offers one option per platform, each mapped to a backend asset", () => {
    expect(PLATFORM_OPTIONS.map((o) => o.asset)).toEqual(["windows", "macos", "linux"]);
  });
});
