import { useRef, useEffect, useState, type RefObject } from "react";

interface HybridChartContainerProps {
  svgRef: RefObject<SVGSVGElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  renderChart: (dims: { width: number; height: number }) => void;
  className?: string;
}

export function HybridChartContainer({
  svgRef,
  canvasRef,
  renderChart,
  className,
}: HybridChartContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Observer detect when the container's size changes
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDims({ width, height });
      }
    });

    resizeObserver.observe(container);

    return () => resizeObserver.unobserve(container);
  }, []);

  useEffect(() => {
    // Re-render the chart whenever dimensions change
    // TODO : should we do this in the background and hide until user hypothesis is submitted?
    if (dims.width > 0 && dims.height > 0) {
      renderChart(dims);
    }
  }, [dims, renderChart]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <canvas
        ref={canvasRef}
        width={dims.width}
        height={dims.height}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <svg
        ref={svgRef}
        width={dims.width}
        height={dims.height}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}
