import { calculateINSS } from '../salary/inss';
import { calculateIRRF } from '../salary/irrf';
import { getRulesForYear } from '../salary/rules/2026';
import { roundCurrency } from '../salary/money';

/**
 * 13º salário (gratificação natalina)
 * =====================================
 *
 * FONTES:
 * - Leis nº 4.090/1962 e nº 4.749/1965: direito ao 13º, 1/12 por mês
 *   trabalhado (mês com 15 dias ou mais de trabalho conta como mês
 *   completo), pago em duas parcelas (1ª até 30/11, 2ª até 20/12).
 * - INSS: incide sobre o valor INTEGRAL do 13º, calculado em separado do
 *   salário mensal, usando a mesma tabela progressiva do INSS.
 * - IRRF: "tributação exclusiva na fonte" sobre o valor INTEGRAL do 13º
 *   (não somado ao salário do mês), retido apenas na 2ª parcela — a 1ª
 *   parcela é paga sem qualquer desconto de INSS ou IRRF.
 * - A redução de 2026 (Lei 15.270/2025) se aplica ao 13º: o novo art.
 *   3º-A, §3º, da Lei 9.250/95 (introduzido pela Lei 15.270/2025) diz
 *   expressamente: "A redução do imposto de que trata este artigo também
 *   será aplicada no cálculo do imposto cobrado exclusivamente na fonte
 *   no pagamento do décimo terceiro salário." O valor integral do 13º é
 *   usado tanto para a base de cálculo quanto para o teste de
 *   R$ 5.000,00 / R$ 7.350,00 da redução.
 */

export interface ThirteenthInput {
  /** Salário mensal usado como base para o 13º (geralmente o salário de dezembro). */
  monthlySalary: number;
  /** Número de meses com direito ao 13º (0 a 12; cada mês com 15+ dias trabalhados conta como completo). */
  monthsWorked: number;
  dependents?: number;
  alimony?: number;
}

export interface ThirteenthResult {
  grossThirteenth: number;
  monthsWorked: number;
  firstInstallment: number;
  secondInstallmentGross: number;
  inssTotal: number;
  irrfTotal: number;
  secondInstallmentNet: number;
  totalNet: number;
}

export function calculateThirteenth(input: ThirteenthInput): ThirteenthResult {
  const { monthlySalary, monthsWorked } = input;
  const dependents = input.dependents ?? 0;
  const alimony = input.alimony ?? 0;

  if (monthlySalary < 0) throw new Error('O salário mensal não pode ser negativo.');
  if (!Number.isInteger(monthsWorked) || monthsWorked < 0 || monthsWorked > 12) {
    throw new Error('O número de meses trabalhados deve ser um número inteiro entre 0 e 12.');
  }

  const rules = getRulesForYear(2026);

  const grossThirteenth = roundCurrency((monthlySalary / 12) * monthsWorked);
  const firstInstallment = roundCurrency(grossThirteenth / 2);
  const secondInstallmentGross = roundCurrency(grossThirteenth - firstInstallment);

  const inss = calculateINSS(grossThirteenth, rules);
  const irrf = calculateIRRF(grossThirteenth, inss.total, dependents, alimony, rules);

  const secondInstallmentNet = roundCurrency(secondInstallmentGross - inss.total - irrf.finalTax);
  const totalNet = roundCurrency(firstInstallment + secondInstallmentNet);

  return {
    grossThirteenth,
    monthsWorked,
    firstInstallment,
    secondInstallmentGross,
    inssTotal: inss.total,
    irrfTotal: irrf.finalTax,
    secondInstallmentNet,
    totalNet,
  };
}
