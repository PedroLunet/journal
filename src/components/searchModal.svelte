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
			class="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/90 shadow-2xl ring-1 ring-black/50 backdrop-blur-xl"
			transition:fly={{ y: 0, duration: 200, easing: cubicOut, opacity: 0 }}
		>
			<div class="flex items-center p-4">
				<Search class="mr-4 h-6 w-6 text-zinc-400" strokeWidth={2.5} />
				<input
					bind:this={inputRef}
					bind:value={query}
					type="text"
					placeholder="Spotlight Search..."
					class="flex-1 bg-transparent text-2xl font-light text-white placeholder-zinc-500 focus:outline-none"
				/>
				{#if !query}
					<span
						class="hidden rounded border border-zinc-700/50 bg-zinc-800/50 px-2 py-1 text-xs font-medium text-zinc-600 sm:inline-block"
						>ESC</span
					>
				{/if}
			</div>

			{#if results.length > 0 || query}
				<div class="h-px w-full bg-white/10"></div>
			{/if}

			{#if query}
				<div bind:this={resultsListRef} class="scrollbar-hide max-h-[50vh] overflow-y-auto py-2">
					{#if results.length === 0}
						<div class="py-8 text-center text-zinc-500">No results found.</div>
					{:else}
						{#each results as result, i}
							<button
								onclick={() => handleSelect(result.date)}
								class="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors
                        {i === selectedIndex ? 'bg-blue-600/20' : 'hover:bg-white/5'}"
							>
								{#if i === selectedIndex}
									<div class="absolute left-0 h-10 w-1 rounded-r bg-blue-500"></div>
								{/if}

								<div
									class="flex h-10 w-10 flex-col items-center justify-center rounded border border-white/5 bg-zinc-800 text-zinc-300"
								>
									<span class="text-[9px] font-bold uppercase"
										>{result.date.toLocaleString('default', { month: 'short' })}</span
									>
									<span class="text-sm leading-none font-bold">{result.date.getDate()}</span>
								</div>

								<div class="min-w-0 flex-1">
									<div class="mb-0.5 flex items-center gap-2">
										<span class="text-sm font-medium text-zinc-200">
											{result.date.toLocaleDateString('en-US', {
												weekday: 'long',
												year: 'numeric'
											})}
										</span>
										{#if result.mood}
											<div
												class="h-2 w-2 rounded-full"
												style="background-color: {result.mood}"
											></div>
										{/if}
									</div>
									<p class="truncate text-sm text-zinc-400">
										{@html result.snippet.replace(
											new RegExp(`(${query})`, 'gi'),
											'<span class="text-white font-semibold underline decoration-salmon/50">$1</span>'
										)}
									</p>
								</div>

								{#if i === selectedIndex}
									<ArrowRight class="ml-2 h-4 w-4 animate-pulse text-blue-400" />
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
