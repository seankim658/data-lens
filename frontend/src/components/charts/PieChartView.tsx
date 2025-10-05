/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { ChartViewProps } from "@/types/charts";

export function PieChartView({ data, chartTitle }: ChartViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      svg.selectAll("*").remove();

      const radius = Math.min(width, height) / 2.5;
      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const color = d3.scaleOrdinal(
        d3.range(5).map((i) => `var(--color-chart-${i + 1})`),
      );

      const pie = d3.pie<any>().value((d) => d.y);
      const arc = d3.arc<any>().innerRadius(0).outerRadius(radius);

      const arcs = g
        .selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => color(d.data.x));

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "1.1rem")
        .style("font-weight", "600")
        .text(chartTitle);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.unobserve(container);
  }, [data, chartTitle]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <svg ref={svgRef} style={{ position: "absolute", top: 0, left: 0 }} />
    </div>
  );
}
