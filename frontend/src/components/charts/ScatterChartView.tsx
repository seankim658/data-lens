/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import type { ColumnMapping } from "@/types/charts";

interface ChartViewProps {
  data: any[];
  mapping: ColumnMapping;
}

export function ScatterChartView({ data, mapping }: ChartViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawChart = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const canvas = d3.select(canvasRef.current);
    const context = (canvas.node() as HTMLCanvasElement)?.getContext("2d");

    if (!svg || !canvas || !context || data.length === 0) return;

    svg.select("*").remove();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    const parent = svg.node()?.parentNode as HTMLElement;
    const { width, height } = parent.getBoundingClientRect();

    svg.attr("width", width).attr("height", height);
    canvas.attr("width", width).attr("height", height);

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // 1. Use D3 to create scales
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.x) as [number, number])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.y) as [number, number])
      .range([height - margin.bottom, margin.top]);

    // 2. Use D3 to draw axes on the SVG
    const xAxis = (g: any) =>
      g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    const yAxis = (g: any) =>
      g.attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // 3. Use D3 scales to draw points on the Canvas
    context.fillStyle = "var(--color-chart-4)";
    data.forEach((d) => {
      context.beginPath();
      // Use the D3 scales to get the pixel position
      const px = x(d.x);
      const py = y(d.y);
      // Draw a circle on the canvas context
      context.arc(px, py, 2.5, 0, 2 * Math.PI);
      context.fill();
    });
  }, [data]);

  useEffect(() => {
    drawChart();
    // Add resize observer if needed
  }, [drawChart]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <svg ref={svgRef} style={{ position: "absolute", top: 0, left: 0 }} />
    </div>
  );
}
