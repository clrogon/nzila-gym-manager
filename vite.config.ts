import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // Ensure base path is root for proper routing
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    
    // Gzip compression
    mode === "production" && viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240, // Only compress files larger than 10KB
      deleteOriginFile: false
    }),
    
    // Brotli compression (better than gzip)
    mode === "production" && viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
      deleteOriginFile: false
    })
  ].filter(Boolean),
  
  build: {
    // Target modern browsers
    target: 'es2020',
    
    // Code splitting strategy
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI library chunks
          'ui-core': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'ui-inputs': ['@radix-ui/react-checkbox', '@radix-ui/react-radio-group', '@radix-ui/react-switch'],
          'ui-navigation': ['@radix-ui/react-tabs', '@radix-ui/react-navigation-menu'],
          
          // Utility libraries
          'charts': ['recharts'],
          'utils': ['date-fns', 'date-fns-tz', 'zod', 'clsx', 'tailwind-merge'],
          
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          
          // Query library
          'query': ['@tanstack/react-query'],
        },
        
        // Minify chunk names for production
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  
  // Path aliases
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      'date-fns',
      'zod',
    ],
  },
}));
