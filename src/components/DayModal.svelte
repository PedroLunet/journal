<script lang="ts">
	import { fade } from 'svelte/transition';

	interface Props {
		isOpen: boolean;
		date: Date | null;
		onClose: () => void;
		onSave: (text: string) => void;
	}

	let { isOpen, date, onClose, onSave }: Props = $props();

	let note = $state('');

	function handleSave() {
		onSave(note);
		note = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && date}
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs backdrop-saturate-1000"
		role="button"
		tabindex="0"
		onclick={onClose}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') onClose();
		}}
	>
		<div
			class="w-full max-w-md cursor-default rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mb-4">
				<h2 class="text-xl font-bold text-white">
					{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
				</h2>
				<p class="text-sm text-zinc-500">How was your day?</p>
			</div>

			<textarea
				bind:value={note}
				class="h-32 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-salmon focus:outline-none"
				placeholder="Write your thoughts here..."
			></textarea>

			<div class="mt-6 flex justify-end gap-3">
				<button
					onclick={onClose}
					class="px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
				>
					Cancel
				</button>
				<button
					onclick={handleSave}
					class="rounded-lg bg-salmon px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-salmon/80"
				>
					Save Entry
				</button>
			</div>
		</div>
	</div>
{/if}
