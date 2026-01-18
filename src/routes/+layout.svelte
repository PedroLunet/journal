<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="box-border h-screen w-screen overflow-hidden bg-iridium p-8 text-rose">
	<div class="h-full w-full">
		{@render children()}
	</div>
</div>
