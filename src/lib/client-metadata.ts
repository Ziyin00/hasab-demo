export interface ClientMetadata {
  screen_width?: number;
  screen_height?: number;
  viewport_width?: number;
  viewport_height?: number;
  timezone?: string;
  browser_language?: string;
  platform?: string;
  device_type?: "desktop" | "mobile" | "tablet" | string;
  user_language?: string;
}

/** Builds the client_metadata payload for chat requests, per the visitor tracking guide. */
export function buildClientMetadata(selectedLanguage?: string): ClientMetadata {
  const ua = navigator.userAgent || "";
  let deviceType: ClientMetadata["device_type"] = "desktop";
  if (/Tablet|iPad/i.test(ua)) deviceType = "tablet";
  else if (/Mobi|Android/i.test(ua)) deviceType = "mobile";

  return {
    screen_width: window.screen?.width,
    screen_height: window.screen?.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    browser_language: navigator.language || "",
    platform: navigator.platform || "",
    device_type: deviceType,
    user_language: selectedLanguage || "",
  };
}
