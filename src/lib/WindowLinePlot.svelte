<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let data = Array(10).fill({ time: null, value: null });
  let interval = null;
  let increasing = true;

  const updateData = () => {
    const lastValue = data.filter(d => d.value !== null).slice(-1)[0]?.value ?? 0;
    let newValue;

    if (increasing) {
      newValue = lastValue + 1;
      if (newValue >= 50) {
        increasing = false;
      }
    } else {
      newValue = lastValue - 1;
      if (newValue <= 0) {
        increasing = true;
      }
    }

    data.shift();
    data.push({ time: new Date(), value: newValue });
  };

  const startUpdating = () => {
    interval = setInterval(() => {
      updateData();
      drawChart();
    }, 1001);
  };

  const drawChart = () => {
    const svg = d3.select('svg');
    svg.selectAll('*').remove();

    const width = +svg.attr('width');
    const height = +svg.attr('height');
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10000);

    const validData = data.filter(d => d.time !== null);
    const x = d3.scaleTime()
      .domain([tenSecondsAgo, now])
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

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('path')
      .datum(validData)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%H:%M:%S')))
      .selectAll("text")
      .style("fill", "#fff");

    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#fff");
  };

  onMount(() => {
    startUpdating();
    return () => clearInterval(interval);
  });
</script>

<svg width="580" height="250"></svg>

<style>
  svg {
    display: block;
    margin: 10px auto;
    background-color: #1e1e1e;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }
</style>
