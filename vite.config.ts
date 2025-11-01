import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-and-fix-files',
      closeBundle() {
        // Copy content.css to dist/content/
        mkdirSync('dist/content', { recursive: true });
        copyFileSync('src/content/content.css', 'dist/content/content.css');
        
        // Fix HTML files to use relative paths (remove leading /)
        const htmlFiles = ['popup.html', 'dashboard.html', 'options.html'];
        htmlFiles.forEach(file => {
          const filePath = `dist/${file}`;
          let content = readFileSync(filePath, 'utf-8');
          // Replace absolute paths with relative paths
          content = content.replace(/src="\/assets\//g, 'src="./assets/');
          content = content.replace(/href="\/assets\//g, 'href="./assets/');
          writeFileSync(filePath, content);
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        options: resolve(__dirname, 'options.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep background and content scripts in their respective folders
          if (chunkInfo.name === 'background') {
            return 'background/background.js';
          }
          if (chunkInfo.name === 'content') {
            return 'content/content.js';
          }
          // Place popup, dashboard, options scripts in assets folder
          return 'assets/[name].[hash].js';
        },
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep content.css in content folder
          if (assetInfo.name === 'content.css') {
            return 'content/content.css';
          }
          // Place all other assets (including CSS) in assets folder
          return 'assets/[name].[hash].[ext]';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
