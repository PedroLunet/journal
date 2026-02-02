<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let { progress = 0, totalDays = 0, daysPassed = 0, size = 80, strokeWidth = 5 } = $props();

	const ARC_DEGREES = 280;

	let radius = $derived((size - strokeWidth) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	let visibleLength = $derived((ARC_DEGREES / 360) * circumference);

	const animatedProgress = new Tween(0, {
		duration: 1500,
		easing: cubicOut
	});

	const animatedDays = new Tween(0, {
		duration: 1500,
		easing: cubicOut
	});

	$effect(() => {
		animatedProgress.target = progress;
		animatedDays.target = daysPassed;
	});

	let progressOffset = $derived(visibleLength - (animatedProgress.current / 100) * visibleLength);

	const rotation = 130;
</script>

<div
	class="relative hidden items-center justify-center select-none md:flex"
	style="width: {size}px; height: {size}px;"
>
	<svg
		width={size}
		height={size}
		viewBox="0 0 {size} {size}"
		class="overflow-visible"
		style="transform: rotate({rotation}deg);"
	>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			stroke="currentColor"
			stroke-width={strokeWidth}
			fill="transparent"
			stroke-dasharray="{visibleLength} {circumference}"
			stroke-linecap="round"
			class="text-zinc-800"
		/>

		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			stroke="currentColor"
			stroke-width={strokeWidth}
			fill="transparent"
			stroke-dasharray="{visibleLength} {circumference}"
			stroke-dashoffset={progressOffset}
			stroke-linecap="round"
			class="text-salmon ease-out"
		/>
	</svg>

	<div class="absolute inset-0 flex flex-col items-center justify-center">
		<span class="text-xl leading-none font-bold tracking-tighter text-rose">
			{Math.round(animatedDays.current)}
		</span>

		<div class="my-0.5 h-px w-6 bg-zinc-700/50"></div>

		<span class="text-xs leading-none font-bold tracking-wide text-zinc-600">
			{totalDays}
		</span>
	</div>
</div>
