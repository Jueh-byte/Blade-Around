import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure assets load correctly on custom domains
  base: '/', 
  define: {
    // Prevent crashes in libraries that might check process.env
    'process.env': {}
  }
})