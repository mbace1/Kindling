import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/Suds-Jack/kindling/",
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        maskPath: "/Suds-Jack/kindling/",
        prerender: {
          outputPath: "/index.html",
          crawlLinks: false,
        },
      },
    }),
    viteReact(),
  ],
});
