import { expect } from 'vitest';
import { SUPPORTED_TAX_YEARS } from '../src/constants/index.js';
import type { Steuerklasse, TaxYear } from '../src/types.js';

export const ALL_STEUERKLASSEN: Steuerklasse[] = [1, 2, 3, 4, 5, 6];

export function forEachYearAndClass(run: (year: TaxYear, stkl: Steuerklasse) => void): void {
  for (const year of SUPPORTED_TAX_YEARS) {
    for (const stkl of ALL_STEUERKLASSEN) run(year, stkl);
  }
}

/**
 * Assert that fn never decreases across the range and never rises faster than
 * maxPerUnit per unit of input. Needs no external source.
 */
export function expectNonDecreasing(
  fn: (x: number) => number,
  options: { from: number; to: number; step: number; maxPerUnit: number; slack?: number },
): void {
  const { from, to, step, maxPerUnit, slack = 0.01 } = options;
  let previousX = from;
  let previous = fn(from);

  for (let x = from + step; x <= to; x += step) {
    const current = fn(x);
    const delta = current - previous;
    if (delta < -slack) {
      throw new Error(`dropped by ${(-delta).toFixed(2)} between ${previousX} and ${x}`);
    }
    if (delta > maxPerUnit * step) {
      throw new Error(`rose by ${delta.toFixed(2)} between ${previousX} and ${x}`);
    }
    previousX = x;
    previous = current;
  }
  expect(previous).toBeGreaterThanOrEqual(fn(from) - slack);
}

export function expectEurosWithin(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
): void {
  const delta = Math.abs(actual - expected);
  expect(delta, `${label}: expected ${expected} +/- ${tolerance}, got ${actual}`).toBeLessThanOrEqual(
    tolerance,
  );
}
