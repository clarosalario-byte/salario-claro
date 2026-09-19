import type { YearRules } from './types';
import { roundCurrency } from './money';

export interface DeductionComparison {
  methodUsed: 'simplified' | 'legal';
  simplifiedDeduction: number;
  legalDeductions: {
    inss: number;
    dependents: number;
    alimony: number;
    total: number;
  };
  /** The deduction amount actually applied (the larger of the two). */
  appliedDeduction: number;
}

/**
 * Compares the "desconto simplificado mensal" against the sum of legal
 * deductions (INSS + dependents + pensão alimentícia) and returns whichever
 * is larger — the taxpayer/withholding agent must use whichever reduces the
 * calculation base the most. This mirrors the four Receita Federal worked
 * examples exactly (simplified wins for lower incomes where INSS alone is
 * below R$ 607,20; legal deductions win once INSS + dependents exceed that
 * cap).
 */
export function compareDeductions(
  inss: number,
  dependents: number,
  alimony: number,
  rules: YearRules
): DeductionComparison {
  const dependentsDeduction = roundCurrency(dependents * rules.irpf.dependentDeduction);
  const legalTotal = roundCurrency(inss + dependentsDeduction + alimony);
  const simplified = rules.irpf.simplifiedDeductionCap;

  const methodUsed: 'simplified' | 'legal' = simplified >= legalTotal ? 'simplified' : 'legal';

  return {
    methodUsed,
    simplifiedDeduction: simplified,
    legalDeductions: {
      inss,
      dependents: dependentsDeduction,
      alimony,
      total: legalTotal,
    },
    appliedDeduction: methodUsed === 'simplified' ? simplified : legalTotal,
  };
}
