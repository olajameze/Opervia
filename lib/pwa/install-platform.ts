export type InstallPlatform = "ios-safari" | "macos-safari" | "desktop-chromium" | "generic";

export function detectInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "generic";

  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|chromium/i.test(ua);

  if (isIos && isSafari) return "ios-safari";

  const isMac = /macintosh|mac os x/i.test(ua);
  if (isMac && isSafari) return "macos-safari";

  const isChromium = /chrome|chromium|edg/i.test(ua) && !/mobile|android/i.test(ua);
  if (isChromium) return "desktop-chromium";

  return "generic";
}

export function getInstallFallbackMessage(platform: InstallPlatform): string {
  switch (platform) {
    case "ios-safari":
      return 'Tap Share, then "Add to Home Screen"';
    case "macos-safari":
      return "Use File → Add to Dock, or Share → Add to Dock";
    case "desktop-chromium":
      return "Click the install icon in your browser's address bar";
    case "generic":
      return "Install Opervia from your browser menu for faster access";
  }
}
