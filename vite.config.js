import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from "@tailwindcss/vite"
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
	base: process.env.NODE_ENV === 'production' ? '/Markkk/' : '/',
	plugins: [
		tailwindcss(),
		vue(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.svg'],
			manifest: {
				name: 'Markkk',
				short_name: 'Markkk',
				description: 'Éditeur de Markdown + Convertisseur en PDF',
				theme_color: '#2A303C',
				background_color: '#2A303C',
				display: 'standalone',
				icons: [
					{
						src: 'pwa-192x192.svg',
						sizes: '192x192',
						type: 'image/svg+xml'
					},
					{
						src: 'pwa-512x512.svg',
						sizes: '512x512',
						type: 'image/svg+xml'
					},
					{
						src: 'pwa-512x512.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					}
				],
			},
		})
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		},
	}
})
