<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div
	class="box-border flex h-screen w-screen flex-col overflow-hidden bg-iridium p-6 text-rose md:p-12"
>
	<div class="relative h-full w-full">
		{@render children()}
	</div>
</div>
