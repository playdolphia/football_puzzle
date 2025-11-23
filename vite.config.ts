import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue'
import vercel from 'vite-plugin-vercel';
 
export default (params: any) => {
  process.env = {...process.env, ...loadEnv(params.mode, process.cwd())};

  return defineConfig({
    server: {
      host: '0.0.0.0',
      port: process.env.PORT as unknown as number,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [vercel(), vue(), tailwindcss()],
  });
};