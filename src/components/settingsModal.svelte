<script lang="ts">
	import { db } from '../lib/db';
	import { Download, Upload } from '@lucide/svelte';

	let { isOpen, onClose, onImportSuccess } = $props<{
		isOpen: boolean;
		onClose: () => void;
		onImportSuccess: () => void;
	}>();

	let isExporting = $state(false);
	let isImporting = $state(false);
	let fileInput: HTMLInputElement = $state()!;

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

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
		role="dialog"
		aria-modal="true"
	>
		<button
			class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
			onclick={onClose}
			aria-label="Close modal"
		></button>

		<div
			class="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl transition-all"
		>
			<div class="p-6">
				<h2 class="mb-2 text-xl font-bold text-salmon">Data & Backup</h2>
				<p class="mb-6 text-sm text-zinc-400">
					Your journal is stored locally on this device. Save a backup to keep your memories safe.
				</p>

				<div class="space-y-3">
					<button
						onclick={handleExport}
						disabled={isExporting}
						class="flex w-full items-center justify-between rounded-xl bg-zinc-800 p-4 text-left transition-colors hover:bg-zinc-700 active:bg-zinc-600"
					>
						<div>
							<div class="font-medium text-zinc-200">Download Backup</div>
							<div class="text-xs text-zinc-500">Save entries and photos as a single file</div>
						</div>
						{#if isExporting}
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"
							></div>
						{:else}
							<Download class="h-5 w-5 text-zinc-400" />
						{/if}
					</button>

					<button
						onclick={triggerFileSelect}
						disabled={isImporting}
						class="flex w-full items-center justify-between rounded-xl bg-zinc-800 p-4 text-left transition-colors hover:bg-zinc-700 active:bg-zinc-600"
					>
						<div>
							<div class="font-medium text-zinc-200">Restore Backup</div>
							<div class="text-xs text-zinc-500">Import a previously saved JSON file</div>
						</div>
						{#if isImporting}
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"
							></div>
						{:else}
							<Upload class="h-5 w-5 text-zinc-400" />
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
