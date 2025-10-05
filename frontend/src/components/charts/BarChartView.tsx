import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { ChartViewProps } from "@/types/charts";

export function BarChartView({
  data,
  chartTitle,
  xAxisTitle,
  yAxisTitle,
  yDomain,
}: ChartViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    // Use ResizeObserver to get container dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;

      // Clear previous render
      svg.selectAll("*").remove();

      const margin = { top: 40, right: 20, bottom: 60, left: 70 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // D3 Scales
      const xScale = d3
        .scaleBand()
        .domain(data.map((d) => d.x))
        .range([0, innerWidth])
        .padding(0.1);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.y) || 0])
        .nice()
        .range([innerHeight, 0]);

      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Draw Axes
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSizeOuter(0));

      g.append("g").call(d3.axisLeft(yScale));

      // Draw Bars
      g.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d) => xScale(d.x)!)
        .attr("y", (d) => yScale(d.y))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => innerHeight - yScale(d.y))
        .attr("fill", "var(--color-chart-1)");

      // Add Labels
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

    // Cleanup observer on component unmount
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
