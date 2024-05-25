import type { WorkoutPhase } from './WorkoutPhase';

export class WorkoutRoutine {
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

export const fourByFour = new WorkoutRoutine([
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
