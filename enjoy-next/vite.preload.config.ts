import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@renderer": path.resolve(__dirname, "./src/renderer"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@generated": path.resolve(__dirname, "./src/generated"),
    },
  },
});
