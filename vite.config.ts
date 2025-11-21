import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Define global constants replacement to support process.env.API_KEY style access
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
      'process.env.VITE_APP_PASSWORD': JSON.stringify(env.VITE_APP_PASSWORD),
    },
    build: {
      outDir: 'dist',
    },
    server: {
      port: 5173,
    },
  };
});