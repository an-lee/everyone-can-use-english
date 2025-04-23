import { defineConfig } from "vite";
import { resolve } from "path";
import { readdirSync } from "fs";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "fs-extra";
import pkg from "./package.json";

const copyTargets: { src: string; dest: string }[] = [];

// Get built-in plugin directories
const getBuiltInPlugins = () => {
  const pluginsDir = resolve(__dirname, "./src/plugins");
  try {
    return readdirSync(pluginsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  } catch (error) {
    console.error("Error reading plugins directory:", error);
    return [];
  }
};

// Create entry points for each built-in plugin
const createPluginEntries = () => {
  const plugins = getBuiltInPlugins();
  const entries = {};

  plugins.forEach((plugin) => {
    // Main plugin entry point
    entries[`plugins/${plugin}/index`] = resolve(
      __dirname,
      `./src/plugins/${plugin}/index.ts`
    );

    const depsPath = resolve(
      __dirname,
      `./src/plugins/${plugin}/plugin-deps.ts`
    );
    if (fs.existsSync(depsPath)) {
      entries[`plugins/${plugin}/plugin-deps`] = depsPath;
    }

    // Copy manifest.json to plugins directory
    copyTargets.push({
      src: `src/plugins/${plugin}/manifest.json`,
      dest: `plugins/${plugin}`,
    });
  });
  return entries;
};

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: copyTargets,
    }),
  ],
  build: {
    lib: {
      entry: {
        main: "src/main.ts",
        ...createPluginEntries(),
      },
      fileName: (_format, entryName) => `${entryName}.js`,
      formats: ["es"],
    },
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: [...Object.keys(pkg.dependencies)],
      output: {
        // Ensure imports of the plugin-types are directed to the built version
        paths: {
          "@main/plugin/plugin-types": "./plugin-types.js",
        },
      },
    },
    // Ensure output preserves directory structure for plugins
    outDir: ".vite/build",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@main": resolve(__dirname, "./src/main"),
      "@renderer": resolve(__dirname, "./src/renderer"),
      "@shared": resolve(__dirname, "./src/shared"),
      "@generated": resolve(__dirname, "./src/generated"),
    },
  },
  // Define __dirname for ES modules
  define: {
    "process.env": {},
    __dirname: JSON.stringify(__dirname),
  },
});
