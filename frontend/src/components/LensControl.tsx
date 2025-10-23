import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { LensConfig } from "@/types/api";

interface LensControlProps {
  activeLens: LensConfig;
  // TODO : Add state update functions here later
}

export function LensControls({ activeLens }: LensControlProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{activeLens.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeLens.controls.map((control) => {
          switch (control.type) {
            case "draggable_handle":
              return (
                <div key={control.target} className="space-y-2">
                  <Label htmlFor={control.target}>{control.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    (Slider Placeholder for Draggable Handle)
                  </p>
                </div>
              );
            // TODO : Add other cases here
            default:
              return (
                <p key={control.target} className="text-sm text-red-500">
                  Unsupported control type: {control.type}
                </p>
              );
          }
        })}
      </CardContent>
    </Card>
  );
}
