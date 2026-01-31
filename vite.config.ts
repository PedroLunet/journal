import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.png', 'journalIcon.png'],
			manifest: {
				name: 'My Journal',
				short_name: 'Journal',
				description: 'A private, offline-first multimedia journal.',
				theme_color: '#18181b',
				background_color: '#18181b',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'journalIcon.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'journalIcon.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'journalIcon.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			},
			workbox: {
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: true
			}
		})
	]
});
