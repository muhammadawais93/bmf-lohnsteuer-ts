import type { YearConstants } from '../types.js';

// Tariff: Steuerfortentwicklungsgesetz, BGBl. 2024 I Nr. 449.
// W1STKL5 to W3STKL5: BMF PAP 2025, Anlage 2 (endgueltig).
export const YEAR_2025: YearConstants = {
  year: 2025,
  tariff: {
    GFB: 12096,
    zone2End: 17443,
    zone3End: 68480,
    zone4End: 277825,
    zone2: { a: 932.3, b: 1400 },
    zone3: { a: 176.64, b: 2397, c: 1015.13 },
    zone4Offset: 10911.92,
    zone5Offset: 19246.67,
  },
  ANP: 1230,
  EFA: 4260,
  SOLZFREI: 19950,
  W1STKL5: 13785,
  W2STKL5: 34240,
  W3STKL5: 222260,
  pensionRate: 0.093,
  healthBaseRate: 0.073,
  healthZusatzbeitragDefault: 0.025,
  unemploymentRate: 0.013,
  careRateWithChildren: 0.018,
  careRateChildless: 0.024,
  healthCareCeiling: 5512.5,
  pensionCeiling: 8050,
  vspFloor: { rule: 'MVSP', VHB: 1900, VHBSTKL3: 3000, rate: 0.12 },
};
