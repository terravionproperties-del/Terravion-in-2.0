/**
 * app/[locale]/(fullscreen)/layout.tsx
 * Route group layout for full-screen apps (GIS, Admin) that must NOT
 * render the site Header, CinematicEnding, StickyCta, or MobileDock.
 * 
 * Next.js App Router: a layout inside a route group (parentheses folder)
 * takes precedence over the parent layout for all routes inside it.
 * So /gis and /admin bypass the [locale]/layout.tsx header/footer entirely.
 */

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
