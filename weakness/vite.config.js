import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
    poolOptions: {
      forks: {
        execArgv: ['--expose-gc'],
      },
    },
  },
})