import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import songSearchHandler from './api/song-search'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-song-search-api',
      configureServer(server) {
        server.middlewares.use('/api/song-search', (request, response, next) => {
          if (request.url === undefined) return next()
          void songSearchHandler(request, response)
        })
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
})
