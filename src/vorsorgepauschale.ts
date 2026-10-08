import {
  CARE_CHILDLESS_SURCHARGE_AGE,
  CARE_MAX_REDUCED_CHILDREN,
  CARE_RATE_FLOOR,
  CARE_RATE_REDUCTION_PER_CHILD,
  KV_REDUCED_RATE_EMPLOYEE,
} from './constants/shared.js';
import { roundCents } from './round.js';
import type { Steuerklasse, YearConstants } from './types.js';

/**
 * Employee care insurance rate (PVSATZAN), section 55 SGB XI.
 *   Under 23: base rate, no childless surcharge.
 *   23 or older and childless: childless rate.
 *   1 child: base rate. Children 2 to 5 under 25: minus 0.25 points each, floor 0.80%.
 */
export function careInsuranceRate(
  age: number,
  childrenUnder25: number,
  c: YearConstants,
): number {
  if (age < CARE_CHILDLESS_SURCHARGE_AGE) return c.careRateWithChildren;
  if (childrenUnder25 <= 0) return c.careRateChildless;
  if (childrenUnder25 === 1) return c.careRateWithChildren;

  const reducedChildren = Math.min(childrenUnder25 - 1, CARE_MAX_REDUCED_CHILDREN);
  const rate = c.careRateWithChildren - reducedChildren * CARE_RATE_REDUCTION_PER_CHILD;
  return Math.max(rate, CARE_RATE_FLOOR);
}

export interface VorsorgepauschaleInput {
  RE4: number;
  STKL: Steuerklasse;
  PVSATZAN: number;
  zusatzbeitrag: number;
  pensionOptOut: boolean;
}

export interface VorsorgepauschaleResult {
  VSPR: number;
  VSPKVPV: number;
  VSP: number;
}

/**
 * PAP MVSP: the Vorsorgepauschale (lump sum for insurance contributions,
 * section 39b Abs. 2 Satz 5 Nr. 3 EStG), annual amounts in euros.
 *
 * VSPR is the real employee pension contribution. VSPKVPV uses the reduced
 * health rate plus half the Zusatzbeitrag, and the employee's real care rate.
 * VSP is the larger of VSPR + VSPKVPV and the minimum amount (MVSPHB from 2026,
 * the flat 12 percent rule before that).
 *
 * The minimum is skipped for class 6 in every year here. The earlier PAP
 * generations may include class 6, see "Known limitations" in the README.
 */
export function vorsorgepauschale(
  input: VorsorgepauschaleInput,
  c: YearConstants,
): VorsorgepauschaleResult {
  const { RE4, STKL, PVSATZAN, zusatzbeitrag, pensionOptOut } = input;

  const grossMonthly = Math.max(0, RE4) / 12;
  const healthBaseMonthly = Math.min(grossMonthly, c.healthCareCeiling);
  const pensionBaseMonthly = Math.min(grossMonthly, c.pensionCeiling);

  const VSPR = pensionOptOut ? 0 : roundCents(pensionBaseMonthly * c.pensionRate) * 12;

  const kvMonthly = healthBaseMonthly * (KV_REDUCED_RATE_EMPLOYEE + zusatzbeitrag / 2);
  const pvMonthly = healthBaseMonthly * PVSATZAN;
  const VSPKVPV = (kvMonthly + pvMonthly) * 12;

  let VSP = VSPR + VSPKVPV;

  if (STKL !== 6) {
    const floor = c.vspFloor;
    if (floor.rule === 'MVSPHB') {
      // VSPHB = min(VSPALV + VSPKVPV, VHB); VSPN = VSPR + VSPHB
      const VSPALV = c.unemploymentRate * pensionBaseMonthly * 12;
      const VSPHB = Math.min(VSPALV + VSPKVPV, floor.VHB);
      VSP = Math.max(VSP, VSPR + VSPHB);
    } else {
      // VSP2 = min(12% of capped income, VHB); VHB is higher for Splitting (class 3)
      const VHB = STKL === 3 ? floor.VHBSTKL3 : floor.VHB;
      const VSP2 = Math.min(floor.rate * pensionBaseMonthly * 12, VHB);
      VSP = Math.max(VSP, VSPR + VSP2);
    }
  }

  return { VSPR, VSPKVPV, VSP };
}
