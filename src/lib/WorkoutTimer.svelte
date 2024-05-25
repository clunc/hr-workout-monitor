<script lang="ts">
    import { onDestroy } from 'svelte';

    class WorkoutTimer {
        warmUpDuration: number;
        roundDuration: number;
        restDuration: number;
        totalRounds: number;
        currentTime: number;
        currentRound: number;
        phase: string;
        running: boolean;
        workoutTimer: any;

        constructor(warmUpDuration: number, roundDuration: number, restDuration: number, totalRounds: number) {
            this.warmUpDuration = warmUpDuration;
            this.roundDuration = roundDuration;
            this.restDuration = restDuration;
            this.totalRounds = totalRounds;

            this.resetTimer();
        }

        startTimer() {
            this.running = true;
            this.setPhase('Warm Up', this.warmUpDuration);
            this.startWorkoutInterval();
        }

        startWorkoutInterval() {
            this.workoutTimer = setInterval(() => this.updateTime(), 1000);
        }

        updateTime() {
            if (this.currentTime > 0) {
                this.currentTime--;
            } else {
                this.advancePhase();
            }
        }

        advancePhase() {
            switch (this.phase) {
                case 'Warm Up':
                    this.setPhase('Round', this.roundDuration);
                    break;
                case 'Round':
                    this.setPhase('Rest', this.restDuration);
                    break;
                case 'Rest':
                    this.handleRestPhaseEnd();
                    break;
            }
        }

        handleRestPhaseEnd() {
            this.currentRound++;
            if (this.currentRound < this.totalRounds) {
                this.setPhase('Round', this.roundDuration);
            } else {
                this.endWorkout();
            }
        }

        setPhase(phase: string, duration: number) {
            this.phase = phase;
            this.currentTime = duration;
        }

        endWorkout() {
            this.phase = 'Done';
            this.running = false;
            clearInterval(this.workoutTimer);
        }

        resetTimer() {
            if (this.workoutTimer) {
                clearInterval(this.workoutTimer);
            }
            this.currentTime = 0;
            this.currentRound = 0;
            this.phase = 'Warm Up';
            this.running = false;
        }
    }

    // Initialize WorkoutTimer with props
    export let warmUpDuration = 2;
    export let roundDuration = 2;
    export let restDuration = 2;
    export let totalRounds = 3;

    let workoutTimer = new WorkoutTimer(warmUpDuration, roundDuration, restDuration, totalRounds);

    let currentTime = workoutTimer.currentTime;
    let currentRound = workoutTimer.currentRound;
    let phase = workoutTimer.phase;
    let running = workoutTimer.running;

    function startTimer() {
        workoutTimer.startTimer();
        updateState();
    }

    function resetTimer() {
        workoutTimer.resetTimer();
        updateState();
    }

    function updateState() {
        currentTime = workoutTimer.currentTime;
        currentRound = workoutTimer.currentRound;
        phase = workoutTimer.phase;
        running = workoutTimer.running;
    }

    const interval = setInterval(() => {
        if (running) {
            updateState();
        }
    }, 1000);

    onDestroy(() => {
        clearInterval(interval);
        workoutTimer.resetTimer();
    });

    $: timerLabel = phase;
    $: timeDisplay = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`;
    $: roundCounter = `${Math.min(currentRound + 1, workoutTimer.totalRounds)} / ${workoutTimer.totalRounds}`;
</script>

<style>
    .container {
        text-align: center;
        background: #1e1e1e;
        color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        margin: 0 auto;
        max-width: 400px;
    }

    .timer {
        margin: 20px 0;
    }

    #time {
        font-size: 48px;
        margin: 10px 0;
    }

    .controls button {
        padding: 10px 20px;
        margin: 5px;
        font-size: 16px;
        cursor: pointer;
        border: none;
        border-radius: 5px;
        background-color: #007bff;
        color: #fff;
    }

    .controls button:disabled {
        background-color: #555;
    }

    #reset-btn {
        background-color: #dc3545;
    }

    .round-counter {
        margin: 10px 0;
        font-size: 20px;
    }
</style>

<div class="container">
    <div class="timer">
        <h2>{timerLabel}</h2>
        <h3 id="time">{timeDisplay}</h3>
    </div>
    <div class="round-counter" hidden={phase === 'Warm Up' || phase === 'Done'}>
        Round: {roundCounter}
    </div>
    <div class="controls">
        <button on:click={startTimer} disabled={running}>Start</button>
        <button id="reset-btn" on:click={resetTimer}>Reset</button>
    </div>
</div>
