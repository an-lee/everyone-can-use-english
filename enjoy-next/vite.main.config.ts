import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      fileName: () => "[name].js",
      formats: ["es"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@main": resolve(__dirname, "./src/main"),
      "@renderer": resolve(__dirname, "./src/renderer"),
      "@shared": resolve(__dirname, "./src/shared"),
    },
  },
});
