import { URL, fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Client + SSR-entry bundling. The Express + Socket.IO server is NOT bundled by
// Vite — it runs via tsx (dev: middleware mode, prod: serves dist/client).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@client": fileURLToPath(new URL("./src/client", import.meta.url)),
    },
  },
  build: {
    emptyOutDir: true,
    target: "es2022",
  },
});
