import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const browser = process.env.BROWSER || 'chrome';

function extensionPlugin(): Plugin {
  return {
    name: 'extension-plugin',
    writeBundle() {
      const dist = resolve(__dirname, 'dist');

      // Copy the correct manifest for the target browser
      const manifestFile = `manifest.${browser}.json`;
      copyFileSync(resolve(__dirname, manifestFile), resolve(dist, 'manifest.json'));

      // Copy icons
      const iconsDir = resolve(dist, 'icons');
      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

      const srcIcons = resolve(__dirname, 'public/icons');
      if (existsSync(srcIcons)) {
        for (const size of ['16', '32', '48', '128']) {
          const file = `icon-${size}.png`;
          const src = resolve(srcIcons, file);
          if (existsSync(src)) {
            copyFileSync(src, resolve(iconsDir, file));
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), extensionPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content-script': resolve(__dirname, 'src/content/extractor.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
