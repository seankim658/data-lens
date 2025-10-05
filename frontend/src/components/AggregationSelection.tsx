import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  aggregationConfigMap,
  type AggregationConfig,
  type AggregationMethods,
} from "@/config/aggregationConfig";
import { cn } from "@/lib/utils";

interface AggregationSelectionProps {
  supportedMethods: AggregationMethods[];
  onSelection: (method: AggregationMethods) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function AggregationSelection({
  supportedMethods,
  onSelection,
  onBack,
  onContinue,
}: AggregationSelectionProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<AggregationMethods | null>(null);

  const methodsWithConfig: AggregationConfig[] = supportedMethods
    .map((method) => aggregationConfigMap.get(method))
    .filter((config): config is AggregationConfig => !!config);

  const handleSelect = (methodId: AggregationMethods) => {
    setSelectedMethod(methodId);
    onSelection(methodId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Choose an Aggregation Method</h2>
        <p className="text-muted-foreground">
          How should we group your data? This is a crucial step in summarizing
          large datasets.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          Continue
        </Button>
      </div>
    </div>
  );
}
