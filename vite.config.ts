import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'อ่านเพลิน · ห้องอ่านนิยาย',
        short_name: 'อ่านเพลิน',
        description: 'ห้องอ่านนิยายส่วนตัว',
        lang: 'th',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: './icons/icon-maskable-512.png', sizes: '512x512',
            type: 'image/png', purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,ttf,svg,png}'],
      },
    }),
  ],
});
