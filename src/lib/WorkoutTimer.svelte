<script lang="ts">
    // Importing the onDestroy lifecycle function from Svelte
    import { onDestroy } from 'svelte';

    import { TimerState } from './TimerState';
    import { WorkoutRoutine } from './WorkoutRoutine';

    // Class to manage the workout timer
    class WorkoutTimer {
        routine: WorkoutRoutine;
        currentPhaseIndex: number;
        currentTime: number;
        state: TimerState;
        workoutTimer: number | null;
        interval: number;
        onUpdate: () => void;
        currentRound: number;
        static readonly TIMER_INTERVAL = 1000; // Timer interval in milliseconds

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

        // Start the timer
        startTimer() {
            if (this.state === TimerState.STOPPED || this.state === TimerState.FINISHED) {
                this.state = TimerState.RUNNING;
                this.setPhase(0);
                this.startWorkoutInterval();
                this.onUpdate();
            }
        }

        // Start the workout interval
        startWorkoutInterval() {
            this.workoutTimer = window.setInterval(() => this.updateTime(), WorkoutTimer.TIMER_INTERVAL);
        }

        // Update the timer
        updateTime() {
            if (this.currentTime > 0) {
                this.currentTime--;
            } else {
                this.advancePhase();
            }
            this.onUpdate();
        }

        // Advance to the next phase
        advancePhase() {
            if (this.currentPhaseIndex < this.routine.getTotalPhases() - 1) {
                this.setPhase(this.currentPhaseIndex + 1);
            } else {
                this.finishWorkout();
            }
        }

        // Set the current phase
        setPhase(index: number) {
            this.currentPhaseIndex = index;
            this.currentTime = this.routine.getPhase(index).duration;
            this.updateCurrentRound();
            this.onUpdate();
        }

        // Update the current round number
        updateCurrentRound() {
            let roundIndex = 0;
            for (let i = 0; i <= this.currentPhaseIndex; i++) {
                if (this.routine.getPhase(i).name === 'Round') {
                    roundIndex++;
                }
            }
            this.currentRound = roundIndex;
        }

        // Pause the timer
        pauseTimer() {
            if (this.state === TimerState.RUNNING) {
                this.state = TimerState.PAUSED;
                this.clearWorkoutInterval();
                this.onUpdate();
            }
        }

        // Continue the timer
        continueTimer() {
            if (this.state === TimerState.PAUSED) {
                this.state = TimerState.RUNNING;
                this.startWorkoutInterval();
                this.onUpdate();
            }
        }

        // Stop the timer
        stopTimer() {
            if (this.state === TimerState.RUNNING || this.state === TimerState.PAUSED) {
                this.state = TimerState.STOPPED;
                this.clearWorkoutInterval();
                this.resetTimer();
                this.onUpdate();
            }
        }

        // Finish the workout
        finishWorkout() {
            this.state = TimerState.FINISHED;
            this.clearWorkoutInterval();
            this.onUpdate();
        }

        // Reset the timer
        resetTimer() {
            this.clearWorkoutInterval();
            this.currentPhaseIndex = 0;
            this.currentTime = 0;
            this.state = TimerState.STOPPED;
            this.updateCurrentRound();
            this.onUpdate();
        }

        // Get the name of the current phase
        getCurrentPhaseName(): string {
            if (this.state === TimerState.STOPPED) return 'Stopped';
            if (this.state === TimerState.FINISHED) return 'Finished';
            return this.routine.getPhase(this.currentPhaseIndex)?.name;
        }

        // Get the current round number
        getCurrentRound(): number {
            return this.currentRound;
        }

        // Get the current state of the timer
        getState(): TimerState {
            return this.state;
        }

        // Get the current time remaining in the phase
        getTime(): number {
            return this.currentTime;
        }

        // Update the state
        updateState() {
            this.onUpdate();
        }

        // Cleanup method to clear intervals
        cleanup() {
            clearInterval(this.interval);
            this.clearWorkoutInterval();
        }

        // Private method to clear the workout interval
        private clearWorkoutInterval() {
            if (this.workoutTimer !== null) {
                clearInterval(this.workoutTimer);
                this.workoutTimer = null;
            }
        }
    }

    // Defining a sample workout routine with phases
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

    // Initializing the selected routine and workout timer
    let selectedRoutine = fourByFour;
    let workoutTimer = new WorkoutTimer(selectedRoutine, updateState);

    // Defining state variables
    let currentTime = workoutTimer.getTime();
    let currentPhase = workoutTimer.getCurrentPhaseName();
    let state = workoutTimer.getState();
    let totalRounds = selectedRoutine.phases.filter(phase => phase.name === 'Round').length;
    let currentRound = workoutTimer.getCurrentRound();

    // Function to start the timer
    function startTimer() {
        workoutTimer.startTimer();
    }

    // Function to toggle between pause and continue
    function togglePauseContinue() {
        if (state === TimerState.PAUSED) {
            workoutTimer.continueTimer();
        } else if (state === TimerState.RUNNING) {
            workoutTimer.pauseTimer();
        }
    }

    // Function to stop the timer
    function stopTimer() {
        workoutTimer.stopTimer();
    }

    // Function to update the state variables
    function updateState() {
        currentTime = workoutTimer.getTime();
        currentPhase = workoutTimer.getCurrentPhaseName();
        state = workoutTimer.getState();
        currentRound = workoutTimer.getCurrentRound();
    }

    // Cleanup interval on component destroy
    onDestroy(() => {
        workoutTimer.cleanup();
    });

    // Reactive statements for timer label and time display
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
    <div class="round-counter" hidden={currentPhase === 'Stopped' || currentPhase === 'Finished'}>
        Round: {currentPhase === 'Warm Up' || currentPhase === 'Cool Down' ? 0 : currentRound} / {totalRounds}
    </div>
    <div class="controls">
        {#if state === TimerState.STOPPED || state === TimerState.FINISHED}
            <button on:click={startTimer}>
                <i class="fas fa-play icon"></i> {state === TimerState.STOPPED ? 'Start' : 'Restart'}
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
