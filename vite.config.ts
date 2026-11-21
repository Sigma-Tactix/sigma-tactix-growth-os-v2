import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import supabaseConfig from './supabase-config.json';
import { assertPreviewSupabaseIsolation } from './src/lib/supabaseConfiguration';

export default defineConfig(({mode, command}) => {
  if (command === 'build') assertPreviewSupabaseIsolation({ ...loadEnv(mode, process.cwd(), ''), ...process.env }, supabaseConfig);
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    // @ts-ignore
    test: {
      // Bound simultaneous cold imports on Windows; dashboard SSR tests share
      // expensive chart dependencies and previously timed out under the full pool.
      maxWorkers: 4,
      exclude: [
        '**/node_modules/**',
        '**/node_modules.bak*/**',
        '**/.kilo/**',
        '**/dist/**',
        '**/worktrees/**',
        '**/.harness-worktrees/**',
        '**/hive/**',
        '**/.agent/**',
        '**/.agents/**',
        '**/tools/**',
      ],
    },
  };
});
