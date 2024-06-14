<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';

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

    // Create an instance of the EventEmitter for the value stream
    const valueStream = new EventEmitter();

    let data = Array(30).fill({ time: null, value: null });
    let interval = null;

    const updateData = (newValue: number) => {
        data.shift();
        data.push({ time: new Date(), value: newValue });
    };

    const startUpdating = () => {
        valueStream.on('newValue', (newValue: number) => {
            updateData(newValue);
            updateChart();
        });
    };

    const drawChart = () => {
        const svg = d3.select('svg');
        const width = +svg.attr('width');
        const height = +svg.attr('height');
        const margin = { top: 20, right: 20, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Initial Axes setup
        const now = new Date();
        const thirtySecondsAgo = new Date(now.getTime() - 30000);

        const x = d3.scaleTime()
            .domain([thirtySecondsAgo, now])
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, 200]) // Initial y domain setup, adjust as needed
            .range([innerHeight, 0]);

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%H:%M:%S')))
            .selectAll("text")
            .style("fill", "#fff");

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", "#fff");
    };

    const updateChart = () => {
        const svg = d3.select('svg');
        svg.selectAll('.line-path').remove();

        const width = +svg.attr('width');
        const height = +svg.attr('height');
        const margin = { top: 20, right: 20, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const now = new Date();
        const thirtySecondsAgo = new Date(now.getTime() - 30000);

        const validData = data.filter(d => d.time !== null);
        const x = d3.scaleTime()
            .domain([thirtySecondsAgo, now])
            .range([0, innerWidth]);

        const yExtent = d3.extent(validData, d => d.value);
        const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

        const y = d3.scaleLinear()
            .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
            .range([innerHeight, 0]);

        const line = d3.line()
            .defined(d => d.value !== null)
            .x(d => x(d.time))
            .y(d => y(d.value));

        const g = svg.select('g');

        g.append('path')
            .datum(validData)
            .attr('class', 'line-path')
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 1.5)
            .attr('d', line);

        // Update axes
        g.select('.x-axis')
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%H:%M:%S')))
            .selectAll("text")
            .style("fill", "#fff");

        g.select('.y-axis')
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", "#fff");
    };

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

    onMount(() => {
        drawChart();
        startUpdating();
        initWebSocket();
        return () => {
            if (ws) {
                ws.close();
            }
        };
    });
</script>

<style>
    svg {
        display: block;
        margin: 10px auto;
        background-color: #1e1e1e;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    }
</style>

<svg width="580" height="250"></svg>
