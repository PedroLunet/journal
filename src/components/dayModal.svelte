<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import {
		ChevronRight,
		ChevronLeft,
		Image as ImageIcon,
		X,
		Maximize2,
		Trash2
	} from '@lucide/svelte';
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
		onDelete: () => void;
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
		onDelete,
		onPrev,
		onNext
	}: Props = $props();

	let note = $state('');
	let mood = $state('#eb9e8f');
	let showPicker = $state(false);
	let isBackdropClick = false;

	let showDeleteConfirm = $state(false);
	let showEntryDeleteConfirm = $state(false);

	let fileInput = $state<HTMLInputElement>();

	let images = $state<Blob[]>([]);
	let previewUrls = $state<string[]>([]);
	let isFullScreen = $state(false);

	let isInitialized = $state(false);

	let textColor = $derived(
		chroma.valid(mood) && chroma(mood).luminance() > 0.5 ? '#18181b' : '#fffbeb'
	);

	let saveTimeout: ReturnType<typeof setTimeout>;

	function debouncedSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			if (isOpen && isInitialized) {
				onSave(note, mood, images);
			}
		}, 1000);
	}

	$effect(() => {
		if (isOpen && isInitialized) {
			const _n = note;
			const _m = mood;
			debouncedSave();
		}
	});

	$effect(() => {
		if (isOpen && date) {
			clearTimeout(saveTimeout);

			note = entryText;
			showPicker = false;
			isFullScreen = false;
			showDeleteConfirm = false;
			showEntryDeleteConfirm = false;
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

			isInitialized = true;
		} else {
			isInitialized = false;
		}
	});

	function closeAndSave() {
		clearTimeout(saveTimeout);
		onSave(note, mood, images);
		onClose();
	}

	function handleNav(direction: 'prev' | 'next') {
		clearTimeout(saveTimeout);
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
				clearTimeout(saveTimeout);
				onSave(note, mood, images);
			}
			target.value = '';
		}
	}

	function requestDelete(e: Event) {
		e.stopPropagation();
		showDeleteConfirm = true;
	}

	function confirmDelete() {
		if (previewUrls.length > 0) URL.revokeObjectURL(previewUrls[0]);
		images = [];
		previewUrls = [];
		showDeleteConfirm = false;

		clearTimeout(saveTimeout);
		onSave(note, mood, images);
	}

	function requestEntryDelete() {
		showEntryDeleteConfirm = true;
	}

	function confirmEntryDelete() {
		clearTimeout(saveTimeout);
		onDelete();
		showEntryDeleteConfirm = false;
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;

		if (e.key === 'Escape') {
			if (showEntryDeleteConfirm) showEntryDeleteConfirm = false;
			else if (showDeleteConfirm) showDeleteConfirm = false;
			else if (isFullScreen) isFullScreen = false;
			else if (showPicker) showPicker = false;
			else closeAndSave();
			return;
		}

		if (!isFullScreen && !showDeleteConfirm && !showEntryDeleteConfirm && !showPicker) {
			const target = e.target as HTMLElement;
			const isEditing =
				target.tagName === 'TEXTAREA' ||
				(target.tagName === 'INPUT' && target.getAttribute('type') === 'text');

			const isModifier = e.metaKey || e.ctrlKey;

			if (!isEditing || isModifier) {
				if (e.key === 'ArrowLeft') {
					if (isEditing) e.preventDefault();
					handleNav('prev');
				} else if (e.key === 'ArrowRight' && canGoNext) {
					if (isEditing) e.preventDefault();
					handleNav('next');
				}
			}
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
								onclick={requestDelete}
								onkeydown={(e) => e.key === 'Enter' && requestDelete(e)}
								class="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white/80 opacity-100 shadow-lg backdrop-blur-sm transition-all hover:bg-red-500 hover:text-white md:opacity-0 md:group-hover:opacity-100"
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
							onclick={() => fileInput?.click()}
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

				<div class="flex items-center gap-3">
					{#if note.trim() || images.length > 0}
						<button
							onclick={requestEntryDelete}
							class="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-500"
							title="Delete Entry"
						>
							<Trash2 size={18} />
						</button>
					{/if}

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
	</div>

	{#if showDeleteConfirm}
		<div
			transition:fade={{ duration: 150 }}
			class="fixed inset-0 z-110 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div
				class="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
				transition:scale={{ start: 0.95, duration: 150 }}
			>
				<h3 class="text-lg font-semibold text-white">Delete photo?</h3>
				<p class="mt-2 text-sm text-zinc-400">
					Are you sure you want to remove this memory? This action cannot be undone.
				</p>

				<div class="mt-6 flex justify-end gap-3">
					<button
						class="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
						onclick={() => (showDeleteConfirm = false)}
					>
						Cancel
					</button>
					<button
						class="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white"
						onclick={confirmDelete}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showEntryDeleteConfirm}
		<div
			transition:fade={{ duration: 150 }}
			class="fixed inset-0 z-110 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div
				class="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
				transition:scale={{ start: 0.95, duration: 150 }}
			>
				<h3 class="text-lg font-semibold text-white">Delete entry?</h3>
				<p class="mt-2 text-sm text-zinc-400">
					Are you sure you want to delete this day's entry entirely? This cannot be undone.
				</p>

				<div class="mt-6 flex justify-end gap-3">
					<button
						class="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
						onclick={() => (showEntryDeleteConfirm = false)}
					>
						Cancel
					</button>
					<button
						class="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white"
						onclick={confirmEntryDelete}
					>
						Delete Everything
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if isFullScreen && previewUrls.length > 0}
		<div
			transition:fade={{ duration: 200 }}
			class="fixed inset-0 z-100 flex cursor-zoom-out items-center justify-center bg-black/90 p-4 backdrop-blur-md"
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
