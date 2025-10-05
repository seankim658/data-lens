import type { LensConfig } from "@/types/api";
import { Button } from "@/components/ui/button";
import { LensControls } from "@/components/LensControl";

interface LensPanelProps {
  compatibleLenses: LensConfig[];
  activeLens: LensConfig | null;
  onSelectLens: (lens: LensConfig | null) => void;
}

export function LensPanel({
  compatibleLenses,
  activeLens,
  onSelectLens,
}: LensPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-left">Interactive Lenses</h3>
      {compatibleLenses.length > 0 ? (
        compatibleLenses.map((lens) => (
          <Button
            key={lens.id}
            variant={activeLens?.id === lens.id ? "secondary" : "outline"}
            className="w-full justify-start"
            onClick={() =>
              onSelectLens(activeLens?.id === lens.id ? null : lens)
            }
          >
            {lens.name}
          </Button>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-left">
          No compatible lenses for this chart type.
        </p>
      )}

      {activeLens && <LensControls activeLens={activeLens} />}
    </div>
  );
}
