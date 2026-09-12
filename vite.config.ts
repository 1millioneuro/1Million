import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  base: '/1Million/',
  define: {
    'process.env': {},
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
  },
})
