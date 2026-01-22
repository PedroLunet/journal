<script lang="ts">
	import DayModal from '../components/dayModal.svelte';
	import { onMount } from 'svelte';

	let journalEntries = $state<Record<string, { text: string }>>({});
	let selectedDate = $state<Date | null>(null);
	let isModalOpen = $state(false);

	let dotElements = $state<HTMLElement[]>([]);
	let dotPositions: { x: number; y: number }[] = [];
	let containerRef = $state<HTMLElement | null>(null);

	const currentYear = new Date().getFullYear();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const isFuture = (date: Date) => date > today;
	const isToday = (date: Date) => date.toDateString() === today.toDateString();
	const isFirstOfMonth = (date: Date) => date.getDate() === 1 && date.getMonth() !== 0;
	const getMonthLetter = (date: Date) => date.toLocaleString('default', { month: 'narrow' });
	const formatDateId = (date: Date) => date.toISOString().split('T')[0];

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
	const daysPassed = allDays.filter((day) => !isFuture(day)).length;
	const yearProgress = (daysPassed / allDays.length) * 100;

	onMount(() => {
		const stored = localStorage.getItem('journal_entries');
		if (stored) {
			journalEntries = JSON.parse(stored);
		}

		setTimeout(() => {
			updatePositions();

			const todayIndex = allDays.findIndex((day) => isToday(day));
			if (todayIndex !== -1 && dotElements[todayIndex]) {
				dotElements[todayIndex].scrollIntoView({
					behavior: 'smooth',
					block: 'center',
					inline: 'center'
				});
			}
		}, 100);
	});

	function handleSave(text: string) {
		if (selectedDate) {
			const dateId = formatDateId(selectedDate);
			if (!text.trim()) {
				delete journalEntries[dateId];
			} else {
				journalEntries[dateId] = { text };
			}
			localStorage.setItem('journal_entries', JSON.stringify(journalEntries));
		}
	}

	const hasEntry = (date: Date) => {
		const dateId = formatDateId(date);
		return !!journalEntries[dateId];
	};

	function openModal(day: Date) {
		if (isFuture(day)) return;
		selectedDate = day;
		isModalOpen = true;
	}

	function handlePrevDay() {
		if (!selectedDate) return;
		const newDate = new Date(selectedDate);
		newDate.setDate(selectedDate.getDate() - 1);
		if (newDate.getFullYear() === currentYear) selectedDate = newDate;
	}

	function handleNextDay() {
		if (!selectedDate) return;
		const newDate = new Date(selectedDate);
		newDate.setDate(selectedDate.getDate() + 1);
		if (!isFuture(newDate) && newDate.getFullYear() === currentYear) selectedDate = newDate;
	}

	function canGoNext(date: Date | null) {
		if (!date) return false;
		const nextDay = new Date(date);
		nextDay.setDate(date.getDate() + 1);
		return !isFuture(nextDay) && nextDay.getFullYear() === currentYear;
	}

	function getDotClasses(day: Date) {
		const entry = hasEntry(day);
		const current = isToday(day);
		const first = isFirstOfMonth(day);
		const future = isFuture(day);

		let classes = 'h-1 w-1 rounded-full bg-rose transition-all group-hover:scale-[2] ';

		if (future && !entry) {
			classes += 'opacity-30 ';
		} else if (current) {
			if (entry) {
				classes += 'ring-1 ring-salmon ring-offset-4 ring-offset-iridium duration-350 ';
			} else {
				classes += 'ring-1 ring-rose ring-offset-4 ring-offset-iridium duration-350 ';
			}
		} else {
			classes += 'duration-250 ';
		}

		if (entry) {
			if (current) {
				classes += 'shadow-[0_0_15px_3px_var(--color-salmon)] ';
			} else {
				classes += 'shadow-[0_0_10px_2px_var(--color-salmon)] ';
			}
		} else if (first) {
			classes += 'shadow-[0_0_10px_2px_var(--color-rose)] ';
			if (!future) {
				classes += 'group-hover:shadow-[0_0_10px_0.5px_var(--color-rose)] ';
			}
		}
		return classes;
	}

	// --- ANIMATION LOGIC ---

	function updatePositions() {
		if (typeof window === 'undefined') return;
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

	function handleMouseMove(e: MouseEvent) {
		if (typeof window === 'undefined') return;
		if (window.innerWidth < 768) return;

		const mouseX = e.clientX;
		const mouseY = e.clientY;
		const radius = 200;
		const peakDistance = 50;
		const strength = 15;

		dotElements.forEach((el, i) => {
			if (!el) return;
			const pos = dotPositions[i];
			if (!pos) return;

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

<svelte:window onresize={updatePositions} />

<div
	class="flex h-full w-full flex-col"
	role="application"
	onmousemove={handleMouseMove}
	onmouseleave={resetGrid}
>
	<header class="flex shrink-0 items-end justify-between border-b border-rose/10 p-6 md:p-8">
		<div class="flex flex-col gap-1">
			<h1 class="font-mono text-4xl font-bold tracking-tighter text-salmon">
				{currentYear}
			</h1>
			<p class="text-xs font-medium tracking-widest text-zinc-500 uppercase">
				{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
			</p>
		</div>

		<div class="flex flex-col items-end gap-2">
			<div class="flex items-baseline gap-2">
				<span class="text-2xl font-bold text-rose">{daysPassed}</span>
				<span class="text-sm text-zinc-600">/ {allDays.length} Days</span>
			</div>

			<div class="relative h-1.5 w-32 overflow-hidden rounded-full bg-zinc-800 md:w-48">
				<div
					class="h-full bg-salmon shadow-[0_0_10px_1px_var(--color-salmon)] transition-all duration-1000 ease-out"
					style="width: {yearProgress}%"
				></div>
			</div>
		</div>
	</header>

	<main
		bind:this={containerRef}
		class="scrollbar-hide min-h-0 flex-1 overflow-y-auto"
		onscroll={updatePositions}
	>
		<div
			class="
                grid min-h-125 w-full
                grid-cols-10 place-items-center gap-y-8
                p-6 sm:h-full
                sm:grid-cols-[repeat(19,1fr)] md:place-content-evenly md:gap-y-0
            "
		>
			{#each allDays as day, i}
				<button
					bind:this={dotElements[i]}
					disabled={isFuture(day)}
					class="group relative flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 ease-out will-change-transform disabled:cursor-default"
					aria-label={day.toDateString()}
					title={day.toDateString()}
					onclick={() => openModal(day)}
				>
					{#if isFirstOfMonth(day)}
						<span
							class="pointer-events-none absolute top-0 left-0 font-mono text-[10px] leading-none text-zinc-600 select-none"
						>
							{getMonthLetter(day)}
						</span>
					{/if}

					<div class={getDotClasses(day)}></div>
				</button>
			{/each}
		</div>
	</main>

	<DayModal
		isOpen={isModalOpen}
		date={selectedDate}
		entryText={selectedDate ? journalEntries[formatDateId(selectedDate)]?.text : ''}
		canGoNext={canGoNext(selectedDate)}
		onClose={() => (isModalOpen = false)}
		onSave={(text) => handleSave(text)}
		onPrev={handlePrevDay}
		onNext={handleNextDay}
	/>
</div>
