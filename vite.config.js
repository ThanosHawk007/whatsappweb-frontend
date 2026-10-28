import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis", // Polyfill global to globalThis
  },
  optimizeDeps: {
    include: [
      "sockjs-client", // Ensure sockjs-client is correctly bundled
    ],
  },
  resolve: {
    alias: {
      buffer: "buffer", // Ensure buffer is correctly aliased
    },
  },
});
