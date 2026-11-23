import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = `http://127.0.0.1:${env.PORT || '5000'}`;

  return {
    plugins: [
      {
        name: 'treat-js-files-as-jsx',
        async transform(code, id) {
          if (!id.match(/src\/.*\.js$/)) return null;
          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          });
        },
      },
      react(),
    ],
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
