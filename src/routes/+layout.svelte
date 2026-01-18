<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="h-screen w-screen bg-zinc-950 text-white p-8 box-border overflow-hidden">
	<div class="h-full w-full">
		{@render children()}
	</div>
</div>