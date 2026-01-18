<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div
	class="box-border h-screen w-screen overflow-y-auto bg-iridium p-12 text-rose md:overflow-hidden"
>
	<div class="h-full w-full">
		{@render children()}
	</div>
</div>
