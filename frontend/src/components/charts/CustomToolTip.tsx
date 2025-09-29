import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface CustomTooltipContentProps {
  active?: boolean;
  payload?: {
    name: NameType;
    value: ValueType;
    color?: string;
  }[];
  label?: string | number;
}

export function CustomTooltip({
  active,
  payload,
  label,
}: CustomTooltipContentProps) {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-card border rounded-md shadow-lg text-card-foreground">
        <p className="font-semibold">{`${label}`}</p>
        {payload.map((pld, index) => (
          <div key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value}`}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
