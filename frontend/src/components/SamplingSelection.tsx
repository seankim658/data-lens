import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  samplingConfigMap,
  type SamplingConfig,
} from "@/config/samplingConfig";

interface SamplingSelectionProps {
  supportedMethods: { id: string; name: string; description: string }[];
  onSelectMethod: (method: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function SamplingSelection({
  supportedMethods,
  onSelectMethod,
  onSkip,
  onBack,
}: SamplingSelectionProps) {
  const methodsWithConfig: SamplingConfig[] = supportedMethods
    .map((method) => samplingConfigMap.get(method.id))
    .filter((config): config is SamplingConfig => !!config);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Dataset Too Large</h2>
        <p className="text-muted-foreground">
          Your dataset is very large, which may slow down rendering and
          potentially crash the browser tab. Please select a sampling method to
          continue.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methodsWithConfig.map((method, index) => (
          <Card
            key={method.id}
            onClick={() => onSelectMethod(method.id)}
            className="cursor-pointer hover:border-primary transition-colors group text-left opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <method.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
              <div>
                <CardTitle>{method.name}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="flex justify-between mt-12">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button variant="secondary" onClick={onSkip}>
          Proceed Without Sampling
        </Button>
      </div>
    </div>
  );
}
