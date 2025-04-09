import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@main": path.resolve(__dirname, "./src/main"),
      "@renderer": path.resolve(__dirname, "./src/renderer"),
      "@generated": path.resolve(__dirname, "./src/generated"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
