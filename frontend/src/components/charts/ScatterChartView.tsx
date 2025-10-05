import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { ChartViewProps } from "@/types/charts";

export function ScatterChartView({
  data,
  chartTitle,
  xAxisTitle,
  yAxisTitle,
}: ChartViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      svg.selectAll("*").remove();

      const margin = { top: 40, right: 20, bottom: 60, left: 70 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.x) as [number, number])
        .range([0, innerWidth]);

      const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.y) as [number, number])
        .range([innerHeight, 0]);

      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));
      g.append("g").call(d3.axisLeft(yScale));

      g.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 3)
        .attr("fill", "var(--color-chart-4)");

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.1rem")
        .style("font-weight", "600")
        .text(chartTitle);
      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 3)
        .text(xAxisTitle);
      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 3)
        .text(yAxisTitle);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.unobserve(container);
  }, [data, chartTitle, xAxisTitle, yAxisTitle]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <svg ref={svgRef} style={{ position: "absolute", top: 0, left: 0 }} />
    </div>
  );
}
