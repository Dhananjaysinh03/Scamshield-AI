import type { Metadata } from "next";
import { Fraunces, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./gmail.css";
import "./landing-pitch.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scamshield-ai-k6i1.onrender.com"),
  title: {
    default: "ScamShield — Stop before you click",
    template: "%s · ScamShield",
  },
  description:
    "Email phishing prevention for everyday people. Multi-factor check → HARD STOP before OTP, pay, files, or screen share. ScamShield in Mail demo included.",
  applicationName: "ScamShield",
  keywords: [
    "phishing",
    "email security",
    "OTP scam",
    "ScamShield",
    "hackathon",
  ],
  authors: [{ name: "Neural Nexus" }],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://scamshield-ai-k6i1.onrender.com",
    siteName: "ScamShield",
    title: "ScamShield — Stop before you click",
    description:
      "Paste or open mail → multi-factor check → HARD STOP before OTP, pay, files, or screen share.",
  },
  twitter: {
    card: "summary",
    title: "ScamShield — Stop before you click",
    description:
      "Email phishing prevention for everyday people. HARD STOP before irreversible actions.",
  },
};

const themeBootScript = `
(function(){
  try {
    var t = localStorage.getItem('scamshield-theme');
    var dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${outfit.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
