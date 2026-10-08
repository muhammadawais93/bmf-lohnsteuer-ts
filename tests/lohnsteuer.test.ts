import { describe, expect, test } from 'vitest';
import { calculateLohnsteuer, SUPPORTED_TAX_YEARS } from '../src/index.js';
import type { LohnsteuerResult, TaxYear } from '../src/index.js';
import { getYearConstants } from '../src/constants/index.js';
import { ALL_STEUERKLASSEN } from './helpers.js';

const base = { RE4: 60000, STKL: 1 as const, age: 30 };

describe('calculateLohnsteuer: the intermediate values reconcile', () => {
  for (const year of SUPPORTED_TAX_YEARS) {
    for (const STKL of ALL_STEUERKLASSEN) {
      test(`${year}, class ${STKL}: ZVE = RE4 - VSP - ANP - SAP - EFA`, () => {
        const r = calculateLohnsteuer({ ...base, STKL }, year);
        expect(r.ZVE).toBeCloseTo(Math.max(0, r.RE4 - r.VSP - r.ANP - r.SAP - r.EFA), 1);
        expect(r.VSP).toBeGreaterThanOrEqual(r.VSPR + r.VSPKVPV - 0.01);
        expect(r.X).toBe(Math.floor(r.ZVE / r.KZTAB));
      });
    }
  }
});

describe('calculateLohnsteuer: tax class rules', () => {
  test('class 6 gets no allowances', () => {
    const r = calculateLohnsteuer({ ...base, STKL: 6 }, 2026);
    expect([r.ANP, r.SAP, r.EFA]).toEqual([0, 0, 0]);
  });

  test('only class 2 gets the Alleinerziehende relief', () => {
    const c = getYearConstants(2026);
    expect(calculateLohnsteuer({ ...base, STKL: 2 }, 2026).EFA).toBe(c.EFA);
    for (const STKL of [1, 3, 4, 5] as const) {
      expect(calculateLohnsteuer({ ...base, STKL }, 2026).EFA).toBe(0);
    }
  });

  test('only class 3 uses KZTAB 2', () => {
    for (const STKL of ALL_STEUERKLASSEN) {
      expect(calculateLohnsteuer({ ...base, STKL }, 2026).KZTAB).toBe(STKL === 3 ? 2 : 1);
    }
  });

  test('class 1 and class 4 give the same Lohnsteuer', () => {
    for (const year of SUPPORTED_TAX_YEARS) {
      expect(calculateLohnsteuer({ ...base, STKL: 4 }, year).LSTJAHR).toBe(
        calculateLohnsteuer({ ...base, STKL: 1 }, year).LSTJAHR,
      );
    }
  });
});

describe('calculateLohnsteuer: Soli and Kirchensteuer', () => {
  test('no Soli at or below the exemption threshold', () => {
    const r = calculateLohnsteuer({ RE4: 30000, STKL: 1 }, 2026);
    expect(r.LSTJAHR).toBeLessThanOrEqual(getYearConstants(2026).SOLZFREI);
    expect(r.SOLZJ).toBe(0);
  });

  test('Soli is positive and below 5.5% in the glide zone', () => {
    const c = getYearConstants(2026);
    const r = calculateLohnsteuer({ RE4: 110000, STKL: 1 }, 2026);
    expect(r.LSTJAHR).toBeGreaterThan(c.SOLZFREI);
    expect(r.SOLZJ).toBeGreaterThan(0);
    expect(r.SOLZJ).toBeLessThanOrEqual(r.LSTJAHR * 0.055);
  });

  test('church tax is 8% in Bavaria, 9% in Berlin, and 0 without a state', () => {
    const none = calculateLohnsteuer({ ...base }, 2026);
    const bavaria = calculateLohnsteuer({ ...base, churchTaxState: 'Bavaria' }, 2026);
    const berlin = calculateLohnsteuer({ ...base, churchTaxState: 'Berlin' }, 2026);
    expect(none.KIST).toBe(0);
    expect(bavaria.KIST).toBeCloseTo(none.LSTJAHR * 0.08, 2);
    expect(berlin.KIST).toBeCloseTo(none.LSTJAHR * 0.09, 2);
    expect(berlin.BK).toBe(berlin.LSTJAHR);
  });
});

describe('calculateLohnsteuer: input handling', () => {
  test('more gross never means less Lohnsteuer, same class', () => {
    for (const year of SUPPORTED_TAX_YEARS) {
      let previous = -1;
      for (const RE4 of [20000, 30000, 48000, 80000, 150000, 400000]) {
        const { LSTJAHR } = calculateLohnsteuer({ ...base, RE4 }, year);
        expect(LSTJAHR).toBeGreaterThanOrEqual(previous);
        previous = LSTJAHR;
      }
    }
  });

  test('every field is a finite number for extreme gross values', () => {
    for (const RE4 of [0, 1, 12348, 250000, 1_000_000]) {
      for (const STKL of ALL_STEUERKLASSEN) {
        const r = calculateLohnsteuer({ RE4, STKL }, 2026);
        const bad = Object.entries(r).filter(([, v]) => typeof v === 'number' && !Number.isFinite(v));
        expect(bad).toEqual([]);
      }
    }
  });

  test('negative RE4 is treated as zero', () => {
    const r = calculateLohnsteuer({ RE4: -5000, STKL: 1 }, 2026);
    expect(r.ZVE).toBe(0);
    expect(r.LSTJAHR).toBe(0);
  });

  test('an unsupported tax year throws', () => {
    expect(() => calculateLohnsteuer(base, 2019 as TaxYear)).toThrow(RangeError);
  });

  test('an invalid class throws', () => {
    expect(() => calculateLohnsteuer({ ...base, STKL: 7 as LohnsteuerResult['STKL'] }, 2026)).toThrow(
      RangeError,
    );
  });
});
