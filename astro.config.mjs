// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Enable Netlify adapter only in production to avoid POST request blocking bug in dev mode
// Netlify automatically sets NETLIFY=true during builds
const isProduction = process.env.NETLIFY === 'true';

export default defineConfig({
  output: 'server',
  adapter: isProduction ? netlify({
    edgeMiddleware: false, // Disable edge middleware to avoid potential issues
  }) : undefined,
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});