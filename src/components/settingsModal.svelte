<script lang="ts">
	import { db } from '../lib/db';
	import { Download, Upload, X } from '@lucide/svelte';
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

	function handleKeydown(e: KeyboardEvent) {
		if (isOpen && e.key === 'Escape') {
			onClose();
		}
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
			alert('Export failed');
			console.error(err);
		} finally {
			isExporting = false;
		}
	}

	async function handleImport(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files?.length) return;

		const file = target.files[0];
		if (!confirm('This will merge the backup with your current entries. Continue?')) {
			target.value = '';
			return;
		}

		isImporting = true;

		try {
			const text = await file.text();
			await db.importBackup(text);
			alert('Backup restored successfully!');
			onImportSuccess();
			onClose();
		} catch (err) {
			alert('Failed to import backup. File might be corrupted.');
			console.error(err);
		} finally {
			isImporting = false;
			if (fileInput) fileInput.value = '';
		}
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

					<input
						bind:this={fileInput}
						type="file"
						accept=".json"
						class="hidden"
						onchange={handleImport}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
