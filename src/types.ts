export type TaxYear = 2024 | 2025 | 2026;

/** Lohnsteuerklasse (tax class), 1 to 6. */
export type Steuerklasse = 1 | 2 | 3 | 4 | 5 | 6;

export const FEDERAL_STATES = [
  'Baden-Württemberg',
  'Bavaria',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hesse',
  'Lower Saxony',
  'Mecklenburg-Vorpommern',
  'North Rhine-Westphalia',
  'Rhineland-Palatinate',
  'Saarland',
  'Saxony',
  'Saxony-Anhalt',
  'Schleswig-Holstein',
  'Thuringia',
] as const;

export type FederalState = (typeof FEDERAL_STATES)[number];

export interface LohnsteuerInput {
  /** RE4: annual taxable gross pay in euros (the PAP itself works in cents). */
  RE4: number;
  STKL: Steuerklasse;
  /** Age in years. Only used for the care insurance (Pflegeversicherung) rate. Default 30. */
  age?: number;
  /** Children under 25. Only used for the care insurance rate. Default 0. */
  childrenUnder25?: number;
  /**
   * Total health insurance Zusatzbeitrag (additional contribution) as a fraction,
   * for example 0.029 for 2.9%. This is the total rate, not the employee half.
   * Defaults to the value in the year constants.
   */
  zusatzbeitrag?: number;
  /** True if the employee pays no statutory pension insurance. Default false. */
  pensionOptOut?: boolean;
  /** Federal state used for the church tax rate. Leave out for no church tax. */
  churchTaxState?: FederalState;
}

export interface LohnsteuerResult {
  taxYear: TaxYear;
  RE4: number;
  STKL: Steuerklasse;
  /** Vorsorgepauschale, pension part. */
  VSPR: number;
  /** Vorsorgepauschale, health and care insurance part. */
  VSPKVPV: number;
  /** Vorsorgepauschale after the minimum (floor) rule. */
  VSP: number;
  /** Arbeitnehmer-Pauschbetrag. Zero in class 6. */
  ANP: number;
  /** Sonderausgaben-Pauschbetrag. Zero in class 6. */
  SAP: number;
  /** Entlastungsbetrag fuer Alleinerziehende. Only class 2. */
  EFA: number;
  /** Zu versteuerndes Einkommen (taxable income), rounded to cents. */
  ZVE: number;
  /** 2 for class 3 (Splitting), otherwise 1. */
  KZTAB: number;
  /** ZVE divided by KZTAB, floored to a whole euro, as fed to the tariff. */
  X: number;
  /** Annual Lohnsteuer in whole euros. */
  LSTJAHR: number;
  /** Annual Solidaritaetszuschlag, rounded to cents. */
  SOLZJ: number;
  /** Bemessungsgrundlage (base) for the church tax. */
  BK: number;
  /** Annual Kirchensteuer, rounded to cents. Zero without churchTaxState. */
  KIST: number;
}

/** Coefficients of the section 32a EStG tariff, which change with each tax year. */
export interface TariffConstants {
  /** Grundfreibetrag: the tariff is zero up to and including this income. */
  GFB: number;
  zone2End: number;
  zone3End: number;
  zone4End: number;
  /** Zone 2: (a * y + b) * y with y = (x - GFB) / 10000 */
  zone2: { a: number; b: number };
  /** Zone 3: (a * z + b) * z + c with z = (x - zone2End) / 10000 */
  zone3: { a: number; b: number; c: number };
  /** Zone 4: 0.42 * x - zone4Offset */
  zone4Offset: number;
  /** Zone 5: 0.45 * x - zone5Offset */
  zone5Offset: number;
}

/**
 * The minimum Vorsorgepauschale rule differs between PAP generations.
 * Up to 2025 the flat 12 percent rule applies, from 2026 the rule uses the
 * unemployment insurance rate.
 */
export type VspFloor =
  | { rule: 'MVSP'; VHB: number; VHBSTKL3: number; rate: number }
  | { rule: 'MVSPHB'; VHB: number };

export interface YearConstants {
  year: TaxYear;
  tariff: TariffConstants;
  /** Arbeitnehmer-Pauschbetrag */
  ANP: number;
  /** Entlastungsbetrag fuer Alleinerziehende (class 2) */
  EFA: number;
  /** Soli exemption threshold (Freigrenze) on the annual Lohnsteuer */
  SOLZFREI: number;
  /** Class 5 and 6 zone limits (section 39b Abs. 2 Satz 7 EStG) */
  W1STKL5: number;
  W2STKL5: number;
  W3STKL5: number;
  /** Pension insurance, employee share, as a fraction */
  pensionRate: number;
  /** Health insurance base rate, employee share, as a fraction */
  healthBaseRate: number;
  /** Default total Zusatzbeitrag as a fraction */
  healthZusatzbeitragDefault: number;
  unemploymentRate: number;
  /** Care insurance employee rate with children */
  careRateWithChildren: number;
  /** Care insurance employee rate when childless and 23 or older */
  careRateChildless: number;
  /** Monthly contribution ceiling for health and care insurance */
  healthCareCeiling: number;
  /** Monthly contribution ceiling for pension and unemployment insurance */
  pensionCeiling: number;
  vspFloor: VspFloor;
}
