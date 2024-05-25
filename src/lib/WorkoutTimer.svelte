<script lang="ts">
    import { onDestroy } from 'svelte';

    enum TimerState {
        STOPPED = 'stopped',
        RUNNING = 'running',
        PAUSED = 'paused'
    }

    interface WorkoutPhase {
        name: string;
        duration: number;
    }

    class WorkoutRoutine {
        phases: WorkoutPhase[];

        constructor(phases: WorkoutPhase[]) {
            this.phases = phases;
        }

        getPhase(index: number): WorkoutPhase {
            return this.phases[index];
        }

        getTotalPhases(): number {
            return this.phases.length;
        }
    }

    class WorkoutTimer {
        routine: WorkoutRoutine;
        currentPhaseIndex: number;
        currentTime: number;
        state: TimerState;
        workoutTimer: number | null;
        interval: number;
        onUpdate: () => void;
        currentRound: number;
        static readonly TIMER_INTERVAL = 1000;

        constructor(routine: WorkoutRoutine, onUpdate: () => void) {
            this.routine = routine;
            this.onUpdate = onUpdate;
            this.currentPhaseIndex = 0;
            this.currentTime = 0;
            this.state = TimerState.STOPPED;
            this.currentRound = 0;
            this.workoutTimer = null;
            this.interval = setInterval(() => {
                if (this.state === TimerState.RUNNING) {
                    this.updateState();
                }
            }, WorkoutTimer.TIMER_INTERVAL);
        }

        startTimer() {
            if (this.state === TimerState.STOPPED) {
                this.state = TimerState.RUNNING;
                this.setPhase(0);
                this.startWorkoutInterval();
                this.onUpdate();
            }
        }

        startWorkoutInterval() {
            this.workoutTimer = window.setInterval(() => this.updateTime(), WorkoutTimer.TIMER_INTERVAL);
        }

        updateTime() {
            if (this.currentTime > 0) {
                this.currentTime--;
            } else {
                this.advancePhase();
            }
            this.onUpdate();
        }

        advancePhase() {
            if (this.currentPhaseIndex < this.routine.getTotalPhases() - 1) {
                this.setPhase(this.currentPhaseIndex + 1);
            } else {
                this.stopTimer(); // Changed from endWorkout to stopTimer
            }
        }

        setPhase(index: number) {
            this.currentPhaseIndex = index;
            this.currentTime = this.routine.getPhase(index).duration;
            this.updateCurrentRound();
            this.onUpdate();
        }

        updateCurrentRound() {
            let roundIndex = 0;
            for (let i = 0; i <= this.currentPhaseIndex; i++) {
                if (this.routine.getPhase(i).name === 'Round') {
                    roundIndex++;
                }
            }
            this.currentRound = roundIndex;
        }

        pauseTimer() {
            if (this.state === TimerState.RUNNING) {
                this.state = TimerState.PAUSED;
                this.clearWorkoutInterval();
                this.onUpdate();
            }
        }

        continueTimer() {
            if (this.state === TimerState.PAUSED) {
                this.state = TimerState.RUNNING;
                this.startWorkoutInterval();
                this.onUpdate();
            }
        }

        stopTimer() {
            if (this.state === TimerState.RUNNING || this.state === TimerState.PAUSED) {
                this.state = TimerState.STOPPED;
                this.clearWorkoutInterval();
                this.resetTimer();
                this.onUpdate();
            }
        }

        resetTimer() {
            this.clearWorkoutInterval();
            this.currentPhaseIndex = 0;
            this.currentTime = 0;
            this.state = TimerState.STOPPED;
            this.updateCurrentRound();
            this.onUpdate();
        }

        getCurrentPhaseName(): string {
            return this.state === TimerState.STOPPED ? 'Stopped' : this.routine.getPhase(this.currentPhaseIndex)?.name;
        }

        getCurrentRound(): number {
            return this.currentRound;
        }

        getState(): TimerState {
            return this.state;
        }

        getTime(): number {
            return this.currentTime;
        }

        updateState() {
            this.onUpdate();
        }

        cleanup() {
            clearInterval(this.interval);
            this.clearWorkoutInterval();
        }

        private clearWorkoutInterval() {
            if (this.workoutTimer !== null) {
                clearInterval(this.workoutTimer);
                this.workoutTimer = null;
            }
        }
    }

    const fourByFour = new WorkoutRoutine([
        { name: 'Warm Up', duration: 2 },
        { name: 'Round', duration: 2 },
        { name: 'Rest', duration: 2 },
        { name: 'Round', duration: 2 },
        { name: 'Rest', duration: 2 },
        { name: 'Round', duration: 2 },
        { name: 'Rest', duration: 2 },
        { name: 'Round', duration: 2 },
        { name: 'Cool Down', duration: 2 }
    ]);

    let selectedRoutine = fourByFour;
    let workoutTimer = new WorkoutTimer(selectedRoutine, updateState);

    let currentTime = workoutTimer.getTime();
    let currentPhase = workoutTimer.getCurrentPhaseName();
    let state = workoutTimer.getState();
    let totalRounds = selectedRoutine.phases.filter(phase => phase.name === 'Round').length;
    let currentRound = workoutTimer.getCurrentRound();

    function startTimer() {
        workoutTimer.startTimer();
    }

    function togglePauseContinue() {
        if (state === TimerState.PAUSED) {
            workoutTimer.continueTimer();
        } else if (state === TimerState.RUNNING) {
            workoutTimer.pauseTimer();
        }
    }

    function stopTimer() {
        workoutTimer.stopTimer();
    }

    function updateState() {
        currentTime = workoutTimer.getTime();
        currentPhase = workoutTimer.getCurrentPhaseName();
        state = workoutTimer.getState();
        currentRound = workoutTimer.getCurrentRound();
    }

    onDestroy(() => {
        workoutTimer.cleanup();
    });

    $: timerLabel = currentPhase;
    $: timeDisplay = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`;
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

    .controls {
        display: flex;
        justify-content: center;
        gap: 10px;
    }

    .controls button {
        padding: 10px 20px;
        font-size: 16px;
        cursor: pointer;
        border: none;
        border-radius: 5px;
        background-color: #007bff;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 120px;
    }

    .controls button:disabled {
        background-color: #555;
    }

    #stop-btn {
        background-color: #dc3545;
    }

    .round-counter {
        margin: 10px 0;
        font-size: 20px;
    }

    .icon {
        margin-right: 8px;
    }
</style>

<div class="container">
    <div class="timer">
        <h2>{timerLabel}</h2>
        <h3 id="time">{timeDisplay}</h3>
    </div>
    <div class="round-counter" hidden={currentPhase === 'Stopped'}>
        Round: {currentPhase === 'Warm Up' || currentPhase === 'Cool Down' ? 0 : currentRound} / {totalRounds}
    </div>
    <div class="controls">
        {#if state === TimerState.STOPPED}
            <button on:click={startTimer}>
                <i class="fas fa-play icon"></i> Start
            </button>
        {:else if state === TimerState.RUNNING}
            <button on:click={togglePauseContinue}>
                <i class="fas fa-pause icon"></i> Pause
            </button>
            <button id="stop-btn" on:click={stopTimer}>
                <i class="fas fa-stop icon"></i> Stop
            </button>
        {:else if state === TimerState.PAUSED}
            <button on:click={togglePauseContinue}>
                <i class="fas fa-play icon"></i> Continue
            </button>
            <button id="stop-btn" on:click={stopTimer}>
                <i class="fas fa-stop icon"></i> Stop
            </button>
        {/if}
    </div>
</div>
