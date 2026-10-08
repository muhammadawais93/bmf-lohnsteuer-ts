import type { YearConstants } from '../types.js';

// Tariff: BGBl. 2024 I Nr. 386 (Gesetz zur steuerlichen Freistellung des
// Existenzminimums 2024), a retroactive correction. Grundfreibetrag went from
// 11,604 to 11,784 and every zone constant from zone 2 onward shifted with it.
// W1STKL5: BMF PAP for the corrected December 2024 tables, Anlage 2. The
// correction moved W1STKL5 from 13279 to 13432; W2 and W3 stayed unchanged.
export const YEAR_2024: YearConstants = {
  year: 2024,
  tariff: {
    GFB: 11784,
    zone2End: 17005,
    zone3End: 66760,
    zone4End: 277825,
    zone2: { a: 954.8, b: 1400 },
    zone3: { a: 181.19, b: 2397, c: 991.21 },
    zone4Offset: 10636.31,
    zone5Offset: 18971.06,
  },
  ANP: 1230,
  EFA: 4260,
  SOLZFREI: 18130,
  W1STKL5: 13432,
  W2STKL5: 33380,
  W3STKL5: 222260,
  pensionRate: 0.093,
  healthBaseRate: 0.073,
  healthZusatzbeitragDefault: 0.017,
  unemploymentRate: 0.013,
  careRateWithChildren: 0.017,
  careRateChildless: 0.023,
  healthCareCeiling: 5175,
  pensionCeiling: 7550,
  vspFloor: { rule: 'MVSP', VHB: 1900, VHBSTKL3: 3000, rate: 0.12 },
};
