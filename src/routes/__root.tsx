import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Kindling";
const host = import.meta.env.VITE_PUBLIC_HOSTNAME;
const ogImage = host ? `https://${host}/og.jpg` : undefined;
const xBanner = host ? `https://${host}/x-banner.jpg` : undefined;
const hubStatic = import.meta.env.VITE_HUB_STATIC === "true";
const base = import.meta.env.BASE_URL ?? "/";
const atBase = (path: string) => `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: "Tend a bonfire. Keep a small monster. Two missed days and they become kindling." },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "theme-color", content: "#0c1016" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "x:game" },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: "A dark-fantasy keeper for the small things you already do." },
      ...(ogImage
        ? [
            { property: "og:image", content: ogImage },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]
        : []),
      ...(xBanner
        ? [
            { property: "x:game:image", content: xBanner },
            { property: "x:game:image:width", content: "1200" },
            { property: "x:game:image:height", content: "264" },
          ]
        : []),
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: atBase("favicon.svg") },
      { rel: "stylesheet", href: appCss },
      ...(!hubStatic
        ? [
            { rel: "manifest", href: "/__grok/manifest.webmanifest" },
            { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
          ]
        : []),
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,650;9..144,700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-night text-bone antialiased">
        {!hubStatic ? <PreviewHostBridge /> : null}
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
