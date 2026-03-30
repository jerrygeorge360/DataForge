import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  envPrefix: ['VITE_', 'MARKETPLACE_', 'FILECOIN_', 'CHAIN_'],
  plugins: [
    react(),
    nodePolyfills(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/fil-price': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        rewrite: (path) => '/api/v3/simple/price?ids=filecoin&vs_currencies=usd',
      },
    },
  },
})
