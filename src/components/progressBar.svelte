<script lang="ts">
	let { progress = 0, totalDays = 0, daysPassed = 0, size = 80, strokeWidth = 5 } = $props();

	const ARC_DEGREES = 280;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const visibleLength = (ARC_DEGREES / 360) * circumference;

	let progressOffset = $derived(visibleLength - (progress / 100) * visibleLength);
	const rotation = 130;
</script>

<div
	class="relative flex items-center justify-center select-none"
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
			class="text-salmon transition-all duration-1000 ease-out"
		/>
	</svg>

	<div class="absolute inset-0 flex flex-col items-center justify-center">
		<span class="text-xl leading-none font-bold tracking-tighter text-rose">
			{daysPassed}
		</span>

		<div class="my-0.5 h-px w-6 bg-zinc-700/50"></div>
		<span class="text-xs leading-none font-bold tracking-wide text-zinc-600">
			{totalDays}
		</span>
	</div>
</div>
