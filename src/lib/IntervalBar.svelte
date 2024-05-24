<script lang="ts">
    import { onDestroy } from 'svelte';

    class IntervalBar {
        min: number;
        max: number;
        intervals: { min: number, max: number, color: string }[];
        currentValue: number;
        direction: number;
        timer: NodeJS.Timeout | null;

        constructor(min: number, max: number, intervals: { min: number, max: number, color: string }[]) {
            this.min = min;
            this.max = max;
            this.intervals = intervals;
            this.currentValue = min;
            this.direction = 1;
            this.timer = null;
        }

        startAnimation(callback: (value: number) => void) {
            this.timer = setInterval(() => {
                if (this.direction === 1) {
                    this.currentValue += 1;
                    if (this.currentValue >= this.max) {
                        this.direction = -1;
                    }
                } else {
                    this.currentValue -= 1;
                    if (this.currentValue <= this.min) {
                        this.direction = 1;
                    }
                }
                callback(this.currentValue);
            }, 50);
        }

        stopAnimation() {
            if (this.timer) clearInterval(this.timer);
        }

        calculateNeedlePosition() {
            const cappedValue = Math.max(this.min, Math.min(this.max, this.currentValue));
            const position = ((cappedValue - this.min) / (this.max - this.min)) * 100;
            return position;
        }

        getSegmentWidths() {
            return this.intervals.map((interval, index) => {
                const width = ((interval.max - interval.min) / (this.max - this.min)) * 100;
                const isLast = index === this.intervals.length - 1;
                return { width, color: interval.color, isLast };
            });
        }
    }

    const intervals = [
        { min: 0, max: 130, color: 'white' },
        { min: 130, max: 140, color: 'green' },
        { min: 140, max: 180, color: 'yellow' },
        { min: 180, max: 190, color: 'red' },
        { min: 190, max: 300, color: 'darkred' }
    ];

    const intervalBar = new IntervalBar(0, 300, intervals);

    let currentValue = intervalBar.currentValue;
    let needlePosition = intervalBar.calculateNeedlePosition();
    let segmentWidths = intervalBar.getSegmentWidths();

    function updateDisplay() {
        currentValue = intervalBar.currentValue;
        needlePosition = intervalBar.calculateNeedlePosition();
        segmentWidths = intervalBar.getSegmentWidths();
    }

    onDestroy(() => {
        intervalBar.stopAnimation();
    });

    intervalBar.startAnimation(updateDisplay);
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

    .interval-bar {
        margin: 20px 0;
    }

    .bar {
        width: 300px;
        height: 20px;
        background: #333;
        position: relative;
        margin: 10px auto;
        border-radius: 10px;
        overflow: hidden;
    }

    .segment {
        position: absolute;
        height: 100%;
    }

    .segment:first-of-type {
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }

    .segment.last {
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
    }

    .needle {
        width: 2px;
        height: 30px;
        background: white;
        position: absolute;
        top: -5px;
        border-radius: 2px;
    }

    .value {
        margin-top: 10px;
        font-size: 24px;
    }

    .white {
        color: white !important;
    }

    .green {
        color: green !important;
    }

    .yellow {
        color: yellow !important;
    }

    .red {
        color: red !important;
    }

    .darkred {
        color: darkred !important;
    }
</style>

<div class="container">
    <div class="interval-bar">
        <h2>Value</h2>
        <div class="bar">
            {#each segmentWidths as { width, color, isLast }, i}
                <div 
                    class="segment {isLast ? 'last' : ''}" 
                    style="left: {segmentWidths.slice(0, i).reduce((sum, s) => sum + s.width, 0)}%; width: {width}%; background: {color};">
                </div>
            {/each}
            <div class="needle" style="left: {needlePosition}%;"></div>
        </div>
        <div class="value {intervals.find(interval => currentValue >= interval.min && currentValue <= interval.max)?.color}">
            {currentValue}
        </div>
    </div>
</div>
