<script lang="ts">
	const currentYear = new Date().getFullYear();

	function getDaysInYear(year: number) {
		const date = new Date(year, 0, 1);
		const days = [];

		while (date.getFullYear() === year) {
			days.push(new Date(date));
			date.setDate(date.getDate() + 1);
		}
		return days;
	}

	const allDays = getDaysInYear(currentYear);

	const formatDateId = (date: Date) => {
		return date.toISOString().split('T')[0];
	};
</script>

<div class="h-full w-full">
	<div
		class="
            grid h-auto w-full
            grid-cols-10 place-items-center gap-y-8 py-10
            sm:h-full sm:grid-cols-[repeat(19,1fr)] md:place-content-evenly md:gap-y-0 md:py-0
        "
	>
		{#each allDays as day}
			<button
				class="h-1 w-1 rounded-full bg-rose transition-all duration-300 hover:scale-[3]"
				aria-label={day.toDateString()}
				title={day.toDateString()}
				on:click={() => console.log('Clicked:', formatDateId(day))}
			>
			</button>
		{/each}
	</div>
</div>
