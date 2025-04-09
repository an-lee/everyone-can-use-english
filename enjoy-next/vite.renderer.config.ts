import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// eslint-disable-next-line import/no-unresolved
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
// eslint-disable-next-line import/no-unresolved
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/renderer/routes",
      generatedRouteTree: "./src/renderer/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@main": path.resolve(__dirname, "./src/main"),
      "@renderer": path.resolve(__dirname, "./src/renderer"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@generated": path.resolve(__dirname, "./src/generated"),
      "vendor/pdfjs": path.resolve(
        __dirname,
        "./node_modules/foliate-js/vendor/pdfjs"
      ),
    },
  },
});
