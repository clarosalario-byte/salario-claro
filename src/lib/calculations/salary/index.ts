export { calculateSalary } from './salary';
export { calculateINSS } from './inss';
export { calculateIRRF } from './irrf';
export { compareDeductions } from './deductions';
export { validateSalaryInput } from './validation';
export { formatBRL, roundCurrency } from './money';
export { getRulesForYear, RULES_2026 } from './rules/2026';
export type {
  SalaryCalculationInput,
  SalaryCalculationResult,
  INSSResult,
  INSSBracketResult,
  IRPFResult,
  YearRules,
} from './types';
export type { ValidationResult, ValidationError } from './validation';
