// Rates fixed by statute that do not carry a tax year.

import type { FederalState } from '../types.js';

/** Section 4 SolzG: the glide zone takes 11.9% of the amount above the exemption threshold. */
export const SOLI_GLIDE_ZONE_FACTOR = 0.119;
export const SOLI_FULL_RATE = 0.055;

/** Section 32a EStG: marginal rates of the two top tariff zones. */
export const RATE_ZONE_4 = 0.42;
export const RATE_ZONE_5 = 0.45;

/** Section 10c EStG: Sonderausgaben-Pauschbetrag. */
export const SAP = 36;

/** Reduced health insurance rate (section 243 SGB V is 14.0%), employee half. */
export const KV_REDUCED_RATE_EMPLOYEE = 0.07;

/** Section 55 SGB XI: care insurance reduction per additional child (2nd to 5th). */
export const CARE_RATE_REDUCTION_PER_CHILD = 0.0025;
export const CARE_RATE_FLOOR = 0.008;
/** Children 2 to 5 earn a reduction, so at most 4 reductions apply. */
export const CARE_MAX_REDUCED_CHILDREN = 4;
/** Below this age the childless surcharge does not apply. */
export const CARE_CHILDLESS_SURCHARGE_AGE = 23;

export const DEFAULT_AGE = 30;

export const CHURCH_TAX_RATES: Record<FederalState, number> = {
  Bavaria: 0.08,
  'Baden-Württemberg': 0.08,
  Berlin: 0.09,
  Brandenburg: 0.09,
  Bremen: 0.09,
  Hamburg: 0.09,
  Hesse: 0.09,
  'Lower Saxony': 0.09,
  'Mecklenburg-Vorpommern': 0.09,
  'North Rhine-Westphalia': 0.09,
  'Rhineland-Palatinate': 0.09,
  Saarland: 0.09,
  Saxony: 0.09,
  'Saxony-Anhalt': 0.09,
  'Schleswig-Holstein': 0.09,
  Thuringia: 0.09,
};
