import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "De Vie Socials",
  description: "Instagram plan, pipeline and posting rhythm for @devie.bar.",
  manifest: "/manifest.webmanifest",
  applicationName: "De Vie Socials",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "DV Socials" },
  icons: { icon: [{ url: "/icon-512.png", type: "image/png" }], apple: [{ url: "/apple-icon.png" }] },
};

export const viewport: Viewport = {
  themeColor: "#025B4C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
