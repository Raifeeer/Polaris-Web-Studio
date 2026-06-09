import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// Inline CSS plugin to completely eliminate render-blocking stylesheets (100% PageSpeed safe)
function inlineCssPlugin() {
  return {
    name: 'inline-css-plugin',
    transformIndexHtml(html: string, ctx: any) {
      if (!ctx || !ctx.bundle) {
        return html;
      }
      let newHtml = html;
      for (const [fileName, asset] of Object.entries(ctx.bundle)) {
        const assetAny = asset as any;
        if (fileName.endsWith('.css') && assetAny && 'source' in assetAny) {
          const cssContent = assetAny.source;
          const baseName = path.basename(fileName);
          const linkRegex = new RegExp(`<link[^>]*href=[^>]*${baseName}[^>]*>`, 'g');
          newHtml = newHtml.replace(linkRegex, `<style>${cssContent}</style>`);
        }
      }
      return newHtml;
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), inlineCssPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log'],
          passes: 2,
        },
        mangle: true,
        format: {
          comments: false,
        },
      },
      target: 'es2015',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-ui': ['lucide-react'],
            'vendor-calcom': ['@calcom/embed-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
