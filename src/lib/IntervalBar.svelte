<script lang="ts">
    // Import onDestroy from Svelte to handle cleanup
    import { onDestroy } from 'svelte';

    // Simple event emitter class
    class EventEmitter {
        events: { [key: string]: Function[] } = {};

        on(event: string, listener: Function) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(listener);
        }

        off(event: string, listener: Function) {
            if (this.events[event]) {
                this.events[event] = this.events[event].filter(l => l !== listener);
            }
        }

        emit(event: string, data: any) {
            if (this.events[event]) {
                this.events[event].forEach(listener => listener(data));
            }
        }
    }

    // Define the Interval interface to represent each segment of the bar
    interface Interval {
        min: number; // Minimum value of the interval
        max: number; // Maximum value of the interval
        color: string; // Color of the interval
    }

    // Define the IntervalBar class to manage the bar's state and behavior
    class IntervalBar {
        min: number; // Minimum value of the bar
        max: number; // Maximum value of the bar
        intervals: Interval[]; // Array of interval objects
        currentValue: number; // Current value of the bar
        valueStream: EventEmitter; // Event emitter for the value stream
        valueListener: (value: number) => void; // Listener for value updates

        // Constructor to initialize the IntervalBar instance
        constructor(intervals: Interval[], initialValue: number, valueStream: EventEmitter) {
            this.intervals = intervals;
            this.min = Math.min(...intervals.map(interval => interval.min));
            this.max = Math.max(...intervals.map(interval => interval.max));
            this.currentValue = initialValue;
            this.valueStream = valueStream;

            // Listener to handle new values from the stream
            this.valueListener = (newValue: number) => {
                this.updateValue(newValue);
                this.updateDisplay();
            };

            // Subscribe to the value stream
            this.valueStream.on('newValue', this.valueListener);
        }

        // Method to calculate the needle position as a percentage
        calculateNeedlePosition() {
            const cappedValue = Math.max(this.min, Math.min(this.max, this.currentValue));
            return ((cappedValue - this.min) / (this.max - this.min)) * 100;
        }

        // Method to calculate the width and color of each interval segment
        getSegmentWidths() {
            return this.intervals.map((interval, index) => {
                const width = ((interval.max - interval.min) / (this.max - this.min)) * 100;
                return { width, color: interval.color, index };
            });
        }

        // Method to get the color class for the current value
        getColorClass() {
            const interval = this.intervals.find(interval => this.currentValue >= interval.min && this.currentValue <= interval.max);
            return interval ? this.getColorName(interval.color) : '';
        }

        // Private helper method to map a color to a class name
        private getColorName(color: string) {
            const colorMap: { [key: string]: string } = {
                '#4E4E4E': 'dark-gray',
                '#3A6351': 'dark-green',
                '#A4A90D': 'olive',
                '#FF8C42': 'dark-orange',
                '#B33030': 'dark-red',
            };
            return colorMap[color] || '';
        }

        // Method to update the current value from an external event
        updateValue(newValue: number) {
            this.currentValue = newValue;
        }

        // Method to update the display
        updateDisplay() {
            currentValue = this.currentValue;
            needlePosition = isNaN(this.currentValue) ? 0 : this.calculateNeedlePosition();
            segmentWidths = this.getSegmentWidths();
            colorClass = this.getColorClass();
        }

        // Unsubscribe from the value stream
        destroy() {
            this.valueStream.off('newValue', this.valueListener);
        }
    }

    // Define the intervals for the bar
    const intervals: Interval[] = [
        { min: 100, max: 130, color: '#4E4E4E' }, // Dark Gray
        { min: 130, max: 140, color: '#3A6351' }, // Dark Green
        { min: 140, max: 180, color: '#A4A90D' }, // Olive
        { min: 180, max: 190, color: '#FF8C42' }, // Dark Orange
        { min: 190, max: 200, color: '#B33030' } // Dark Red
    ];

    // Create an instance of the EventEmitter for the value stream
    const valueStream = new EventEmitter();

    // Create an instance of IntervalBar with an initial value
    let currentValue = NaN; // Initialize the current value with NaN
    const intervalBar = new IntervalBar(intervals, currentValue, valueStream);

    let needlePosition = intervalBar.calculateNeedlePosition(); // Calculate the initial needle position
    let segmentWidths = intervalBar.getSegmentWidths(); // Calculate the initial segment widths
    let colorClass = intervalBar.getColorClass(); // Get the initial color class

    // Function to update the display when the value changes
    function updateDisplay() {
        currentValue = intervalBar.currentValue;
        needlePosition = isNaN(intervalBar.currentValue) ? 0 : intervalBar.calculateNeedlePosition();
        segmentWidths = intervalBar.getSegmentWidths();
        colorClass = intervalBar.getColorClass();
    }

    // Cleanup the interval on component destruction
    onDestroy(() => {
        intervalBar.destroy();
        if (ws) {
            ws.close();
        }
    });

    // Toggle between test data and actual backend data
    const USE_TEST_HEART_RATE = false; // Set this to true to use test data

    let ws: WebSocket;

    function initWebSocket() {
        try {
            ws = new WebSocket("ws://localhost:8000/ws");

            ws.onmessage = function(event) {
                try {
                    const message = JSON.parse(event.data);
                    if (message && message.heart_rate) {
                        const newValue = message.heart_rate;
                        valueStream.emit('newValue', newValue);
                    } else {
                        console.error("Received invalid data:", message);
                    }
                } catch (error) {
                    console.error("Error parsing WebSocket message:", error);
                }
            };

            ws.onopen = function(event) {
                console.log("Connected to WebSocket server");
            };

            ws.onclose = function(event) {
                console.log("Disconnected from WebSocket server");
            };

            ws.onerror = function(event) {
                console.error("WebSocket error observed:", event);
            };
        } catch (error) {
            console.error("Failed to initialize WebSocket:", error);
        }
    }

    if (USE_TEST_HEART_RATE) {
        // Mock the backend stream of heart rate values
        let direction = 1;
        setInterval(() => {
            let newValue = isNaN(intervalBar.currentValue) ? intervalBar.min : intervalBar.currentValue + direction;
            if (newValue >= intervalBar.max) {
                newValue = intervalBar.max;
                direction = -1;
            } else if (newValue <= intervalBar.min) {
                newValue = intervalBar.min;
                direction = 1;
            }
            valueStream.emit('newValue', newValue);
        }, 100); // Emit new value every 100 milliseconds
    } else {
        initWebSocket();
    }
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

    /* Background bar for the intervals with a border */
    .bar {
        width: 300px;
        height: 20px;
        background: #333;
        position: relative;
        margin: 10px auto;
        border-radius: 10px;
        overflow: hidden;
        border: 0.5px solid #888; /* Lighter and thinner border around the bar */
    }

    /* Individual interval segments */
    .segment {
        position: absolute;
        height: 100%;
        border-radius: 0; /* Remove border-radius from segments */
    }

    /* Ensure the first and last segment properly round */
    .segment:first-of-type {
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }

    .segment:last-of-type {
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
        <h2>Heart Rate</h2>
        <div class="bar">
            <!-- Loop through each segment and display it with appropriate styling -->
            {#each segmentWidths as { width, color, index }}
                <div 
                    class="segment" 
                    style="left: {segmentWidths.slice(0, index).reduce((sum, s) => sum + s.width, 0)}%; width: {width}%; background: {color};">
                </div>
            {/each}
            <!-- Needle indicating the current value position -->
            <div class="needle" style="left: {needlePosition}%;"></div>
        </div>
        <!-- Display the current value with the appropriate color class -->
        <div class="value {colorClass}">
            {isNaN(currentValue) ? "Loading..." : currentValue}
        </div>
    </div>
</div>
