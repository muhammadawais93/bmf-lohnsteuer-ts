import type { TaxYear, YearConstants } from '../types.js';
import { YEAR_2024 } from './2024.js';
import { YEAR_2025 } from './2025.js';
import { YEAR_2026 } from './2026.js';

const ALL_YEAR_CONSTANTS: Record<TaxYear, YearConstants> = {
  2024: YEAR_2024,
  2025: YEAR_2025,
  2026: YEAR_2026,
};

export const SUPPORTED_TAX_YEARS = Object.keys(ALL_YEAR_CONSTANTS).map(Number) as TaxYear[];

export function getYearConstants(year: TaxYear): YearConstants {
  const constants = ALL_YEAR_CONSTANTS[year];
  if (!constants) {
    throw new RangeError(
      `Unsupported tax year ${String(year)}. Supported: ${SUPPORTED_TAX_YEARS.join(', ')}`,
    );
  }
  return constants;
}
