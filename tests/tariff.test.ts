// Properties of the tariff and the class 5/6 procedure that need no external
// source. The continuity checks at W1, W2 and W3 are what exposed two bugs in
// the class 5/6 code of the project this was extracted from: taking the larger
// instead of the lesser value in the W1 to W2 zone produced a drop of about
// 286 EUR at W2, and discarding the 42% zone above W3 produced a drop of about
// 78,674 EUR.

import { describe, expect, test } from 'vitest';
import { SUPPORTED_TAX_YEARS, getYearConstants } from '../src/constants/index.js';
import { uptab, upmlst } from '../src/tariff.js';
import { expectNonDecreasing, forEachYearAndClass } from './helpers.js';

/** 45% top rate plus a cent of rounding slack. */
const MAX_MARGINAL_STEP = 0.46;

/**
 * upmlst rounds to whole euros, so a step on a zone boundary can carry up to
 * 1 EUR of rounding noise on top of the marginal step. The bugs above were
 * hundreds of euros, so 1.5 still catches them.
 */
const MAX_BOUNDARY_STEP = 1.5;

describe('upmlst: monotonic, every class, every year', () => {
  forEachYearAndClass((year, stkl) => {
    test(`${year}, class ${stkl}: never falls, never rises more than ${MAX_MARGINAL_STEP} per euro`, () => {
      const c = getYearConstants(year);
      expectNonDecreasing((zve) => upmlst(zve, stkl, c).ST, {
        from: 0,
        to: 300_000,
        // Not a round number, so the sweep lands inside zones and not on the edges.
        step: 137,
        maxPerUnit: MAX_MARGINAL_STEP,
      });
    });
  });
});

describe('upmlst: continuous at the class 5/6 zone edges', () => {
  for (const stkl of [5, 6] as const) {
    for (const year of SUPPORTED_TAX_YEARS) {
      test(`${year}, class ${stkl}: continuous at W1STKL5, W2STKL5 and W3STKL5`, () => {
        const c = getYearConstants(year);
        for (const edge of [c.W1STKL5, c.W2STKL5, c.W3STKL5]) {
          expectNonDecreasing((zve) => upmlst(zve, stkl, c).ST, {
            from: edge - 1,
            to: edge + 1,
            step: 1,
            maxPerUnit: MAX_BOUNDARY_STEP,
          });
        }
      });
    }
  }
});

describe('uptab: zone edges of the section 32a tariff', () => {
  for (const year of SUPPORTED_TAX_YEARS) {
    test(`${year}: tariff is continuous across all four zone edges`, () => {
      const t = getYearConstants(year).tariff;
      for (const edge of [t.GFB, t.zone2End, t.zone3End, t.zone4End]) {
        expect(Math.abs(uptab(edge + 1, t) - uptab(edge, t))).toBeLessThan(MAX_BOUNDARY_STEP);
      }
    });
  }
});

describe('upmlst: Grundfreibetrag and Splitting', () => {
  for (const year of SUPPORTED_TAX_YEARS) {
    const c = getYearConstants(year);
    const { GFB } = c.tariff;

    for (const stkl of [1, 2, 4] as const) {
      test(`${year}, class ${stkl}: no tax at or below ${GFB}`, () => {
        expect(upmlst(0, stkl, c).ST).toBe(0);
        expect(upmlst(GFB, stkl, c).ST).toBe(0);
        expect(upmlst(GFB + 500, stkl, c).ST).toBeGreaterThan(0);
      });
    }

    test(`${year}, class 3: Splitting doubles the tax-free amount`, () => {
      expect(upmlst(GFB * 2, 3, c).ST).toBe(0);
      expect(upmlst(GFB * 2 + 1000, 3, c).ST).toBeGreaterThan(0);
      expect(upmlst(GFB * 2, 3, c).KZTAB).toBe(2);
    });

    test(`${year}, class 6: tax from the first euro`, () => {
      expect(upmlst(1000, 6, c).ST).toBeGreaterThan(0);
    });
  }
});
