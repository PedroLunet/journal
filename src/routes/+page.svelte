<script lang="ts">
	import DayModal from '../components/DayModal.svelte';
	import { onMount } from 'svelte';

	let journalEntries = $state<Record<string, { text: string }>>({});

	onMount(() => {
		const stored = localStorage.getItem('journal_entries');
		if (stored) {
			journalEntries = JSON.parse(stored);
		}
	});

	let selectedDate = $state<Date | null>(null);
	let isModalOpen = $state(false);

	const formatDateId = (date: Date) => date.toISOString().split('T')[0];

	// --- SAVE / DELETE LOGIC ---
	function handleSave(text: string) {
		if (selectedDate) {
			const dateId = formatDateId(selectedDate);

			// If text is empty/whitespace, delete the entry
			if (!text.trim()) {
				delete journalEntries[dateId];
				console.log('Entry deleted for:', dateId);
			} else {
				journalEntries[dateId] = { text };
				console.log('Entry saved for:', dateId);
			}

			localStorage.setItem('journal_entries', JSON.stringify(journalEntries));
		}
		// Note: We do NOT close the modal here automatically if called via navigation,
		// but the 'Save Entry' button calls this and then the modal closes via UI logic if needed.
		// For the 'Save' button specifically, we might want to close it:
		if (!isModalOpen) return; // Guard for safety

		// Only close modal if this was triggered by the "Save" button (not navigation)
		// Actually, the simplest way is to let the modal control closing, or just close it here.
		// For now, we will assume this function just saves state.
		// We will handle closing in the specific button click in the modal if needed,
		// OR simply set isModalOpen = false here.
		// Since navigation calls this, we should ONLY close if it's the specific "Save" action.
		// However, the current DayModal implementation calls onSave(note) then continues.
		// To keep it simple: We will NOT close isModalOpen here.
		// We will let the "Save Entry" button logic in the Modal handle closure or
		// we can add a specific `closeAfterSave` flag if we wanted.
		//
		// WAIT: The DayModal calls onSave() then... nothing.
		// If we want "Save Entry" to close the modal, we should add `isModalOpen = false` here.
		// But if `handleNav` calls this, we DON'T want to close.
		//
		// FIX: The Modal handles the logic. The Modal's "Save Entry" button doesn't close it automatically
		// in my previous code, it just saves.
		// Let's make `handleSave` purely about SAVING DATA.
		// The Modal can call `onClose` separately if desired, OR we check context.
		//
		// actually, standard pattern:
		// The "Save Entry" button usually implies "Save & Close".
		// The Navigation arrows imply "Save & Move".
		//
		// Let's modify handleSave to accept an optional 'shouldClose' param or just keep it simple.
		// For this full page request, I will adhere to the previous pattern:
		// We will simply save. If the user clicked "Save Entry", they might want to stay?
		// usually they want to close.
		//
		// Let's stick to the previous working logic:
		// We will simply set isModalOpen = false inside the specific button handler if we want,
		// OR we just leave it open.
		//
		// *Correction*: In the previous code, `handleSave` set `isModalOpen = false`.
		// This effectively breaks navigation (saving would close the modal).
		// I will remove `isModalOpen = false` from here and let the specific actions decide.
	}

	// REVISED SAVE HANDLER TO SUPPORT NAVIGATION
	function saveEntryData(text: string) {
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

	// --- NAVIGATION LOGIC ---
	function handlePrevDay() {
		if (!selectedDate) return;
		const newDate = new Date(selectedDate);
		newDate.setDate(selectedDate.getDate() - 1);

		// Prevent going to previous year
		if (newDate.getFullYear() === currentYear) {
			selectedDate = newDate;
		}
	}

	function handleNextDay() {
		if (!selectedDate) return;
		const newDate = new Date(selectedDate);
		newDate.setDate(selectedDate.getDate() + 1);

		// Prevent going to future or next year
		if (!isFuture(newDate) && newDate.getFullYear() === currentYear) {
			selectedDate = newDate;
		}
	}

	function canGoNext(date: Date | null) {
		if (!date) return false;
		const nextDay = new Date(date);
		nextDay.setDate(date.getDate() + 1);
		return !isFuture(nextDay) && nextDay.getFullYear() === currentYear;
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

	const currentYear = new Date().getFullYear();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

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

	const isToday = (date: Date) => {
		return date.toDateString() === today.toDateString();
	};

	const isFuture = (date: Date) => {
		return date > today;
	};

	const getMonthLetter = (date: Date) => {
		return date.toLocaleString('default', { month: 'narrow' });
	};

	const isFirstOfMonth = (date: Date) => {
		return date.getDate() === 1 && date.getMonth() !== 0;
	};

	// --- STYLING LOGIC ---
	function getDotClasses(day: Date) {
		const entry = hasEntry(day);
		const current = isToday(day);
		const first = isFirstOfMonth(day);
		const future = isFuture(day);

		let classes = 'h-1 w-1 rounded-full bg-rose transition-all ';

		if (future && !entry) {
			classes += 'opacity-30 ';
		} else if (current) {
			if (entry) {
				classes +=
					'ring-1 ring-salmon ring-offset-4 ring-offset-iridium duration-350 group-hover:scale-[2] ';
			} else {
				classes +=
					'ring-1 ring-rose ring-offset-4 ring-offset-iridium duration-350 group-hover:scale-[2] ';
			}
		} else {
			classes += 'duration-250 group-hover:scale-[3] ';
		}

		if (entry) {
			if (current) {
				classes += 'scale-125 shadow-[0_0_15px_3px_var(--color-salmon)] ';
			} else {
				classes += 'scale-125 shadow-[0_0_10px_2px_var(--color-salmon)] ';
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
	let dotElements = $state<HTMLElement[]>([]);
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
		if (window.innerWidth < 768) return;

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

<svelte:window onresize={updatePositions} />

<div
	class="h-full w-full"
	role="application"
	onmousemove={handleMouseMove}
	onmouseleave={resetGrid}
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

		<DayModal
			isOpen={isModalOpen}
			date={selectedDate}
			entryText={selectedDate ? journalEntries[formatDateId(selectedDate)]?.text : ''}
			canGoNext={canGoNext(selectedDate)}
			onClose={() => (isModalOpen = false)}
			onSave={(text) => {
				saveEntryData(text);
				// We only close the modal if this was triggered by the "Save Entry" button,
				// NOT by navigation. The navigation function calls onSave then moves,
				// but the Save button calls onSave.
				// To keep it simple: "Save Entry" button logic in Modal handles saving.
				// We can just close it here if we want "Save Entry" to close.
				// BUT navigation also triggers this.
				//
				// TRICK: We will modify DayModal slightly to handle "Save & Close" separate from "Save & Move",
				// OR we just say: The parent simply saves.
				// The Modal decides when to ask the parent to Close.
				//
				// For now, to match your expected behavior:
				// We will rely on the Modal simply calling 'onSave' for data,
				// and 'onClose' for closing.
				// So this callback ONLY saves data.
			}}
			onPrev={handlePrevDay}
			onNext={handleNextDay}
		/>
	</div>
</div>
