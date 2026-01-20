<script lang="ts">
	import { fade } from 'svelte/transition';
	import { ChevronRight, ChevronLeft } from '@lucide/svelte';

	interface Props {
		isOpen: boolean;
		date: Date | null;
		entryText?: string;
		canGoNext?: boolean;
		onClose: () => void;
		onSave: (text: string) => void;
		onPrev: () => void;
		onNext: () => void;
	}

	let {
		isOpen,
		date,
		entryText = '',
		canGoNext = false,
		onClose,
		onSave,
		onPrev,
		onNext
	}: Props = $props();

	let note = $state('');
	let isBackdropClick = false;

	$effect(() => {
		if (isOpen) {
			note = entryText;
		}
	});

	function closeAndSave() {
		onSave(note);
		onClose();
	}

	function handleNav(direction: 'prev' | 'next') {
		onSave(note);
		if (direction === 'prev') onPrev();
		if (direction === 'next') onNext();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeAndSave();
		} else if (e.key === 'ArrowLeft') {
			handleNav('prev');
		} else if (e.key === 'ArrowRight' && canGoNext) {
			handleNav('next');
		}
	}

	function handleBackdropMouseDown(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			isBackdropClick = true;
		}
	}

	function handleBackdropMouseUp(e: MouseEvent) {
		if (isBackdropClick && e.target === e.currentTarget) {
			closeAndSave();
		}
		isBackdropClick = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && date}
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs backdrop-saturate-300"
		role="button"
		tabindex="0"
		onmousedown={handleBackdropMouseDown}
		onmouseup={handleBackdropMouseUp}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') closeAndSave();
		}}
	>
		<div
			class="w-full max-w-xl cursor-default rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl transition-all"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			onmousedown={(e) => e.stopPropagation()}
		>
			<div class="mb-6 flex items-center justify-between">
				<button
					onclick={() => handleNav('prev')}
					class="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
					title="Previous Day"
				>
					<ChevronLeft size={24} />
				</button>

				<div class="text-center">
					<h2 class="text-xl font-bold text-white">
						{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
					</h2>
					<p class="text-sm text-zinc-500">How was your day?</p>
				</div>

				<button
					onclick={() => handleNav('next')}
					disabled={!canGoNext}
					class="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-all
                    {canGoNext
						? 'hover:bg-zinc-800 hover:text-white active:scale-95'
						: 'cursor-not-allowed opacity-20'}"
					title="Next Day"
				>
					<ChevronRight size={24} />
				</button>
			</div>

			<textarea
				bind:value={note}
				class="h-48 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-salmon focus:outline-none"
				placeholder="Write your thoughts here..."
			></textarea>

			<div class="mt-6 flex justify-end">
				<button
					onclick={closeAndSave}
					class="rounded-lg bg-salmon px-6 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-salmon/80"
				>
					Done!
				</button>
			</div>
		</div>
	</div>
{/if}
