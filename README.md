# bmf-lohnsteuer-ts

German wage tax (Lohnsteuer) calculation in TypeScript. It follows the structure of the Programmablaufplan (PAP), the pseudo-code the German Federal Ministry of Finance (BMF) publishes so that payroll software computes income tax the same way.

This is an independent implementation. It is not official, not certified, and not guaranteed to match any payslip to the cent. See [Known limitations](#known-limitations).

Used in the salary calculator at [germanydesk.com](https://germanydesk.com/tools/brutto-netto).

## Install

Not on npm yet. Install from GitHub (the package builds itself on install):

```sh
npm install github:muhammadawais93/bmf-lohnsteuer-ts
```

## Usage

```ts
import { calculateLohnsteuer } from 'bmf-lohnsteuer-ts';

const result = calculateLohnsteuer(
  { RE4: 48000, STKL: 1, age: 30, churchTaxState: 'Berlin' },
  2026,
);
console.log(result);
```

Real output:

```
{
  taxYear: 2026,
  RE4: 48000,
  STKL: 1,
  VSPR: 4464,
  VSPKVPV: 5208,
  VSP: 9672,
  ANP: 1230,
  SAP: 36,
  EFA: 0,
  ZVE: 37062,
  KZTAB: 1,
  X: 37062,
  LSTJAHR: 6295,
  SOLZJ: 0,
  BK: 6295,
  KIST: 566.55
}
```

The BMF online calculator gives 6294 for the same case, so the result is one euro off. That is consistent with the rounding difference described under "Why it's tricky".

### Reading the result

All amounts are annual, in euros. The names are the PAP's names where one exists.

| Field | Meaning |
| --- | --- |
| `RE4` | Annual taxable gross pay (the PAP itself works in cents) |
| `STKL` | Tax class (Steuerklasse) 1 to 6 |
| `VSPR`, `VSPKVPV`, `VSP` | Vorsorgepauschale: a lump sum for insurance contributions that is deducted before tax. Pension part, health and care part, and the final amount after the minimum rule |
| `ANP`, `SAP`, `EFA` | Allowances: employee lump sum, special expenses lump sum, single-parent relief (class 2 only). `ANP` and `SAP` are zero in class 6 |
| `ZVE` | Zu versteuerndes Einkommen, the taxable income |
| `KZTAB`, `X` | `KZTAB` is 2 for the Splitting tariff (class 3), else 1. `X` is `ZVE / KZTAB` floored to whole euros, the value fed into the tariff |
| `LSTJAHR` | Annual wage tax in whole euros |
| `SOLZJ` | Annual solidarity surcharge (Solidaritätszuschlag) |
| `BK`, `KIST` | Base for church tax and the church tax (Kirchensteuer) amount |

Inputs other than `RE4` and `STKL` are optional: `age` and `childrenUnder25` (care insurance rate), `zusatzbeitrag` (total health insurance additional rate as a fraction, default per year), `pensionOptOut`, and `churchTaxState`.

## Why it's tricky

- **Rounding and truncation.** The tariff input `X` is floored to a whole euro before the lookup, but the final tax here is rounded to the nearest euro. The statute rounds the tariff result down (section 32a EStG), so this is the likely cause of the one euro gap in the example above.
- **Tax classes are different algorithms, not different numbers.** Class 3 runs the tariff on half the income and doubles it (Splitting). Classes 5 and 6 use a separate three-zone procedure (`MST5-6`). In that procedure the statute says "at most 42 percent" above the first zone limit, so the 42 percent branch is a ceiling. An earlier version took the larger value instead of the smaller one, and a continuity test (tax must never drop as income rises) caught a drop of about 286 euros. A second bug above the third zone limit showed up as a drop of about 78,674 euros.
- **Constants change every year, sometimes retroactively.** The 2024 basic allowance (Grundfreibetrag) went from 11,604 to 11,784 euros through a correction law, and the class 5/6 limit `W1STKL5` moved from 13,279 to 13,432 with it. The 2026 PAP also changed how the minimum Vorsorgepauschale works, so the formula, not just the numbers, depends on the year. Everything year-specific lives in `src/constants/<year>.ts`.

## Supported tax years and known limitations

Supported: 2024, 2025, 2026.

- **Annual calculation only.** The PAP also covers monthly, weekly and daily payment periods and one-off payments (Sonstige Bezüge). Those are not implemented.
- **Rounding.** See above. Results can differ from the BMF by about one euro.
- **No Kinderfreibetrag.** Child allowances are not modelled, so Soli and church tax are computed without them.
- **Care insurance in Sachsen.** The higher employee care insurance rate in Sachsen is not modelled.
- **Vorsorgepauschale minimum in class 6 before 2026.** The code skips the minimum rule for class 6 in every year. For 2024 and 2025 this needs to be checked against the PAP (open question).
- **Church tax** is a flat 8 percent (Bavaria, Baden-Württemberg) or 9 percent of the wage tax.
- **Private health insurance and other special cases** (for example the Vorsorgepauschale for privately insured employees) are not covered.

### Verification status

The test suite checks eight annual Lohnsteuer figures for 2026, taken from the official BMF online calculator, with a tolerance of 5 euros. It also runs property checks: tax never falls as income rises, no jumps at the class 5/6 zone limits, no tax below the Grundfreibetrag.

TODO:

- Add cases from the BMF's own published PAP examples, if the BMF publishes any, with their source.
- Add BMF calculator figures for 2024 and 2025.
- Add cases with children, other care insurance rates, church tax and a non-default Zusatzbeitrag.
- Resolve the class 6 question for 2024 and 2025.

## Sources

- [BMF: Programmablaufplan (PAP) for Lohnsteuer](https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/Steuerarten/Lohnsteuer/Programmablaufplan/programmablaufplan.html). The PDFs are not copied into this repository.
- [Section 32a EStG: income tax tariff](https://www.gesetze-im-internet.de/estg/__32a.html)
- [Section 38b EStG: tax classes](https://www.gesetze-im-internet.de/estg/__38b.html)
- [Section 39b EStG: withholding procedure, including the Vorsorgepauschale and classes 5 and 6](https://www.gesetze-im-internet.de/estg/__39b.html)
- [Section 4 SolzG: solidarity surcharge](https://www.gesetze-im-internet.de/solzg_1995/__4.html)

## Contributing

### Adding a new tax year

1. Copy `src/constants/2026.ts` to `src/constants/<year>.ts` and rename the export to `YEAR_<year>`.
2. Replace every value from the BMF PAP for that year and the statute text. Check each number against at least two official sources (the PAP and gesetze-im-internet.de). Do not rely on third-party calculators.
   - Tariff coefficients and zone limits (`tariff`), from section 32a EStG.
   - `W1STKL5`, `W2STKL5`, `W3STKL5`, `SOLZFREI`, `ANP`, `EFA`.
   - Contribution rates and ceilings.
   - `vspFloor`: check whether the minimum Vorsorgepauschale rule changed in the new PAP.
3. Add the year to `TaxYear` in `src/types.ts` and to `ALL_YEAR_CONSTANTS` in `src/constants/index.ts`.
4. Run `npm test`. The monotonic and continuity tests cover every supported year automatically. Add golden values for the new year only if you can cite where they come from.

### Development

```sh
npm install
npm run typecheck
npm test
```

## License

MIT, see [LICENSE](LICENSE).
