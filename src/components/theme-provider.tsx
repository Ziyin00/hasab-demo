"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useServerInsertedHTML } from "next/navigation";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  attribute?: "class";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme | ((prev: Theme) => Theme)) => void;
  resolvedTheme?: "dark" | "light";
  themes: string[];
  systemTheme?: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function disableTransitionsTemporarily() {
  const css = document.createElement("style");
  css.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
    )
  );
  document.head.appendChild(css);
  return () => {
    window.getComputedStyle(document.body);
    setTimeout(() => {
      document.head.removeChild(css);
    }, 1);
  };
}

function applyThemeClass(
  theme: Theme,
  opts: { disableTransitionOnChange: boolean; enableSystem: boolean }
) {
  const root = document.documentElement;
  const resolved =
    theme === "system" && opts.enableSystem ? getSystemTheme() : theme === "system" ? "light" : theme;
  const restore = opts.disableTransitionOnChange ? disableTransitionsTemporarily() : null;

  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  restore?.();
}

/**
 * Drop-in replacement for next-themes ThemeProvider.
 * Injects the FOUC-prevention script via `useServerInsertedHTML` so React 19
 * does not warn about `<script>` tags rendered inside Client Components.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  useServerInsertedHTML(() => {
    const script = `(function(k,d,e){try{var r=document.documentElement,t=localStorage.getItem(k)||d,s=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",v=t==="system"&&e?s:t==="system"?"light":t;r.classList.remove("light","dark");r.classList.add(v);r.style.colorScheme=v}catch(n){}})(${JSON.stringify(
      storageKey
    )},${JSON.stringify(defaultTheme)},${enableSystem ? "true" : "false"})`;

    return (
      <script
        key="hasab-theme-init"
        dangerouslySetInnerHTML={{ __html: script }}
      />
    );
  });

  useEffect(() => {
    const stored = (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
    setThemeState(stored);
    setSystemTheme(getSystemTheme());
    setMounted(true);
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (!mounted) return;
    applyThemeClass(theme, { disableTransitionOnChange, enableSystem });
  }, [theme, mounted, disableTransitionOnChange, enableSystem]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = getSystemTheme();
      setSystemTheme(next);
      if (theme === "system") {
        applyThemeClass("system", { disableTransitionOnChange, enableSystem });
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme, disableTransitionOnChange, enableSystem]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      setThemeState((event.newValue as Theme | null) ?? defaultTheme);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, defaultTheme]);

  const setTheme = useCallback(
    (next: Theme | ((prev: Theme) => Theme)) => {
      setThemeState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(storageKey, value);
        } catch {
          // ignore quota / private mode
        }
        return value;
      });
    },
    [storageKey]
  );

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme: mounted ? resolvedTheme : undefined,
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
      systemTheme: enableSystem ? systemTheme : undefined,
    }),
    [theme, setTheme, resolvedTheme, mounted, enableSystem, systemTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "system" as Theme,
      setTheme: () => {},
      resolvedTheme: undefined,
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
    };
  }
  return context;
}
