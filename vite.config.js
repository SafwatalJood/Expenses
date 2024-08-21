import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Expenses/',
  root: 'src',  // Specify the root directory
  build: {
    outDir: '../dist',  // Output to the root dist folder
    emptyOutDir: true,
  }
})
