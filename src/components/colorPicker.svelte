<script lang="ts">
	import chroma from 'chroma-js';
	import { cn } from '../lib/utils';

	type HSVA = [number, number, number, number];

	let { value = '#ef4444', onChange } = $props();

	let hsva = $state<HSVA>([0, 1, 1, 1]);
	let isDragging = $state(false);

	$effect(() => {
		if (!value) return;
		if (!isDragging) {
			try {
				const c = chroma(value);
				const [h, s, v] = c.hsv();
				const a = c.alpha();

				hsva = [isNaN(h) ? hsva[0] : h, s, isNaN(v) ? 0 : v, a];
			} catch (e) {}
		}
	});

	function updateColor(newHsva: HSVA) {
		hsva = newHsva;
		const [h, s, v, a] = newHsva;
		const hex = chroma(h, s, v, 'hsv').alpha(a).hex();
		onChange?.(hex);
	}

	let hueColor = $derived(chroma(hsva[0], 1, 1, 'hsv').css());
	let fullColor = $derived(chroma(hsva[0], hsva[1], hsva[2], 'hsv').css());

	function draggable(
		node: HTMLElement,
		params: {
			onMove: (x: number, y: number) => void;
		}
	) {
		let active = false;

		function getPos(e: MouseEvent | TouchEvent) {
			const rect = node.getBoundingClientRect();
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

			const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
			const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);

			return { x: x / rect.width, y: y / rect.height };
		}

		function handleStart(e: MouseEvent | TouchEvent) {
			if (e.cancelable) e.preventDefault();
			active = true;
			isDragging = true;

			const { x, y } = getPos(e);
			params.onMove(x, y);

			window.addEventListener('mousemove', handleMove);
			window.addEventListener('touchmove', handleMove, { passive: false });
			window.addEventListener('mouseup', handleEnd);
			window.addEventListener('touchend', handleEnd);
		}

		function handleMove(e: MouseEvent | TouchEvent) {
			if (!active) return;
			if (e.cancelable) e.preventDefault();
			const { x, y } = getPos(e);
			params.onMove(x, y);
		}

		function handleEnd() {
			active = false;
			isDragging = false;
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('touchmove', handleMove);
			window.removeEventListener('mouseup', handleEnd);
			window.removeEventListener('touchend', handleEnd);
		}

		node.addEventListener('mousedown', handleStart);
		node.addEventListener('touchstart', handleStart);

		return {
			destroy() {
				node.removeEventListener('mousedown', handleStart);
				node.removeEventListener('touchstart', handleStart);
			}
		};
	}
</script>

<div class="flex w-full touch-none flex-col gap-4 select-none">
	<div
		class="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-700/50 shadow-inner"
		style="background-color: {hueColor};"
		use:draggable={{
			onMove: (x, y) => {
				updateColor([hsva[0], x, 1 - y, hsva[3]]);
			}
		}}
	>
		<div class="absolute inset-0 bg-linear-to-r from-white to-transparent mix-blend-normal"></div>
		<div class="absolute inset-0 bg-linear-to-t from-black to-transparent"></div>

		<div
			class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 shadow-sm ring-1 ring-black/20"
			style="
                background-color: {fullColor};
                left: {hsva[1] * 100}%;
                top: {(1 - hsva[2]) * 100}%;
            "
		></div>
	</div>

	<div class="flex items-center gap-3">
		<div
			class="relative h-4 flex-1 cursor-pointer rounded-full"
			style="background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);"
			use:draggable={{
				onMove: (x) => {
					updateColor([x * 360, hsva[1], hsva[2], hsva[3]]);
				}
			}}
		>
			<div
				class="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-md"
				style="left: {(hsva[0] / 360) * 100}%"
			></div>
		</div>

		<div
			class="h-8 w-8 rounded-full border border-zinc-700 shadow-sm"
			style="background-color: {fullColor};"
		></div>
	</div>
</div>
