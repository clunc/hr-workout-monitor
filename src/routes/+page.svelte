<script lang="ts">
    import IntervalBar from '$lib/IntervalBar.svelte';
    import WorkoutTimer from '$lib//WorkoutTimer.svelte';
</script>

<WorkoutTimer warmUpDuration={2} roundDuration={2} restDuration={2} totalRounds={3} />
<IntervalBar />
