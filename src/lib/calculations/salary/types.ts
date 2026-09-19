/**
 * Shared types for the salary calculation engine.
 *
 * Money is represented in cents (integer) internally wherever a running
 * total is accumulated, to avoid floating point drift. Public-facing
 * inputs/outputs use reais (number, 2 decimals) for ergonomics, and the
 * conversion happens at the boundary (see `money.ts`).
 */

export interface INSSBracket {
  /** Lower bound of the bracket, in reais (inclusive). */
  from: number;
  /** Upper bound of the bracket, in reais (inclusive). Infinity for the last bracket before the ceiling. */
  to: number;
  /** Contribution rate for the slice of salary that falls in this bracket. */
  rate: number;
}

export interface IRPFBracket {
  /** Lower bound of the monthly calculation base, in reais (inclusive). */
  from: number;
  /** Upper bound of the monthly calculation base, in reais (inclusive). Infinity for the top bracket. */
  to: number;
  /** Nominal marginal rate for this bracket. */
  rate: number;
  /** "Parcela a deduzir" published by Receita Federal for this bracket (reais). */
  deduction: number;
}

export interface ReductionRule {
  /** Upper bound (inclusive) of gross taxable income for full zeroing, in reais. */
  fullReliefCeiling: number;
  /** Maximum reduction amount available at/under the full relief ceiling, in reais. */
  fullReliefAmount: number;
  /** Upper bound (inclusive) of gross taxable income where a partial, linearly-decreasing reduction applies. */
  partialReliefCeiling: number;
  /** Fixed term in the partial-relief linear formula: reducao = base - (slope * rendimentosTributaveis). */
  partialReliefBase: number;
  /** Slope term in the partial-relief linear formula. */
  partialReliefSlope: number;
}

export interface YearRules {
  year: number;
  /** ISO date string for when these rules were last verified against official sources. */
  lastVerified: string;
  inss: {
    brackets: INSSBracket[];
    ceiling: number;
  };
  irpf: {
    brackets: IRPFBracket[];
    dependentDeduction: number;
    simplifiedDeductionCap: number;
    reduction: ReductionRule;
  };
  sources: { label: string; url: string }[];
}

export interface SalaryCalculationInput {
  /** Salário bruto mensal, em reais. */
  grossSalary: number;
  /** Número de dependentes para fins de IRRF. */
  dependents: number;
  /** Outros descontos genéricos informados pelo usuário (vale-transporte, plano de saúde, etc.), em reais. */
  otherDeductions: number;
  /**
   * Pensão alimentícia, em reais. Tratada separadamente porque é uma dedução
   * legal para fins de IRRF (diferente de "outros descontos" genéricos).
   */
  alimony?: number;
  /** Ano das regras a utilizar. Atualmente apenas 2026 é suportado. */
  year?: number;
}

export interface INSSBracketResult {
  from: number;
  to: number;
  rate: number;
  /** Faixa de salário efetivamente tributada nesta alíquota. */
  taxableSlice: number;
  /** Valor de contribuição gerado por esta faixa. */
  amount: number;
}

export interface INSSResult {
  brackets: INSSBracketResult[];
  total: number;
  hitCeiling: boolean;
}

export interface IRPFResult {
  /** Base usada para decidir a tabela de redução (o salário bruto / rendimento tributável). */
  taxableIncome: number;
  /** Dedução utilizada: 'simplified' ou 'legal'. */
  deductionMethodUsed: 'simplified' | 'legal';
  simplifiedDeduction: number;
  legalDeductions: {
    inss: number;
    dependents: number;
    alimony: number;
    total: number;
  };
  /** Base de cálculo final (rendimento tributável - deduções escolhidas). */
  calculationBase: number;
  bracket: IRPFBracket;
  /** Imposto apurado pela tabela progressiva, antes da redução da Lei 15.270/2025. */
  taxBeforeReduction: number;
  /** Redução aplicável pela Lei 15.270/2025 (nunca excede o imposto apurado). */
  reduction: number;
  /** Imposto final devido (nunca negativo). */
  finalTax: number;
}

export interface SalaryCalculationResult {
  input: Required<Omit<SalaryCalculationInput, 'year'>> & { year: number };
  inss: INSSResult;
  irpf: IRPFResult;
  otherDeductions: number;
  netSalary: number;
  rulesYear: number;
}
