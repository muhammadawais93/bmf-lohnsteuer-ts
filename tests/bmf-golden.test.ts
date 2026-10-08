// Golden values from the official BMF Lohnsteuerrechner
// (bmf-steuerrechner.de/bl/bl2026/), carried over from the test suite of the
// project this library was extracted from.
//
// Scenario held constant: tax year 2026, age 30, no children, no church tax,
// statutory health insurance with the 2026 default Zusatzbeitrag of 2.9%,
// childless care insurance rate, statutory pension insurance.
//
// If one of these fails, a real number changed. Re-check it against the BMF
// calculator before touching the expectation.

import { describe, test } from 'vitest';
import { calculateLohnsteuer } from '../src/index.js';
import type { Steuerklasse } from '../src/index.js';
import { expectEurosWithin } from './helpers.js';

const BMF_LOHNSTEUER_2026: { STKL: Steuerklasse; RE4: number; annualLohnsteuer: number }[] = [
  { STKL: 1, RE4: 48000, annualLohnsteuer: 6294 },
  { STKL: 2, RE4: 48000, annualLohnsteuer: 5020 },
  { STKL: 3, RE4: 48000, annualLohnsteuer: 2422 },
  { STKL: 4, RE4: 48000, annualLohnsteuer: 6294 },
  { STKL: 5, RE4: 48000, annualLohnsteuer: 11339 },
  { STKL: 6, RE4: 48000, annualLohnsteuer: 11871 },
  { STKL: 5, RE4: 18000, annualLohnsteuer: 1834 },
  { STKL: 5, RE4: 400000, annualLohnsteuer: 160885 },
];

/** The BMF figures are whole euros per year, so a few euros of slack is right. */
const BMF_TOLERANCE_EUROS = 5;

describe('LSTJAHR against the BMF Lohnsteuerrechner, 2026', () => {
  for (const { STKL, RE4, annualLohnsteuer } of BMF_LOHNSTEUER_2026) {
    test(`class ${STKL} at ${RE4} EUR is within ${BMF_TOLERANCE_EUROS} EUR of the BMF figure`, () => {
      const result = calculateLohnsteuer({ RE4, STKL, age: 30 }, 2026);
      expectEurosWithin(result.LSTJAHR, annualLohnsteuer, BMF_TOLERANCE_EUROS, `class ${STKL}`);
    });
  }
});
