<script lang="ts">
	let { progress = 0, totalDays = 0, daysPassed = 0, size = 120, strokeWidth = 6 } = $props();

	const ARC_DEGREES = 260;

	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	const visibleLength = (ARC_DEGREES / 360) * circumference;

	let progressOffset = $derived(visibleLength - (progress / 100) * visibleLength);

	const rotation = 140;
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
			style="filter: drop-shadow(0 0 6px rgba(235, 158, 143, 0.4));"
		/>
	</svg>

	<div class="absolute inset-0 flex flex-col items-center justify-center pt-3">
		<div class="flex items-baseline gap-0.5">
			<span class="text-2xl font-bold tracking-tighter text-rose">
				{daysPassed}
			</span>
			<span class="text-[10px] font-medium text-zinc-600">
				/ {totalDays}
			</span>
		</div>
		<span class="-mt-1 text-[9px] font-bold tracking-widest text-zinc-700 uppercase"> Days </span>
	</div>
</div>
