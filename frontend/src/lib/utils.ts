import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ColumnInfo } from "@/types/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isNumeric = (dtype: string): boolean => {
  const numericTypes = ["int", "float", "decimal"];
  return numericTypes.some((type) => dtype.toLowerCase().includes(type));
};

export const calculateColumnCounts = (
  columns: ColumnInfo[],
): Record<string, number> => {
  return columns.reduce(
    (acc, col) => {
      const typeKey = isNumeric(col.dtype) ? "numeric" : "categorical";
      acc[typeKey] = (acc[typeKey] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
};
