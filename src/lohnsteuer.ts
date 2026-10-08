import { getYearConstants } from './constants/index.js';
import {
  CHURCH_TAX_RATES,
  DEFAULT_AGE,
  SAP,
  SOLI_FULL_RATE,
  SOLI_GLIDE_ZONE_FACTOR,
} from './constants/shared.js';
import { roundCents } from './round.js';
import { upmlst } from './tariff.js';
import type { LohnsteuerInput, LohnsteuerResult, TaxYear } from './types.js';
import { careInsuranceRate, vorsorgepauschale } from './vorsorgepauschale.js';

/**
 * Annual Lohnsteuer, Solidaritaetszuschlag and Kirchensteuer, following the
 * structure of the BMF Programmablaufplan. Returns the intermediate values
 * (VSP, ZVE, X, ...) so a result can be traced step by step.
 */
export function calculateLohnsteuer(input: LohnsteuerInput, taxYear: TaxYear): LohnsteuerResult {
  const c = getYearConstants(taxYear);
  const { RE4, STKL } = input;

  if (![1, 2, 3, 4, 5, 6].includes(STKL)) {
    throw new RangeError(`STKL must be 1 to 6, got ${String(STKL)}`);
  }

  const PVSATZAN = careInsuranceRate(input.age ?? DEFAULT_AGE, input.childrenUnder25 ?? 0, c);
  const { VSPR, VSPKVPV, VSP } = vorsorgepauschale(
    {
      RE4,
      STKL,
      PVSATZAN,
      zusatzbeitrag: input.zusatzbeitrag ?? c.healthZusatzbeitragDefault,
      pensionOptOut: input.pensionOptOut ?? false,
    },
    c,
  );

  // PAP MZTABFB: class 6 gets no allowances; the Alleinerziehende relief is class 2 only.
  const ANP = STKL === 6 ? 0 : c.ANP;
  const SAP_AMOUNT = STKL === 6 ? 0 : SAP;
  const EFA = STKL === 2 ? c.EFA : 0;

  const ZVE = Math.max(0, Math.max(0, RE4) - VSP - (ANP + SAP_AMOUNT + EFA));

  const { KZTAB, X, ST } = upmlst(ZVE, STKL, c);

  // Section 4 SolzG: glide zone above the exemption threshold, capped at the full 5.5%.
  const SOLZJ =
    ST <= c.SOLZFREI
      ? 0
      : Math.min((ST - c.SOLZFREI) * SOLI_GLIDE_ZONE_FACTOR, ST * SOLI_FULL_RATE);

  const BK = ST;
  const KIST = input.churchTaxState ? BK * CHURCH_TAX_RATES[input.churchTaxState] : 0;

  return {
    taxYear,
    RE4,
    STKL,
    VSPR: roundCents(VSPR),
    VSPKVPV: roundCents(VSPKVPV),
    VSP: roundCents(VSP),
    ANP,
    SAP: SAP_AMOUNT,
    EFA,
    ZVE: roundCents(ZVE),
    KZTAB,
    X,
    LSTJAHR: ST,
    SOLZJ: roundCents(SOLZJ),
    BK,
    KIST: roundCents(KIST),
  };
}
