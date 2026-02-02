<script lang="ts">
	import DayModal from '../components/dayModal.svelte';
	import SettingsModal from '../components/settingsModal.svelte';
	import SearchModal from '../components/searchModal.svelte';
	import CircularProgress from '../components/progressBar.svelte';
	import { onMount } from 'svelte';
	import { db, type JournalEntry } from '../lib/db';

	let journalEntries = $state<Record<string, JournalEntry>>({});

	let selectedDate = $state<Date | null>(null);
	let isModalOpen = $state(false);
	let isSettingsOpen = $state(false);
	let isSearchOpen = $state(false);

	let dotElements = $state<HTMLElement[]>([]);
	let dotPositions: { x: number; y: number }[] = [];
	let containerRef = $state<HTMLElement | null>(null);

	const currentYear = new Date().getFullYear();

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
	let today = $state(new Date());

	$effect(() => {
		today.setHours(0, 0, 0, 0);
	});

	const isFuture = (date: Date) => date > today;
	const isToday = (date: Date) => date.toDateString() === today.toDateString();
	const isFirstOfMonth = (date: Date) => date.getDate() === 1 && date.getMonth() !== 0;
	const getMonthLetter = (date: Date) => date.toLocaleString('default', { month: 'narrow' });
	const formatDateId = (date: Date) => date.toISOString().split('T')[0];
	const getEntry = (date: Date) => journalEntries[formatDateId(date)];

	let daysPassed = $derived(allDays.filter((day) => !isFuture(day)).length);
	let yearProgress = $derived((daysPassed / allDays.length) * 100);

	onMount(() => {
		const initDB = async () => {
			await db.migrateFromLocalStorage();
			journalEntries = await db.getAllEntries();

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
			}, 150);
		};

		initDB();

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') refreshDate();
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
		const interval = setInterval(refreshDate, 60000);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			clearInterval(interval);
		};
	});

	function refreshDate() {
		const now = new Date();
		if (now.toDateString() !== today.toDateString()) {
			if (now.getFullYear() !== currentYear) {
				location.reload();
				return;
			}
			today = now;
			today.setHours(0, 0, 0, 0);
		}
	}

	function updatePositions() {
		if (typeof window === 'undefined') return;
		dotElements = dotElements || [];
		dotPositions = dotElements.map((el) => {
			if (!el) return { x: 0, y: 0 };
			const rect = el.getBoundingClientRect();
			return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		});
	}

	function handleMouseMove(e: MouseEvent) {
		if (typeof window === 'undefined') return;
		if (window.innerWidth < 768) return;
		if (dotPositions.length === 0) return;

		const mouseX = e.clientX;
		const mouseY = e.clientY;
		const radius = 200;
		const peakDistance = 50;
		const strength = 15;

		for (let i = 0; i < dotElements.length; i++) {
			const el = dotElements[i];
			if (!el) continue;
			const pos = dotPositions[i];
			if (!pos) continue;

			const dx = pos.x - mouseX;
			const dy = pos.y - mouseY;
			const distSq = dx * dx + dy * dy;

			if (distSq >= radius * radius) {
				if (el.style.transform) el.style.transform = '';
				continue;
			}

			const distance = Math.sqrt(distSq);
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
		}
	}

	function resetGrid() {
		dotElements.forEach((el) => {
			if (el) el.style.transform = '';
		});
	}

	function openModal(day: Date) {
		if (isFuture(day)) return;
		selectedDate = day;
		isModalOpen = true;
	}

	async function handleSave(text: string, mood: string, images: Blob[]) {
		if (selectedDate) {
			const dateId = formatDateId(selectedDate);

			const hasImages = images && images.length > 0;

			if (!text.trim() && !hasImages) {
				delete journalEntries[dateId];
				await db.deleteEntry(dateId);
			} else {
				const cleanImages = images ? [...images] : [];

				const newEntry: JournalEntry = {
					text,
					mood,
					images: cleanImages
				};

				journalEntries[dateId] = newEntry;
				await db.saveEntry(dateId, newEntry);
			}
		}
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

	function handleGlobalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			isSearchOpen = !isSearchOpen;
		}
	}

	// --- STYLING ---
	function getDotClasses(day: Date) {
		const entry = getEntry(day);
		const current = isToday(day);
		const future = isFuture(day);
		const first = isFirstOfMonth(day);
		const past = !future && !current;

		let classes = 'h-1 w-1 rounded-full transition-all group-hover:scale-[2] duration-250 ';

		if (future && !entry) classes += 'opacity-30 ';

		if (!entry) classes += 'bg-rose ';

		if (current) {
			if (!entry) {
				classes += 'ring-1 ring-offset-4 ring-offset-iridium ring-rose duration-350 ';
			} else {
				classes += 'duration-350 ';
			}
		}

		if (first && !entry) {
			if (!past) {
				classes += 'shadow-[0_0_10px_2px_var(--color-rose)] ';
			}

			if (!future) classes += 'group-hover:shadow-[0_0_10px_0.5px_var(--color-rose)] ';
		}

		return classes;
	}

	function getDotStyle(day: Date) {
		const entry = getEntry(day);
		const current = isToday(day);

		if (entry) {
			const moodColor = entry.mood || 'var(--color-salmon)';

			if (current) {
				return `
            background-color: var(--color-rose); 
            box-shadow: 
                0 0 0 4px var(--color-iridium), 
                0 0 0 5px ${moodColor}, 
                0 0 15px 3px ${moodColor};
        `;
			} else {
				return `
            background-color: ${moodColor}; 
            box-shadow: 0 0 10px 2px ${moodColor};
          `;
			}
		}

		return '';
	}
</script>

<svelte:window onresize={updatePositions} onkeydown={handleGlobalKeydown} />

<div
	class="flex h-full w-full flex-col"
	role="application"
	onmousemove={handleMouseMove}
	onmouseleave={resetGrid}
>
	<header class="flex shrink-0 items-center justify-between border-b border-rose/10 p-6 md:p-8">
		<div class="flex flex-col gap-1">
			<h1 class="font-mono text-4xl font-bold tracking-tighter text-salmon">
				{currentYear}
			</h1>
			<p class="text-xs font-medium tracking-widest text-zinc-500 uppercase">
				{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
			</p>
		</div>

		<div class="flex items-center gap-6">
			<CircularProgress
				progress={yearProgress}
				{daysPassed}
				totalDays={allDays.length}
				size={80}
				strokeWidth={5}
			/>

			<div class="h-10 w-px bg-zinc-800"></div>

			<div class="flex gap-2">
				<button
					onclick={() => (isSearchOpen = true)}
					class="group rounded-full bg-zinc-900/50 p-3 transition-all hover:bg-zinc-800 hover:text-salmon active:scale-95"
					aria-label="Search"
					title="Search (Cmd+K)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-zinc-400 transition-colors group-hover:text-salmon"
					>
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
				</button>

				<button
					onclick={() => (isSettingsOpen = true)}
					class="group rounded-full bg-zinc-900/50 p-3 transition-all hover:bg-zinc-800 hover:text-salmon active:scale-95"
					aria-label="Settings"
					title="Backup & Data"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-zinc-400 transition-colors group-hover:text-salmon"
					>
						<path
							d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
						/>
						<circle cx="12" cy="12" r="3" />
					</svg>
				</button>
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

					<div class={getDotClasses(day)} style={getDotStyle(day)}></div>
				</button>
			{/each}
		</div>
	</main>

	<DayModal
		isOpen={isModalOpen}
		date={selectedDate}
		entryText={selectedDate ? journalEntries[formatDateId(selectedDate)]?.text : ''}
		entryMood={selectedDate ? journalEntries[formatDateId(selectedDate)]?.mood : undefined}
		entryImages={selectedDate ? journalEntries[formatDateId(selectedDate)]?.images : []}
		canGoNext={canGoNext(selectedDate)}
		onClose={() => (isModalOpen = false)}
		onSave={(text, mood, images) => handleSave(text, mood, images)}
		onPrev={handlePrevDay}
		onNext={handleNextDay}
	/>

	<SettingsModal
		isOpen={isSettingsOpen}
		onClose={() => (isSettingsOpen = false)}
		onImportSuccess={() => location.reload()}
	/>

	<SearchModal
		isOpen={isSearchOpen}
		onClose={() => (isSearchOpen = false)}
		entries={journalEntries}
		onSelectDate={(date) => openModal(date)}
	/>
</div>
