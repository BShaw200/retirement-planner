import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// `--mode single` bundles the whole app into one HTML file for easy sharing.
export default defineConfig(({ mode }) => ({
  plugins: mode === "single" ? [react(), viteSingleFile()] : [react()],
  base: "./",
  build: { outDir: mode === "single" ? "dist-single" : "dist", chunkSizeWarningLimit: 800 },
}));
