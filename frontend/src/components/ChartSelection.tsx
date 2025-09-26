import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { chartConfigs } from "@/config/chartConfig";

interface ChartSelectionProps {
  onSelectChart: (chartType: string) => void;
}

export const ChartSelection: React.FC<ChartSelectionProps> = ({
  onSelectChart,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Choose a Visualization</h2>
        <p className="text-muted-foreground">
          Select an initial chart type to begin your investigation.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartConfigs.map((chart, index) => (
          <Card
            key={chart.id}
            onClick={() => onSelectChart(chart.id)}
            className="cursor-pointer hover:border-primary transition-colors group text-left opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <chart.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
              <div>
                <CardTitle>{chart.name}</CardTitle>
                <CardDescription>{chart.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};
