<script lang="ts">
	import { onMount } from 'svelte';

	let { progress = 0 } = $props();

	type Particle = {
		x: number;
		y: number;
		size: number;
		jitter: number;
		moveX: number;
		moveY: number;
		duration: number;
		delay: number;
	};

	let particles = $state<Particle[]>([]);

	onMount(() => {
		particles = Array.from({ length: 250 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: 2 + Math.random() * 4,
			jitter: (Math.random() - 0.5) * 15,

			moveX: (Math.random() - 0.5) * 20,
			moveY: (Math.random() - 0.5) * 20,
			duration: 3 + Math.random() * 5,
			delay: -Math.random() * 10
		}));
	});

	function isParticleActive(p: Particle) {
		return p.x < progress + p.jitter;
	}
</script>

<div
	class="relative h-10 w-32 overflow-hidden rounded-full border border-rose/50 bg-zinc-900 md:w-64"
>
	{#each particles as p}
		<div
			class="animate-float absolute rounded-full bg-salmon transition-opacity duration-700 ease-out"
			style="
                left: {p.x}%; 
                top: {p.y}%; 
                width: {p.size}px; 
                height: {p.size}px;
                opacity: {isParticleActive(p) ? 1 : 0};
                
                /* PASS VARIABLES TO CSS */
                --mx: {p.moveX}px;
                --my: {p.moveY}px;
                animation-duration: {p.duration}s;
                animation-delay: {p.delay}s;
            "
		></div>
	{/each}
</div>

<style>
	@keyframes float {
		0%,
		100% {
			transform: translate(-50%, -50%) translate(0px, 0px);
		}
		50% {
			transform: translate(-50%, -50%) translate(var(--mx), var(--my));
		}
	}

	.animate-float {
		animation: float linear infinite;
	}
</style>
