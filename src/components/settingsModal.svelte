<script lang="ts">
	import { db, type ImportStrategy } from '../lib/db';
	import {
		Download,
		Upload,
		X,
		TriangleAlert,
		Check,
		CircleAlert,
		ChevronLeft
	} from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { isOpen, onClose, onImportSuccess } = $props<{
		isOpen: boolean;
		onClose: () => void;
		onImportSuccess: () => void;
	}>();

	let isExporting = $state(false);
	let isImporting = $state(false);
	let fileInput: HTMLInputElement = $state()!;

	type Step = 'idle' | 'conflict' | 'confirm_merge' | 'success' | 'error';
	let importStep = $state<Step>('idle');

	let pendingFileString = $state<string | null>(null);
	let statusMessage = $state('');

	$effect(() => {
		if (!isOpen) {
			setTimeout(() => {
				importStep = 'idle';
				pendingFileString = null;
				statusMessage = '';
			}, 300);
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (isOpen && e.key === 'Escape') onClose();
	}

	async function handleExport() {
		isExporting = true;
		try {
			const jsonString = await db.exportBackup();
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error(err);
			statusMessage = 'Failed to generate backup file.';
			importStep = 'error';
		} finally {
			isExporting = false;
		}
	}

	async function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files?.length) return;

		const file = target.files[0];

		try {
			const text = await file.text();
			const hasExisting = await db.hasEntries();

			if (hasExisting) {
				pendingFileString = text;
				importStep = 'conflict';
			} else {
				await executeImport(text, 'overwrite');
			}
		} catch (err) {
			console.error(err);
			statusMessage = 'Failed to read the selected file.';
			importStep = 'error';
		} finally {
			if (fileInput) fileInput.value = '';
		}
	}

	function goToMergeConfirm() {
		if (!pendingFileString) return;
		importStep = 'confirm_merge';
	}

	async function executeImport(jsonString: string, strategy: ImportStrategy) {
		isImporting = true;
		try {
			await db.importBackup(jsonString, strategy);
			statusMessage = 'Backup restored successfully!';
			importStep = 'success';
		} catch (err) {
			console.error(err);
			statusMessage = 'The backup file appears to be corrupted or invalid.';
			importStep = 'error';
		} finally {
			isImporting = false;
			pendingFileString = null;
		}
	}

	function handleSuccessClick() {
		onClose();
		setTimeout(() => {
			onImportSuccess();
		}, 100);
	}

	function triggerFileSelect() {
		fileInput.click();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
		role="dialog"
		aria-modal="true"
	>
		<button
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			onclick={onClose}
			aria-label="Close modal"
			transition:fade={{ duration: 200 }}
		></button>

		<div
			class="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
			transition:fly={{ y: 20, duration: 300, easing: cubicOut }}
		>
			<button
				onclick={onClose}
				class="absolute top-4 right-4 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
				aria-label="Close"
			>
				<X class="h-5 w-5" />
			</button>

			<div class="p-6">
				{#if importStep === 'idle'}
					<h2 class="mb-2 text-xl font-bold text-salmon">Data & Backup</h2>
					<p class="mb-6 text-sm text-zinc-400">
						Your journal is stored locally on this device. Save a backup to keep your memories safe.
					</p>

					<div class="space-y-3">
						<button
							onclick={handleExport}
							disabled={isExporting}
							class="group hover:bg-zinc-750 flex w-full items-center justify-between rounded-xl bg-zinc-800 p-4 text-left shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] active:bg-zinc-700"
						>
							<div>
								<div class="font-medium text-zinc-200 group-hover:text-white">Download Backup</div>
								<div class="text-xs text-zinc-500 group-hover:text-zinc-400">
									Save entries and photos as a single file
								</div>
							</div>
							{#if isExporting}
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"
								></div>
							{:else}
								<Download
									class="h-5 w-5 text-zinc-400 transition-transform duration-300 group-hover:scale-110 group-hover:text-salmon"
								/>
							{/if}
						</button>

						<button
							onclick={triggerFileSelect}
							disabled={isImporting}
							class="group hover:bg-zinc-750 flex w-full items-center justify-between rounded-xl bg-zinc-800 p-4 text-left shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] active:bg-zinc-700"
						>
							<div>
								<div class="font-medium text-zinc-200 group-hover:text-white">Restore Backup</div>
								<div class="text-xs text-zinc-500 group-hover:text-zinc-400">
									Import a previously saved JSON file
								</div>
							</div>
							{#if isImporting}
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"
								></div>
							{:else}
								<Upload
									class="h-5 w-5 text-zinc-400 transition-transform duration-300 group-hover:scale-110 group-hover:text-emerald-400"
								/>
							{/if}
						</button>
					</div>
				{:else if importStep === 'conflict'}
					<div class="mb-2 flex items-center gap-2 text-amber-500">
						<TriangleAlert class="h-6 w-6" />
						<h2 class="text-xl font-bold text-zinc-100">Existing Data Found</h2>
					</div>

					<p class="mb-6 text-sm text-zinc-400">
						How would you like to handle dates that exist in both your current journal and the
						backup?
					</p>

					<div class="space-y-3">
						<button
							onclick={() => pendingFileString && executeImport(pendingFileString, 'keep_old')}
							class="w-full rounded-xl border border-zinc-700 bg-transparent p-4 text-left transition-colors hover:bg-zinc-800"
						>
							<div class="font-bold text-zinc-200">Keep Current</div>
							<div class="text-xs text-zinc-500">
								Keep my current entries. Only import new days.
							</div>
						</button>

						<button
							onclick={goToMergeConfirm}
							class="w-full rounded-xl bg-zinc-800 p-4 text-left shadow-md ring-1 ring-transparent transition-all ring-inset hover:bg-zinc-700 hover:ring-salmon/50"
						>
							<div class="font-bold text-salmon">Merge Both</div>
							<div class="text-xs text-zinc-400">
								Combine text. Backup photo overwrites if conflict.
							</div>
						</button>

						<button
							onclick={() => pendingFileString && executeImport(pendingFileString, 'overwrite')}
							class="w-full rounded-xl border border-rose/20 bg-rose/5 p-4 text-left transition-colors hover:border-rose/40 hover:bg-rose/10"
						>
							<div class="font-bold text-rose">Replace with Backup</div>
							<div class="text-xs text-rose/70">
								Overwrite my current entries with the backup version.
							</div>
						</button>
					</div>

					<button
						onclick={() => (importStep = 'idle')}
						class="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-300"
					>
						Cancel
					</button>
				{:else if importStep === 'confirm_merge'}
					<div class="mb-6 flex flex-col items-center text-center">
						<div class="mb-4 rounded-full bg-amber-500/10 p-4">
							<TriangleAlert class="h-10 w-10 text-amber-500" />
						</div>
						<h2 class="text-xl font-bold text-zinc-100">Photo Conflict Warning</h2>
					</div>

					<p class="mb-6 text-sm leading-relaxed text-zinc-400">
						Merging will combine your text entries into one.
						<br /><br />
						<span class="font-bold text-amber-500">However</span>, if a day has a photo in
						<strong class="text-zinc-200">BOTH</strong>
						your current journal and the backup, the
						<strong class="text-zinc-200">BACKUP PHOTO</strong> will overwrite your current one.
					</p>

					<div class="grid grid-cols-2 gap-3">
						<button
							onclick={() => (importStep = 'conflict')}
							class="rounded-xl border border-zinc-700 p-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
						>
							Back
						</button>
						<button
							onclick={() => pendingFileString && executeImport(pendingFileString, 'merge')}
							class="rounded-xl bg-amber-600/20 p-3 text-sm font-bold text-amber-500 ring-1 ring-amber-500/50 transition-colors ring-inset hover:bg-amber-600/30"
						>
							I Understand
						</button>
					</div>
				{:else if importStep === 'success'}
					<div class="flex flex-col items-center py-6 text-center">
						<div class="mb-4 rounded-full bg-emerald-500/10 p-4">
							<Check class="h-12 w-12 text-emerald-500" />
						</div>
						<h2 class="mb-2 text-xl font-bold text-white">Success!</h2>
						<p class="text-sm text-zinc-400">{statusMessage}</p>

						<button
							onclick={handleSuccessClick}
							class="mt-8 w-full rounded-xl bg-zinc-800 p-3 font-medium text-zinc-200 hover:bg-zinc-700"
						>
							Done
						</button>
					</div>
				{:else if importStep === 'error'}
					<div class="flex flex-col items-center py-6 text-center">
						<div class="mb-4 rounded-full bg-rose-500/10 p-4">
							<CircleAlert class="h-12 w-12 text-rose-500" />
						</div>
						<h2 class="mb-2 text-xl font-bold text-white">Error</h2>
						<p class="text-sm text-zinc-400">{statusMessage}</p>

						<button
							onclick={() => (importStep = 'idle')}
							class="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-transparent p-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
						>
							<ChevronLeft class="h-4 w-4" />
							Back to Menu
						</button>
					</div>
				{/if}

				<input
					bind:this={fileInput}
					type="file"
					accept=".json"
					class="hidden"
					onchange={handleFileSelect}
				/>
			</div>
		</div>
	</div>
{/if}
