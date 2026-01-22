<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<div class="box-border flex h-screen w-screen flex-col overflow-hidden bg-iridium">
	<div class="relative h-full w-full">
		{@render children()}
	</div>
</div>
