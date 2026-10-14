import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({base:process.env.VITE_BASE_PATH || './',plugins:[react(),tailwind(),VitePWA({registerType:'prompt',includeAssets:['icon.svg','icon-192.png','icon-512.png'],manifest:{name:'Strength Lab',short_name:'Strength Lab',description:'Performance. Measured.',theme_color:'#101820',background_color:'#101820',display:'standalone',start_url:'./',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,svg,png}'],maximumFileSizeToCacheInBytes:4000000}})],test:{include:['tests/**/*.test.ts'],environment:'node'}});
