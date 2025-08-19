import type { Metadata } from "next";
import "./globals.css";
import { RouteOverlayProvider } from "./providers/route-overlay";

export const metadata: Metadata = {
  title: "mrs3_frontend",
  description: "mrs3_frontend",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <RouteOverlayProvider>
          {children}
        </RouteOverlayProvider>
      </body>
    </html>
  );
}
