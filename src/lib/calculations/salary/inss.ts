import type { INSSResult, INSSBracketResult, YearRules } from './types';
import { roundCurrency } from './money';

/**
 * Calculates the progressive INSS employee contribution.
 *
 * The contribution is "fatiada" (sliced): each bracket's rate applies only
 * to the portion of the salary that falls within that bracket, not to the
 * whole salary. Salary above the ceiling contributes nothing extra.
 *
 * Rounding: each bracket's contribution is rounded to the nearest cent for
 * DISPLAY purposes, but the grand total is computed by summing the exact
 * (unrounded) per-bracket amounts and rounding only once at the end. This
 * matches the official worked example published by Receita Federal-adjacent
 * sources, which notes explicitly: "valores por faixa arredondados para
 * exibição; o total considera os centavos exatos" — summing the already-
 * rounded per-bracket display values can be off by a cent from the true
 * total.
 */
export function calculateINSS(grossSalary: number, rules: YearRules): INSSResult {
  if (grossSalary < 0) {
    throw new Error('Salário bruto não pode ser negativo.');
  }

  const { brackets, ceiling } = rules.inss;
  const cappedSalary = Math.min(grossSalary, ceiling);
  const hitCeiling = grossSalary >= ceiling;

  const bracketResults: INSSBracketResult[] = [];
  let exactTotal = 0;
  // Brackets are published as "from X.01 to Y.00" for display, but the true
  // lower edge of each slice is the previous bracket's upper edge (X.00),
  // not X.01 — otherwise every slice loses one cent. Track the true edge
  // separately from the displayed `from`.
  let previousUpperEdge = 0;

  for (const bracket of brackets) {
    if (cappedSalary <= previousUpperEdge) break;

    const upper = Math.min(cappedSalary, bracket.to);
    const exactSlice = upper - previousUpperEdge;
    const exactAmount = exactSlice * bracket.rate;

    bracketResults.push({
      from: bracket.from,
      to: bracket.to,
      rate: bracket.rate,
      taxableSlice: roundCurrency(exactSlice),
      amount: roundCurrency(exactAmount),
    });

    exactTotal += exactAmount;
    previousUpperEdge = bracket.to;

    if (cappedSalary <= bracket.to) break;
  }

  return {
    brackets: bracketResults,
    total: roundCurrency(exactTotal),
    hitCeiling,
  };
}
