import type { IRPFResult, YearRules, IRPFBracket } from './types';
import { roundCurrency } from './money';
import { compareDeductions } from './deductions';

function findBracket(base: number, brackets: IRPFBracket[]): IRPFBracket {
  const bracket = brackets.find((b) => base >= b.from && base <= b.to);
  // base is always >= 0 and the last bracket's `to` is Infinity, so this is exhaustive.
  return bracket ?? brackets[brackets.length - 1];
}

/**
 * Calculates the "redução do imposto" created by Lei 15.270/2025.
 *
 * IMPORTANT (confirmed by official Receita Federal example 5): the
 * thresholds (R$ 5.000,00 and R$ 7.350,00) are compared against the gross
 * TAXABLE INCOME (salário bruto / "rendimentos tributáveis sujeitos à
 * incidência mensal") — NOT against the calculation base after deductions.
 * The reduction, once triggered, is also computed using that same gross
 * figure in the linear formula for the partial band.
 */
function calculateReduction(
  taxBeforeReduction: number,
  grossTaxableIncome: number,
  rules: YearRules
): number {
  const { fullReliefCeiling, fullReliefAmount, partialReliefCeiling, partialReliefBase, partialReliefSlope } =
    rules.irpf.reduction;

  let reduction: number;

  if (grossTaxableIncome <= fullReliefCeiling) {
    reduction = fullReliefAmount;
  } else if (grossTaxableIncome <= partialReliefCeiling) {
    reduction = partialReliefBase - partialReliefSlope * grossTaxableIncome;
  } else {
    reduction = 0;
  }

  reduction = Math.max(0, roundCurrency(reduction));

  // "A dedução é limitada ao valor do imposto determinado com a tabela
  // progressiva" — the reduction can never exceed the tax it is reducing.
  return Math.min(reduction, taxBeforeReduction);
}

/**
 * Calculates IRRF (monthly income tax withholding) for a given gross salary,
 * following the sequence: choose the more advantageous deduction (simplified
 * vs. legal) → compute calculation base → apply the progressive table →
 * apply the 2026 reduction (Lei 15.270/2025) → floor at zero.
 */
export function calculateIRRF(
  grossSalary: number,
  inss: number,
  dependents: number,
  alimony: number,
  rules: YearRules
): IRPFResult {
  if (grossSalary < 0) throw new Error('Salário bruto não pode ser negativo.');
  if (dependents < 0) throw new Error('Número de dependentes não pode ser negativo.');
  if (alimony < 0) throw new Error('Pensão alimentícia não pode ser negativa.');

  const deductionComparison = compareDeductions(inss, dependents, alimony, rules);

  const calculationBase = roundCurrency(
    Math.max(0, grossSalary - deductionComparison.appliedDeduction)
  );

  const bracket = findBracket(calculationBase, rules.irpf.brackets);
  const taxBeforeReduction = roundCurrency(
    Math.max(0, calculationBase * bracket.rate - bracket.deduction)
  );

  const reduction = calculateReduction(taxBeforeReduction, grossSalary, rules);
  const finalTax = roundCurrency(Math.max(0, taxBeforeReduction - reduction));

  return {
    taxableIncome: grossSalary,
    deductionMethodUsed: deductionComparison.methodUsed,
    simplifiedDeduction: deductionComparison.simplifiedDeduction,
    legalDeductions: deductionComparison.legalDeductions,
    calculationBase,
    bracket,
    taxBeforeReduction,
    reduction,
    finalTax,
  };
}
