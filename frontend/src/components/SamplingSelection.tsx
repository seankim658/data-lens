import { useState } from "react";
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
  type SamplingMethods,
} from "@/config/samplingConfig";
import { cn } from "@/lib/utils";

interface SamplingSelectionProps {
  supportedMethods: SamplingMethods[];
  onSelection: (method: SamplingMethods) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function SamplingSelection({
  supportedMethods,
  onSelection,
  onContinue,
  onBack,
}: SamplingSelectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<SamplingMethods | null>(
    null,
  );

  const methodsWithConfig: SamplingConfig[] = supportedMethods
    .map((method) => samplingConfigMap.get(method))
    .filter((config): config is SamplingConfig => !!config);

  const handleSelect = (methodId: SamplingMethods) => {
    setSelectedMethod(methodId);
    onSelection(methodId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Dataset Sampling</h2>
        <p className="text-muted-foreground">
          Your dataset is large. To ensure performance, please select a sampling
          method to reduce the number of data points.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methodsWithConfig.map((method, index) => (
          <Card
            key={method.id}
            onClick={() => handleSelect(method.id)}
            className={cn(
              "cursor-pointer hover:border-primary transition-colors group text-left opacity-0 animate-fade-in-up",
              {
                "border-primary ring-2 ring-primary/50":
                  selectedMethod === method.id,
              },
            )}
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
        <Button onClick={onContinue} disabled={!selectedMethod}>
          Continue to Chart
        </Button>
      </div>
    </div>
  );
}
