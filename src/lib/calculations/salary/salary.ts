import type { SalaryCalculationInput, SalaryCalculationResult } from './types';
import { getRulesForYear } from './rules/2026';
import { calculateINSS } from './inss';
import { calculateIRRF } from './irrf';
import { validateSalaryInput } from './validation';
import { roundCurrency } from './money';

const DEFAULT_YEAR = 2026;

/**
 * Calculates the full net-salary breakdown for a given month:
 * gross → INSS → IRRF (with 2026 reduction) → other deductions → net.
 *
 * Throws if the input is invalid (negative values, absurd magnitudes, etc.).
 * Callers that want to surface field-level errors to a form should call
 * `validateSalaryInput` themselves before calling this function.
 */
export function calculateSalary(input: SalaryCalculationInput): SalaryCalculationResult {
  const year = input.year ?? DEFAULT_YEAR;
  const dependents = input.dependents ?? 0;
  const otherDeductions = input.otherDeductions ?? 0;
  const alimony = input.alimony ?? 0;
  const grossSalary = input.grossSalary;

  const validation = validateSalaryInput({ grossSalary, dependents, otherDeductions, alimony });
  if (!validation.valid) {
    throw new Error(
      `Entrada inválida: ${validation.errors.map((e) => e.message).join(' ')}`
    );
  }

  const rules = getRulesForYear(year);

  const inss = calculateINSS(grossSalary, rules);
  const irpf = calculateIRRF(grossSalary, inss.total, dependents, alimony, rules);

  // Pensão alimentícia is deducted from the paycheck itself (in addition to
  // reducing the IRPF calculation base), so it must also come off net pay.
  const netSalary = roundCurrency(
    Math.max(0, grossSalary - inss.total - irpf.finalTax - otherDeductions - alimony)
  );

  return {
    input: { grossSalary, dependents, otherDeductions, alimony, year },
    inss,
    irpf,
    otherDeductions: roundCurrency(otherDeductions),
    netSalary,
    rulesYear: year,
  };
}
