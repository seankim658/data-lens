import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Determines if a column's data type is numeric. Backend uses polars,
 * so matching common polars types.
 * @param type - The data type string from the backend
 * @returns True if the data type is numeric
 */
export const isNumeric = (dtype: string): boolean => {
  const numericTypes = ["int", "float", "decimal"];
  return numericTypes.some((type) => dtype.toLowerCase().includes(type));
};
