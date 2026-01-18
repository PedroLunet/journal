<script lang="ts">
	import { onMount } from 'svelte';

	const currentYear = new Date().getFullYear();
	const today = new Date();

	function getDaysInYear(year: number) {
		const date = new Date(year, 0, 1);
		const days = [];
		while (date.getFullYear() === year) {
			days.push(new Date(date));
			date.setDate(date.getDate() + 1);
		}
		return days;
	}

	const allDays = getDaysInYear(currentYear);

	const formatDateId = (date: Date) => {
		return date.toISOString().split('T')[0];
	};

	const isToday = (date: Date) => {
		return date.toDateString() === today.toDateString();
	};

	// --- ANIMATION LOGIC ---

	let dotElements: HTMLElement[] = [];
	let dotPositions: { x: number; y: number }[] = [];

	function updatePositions() {
		dotElements = dotElements || [];
		dotPositions = dotElements.map((el) => {
			if (!el) return { x: 0, y: 0 };
			const rect = el.getBoundingClientRect();
			return {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2
			};
		});
	}

	onMount(() => {
		setTimeout(updatePositions, 100);
	});

	function handleMouseMove(e: MouseEvent) {
		const mouseX = e.clientX;
		const mouseY = e.clientY;

		const radius = 200;
		const peakDistance = 50;
		const strength = 15;

		dotElements.forEach((el, i) => {
			if (!el) return;
			const pos = dotPositions[i];

			const dx = pos.x - mouseX;
			const dy = pos.y - mouseY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance >= radius) {
				if (el.style.transform) el.style.transform = '';
				return;
			}

			const angle = Math.atan2(dy, dx);
			let force = 0;

			if (distance < peakDistance) {
				force = distance / peakDistance;
			} else {
				force = (radius - distance) / (radius - peakDistance);
			}

			const moveX = Math.cos(angle) * (force * strength);
			const moveY = Math.sin(angle) * (force * strength);

			el.style.transform = `translate(${moveX}px, ${moveY}px)`;
		});
	}

	function resetGrid() {
		dotElements.forEach((el) => {
			if (el) el.style.transform = '';
		});
	}
</script>

<svelte:window on:resize={updatePositions} />

<div
	class="h-full w-full"
	role="application"
	on:mousemove={handleMouseMove}
	on:mouseleave={resetGrid}
>
	<div
		class="
            grid h-auto w-full
            grid-cols-10 place-items-center gap-y-8 py-10
            sm:h-full sm:grid-cols-[repeat(19,1fr)] md:place-content-evenly md:gap-y-0 md:py-0
        "
	>
		{#each allDays as day, i}
			<button
				bind:this={dotElements[i]}
				class="group flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-400 ease-out will-change-transform"
				aria-label={day.toDateString()}
				title={day.toDateString()}
				on:click={() => console.log('Clicked:', formatDateId(day))}
			>
				<div
					class="h-1 w-1 rounded-full bg-rose transition-all
                    {isToday(day)
						? 'ring-1 ring-rose ring-offset-4 ring-offset-iridium duration-500 group-hover:scale-[2]'
						: 'duration-250 group-hover:scale-[3]'}"
				></div>
			</button>
		{/each}
	</div>
</div>
