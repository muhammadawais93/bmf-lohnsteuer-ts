import { RATE_ZONE_4, RATE_ZONE_5 } from './constants/shared.js';
import type { Steuerklasse, TariffConstants, YearConstants } from './types.js';

/**
 * PAP UPTAB: the section 32a EStG income tax tariff for one year.
 * Takes an income in whole euros, returns the unrounded tax.
 */
export function uptab(x: number, t: TariffConstants): number {
  if (x <= t.GFB) return 0;
  if (x <= t.zone2End) {
    const y = (x - t.GFB) / 10000;
    return (t.zone2.a * y + t.zone2.b) * y;
  }
  if (x <= t.zone3End) {
    const z = (x - t.zone2End) / 10000;
    return (t.zone3.a * z + t.zone3.b) * z + t.zone3.c;
  }
  if (x <= t.zone4End) {
    return RATE_ZONE_4 * x - t.zone4Offset;
  }
  return RATE_ZONE_5 * x - t.zone5Offset;
}

/**
 * PAP UP5-6: building block of the class 5 and 6 procedure. Takes the doubled
 * difference between the tariff at 1.25 times and 0.75 times the base, and
 * never less than a flat 14 percent of the base.
 */
function up56(zx: number, t: TariffConstants): number {
  const st1 = uptab(1.25 * zx, t);
  const st2 = uptab(0.75 * zx, t);
  const diff = (st1 - st2) * 2;
  const mist = zx * 0.14;
  return Math.max(mist, diff);
}

/**
 * PAP MST5-6: the three-zone procedure for classes 5 and 6
 * (section 39b Abs. 2 Satz 7 EStG).
 *   ZVE up to W1: UP5-6(ZVE).
 *   W1 to W2: the lesser of UP5-6(ZVE) and UP5-6(W1) + (ZVE - W1) * 42%.
 *   Above W2: UP5-6(W2) + 42% up to W3, then 45% beyond W3.
 * The statute says "hoechstens 42 Prozent" above W1, so the 42% branch is a
 * ceiling. Taking the larger of the two made the tax drop as income rose.
 */
function mst56(zve: number, c: YearConstants): number {
  const { W1STKL5: w1, W2STKL5: w2, W3STKL5: w3, tariff: t } = c;

  if (zve > w2) {
    const base = up56(w2, t);
    if (zve > w3) {
      return base + (w3 - w2) * RATE_ZONE_4 + (zve - w3) * RATE_ZONE_5;
    }
    return base + (zve - w2) * RATE_ZONE_4;
  }

  let st = up56(zve, t);
  if (zve > w1) {
    const vergl = st;
    const hoch = up56(w1, t) + (zve - w1) * RATE_ZONE_4;
    st = Math.min(vergl, hoch);
  }
  return st;
}

export interface UpmlstResult {
  KZTAB: number;
  X: number;
  /** Annual Lohnsteuer in whole euros. */
  ST: number;
}

/**
 * PAP UPMLST: annual Lohnsteuer from the ZVE.
 * X is ZVE divided by KZTAB, floored to a whole euro before the tariff lookup.
 * KZTAB is 2 only for the Splitting tariff (class 3), otherwise 1.
 * The final tax is rounded to the nearest euro, see "Known limitations" in the README.
 */
export function upmlst(zve: number, stkl: Steuerklasse, c: YearConstants): UpmlstResult {
  const KZTAB = stkl === 3 ? 2 : 1;
  if (zve <= 0) return { KZTAB, X: 0, ST: 0 };

  const X = Math.floor(zve / KZTAB);
  let tax: number;
  if (stkl === 3) {
    tax = uptab(X, c.tariff) * KZTAB;
  } else if (stkl === 5 || stkl === 6) {
    tax = mst56(X, c);
  } else {
    tax = uptab(X, c.tariff);
  }

  return { KZTAB, X, ST: Math.max(0, Math.round(tax)) };
}
