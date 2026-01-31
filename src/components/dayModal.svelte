<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { ChevronRight, ChevronLeft, Image as ImageIcon, X, Maximize2 } from '@lucide/svelte';
	import ColorPicker from './colorPicker.svelte';
	import chroma from 'chroma-js';

	interface Props {
		isOpen: boolean;
		date: Date | null;
		entryText?: string;
		entryMood?: string;
		entryImages?: Blob[];
		canGoNext?: boolean;
		onClose: () => void;
		onSave: (text: string, mood: string, images: Blob[]) => void;
		onPrev: () => void;
		onNext: () => void;
	}

	let {
		isOpen,
		date,
		entryText = '',
		entryMood = '',
		entryImages = [],
		canGoNext = false,
		onClose,
		onSave,
		onPrev,
		onNext
	}: Props = $props();

	let note = $state('');
	let mood = $state('#eb9e8f');
	let showPicker = $state(false);
	let isBackdropClick = false;

	let fileInput: HTMLInputElement;

	let images = $state<Blob[]>([]);
	let previewUrls = $state<string[]>([]);

	let isFullScreen = $state(false);

	let textColor = $derived(
		chroma.valid(mood) && chroma(mood).luminance() > 0.5 ? '#18181b' : '#fffbeb'
	);

	$effect(() => {
		if (isOpen && date) {
			note = entryText;
			showPicker = false;
			isFullScreen = false;
			images = [];
			previewUrls = [];

			if (entryImages && entryImages.length > 0) {
				try {
					const rawBlob = structuredClone(entryImages[0]);
					images = [rawBlob];
					previewUrls = [URL.createObjectURL(rawBlob)];
				} catch (err) {
					console.error('Failed to load image:', err);
				}
			}

			if (entryMood && entryMood.startsWith('#')) {
				mood = entryMood;
			} else {
				mood = '#eb9e8f';
			}
		}
	});

	function closeAndSave() {
		onSave(note, mood, images);
		onClose();
	}

	function handleNav(direction: 'prev' | 'next') {
		onSave(note, mood, images);
		if (direction === 'prev') onPrev();
		if (direction === 'next') onNext();
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			if (file.type.startsWith('image/')) {
				images = [file];
				if (previewUrls.length > 0) URL.revokeObjectURL(previewUrls[0]);
				previewUrls = [URL.createObjectURL(file)];
			}
			target.value = '';
		}
	}

	function removeImage(e: Event) {
		e.stopPropagation();
		if (previewUrls.length > 0) URL.revokeObjectURL(previewUrls[0]);
		images = [];
		previewUrls = [];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (isFullScreen) isFullScreen = false;
			else if (showPicker) showPicker = false;
			else closeAndSave();
		} else if (!isFullScreen) {
			if (e.key === 'ArrowLeft') handleNav('prev');
			else if (e.key === 'ArrowRight' && canGoNext) handleNav('next');
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
			if (e.key === 'Escape') closeAndSave();
		}}
	>
		<div
			class="flex max-h-[90vh] w-full max-w-xl cursor-default flex-col rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl transition-all"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onmousedown={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mb-6 flex shrink-0 items-center justify-between">
				<button
					onclick={() => handleNav('prev')}
					class="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
					title="Previous Day"
				>
					<ChevronLeft size={24} />
				</button>

				<div class="flex flex-col gap-1 text-center">
					<h3 class="text-sm font-semibold text-zinc-500">
						{date.toLocaleDateString('en-US', { weekday: 'long' })}
					</h3>
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

			<div class="min-h-0 flex-1 overflow-y-auto p-1">
				<textarea
					bind:value={note}
					class="h-48 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:outline-none"
					style="--tw-ring-color: {mood};"
					placeholder="Write your thoughts here..."
				></textarea>

				<div class="mt-4">
					{#if previewUrls.length > 0}
						<button
							class="group relative w-fit cursor-zoom-in overflow-hidden rounded-xl border border-white/10 bg-zinc-950 transition-transform active:scale-[0.98]"
							onclick={() => (isFullScreen = true)}
							aria-label="View full size image"
						>
							<img src={previewUrls[0]} alt="Memory" class="h-32 w-auto object-cover" />

							<div
								class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<Maximize2 class="text-white drop-shadow-md" size={24} />
							</div>

							<div
								role="button"
								tabindex="0"
								onclick={removeImage}
								onkeydown={(e) => e.key === 'Enter' && removeImage(e)}
								class="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-red-500 hover:text-white"
								title="Remove photo"
							>
								<X size={14} />
							</div>
						</button>
					{:else}
						<input
							bind:this={fileInput}
							type="file"
							accept=".png, .jpg, .jpeg, .svg, .webp, .heic"
							class="hidden"
							onchange={handleFileSelect}
						/>
						<button
							onclick={() => fileInput.click()}
							class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 py-3 text-zinc-500 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50 hover:text-zinc-300 active:scale-[0.99]"
						>
							<ImageIcon size={18} />
							<span class="text-sm font-medium">Add a photo</span>
						</button>
					{/if}
				</div>
			</div>

			<div class="mt-6 flex shrink-0 items-center justify-between">
				<div class="relative">
					<button
						onclick={() => (showPicker = !showPicker)}
						class="h-6 w-6 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110 active:scale-95"
						style="background-color: {mood};"
						title="Change Mood Color"
						aria-label="Change mood color"
					></button>

					{#if showPicker}
						<div
							class="fixed inset-0 z-60 cursor-default"
							role="presentation"
							onclick={() => (showPicker = false)}
							onkeydown={(e) => {
								if (e.key === 'Escape') showPicker = false;
							}}
						></div>

						<div
							class="absolute bottom-full left-0 z-70 mb-3 w-64 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
							transition:fly={{ y: 10, duration: 200 }}
							role="dialog"
							aria-label="Color Picker"
							tabindex="-1"
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => e.stopPropagation()}
						>
							<ColorPicker value={mood} onChange={(val: string) => (mood = val)} />
						</div>
					{/if}
				</div>

				<button
					onclick={closeAndSave}
					class="rounded-lg px-6 py-2 text-sm font-medium transition-colors duration-300 hover:opacity-90 active:scale-95"
					style="background-color: {mood}; color: {textColor};"
				>
					Done!
				</button>
			</div>
		</div>
	</div>

	{#if isFullScreen && previewUrls.length > 0}
		<div
			transition:fade={{ duration: 200 }}
			class="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/90 p-4 backdrop-blur-md"
			onclick={() => (isFullScreen = false)}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Escape') isFullScreen = false;
			}}
		>
			<img
				src={previewUrls[0]}
				alt="Full screen memory"
				transition:scale={{ start: 0.9, duration: 200 }}
				class="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
			/>

			<button
				class="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
				onclick={() => (isFullScreen = false)}
			>
				<X size={24} />
			</button>
		</div>
	{/if}
{/if}
