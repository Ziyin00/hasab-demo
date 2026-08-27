import {
  Space_Grotesk,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Noto_Sans_Ethiopic,
} from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-landing-display",
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-landing-body",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-landing-mono",
  weight: ["400", "500"],
});

const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-landing-ethiopic",
  weight: ["400", "500", "600"],
});

export function LandingFontProvider({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} ${ethiopic.variable}`}
    >
      {children}
    </div>
  );
}
