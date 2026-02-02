<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Search, ArrowRight } from '@lucide/svelte';
	import type { JournalEntry } from '../lib/db';

	let { isOpen, onClose, entries, onSelectDate } = $props<{
		isOpen: boolean;
		onClose: () => void;
		entries: Record<string, JournalEntry>;
		onSelectDate: (date: Date) => void;
	}>();

	let query = $state('');

	let inputRef = $state<HTMLInputElement>();
	let resultsListRef = $state<HTMLDivElement>();

	let selectedIndex = $state(0);

	let results = $derived.by(() => {
		if (!query.trim()) return [];

		const lowerQuery = query.toLowerCase();

		return Object.entries(entries)
			.map(([dateStr, entry]) => {
				const typedEntry = entry as JournalEntry;
				return {
					date: new Date(dateStr),
					text: typedEntry.text,
					mood: typedEntry.mood,
					snippet: getSnippet(typedEntry.text, lowerQuery)
				};
			})
			.filter((item) => item.text.toLowerCase().includes(lowerQuery))
			.sort((a, b) => b.date.getTime() - a.date.getTime());
	});

	$effect(() => {
		if (isOpen) {
			setTimeout(() => inputRef?.focus(), 10);
			query = '';
			selectedIndex = 0;
		}
	});

	$effect(() => {
		if (results) selectedIndex = 0;
	});

	function getSnippet(text: string, query: string): string {
		const index = text.toLowerCase().indexOf(query);
		if (index === -1) return text.slice(0, 100);

		const start = Math.max(0, index - 20);
		const end = Math.min(text.length, index + query.length + 80);
		return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = (selectedIndex + 1) % results.length;
			scrollSelectedIntoView();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = (selectedIndex - 1 + results.length) % results.length;
			scrollSelectedIntoView();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (results[selectedIndex]) {
				handleSelect(results[selectedIndex].date);
			}
		}
	}

	function scrollSelectedIntoView() {
		if (!resultsListRef) return;
		const selectedEl = resultsListRef.children[selectedIndex] as HTMLElement;
		if (selectedEl) {
			selectedEl.scrollIntoView({ block: 'nearest' });
		}
	}

	function handleSelect(date: Date) {
		onSelectDate(date);
		onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[20vh]"
		role="dialog"
		aria-modal="true"
	>
		<button
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			onclick={onClose}
			transition:fade={{ duration: 150 }}
			aria-label="Close search"
		></button>

		<div
			class="relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl ring-1 ring-black/50"
			transition:fly={{ y: 10, duration: 250, easing: cubicOut, opacity: 0 }}
		>
			<div class="relative flex items-center px-5 py-4">
				<Search class="mr-3 h-5 w-5 text-zinc-500" strokeWidth={2} />
				<input
					bind:this={inputRef}
					bind:value={query}
					type="text"
					placeholder="Search journal..."
					class="flex-1 bg-transparent text-lg font-normal text-zinc-100 placeholder-zinc-500 focus:outline-none"
				/>
				{#if !query}
					<span
						class="ml-2 hidden rounded border border-zinc-800 bg-zinc-900/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 sm:inline-block"
						>ESC</span
					>
				{/if}
			</div>

			{#if query}
				<div
					bind:this={resultsListRef}
					class="scrollbar-hide max-h-[50vh] space-y-1 overflow-y-auto px-2 pb-2"
				>
					{#if results.length === 0}
						<div class="py-6 text-center text-sm text-zinc-500">No matching memories.</div>
					{:else}
						{#each results as result, i}
							<button
								onclick={() => handleSelect(result.date)}
								class="group flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition-all duration-200
                        {i === selectedIndex
									? 'bg-zinc-800 shadow-sm'
									: 'text-zinc-400 hover:bg-zinc-800/40'}"
							>
								<div
									class="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-800/50 bg-zinc-950 text-zinc-400 transition-colors group-hover:border-zinc-700"
								>
									<span class="text-[9px] font-bold tracking-wider uppercase"
										>{result.date.toLocaleString('default', { month: 'short' })}</span
									>
									<span class="text-sm leading-none font-bold text-zinc-200"
										>{result.date.getDate()}</span
									>
								</div>

								<div class="min-w-0 flex-1">
									<div class="mb-0.5 flex items-center gap-2">
										{#if result.mood}
											<div
												class="h-1.5 w-1.5 rounded-full"
												style="background-color: {result.mood}"
											></div>
										{/if}
										<span
											class="text-xs font-medium {i === selectedIndex
												? 'text-zinc-200'
												: 'text-zinc-500 group-hover:text-zinc-300'}"
										>
											{result.date.toLocaleDateString('en-US', {
												weekday: 'long',
												year: 'numeric'
											})}
										</span>
									</div>
									<p
										class="truncate text-sm {i === selectedIndex
											? 'text-zinc-300'
											: 'text-zinc-500'}"
									>
										{@html result.snippet.replace(
											new RegExp(`(${query})`, 'gi'),
											'<span class="text-salmon font-medium">$1</span>'
										)}
									</p>
								</div>

								{#if i === selectedIndex}
									<ArrowRight class="h-4 w-4 shrink-0 text-zinc-500" />
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
