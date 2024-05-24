<script lang="ts">
    // Import onDestroy from Svelte to handle cleanup
    import { onDestroy } from 'svelte';

    // Define the IntervalBar class to manage the bar's state and behavior
    class IntervalBar {
        min: number; // Minimum value of the bar
        max: number; // Maximum value of the bar
        intervals: { min: number, max: number, color: string }[]; // Array of interval objects
        currentValue: number; // Current value of the bar
        direction: number; // Direction of value change (1 for increasing, -1 for decreasing)
        timer: NodeJS.Timeout | null; // Timer for the animation

        // Constructor to initialize the IntervalBar instance
        constructor(min: number, max: number, intervals: { min: number, max: number, color: string }[]) {
            this.min = min;
            this.max = max;
            this.intervals = intervals;
            this.currentValue = min;
            this.direction = 1;
            this.timer = null;
        }

        // Method to start the animation and update the current value
        startAnimation(callback: (value: number) => void) {
            this.timer = setInterval(() => {
                // Update the current value based on the direction
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
                // Call the callback function to update the display
                callback(this.currentValue);
            }, 50); // Update every 50 milliseconds
        }

        // Method to stop the animation
        stopAnimation() {
            if (this.timer) clearInterval(this.timer);
        }

        // Method to calculate the needle position as a percentage
        calculateNeedlePosition() {
            const cappedValue = Math.max(this.min, Math.min(this.max, this.currentValue));
            const position = ((cappedValue - this.min) / (this.max - this.min)) * 100;
            return position;
        }

        // Method to calculate the width and color of each interval segment
        getSegmentWidths() {
            return this.intervals.map((interval, index) => {
                const width = ((interval.max - interval.min) / (this.max - this.min)) * 100;
                const isLast = index === this.intervals.length - 1;
                return { width, color: interval.color, isLast };
            });
        }

        // Method to get the color class for the current value
        getColorClass() {
            const interval = this.intervals.find(interval => this.currentValue >= interval.min && this.currentValue <= interval.max);
            if (interval) {
                switch(interval.color) {
                    case '#4E4E4E': return 'dark-gray';
                    case '#3A6351': return 'dark-green';
                    case '#A4A90D': return 'olive';
                    case '#FF8C42': return 'dark-orange';
                    case '#B33030': return 'dark-red';
                    default: return '';
                }
            }
            return '';
        }
    }

    // Define the intervals for the bar
    const intervals = [
        { min: 0, max: 130, color: '#4E4E4E' }, // Dark Gray
        { min: 130, max: 140, color: '#3A6351' }, // Dark Green
        { min: 140, max: 180, color: '#A4A90D' }, // Olive
        { min: 180, max: 190, color: '#FF8C42' }, // Dark Orange
        { min: 190, max: 300, color: '#B33030' } // Dark Red
    ];

    // Create an instance of IntervalBar
    const intervalBar = new IntervalBar(0, 300, intervals);

    let currentValue = intervalBar.currentValue; // Initialize the current value
    let needlePosition = intervalBar.calculateNeedlePosition(); // Calculate the initial needle position
    let segmentWidths = intervalBar.getSegmentWidths(); // Calculate the initial segment widths
    let colorClass = intervalBar.getColorClass(); // Get the initial color class

    // Function to update the display when the value changes
    function updateDisplay() {
        currentValue = intervalBar.currentValue;
        needlePosition = intervalBar.calculateNeedlePosition();
        segmentWidths = intervalBar.getSegmentWidths();
        colorClass = intervalBar.getColorClass();
    }

    // Cleanup the interval on component destruction
    onDestroy(() => {
        intervalBar.stopAnimation();
    });

    // Start the animation when the component is initialized
    intervalBar.startAnimation(updateDisplay);
</script>

<style>
    /* Container for the entire component */
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

    /* Wrapper for the interval bar */
    .interval-bar {
        margin: 20px 0;
    }

    /* Background bar for the intervals without a border */
    .bar {
        width: 300px;
        height: 20px;
        background: #333;
        position: relative;
        margin: 10px auto;
        border-radius: 10px;
        overflow: hidden;
    }

    /* Individual interval segments */
    .segment {
        position: absolute;
        height: 100%;
    }

    /* Styling for the first segment */
    .segment:first-of-type {
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }

    /* Styling for the last segment */
    .segment.last {
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
    }

    /* Needle indicating the current value */
    .needle {
        width: 2px;
        height: 30px;
        background: white;
        position: absolute;
        top: -5px;
        border-radius: 2px;
    }

    /* Display for the current value */
    .value {
        margin-top: 10px;
        font-size: 24px;
    }

    /* Color classes for different value ranges */
    .dark-gray {
        color: #4E4E4E !important;
    }

    .dark-green {
        color: #3A6351 !important;
    }

    .olive {
        color: #A4A90D !important;
    }

    .dark-orange {
        color: #FF8C42 !important;
    }

    .dark-red {
        color: #B33030 !important;
    }
</style>

<!-- Main container for the interval bar component -->
<div class="container">
    <div class="interval-bar">
        <h2>Value</h2>
        <div class="bar">
            <!-- Loop through each segment and display it with appropriate styling -->
            {#each segmentWidths as { width, color, isLast }, i}
                <div 
                    class="segment {isLast ? 'last' : ''}" 
                    style="left: {segmentWidths.slice(0, i).reduce((sum, s) => sum + s.width, 0)}%; width: {width}%; background: {color};">
                </div>
            {/each}
            <!-- Needle indicating the current value position -->
            <div class="needle" style="left: {needlePosition}%;"></div>
        </div>
        <!-- Display the current value with the appropriate color class -->
        <div class="value {colorClass}">
            {currentValue}
        </div>
    </div>
</div>
