<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r: any) {
					console.log('SW Registered: ' + r);
				},
				onRegisterError(error: any) {
					console.log('SW registration error', error);
				}
			});
		}
	});
</script>

<div class="box-border flex h-screen w-screen flex-col overflow-hidden bg-iridium">
	<div class="relative h-full w-full">
		{@render children()}
	</div>
</div>
