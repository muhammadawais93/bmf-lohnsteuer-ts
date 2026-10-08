import type { YearConstants } from '../types.js';

// Tariff: Steuerfortentwicklungsgesetz (BGBl. 2024 I Nr. 449), provisions in
// force from 1 January 2026.
// W1STKL5 to W3STKL5: BMF PAP 2026, Anlage 2 (endgueltig, korrigierte Fassung).
// The 2026 PAP changed the Vorsorgepauschale, hence the MVSPHB floor rule.
export const YEAR_2026: YearConstants = {
  year: 2026,
  tariff: {
    GFB: 12348,
    zone2End: 17799,
    zone3End: 69878,
    zone4End: 277825,
    zone2: { a: 914.51, b: 1400 },
    zone3: { a: 173.1, b: 2397, c: 1034.87 },
    zone4Offset: 11135.63,
    zone5Offset: 19470.38,
  },
  ANP: 1230,
  EFA: 4260,
  SOLZFREI: 20350,
  W1STKL5: 14071,
  W2STKL5: 34939,
  W3STKL5: 222260,
  pensionRate: 0.093,
  healthBaseRate: 0.073,
  healthZusatzbeitragDefault: 0.029,
  unemploymentRate: 0.013,
  careRateWithChildren: 0.018,
  careRateChildless: 0.024,
  healthCareCeiling: 5812.5,
  pensionCeiling: 8450,
  vspFloor: { rule: 'MVSPHB', VHB: 1900 },
};
