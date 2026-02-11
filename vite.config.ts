import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default (params: any) => {
  process.env = {...process.env, ...loadEnv(params.mode, process.cwd())}

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
    plugins: [vue(), tailwindcss()],
  })
}
