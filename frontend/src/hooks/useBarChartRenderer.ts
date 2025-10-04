/* eslint-disable  @typescript-eslint/no-explicit-any */

import { type RefObject, useCallback } from "react";
import * as d3 from "d3";

interface BarChartRendererProps {
  data: any[];
  svgRef: RefObject<SVGSVGElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  // TODO : Hook for the eventual axis lens
  yDomain?: [number, number] | null;
  chartTitle: string;
  xAxisTitle: string;
  yAxisTitle: string;
}

export const useBarChartRenderer = ({
  data,
  svgRef,
  canvasRef,
  yDomain,
  chartTitle,
  xAxisTitle,
  yAxisTitle,
}: BarChartRendererProps) => {
  const renderChart = useCallback(
    (dims: { width: number; height: number }) => {
      const svg = d3.select(svgRef.current);
      const canvas = d3.select(canvasRef.current);
      const context = (canvas.node() as HTMLCanvasElement)?.getContext("2d");

      if (!svg || !canvas || !context || data.length === 0) return;

      const { width, height } = dims;

      svg.selectAll("*").remove();
      context.clearRect(0, 0, width, height);

      const margin = { top: 40, right: 20, bottom: 60, left: 70 };

      // D3 Scales
      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.x))
        .range([margin.left, width - margin.right])
        .padding(0.1);

      const y = d3
        .scaleLinear()
        // Use the yDomain prop if provided by a lens, otherwise calculate from data
        .domain(yDomain || [0, d3.max(data, (d) => d.y) || 0])
        .nice()
        .range([height - margin.bottom, margin.top]);

      // Draw Axes on SVG
      const xAxis = (g: any) =>
        g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).tickSizeOuter(0));

      const yAxis = (g: any) =>
        g.attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

      svg.append("g").call(xAxis);
      svg.append("g").call(yAxis);

      // Add labels
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.1rem")
        .style("font-weight", "600")
        .text(chartTitle);

      // X-axis label
      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 3)
        .text(xAxisTitle);

      // Y-axis Label
      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 3)
        .text(yAxisTitle);

      // Draw Bars on Canvas
      context.fillStyle = "var(--color-chart-1)";
      data.forEach((d) => {
        const barX = x(d.x);
        if (barX === undefined) return;

        const barY = y(d.y);
        const barHeight = y(0) - barY;

        context.fillRect(barX, barY, x.bandwidth(), barHeight);
      });
    },
    [data, yDomain, svgRef, canvasRef, chartTitle, xAxisTitle, yAxisTitle],
  );

  return { renderChart };
};
