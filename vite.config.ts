import { defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    // Build timestamp — used e.g. for the "Last updated" line on /impressum.
    // Refreshed on every Vite build / dev start.
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "three", "@react-three/fiber", "@react-three/drei"],
  },
  build: {
    // Split the main bundle into cacheable vendor chunks so the initial
    // download is smaller and individual updates don't bust the whole cache.
    // Only includes libraries that are actually present in the bundle today;
    // unknown packages are left to Vite's default chunking.
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          // Heavy/optional libs only loaded by specific tools — keep them
          // out of the initial chunk so the landing page stays lean.
          if (id.includes('three') || id.includes('@react-three')) return 'three';
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'charts';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('date-fns')) return 'date-fns';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('@radix-ui')) return 'radix';
          if (
            id.includes('react-router') ||
            id.includes('@tanstack/react-query') ||
            id.includes('react-helmet-async')
          ) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },
}));
